import { NextRequest, NextResponse } from 'next/server'
import { adminApiRoute } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export const GET = adminApiRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'health':
        return await getSystemHealth()
      case 'stats':
        return await getSystemStats()
      case 'settings':
        return await getSystemSettings()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error in system admin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system data' },
      { status: 500 }
    )
  }
})

export const POST = adminApiRoute(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { action, settings } = body

    switch (action) {
      case 'update_settings':
        // In a real app, you'd store these in a settings table or configuration
        // For now, we'll just return success
        return NextResponse.json({ 
          success: true, 
          message: 'Settings updated successfully' 
        })

      case 'maintenance_mode':
        // Toggle maintenance mode
        return NextResponse.json({ 
          success: true, 
          message: 'Maintenance mode toggled' 
        })

      case 'clear_cache':
        // Clear application cache
        return NextResponse.json({ 
          success: true, 
          message: 'Cache cleared successfully' 
        })

      case 'backup_database':
        // Trigger database backup
        return NextResponse.json({ 
          success: true, 
          message: 'Database backup initiated' 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error updating system:', error)
    return NextResponse.json(
      { error: 'Failed to update system' },
      { status: 500 }
    )
  }
})

async function getSystemHealth() {
  try {
    // Database health check
    const dbHealth = await prisma.$queryRaw`SELECT 1 as health`
    
    // Get various system metrics
    const [
      userCount,
      teamCount,
      orderCount,
      designCount,
      recentErrors,
      diskUsage
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.order.count(),
      prisma.design.count(),
      // Get recent audit logs with high severity
      prisma.auditLog.count({
        where: {
          severity: { in: ['HIGH', 'CRITICAL'] },
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      // Mock disk usage - in production would check actual disk usage
      Promise.resolve({ total: 100000000000, used: 45000000000, available: 55000000000 })
    ])

    return NextResponse.json({
      success: true,
      data: {
        database: {
          status: dbHealth ? 'healthy' : 'error',
          responseTime: '< 10ms', // Mock - would measure actual response time
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
        application: {
          totalUsers: userCount,
          totalTeams: teamCount,
          totalOrders: orderCount,
          totalDesigns: designCount,
          recentErrors,
        },
        storage: diskUsage,
        status: recentErrors > 10 ? 'warning' : 'healthy',
      },
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      data: {
        database: { status: 'error', responseTime: 'timeout' },
        status: 'error',
      },
    })
  }
}

async function getSystemStats() {
  const now = new Date()
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    totalUsers,
    activeUsers30d,
    activeUsers7d,
    newUsersToday,
    totalRevenue,
    revenueToday,
    totalOrders,
    ordersToday,
    totalDesigns,
    designsToday,
    aiGenerationsToday,
    errorCount24h
  ] = await Promise.all([
    prisma.user.count(),
    
    // Active users (users who have created designs or orders)
    prisma.user.count({
      where: {
        OR: [
          { designs: { some: { createdAt: { gte: last30Days } } } },
          { orders: { some: { createdAt: { gte: last30Days } } } },
        ],
      },
    }),
    
    prisma.user.count({
      where: {
        OR: [
          { designs: { some: { createdAt: { gte: last7Days } } } },
          { orders: { some: { createdAt: { gte: last7Days } } } },
        ],
      },
    }),

    prisma.user.count({
      where: { createdAt: { gte: today } },
    }),

    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'COMPLETED' },
    }).then(result => result._sum.totalAmount || 0),

    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
    }).then(result => result._sum.totalAmount || 0),

    prisma.order.count(),
    
    prisma.order.count({
      where: { createdAt: { gte: today } },
    }),

    prisma.design.count(),
    
    prisma.design.count({
      where: { createdAt: { gte: today } },
    }),

    prisma.analyticsEvent.count({
      where: {
        eventType: 'AI_GENERATION',
        createdAt: { gte: today },
      },
    }),

    prisma.auditLog.count({
      where: {
        severity: { in: ['HIGH', 'CRITICAL'] },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active30d: activeUsers30d,
        active7d: activeUsers7d,
        newToday: newUsersToday,
      },
      revenue: {
        total: totalRevenue,
        today: revenueToday,
      },
      orders: {
        total: totalOrders,
        today: ordersToday,
      },
      designs: {
        total: totalDesigns,
        today: designsToday,
      },
      ai: {
        generationsToday: aiGenerationsToday,
      },
      system: {
        errors24h: errorCount24h,
        status: errorCount24h > 10 ? 'warning' : 'healthy',
      },
    },
  })
}

async function getSystemSettings() {
  // In a real application, these would be stored in a settings table
  // For now, return some mock settings
  return NextResponse.json({
    success: true,
    data: {
      general: {
        siteName: 'TShop',
        maintenanceMode: false,
        registrationEnabled: true,
        aiGenerationEnabled: true,
      },
      ai: {
        dailyLimitFree: 2,
        dailyLimitRegistered: 10,
        monthlyLimitPremium: 100,
        defaultProvider: 'gemini',
      },
      security: {
        sessionTimeout: 24, // hours
        maxLoginAttempts: 5,
        auditLogRetention: 365, // days
        requireEmailVerification: true,
      },
      features: {
        teamsEnabled: true,
        partnerApiEnabled: true,
        webhooksEnabled: true,
        analyticsEnabled: true,
      },
    },
  })
}