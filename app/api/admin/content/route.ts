import { NextRequest, NextResponse } from 'next/server'
import { adminApiRoute } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

// Content moderation and management
export const GET = adminApiRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    switch (action) {
      case 'designs':
        return await getDesignsForModeration(status, page, limit)
      case 'reports':
        return await getContentReports(page, limit)
      case 'flagged':
        return await getFlaggedContent(page, limit)
      case 'analytics':
        return await getContentAnalytics()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error in content admin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content data' },
      { status: 500 }
    )
  }
})

export const POST = adminApiRoute(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { action, designId, designs, reason, severity } = body

    switch (action) {
      case 'approve':
        return await approveDesign(designId, body.adminId)
      
      case 'reject':
        return await rejectDesign(designId, reason, body.adminId)
      
      case 'flag':
        return await flagDesign(designId, reason, severity, body.adminId)
      
      case 'bulk_action':
        return await bulkModerateDesigns(designs, body.bulkAction, body.adminId)
      
      case 'create_report':
        return await createContentReport(body.report)
      
      case 'resolve_report':
        return await resolveContentReport(body.reportId, body.resolution, body.adminId)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error moderating content:', error)
    return NextResponse.json(
      { error: 'Failed to moderate content' },
      { status: 500 }
    )
  }
})

