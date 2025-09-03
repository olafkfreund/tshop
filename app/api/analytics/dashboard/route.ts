import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    // Verify user has access to team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN', 'MANAGER'] }, // Only these roles can see analytics
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2))
    const previousEndDate = new Date()
    previousEndDate.setDate(previousEndDate.getDate() - days)

    // Parallel data fetching for performance
    const [
      currentOrders,
      previousOrders,
      currentDesigns,
      previousDesigns,
      teamMembers,
      products,
      analyticsEvents,
    ] = await Promise.all([
      // Current period orders
      prisma.order.findMany({
        where: {
          teamId,
          createdAt: { gte: startDate },
        },
        include: {
          orderItems: {
            include: {
              product: true,
              design: true,
            },
          },
        },
      }),
      // Previous period orders (for growth comparison)
      prisma.order.findMany({
        where: {
          teamId,
          createdAt: {
            gte: previousStartDate,
            lt: previousEndDate,
          },
        },
      }),
      // Current period designs
      prisma.design.findMany({
        where: {
          teamId,
          createdAt: { gte: startDate },
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
          orderItems: {
            include: {
              order: true,
            },
          },
        },
      }),
      // Previous period designs
      prisma.design.findMany({
        where: {
          teamId,
          createdAt: {
            gte: previousStartDate,
            lt: previousEndDate,
          },
        },
      }),
      // Team members
      prisma.teamMember.findMany({
        where: { teamId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      // Products
      prisma.product.findMany({
        include: {
          orderItems: {
            where: {
              order: { teamId },
            },
            include: {
              order: true,
            },
          },
        },
      }),
      // Analytics events
      prisma.analyticsEvent.findMany({
        where: {
          teamId,
          createdAt: { gte: startDate },
        },
      }),
    ])

    // Calculate analytics
    const analytics = calculateAnalytics({
      currentOrders,
      previousOrders,
      currentDesigns,
      previousDesigns,
      teamMembers,
      products,
      analyticsEvents,
      days,
    })

    return NextResponse.json({
      success: true,
      data: analytics,
    })

  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

interface CalculateAnalyticsParams {
  currentOrders: any[]
  previousOrders: any[]
  currentDesigns: any[]
  previousDesigns: any[]
  teamMembers: any[]
  products: any[]
  analyticsEvents: any[]
  days: number
}

function calculateAnalytics({
  currentOrders,
  previousOrders,
  currentDesigns,
  previousDesigns,
  teamMembers,
  products,
  analyticsEvents,
  days,
}: CalculateAnalyticsParams) {
  
  // Overview calculations
  const completedOrders = currentOrders.filter(order => order.status === 'COMPLETED')
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
  
  const previousCompletedOrders = previousOrders.filter(order => order.status === 'COMPLETED')
  const previousRevenue = previousCompletedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  
  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
  const orderGrowth = previousOrders.length > 0 ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100 : 0
  
  const totalDesignViews = analyticsEvents.filter(e => e.type === 'DESIGN_VIEW').length
  const conversionRate = totalDesignViews > 0 ? (completedOrders.length / totalDesignViews) * 100 : 0

  // Daily revenue data
  const dailyRevenue = groupByDay(completedOrders, days, 'totalAmount')
  
  // Monthly revenue (if range is large enough)
  const monthlyRevenue = days >= 60 ? groupByMonth(completedOrders, 'totalAmount') : []

  // Revenue by product
  const revenueByProduct = products.map(product => {
    const productOrders = product.orderItems.filter((item: any) => 
      item.order.status === 'COMPLETED' && 
      new Date(item.order.createdAt) >= new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    )
    const revenue = productOrders.reduce((sum: number, item: any) => sum + (item.quantity * item.pricePerUnit), 0)
    return {
      product: product.name,
      revenue,
      orders: productOrders.length,
    }
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // Design analytics
  const aiGeneratedDesigns = currentDesigns.filter(design => {
    const metadata = design.metadata as any
    return metadata?.createdViaAI || metadata?.createdViaApi
  }).length

  const designsByStatus = currentDesigns.reduce((acc, design) => {
    acc[design.status] = (acc[design.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const designStatusData = Object.entries(designsByStatus).map(([status, count]) => ({
    status,
    count,
    percentage: ((count as number) / currentDesigns.length) * 100,
  }))

  const designsByCategory = currentDesigns.reduce((acc, design) => {
    const category = design.productType || 'Other'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const designCategoryData = Object.entries(designsByCategory).map(([category, count]) => ({
    category,
    count,
  }))

  // Trending designs (by revenue generated)
  const trendingDesigns = currentDesigns.map(design => {
    const orderItems = design.orderItems || []
    const revenue = orderItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.pricePerUnit), 0
    )
    const uses = orderItems.length
    return {
      id: design.id,
      title: design.title,
      uses,
      revenue,
    }
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  // Team member activity
  const memberActivity = teamMembers.map(member => {
    const memberDesigns = currentDesigns.filter(design => design.userId === member.userId).length
    const memberOrders = currentOrders.filter(order => order.userId === member.userId).length
    return {
      member: member.user.name || member.user.email,
      designs: memberDesigns,
      orders: memberOrders,
    }
  }).sort((a, b) => (b.designs + b.orders) - (a.designs + a.orders))

  // Performance metrics (mock data - would integrate with actual analytics service)
  const conversionFunnel = [
    { step: 'Page Views', count: totalDesignViews, percentage: 100 },
    { step: 'Design Created', count: currentDesigns.length, percentage: currentDesigns.length / Math.max(totalDesignViews, 1) * 100 },
    { step: 'Added to Cart', count: currentOrders.length, percentage: currentOrders.length / Math.max(totalDesignViews, 1) * 100 },
    { step: 'Checkout Started', count: currentOrders.filter(o => o.status !== 'PENDING').length, percentage: currentOrders.filter(o => o.status !== 'PENDING').length / Math.max(totalDesignViews, 1) * 100 },
    { step: 'Order Completed', count: completedOrders.length, percentage: completedOrders.length / Math.max(totalDesignViews, 1) * 100 },
  ]

  const topPages = [
    { page: '/designs', views: Math.floor(totalDesignViews * 0.4), conversions: Math.floor(completedOrders.length * 0.3) },
    { page: '/products', views: Math.floor(totalDesignViews * 0.3), conversions: Math.floor(completedOrders.length * 0.4) },
    { page: '/gallery', views: Math.floor(totalDesignViews * 0.2), conversions: Math.floor(completedOrders.length * 0.2) },
    { page: '/dashboard', views: Math.floor(totalDesignViews * 0.1), conversions: Math.floor(completedOrders.length * 0.1) },
  ]

  return {
    overview: {
      totalRevenue,
      totalOrders: currentOrders.length,
      totalDesigns: currentDesigns.length,
      totalMembers: teamMembers.length,
      conversionRate,
      avgOrderValue,
      revenueGrowth,
      orderGrowth,
    },
    revenue: {
      daily: dailyRevenue,
      monthly: monthlyRevenue,
      byProduct: revenueByProduct,
    },
    designs: {
      total: currentDesigns.length,
      aiGenerated: aiGeneratedDesigns,
      aiPercentage: currentDesigns.length > 0 ? (aiGeneratedDesigns / currentDesigns.length) * 100 : 0,
      byStatus: designStatusData,
      byCategory: designCategoryData,
      trending: trendingDesigns,
    },
    team: {
      members: teamMembers.length,
      activeMembers: teamMembers.filter(m => 
        currentDesigns.some(d => d.userId === m.userId) || 
        currentOrders.some(o => o.userId === m.userId)
      ).length,
      designsPerMember: teamMembers.length > 0 ? currentDesigns.length / teamMembers.length : 0,
      memberActivity,
    },
    performance: {
      pageViews: totalDesignViews,
      uniqueVisitors: Math.floor(totalDesignViews * 0.7), // Estimate
      conversionFunnel,
      topPages,
    },
  }
}

function groupByDay(items: any[], days: number, valueField: string = 'id') {
  const dailyData = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayItems = items.filter(item => 
      item.createdAt.toISOString().startsWith(dateStr)
    )

    const value = valueField === 'id' ? dayItems.length : 
      dayItems.reduce((sum, item) => sum + (item[valueField] || 0), 0)

    dailyData.push({
      date: dateStr,
      [valueField === 'totalAmount' ? 'revenue' : 'count']: value,
      orders: dayItems.length,
    })
  }

  return dailyData.reverse() // Oldest to newest
}

function groupByMonth(items: any[], valueField: string = 'id') {
  const monthlyData: Record<string, number> = {}
  
  items.forEach(item => {
    const month = item.createdAt.toISOString().slice(0, 7) // YYYY-MM
    const value = valueField === 'id' ? 1 : (item[valueField] || 0)
    monthlyData[month] = (monthlyData[month] || 0) + value
  })

  return Object.entries(monthlyData).map(([month, value]) => ({
    month,
    [valueField === 'totalAmount' ? 'revenue' : 'count']: value,
    orders: items.filter(item => item.createdAt.toISOString().startsWith(month)).length,
  })).sort((a, b) => a.month.localeCompare(b.month))
}