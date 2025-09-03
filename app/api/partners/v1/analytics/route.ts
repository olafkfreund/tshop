import { NextRequest, NextResponse } from 'next/server'
import { withPartnerAuth } from '@/lib/partner-auth'
import { prisma } from '@/lib/db'

// GET /api/partners/v1/analytics - Get team analytics
export async function GET(request: NextRequest) {
  return withPartnerAuth(request, 'analytics:read', async (apiKey, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const days = Math.min(parseInt(searchParams.get('days') || '30'), 365)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get analytics events for the team
      const events = await prisma.analyticsEvent.findMany({
        where: {
          teamId: apiKey.teamId,
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Get orders for revenue analytics
      const orders = await prisma.order.findMany({
        where: {
          teamId: apiKey.teamId,
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      })

      // Get designs created
      const designs = await prisma.design.findMany({
        where: {
          teamId: apiKey.teamId,
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          metadata: true,
        },
      })

      // Calculate analytics
      const analytics = calculateAnalytics(events, orders, designs, days)

      return NextResponse.json({
        success: true,
        data: {
          analytics,
          period: {
            days,
            startDate,
            endDate: new Date(),
          },
        },
      })

    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch analytics' },
        { status: 500 }
      )
    }
  })
}

function calculateAnalytics(events: any[], orders: any[], designs: any[], days: number) {
  // Event type counts
  const eventCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Revenue analytics
  const completedOrders = orders.filter(order => order.status === 'COMPLETED')
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

  // Daily breakdown
  const dailyStats = groupByDay([...events, ...orders, ...designs], days)

  // Design analytics
  const designsByStatus = designs.reduce((acc, design) => {
    acc[design.status] = (acc[design.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const aiGeneratedDesigns = designs.filter(design => 
    design.metadata && JSON.parse(design.metadata)?.createdViaAI
  ).length

  return {
    overview: {
      totalEvents: events.length,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalDesigns: designs.length,
      aiGeneratedDesigns,
      conversionRate: orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0,
    },
    events: {
      total: events.length,
      breakdown: eventCounts,
      topEvents: Object.entries(eventCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([type, count]) => ({ type, count })),
    },
    revenue: {
      total: totalRevenue,
      orders: completedOrders.length,
      avgOrderValue,
      dailyRevenue: dailyStats.map(day => ({
        date: day.date,
        revenue: day.orders.reduce((sum: number, order: any) => 
          order.status === 'COMPLETED' ? sum + order.totalAmount : sum, 0
        ),
        orderCount: day.orders.filter((order: any) => order.status === 'COMPLETED').length,
      })),
    },
    designs: {
      total: designs.length,
      aiGenerated: aiGeneratedDesigns,
      aiPercentage: designs.length > 0 ? (aiGeneratedDesigns / designs.length) * 100 : 0,
      statusBreakdown: designsByStatus,
      dailyCreated: dailyStats.map(day => ({
        date: day.date,
        count: day.designs.length,
        aiCount: day.designs.filter((design: any) => 
          design.metadata && JSON.parse(design.metadata)?.createdViaAI
        ).length,
      })),
    },
    growth: {
      dailyStats: dailyStats.map(day => ({
        date: day.date,
        events: day.events.length,
        orders: day.orders.length,
        designs: day.designs.length,
        revenue: day.orders.reduce((sum: number, order: any) => 
          order.status === 'COMPLETED' ? sum + order.totalAmount : sum, 0
        ),
      })),
    },
  }
}

function groupByDay(items: any[], days: number) {
  const dailyStats = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayItems = items.filter(item => 
      item.createdAt.toISOString().startsWith(dateStr)
    )

    dailyStats.push({
      date: dateStr,
      events: dayItems.filter(item => item.type), // Has event type
      orders: dayItems.filter(item => item.status && item.totalAmount !== undefined), // Has order fields
      designs: dayItems.filter(item => !item.type && !item.totalAmount), // Neither event nor order
    })
  }

  return dailyStats.reverse() // Oldest to newest
}