async function getDesignsForModeration(status: string | null, page: number, limit: number) {
  const skip = (page - 1) * limit
  
  const where: any = {}
  if (status) {
    where.status = status.toUpperCase()
  } else {
    // Default to designs that need review
    where.status = { in: ['DRAFT', 'REVIEW', 'FLAGGED'] }
  }

  const [designs, total] = await Promise.all([
    prisma.design.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
        },
        _count: {
          select: { 
            comments: true,
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.design.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    success: true,
    data: {
      designs: designs.map(design => ({
        id: design.id,
        title: design.title,
        description: design.description,
        imageUrl: design.imageUrl,
        status: design.status,
        productType: design.productType,
        isPublic: design.isPublic,
        createdAt: design.createdAt,
        updatedAt: design.updatedAt,
        user: design.user,
        team: design.team,
        stats: {
          comments: design._count.comments,
          orders: design._count.orderItems,
        },
        metadata: design.metadata ? JSON.parse(design.metadata as string) : {},
        isAIGenerated: design.metadata && JSON.parse(design.metadata as string).createdViaAI,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  })
}

async function getContentReports(page: number, limit: number) {
  // Mock data for content reports - would be stored in actual table
  const reports = [
    {
      id: 'rep_1',
      designId: 'des_123',
      designTitle: 'Controversial Design',
      reportedBy: { id: 'usr_1', name: 'John Doe', email: 'john@example.com' },
      reason: 'Inappropriate content',
      description: 'This design contains offensive imagery that violates community guidelines.',
      status: 'PENDING',
      severity: 'HIGH',
      createdAt: new Date('2024-01-15'),
      resolvedAt: null,
      resolvedBy: null,
    },
    {
      id: 'rep_2',
      designId: 'des_456',
      designTitle: 'Suspected Copyright',
      reportedBy: { id: 'usr_2', name: 'Jane Smith', email: 'jane@example.com' },
      reason: 'Copyright violation',
      description: 'This appears to use copyrighted characters without permission.',
      status: 'RESOLVED',
      severity: 'MEDIUM',
      createdAt: new Date('2024-01-14'),
      resolvedAt: new Date('2024-01-15'),
      resolvedBy: { id: 'adm_1', name: 'Admin User' },
    },
  ]

  return NextResponse.json({
    success: true,
    data: {
      reports,
      pagination: {
        page,
        limit,
        total: reports.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
  })
}

async function getFlaggedContent(page: number, limit: number) {
  const skip = (page - 1) * limit
  
  const [designs, total] = await Promise.all([
    prisma.design.findMany({
      where: {
        OR: [
          { status: 'FLAGGED' },
          { status: 'UNDER_REVIEW' },
          { 
            metadata: {
              path: ['flagged'],
              equals: true,
            },
          },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.design.count({
      where: {
        OR: [
          { status: 'FLAGGED' },
          { status: 'UNDER_REVIEW' },
        ],
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      flaggedContent: designs.map(design => ({
        id: design.id,
        title: design.title,
        imageUrl: design.imageUrl,
        status: design.status,
        user: design.user,
        flaggedAt: design.updatedAt,
        reason: design.metadata && JSON.parse(design.metadata as string).flagReason,
        severity: design.metadata && JSON.parse(design.metadata as string).flagSeverity,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    },
  })
}

async function getContentAnalytics() {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  const [
    totalDesigns,
    pendingReview,
    flaggedCount,
    approvedCount,
    rejectedCount,
    aiGeneratedCount,
    recentActivity,
  ] = await Promise.all([
    prisma.design.count(),
    prisma.design.count({ where: { status: { in: ['DRAFT', 'REVIEW'] } } }),
    prisma.design.count({ where: { status: 'FLAGGED' } }),
    prisma.design.count({ where: { status: 'APPROVED' } }),
    prisma.design.count({ where: { status: 'REJECTED' } }),
    prisma.design.count({
      where: {
        metadata: {
          path: ['createdViaAI'],
          equals: true,
        },
      },
    }),
    prisma.design.findMany({
      where: { createdAt: { gte: last30Days } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // Group recent activity by day
  const dailyActivity = recentActivity.reduce((acc: any, design) => {
    const date = design.createdAt.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, total: 0, approved: 0, rejected: 0, pending: 0 }
    }
    acc[date].total++
    if (design.status === 'APPROVED') acc[date].approved++
    else if (design.status === 'REJECTED') acc[date].rejected++
    else acc[date].pending++
    return acc
  }, {})

  return NextResponse.json({
    success: true,
    data: {
      overview: {
        totalDesigns,
        pendingReview,
        flaggedCount,
        approvedCount,
        rejectedCount,
        aiGeneratedCount,
        aiPercentage: totalDesigns > 0 ? (aiGeneratedCount / totalDesigns * 100).toFixed(1) : 0,
      },
      moderationQueue: {
        pending: pendingReview,
        flagged: flaggedCount,
        avgReviewTime: '2.3 hours', // Mock data
        completionRate: '94.2%', // Mock data
      },
      dailyActivity: Object.values(dailyActivity),
      topModerators: [
        // Mock data - would track admin moderation actions
        { id: 'adm_1', name: 'Admin User', actionsToday: 23, avgTime: '1.2 min' },
        { id: 'adm_2', name: 'Mod User', actionsToday: 18, avgTime: '1.8 min' },
      ],
    },
  })
}

async function approveDesign(designId: string, adminId: string) {
  await prisma.design.update({
    where: { id: designId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById: adminId,
      updatedAt: new Date(),
      metadata: {
        ...(await getExistingMetadata(designId)),
        moderatedBy: adminId,
        moderatedAt: new Date().toISOString(),
        moderationAction: 'approved',
      },
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Design approved successfully',
  })
}

async function rejectDesign(designId: string, reason: string, adminId: string) {
  await prisma.design.update({
    where: { id: designId },
    data: {
      status: 'REJECTED',
      updatedAt: new Date(),
      metadata: {
        ...(await getExistingMetadata(designId)),
        moderatedBy: adminId,
        moderatedAt: new Date().toISOString(),
        moderationAction: 'rejected',
        rejectionReason: reason,
      },
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Design rejected successfully',
  })
}

async function flagDesign(designId: string, reason: string, severity: string, adminId: string) {
  await prisma.design.update({
    where: { id: designId },
    data: {
      status: 'FLAGGED',
      updatedAt: new Date(),
      metadata: {
        ...(await getExistingMetadata(designId)),
        flagged: true,
        flagReason: reason,
        flagSeverity: severity,
        flaggedBy: adminId,
        flaggedAt: new Date().toISOString(),
      },
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Design flagged successfully',
  })
}

async function bulkModerateDesigns(designs: string[], action: string, adminId: string) {
  const statusMap: any = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    flag: 'FLAGGED',
  }

  await prisma.design.updateMany({
    where: { id: { in: designs } },
    data: {
      status: statusMap[action] || 'UNDER_REVIEW',
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({
    success: true,
    message: `${designs.length} designs ${action}ed successfully`,
  })
}

async function createContentReport(report: any) {
  // In a real app, this would create a record in a content_reports table
  console.log('Creating content report:', report)
  
  return NextResponse.json({
    success: true,
    message: 'Content report created successfully',
  })
}

async function resolveContentReport(reportId: string, resolution: string, adminId: string) {
  // In a real app, this would update the content_reports table
  console.log(`Resolving report ${reportId} with resolution: ${resolution} by admin: ${adminId}`)
  
  return NextResponse.json({
    success: true,
    message: 'Content report resolved successfully',
  })
}

async function getExistingMetadata(designId: string) {
  const design = await prisma.design.findUnique({
    where: { id: designId },
    select: { metadata: true },
  })
  
  return design?.metadata ? JSON.parse(design.metadata as string) : {}
}