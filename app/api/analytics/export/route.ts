import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import PDFDocument from 'pdfkit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const days = parseInt(searchParams.get('days') || '30')
    const format = searchParams.get('format') || 'csv'

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    // Verify user has access to team and export permissions
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }, // Only owners and admins can export
      },
      include: {
        team: true,
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch comprehensive data for export
    const [orders, designs, members, analyticsEvents] = await Promise.all([
      prisma.order.findMany({
        where: {
          teamId,
          createdAt: { gte: startDate },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          orderItems: {
            include: {
              product: true,
              design: {
                select: { id: true, title: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.design.findMany({
        where: {
          teamId,
          createdAt: { gte: startDate },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.teamMember.findMany({
        where: { teamId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          teamId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    if (format === 'csv') {
      return generateCSVExport({
        teamName: teamMember.team.name,
        orders,
        designs,
        members,
        analyticsEvents,
        days,
      })
    } else if (format === 'pdf') {
      return generatePDFExport({
        teamName: teamMember.team.name,
        orders,
        designs,
        members,
        analyticsEvents,
        days,
      })
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error exporting analytics:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    )
  }
}

interface ExportData {
  teamName: string
  orders: any[]
  designs: any[]
  members: any[]
  analyticsEvents: any[]
  days: number
}

function generateCSVExport({ teamName, orders, designs, members, analyticsEvents, days }: ExportData) {
  // Summary data
  const completedOrders = orders.filter(order => order.status === 'COMPLETED')
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
  const aiDesigns = designs.filter(d => d.metadata && (d.metadata as any).createdViaAI).length
  
  let csvContent = `Analytics Report - ${teamName}\n`
  csvContent += `Report Period: Last ${days} days\n`
  csvContent += `Generated: ${new Date().toISOString()}\n\n`
  
  // Summary section
  csvContent += `SUMMARY\n`
  csvContent += `Total Revenue,$${totalRevenue.toFixed(2)}\n`
  csvContent += `Total Orders,${orders.length}\n`
  csvContent += `Completed Orders,${completedOrders.length}\n`
  csvContent += `Average Order Value,$${avgOrderValue.toFixed(2)}\n`
  csvContent += `Total Designs,${designs.length}\n`
  csvContent += `AI Generated Designs,${aiDesigns}\n`
  csvContent += `Team Members,${members.length}\n\n`
  
  // Orders section
  csvContent += `ORDERS\n`
  csvContent += `Order ID,Customer Name,Customer Email,Status,Total Amount,Items,Created Date\n`
  orders.forEach(order => {
    const itemCount = order.orderItems.length
    csvContent += `${order.id},"${order.user?.name || 'N/A'}","${order.user?.email || 'N/A'}",${order.status},$${order.totalAmount.toFixed(2)},${itemCount},${order.createdAt.toISOString()}\n`
  })
  csvContent += `\n`
  
  // Designs section
  csvContent += `DESIGNS\n`
  csvContent += `Design ID,Title,Creator Name,Creator Email,Status,Product Type,AI Generated,Created Date\n`
  designs.forEach(design => {
    const isAI = design.metadata && (design.metadata as any).createdViaAI ? 'Yes' : 'No'
    csvContent += `${design.id},"${design.title}","${design.user?.name || 'N/A'}","${design.user?.email || 'N/A'}",${design.status},${design.productType || 'N/A'},${isAI},${design.createdAt.toISOString()}\n`
  })
  csvContent += `\n`
  
  // Team members section
  csvContent += `TEAM MEMBERS\n`
  csvContent += `Member ID,Name,Email,Role,Joined Date\n`
  members.forEach(member => {
    csvContent += `${member.id},"${member.user.name || 'N/A'}","${member.user.email}",${member.role},${member.joinedAt.toISOString()}\n`
  })

  const headers = new Headers()
  headers.set('Content-Type', 'text/csv')
  headers.set('Content-Disposition', `attachment; filename="analytics-report-${days}days.csv"`)
  
  return new NextResponse(csvContent, { headers })
}

async function generatePDFExport({ teamName, orders, designs, members, analyticsEvents, days }: ExportData) {
  return new Promise<NextResponse>((resolve) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      const headers = new Headers()
      headers.set('Content-Type', 'application/pdf')
      headers.set('Content-Disposition', `attachment; filename="analytics-report-${days}days.pdf"`)
      
      resolve(new NextResponse(pdfBuffer, { headers }))
    })

    // PDF Content
    const completedOrders = orders.filter(order => order.status === 'COMPLETED')
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
    const aiDesigns = designs.filter(d => d.metadata && (d.metadata as any).createdViaAI).length

    // Header
    doc.fontSize(24).text(`Analytics Report`, { align: 'center' })
    doc.fontSize(16).text(`${teamName}`, { align: 'center' })
    doc.fontSize(12).text(`Report Period: Last ${days} days`, { align: 'center' })
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
    doc.moveDown(2)

    // Summary Section
    doc.fontSize(16).text('Executive Summary', { underline: true })
    doc.moveDown()
    
    doc.fontSize(12)
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`)
    doc.text(`Total Orders: ${orders.length}`)
    doc.text(`Completed Orders: ${completedOrders.length}`)
    doc.text(`Average Order Value: $${avgOrderValue.toFixed(2)}`)
    doc.text(`Conversion Rate: ${orders.length > 0 ? ((completedOrders.length / orders.length) * 100).toFixed(1) : 0}%`)
    doc.moveDown()
    
    doc.text(`Total Designs: ${designs.length}`)
    doc.text(`AI Generated Designs: ${aiDesigns} (${designs.length > 0 ? ((aiDesigns / designs.length) * 100).toFixed(1) : 0}%)`)
    doc.text(`Team Members: ${members.length}`)
    doc.moveDown(2)

    // Order Status Breakdown
    doc.fontSize(16).text('Order Status Breakdown', { underline: true })
    doc.moveDown()
    
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(ordersByStatus).forEach(([status, count]) => {
      doc.fontSize(12).text(`${status}: ${count} orders`)
    })
    doc.moveDown(2)

    // Design Status Breakdown
    doc.fontSize(16).text('Design Status Breakdown', { underline: true })
    doc.moveDown()
    
    const designsByStatus = designs.reduce((acc, design) => {
      acc[design.status] = (acc[design.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(designsByStatus).forEach(([status, count]) => {
      doc.fontSize(12).text(`${status}: ${count} designs`)
    })
    doc.moveDown(2)

    // Team Performance
    doc.fontSize(16).text('Team Performance', { underline: true })
    doc.moveDown()
    
    const memberStats = members.map(member => {
      const memberDesigns = designs.filter(d => d.userId === member.userId).length
      const memberOrders = orders.filter(o => o.userId === member.userId).length
      return {
        name: member.user.name || member.user.email,
        designs: memberDesigns,
        orders: memberOrders,
      }
    }).sort((a, b) => (b.designs + b.orders) - (a.designs + a.orders))

    memberStats.slice(0, 10).forEach(member => {
      doc.fontSize(12).text(`${member.name}: ${member.designs} designs, ${member.orders} orders`)
    })

    // Recent Activity
    doc.addPage()
    doc.fontSize(16).text('Recent Orders', { underline: true })
    doc.moveDown()
    
    orders.slice(0, 20).forEach(order => {
      doc.fontSize(10).text(
        `${order.id} - ${order.user?.name || 'N/A'} - $${order.totalAmount.toFixed(2)} - ${order.status} - ${order.createdAt.toLocaleDateString()}`
      )
    })
    
    doc.moveDown(2)
    doc.fontSize(16).text('Recent Designs', { underline: true })
    doc.moveDown()
    
    designs.slice(0, 20).forEach(design => {
      const isAI = design.metadata && (design.metadata as any).createdViaAI ? ' (AI)' : ''
      doc.fontSize(10).text(
        `${design.title} - ${design.user?.name || 'N/A'} - ${design.status}${isAI} - ${design.createdAt.toLocaleDateString()}`
      )
    })

    // Footer
    doc.fontSize(8).text(
      `Report generated on ${new Date().toLocaleDateString()} for ${teamName}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    )

    doc.end()
  })
}