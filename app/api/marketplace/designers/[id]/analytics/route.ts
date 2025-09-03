import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { AnalyticsService } from '@/lib/marketplace/analytics-service'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/marketplace/designers/[id]/analytics - Get designer analytics
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    const { id: designerId } = params
    const { searchParams } = new URL(request.url)
    
    // Parse date range parameters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || '30d' // 30d, 90d, 1y, all

    // Check if user has access to this designer's analytics
    const designer = await prisma.designerProfile.findUnique({
      where: { id: designerId },
      include: {
        user: {
          select: { id: true }
        }
      }
    })

    if (!designer) {
      return NextResponse.json(
        { success: false, error: 'Designer not found' },
        { status: 404 }
      )
    }

    // Only the designer themselves can see full analytics
    // Others see limited public stats
    const isOwner = session?.user?.id === designer.user.id
    
    if (!isOwner) {
      // Return limited public analytics
      const publicStats = await getPublicDesignerStats(designerId)
      return NextResponse.json({
        success: true,
        data: {
          isPublic: true,
          stats: publicStats
        }
      })
    }

    // Calculate date range based on period
    let dateRange: { start: Date; end: Date } | undefined
    
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    } else {
      const now = new Date()
      let daysBack: number
      
      switch (period) {
        case '7d':
          daysBack = 7
          break
        case '30d':
          daysBack = 30
          break
        case '90d':
          daysBack = 90
          break
        case '1y':
          daysBack = 365
          break
        default:
          daysBack = 30
      }
      
      if (period !== 'all') {
        dateRange = {
          start: new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000)),
          end: now
        }
      }
    }

    // Get comprehensive analytics
    const analytics = await AnalyticsService.getDesignerAnalytics(designerId, dateRange)

    return NextResponse.json({
      success: true,
      data: {
        isPublic: false,
        period,
        dateRange,
        analytics
      }
    })
  } catch (error) {
    console.error('Error fetching designer analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Helper function to get public designer statistics
async function getPublicDesignerStats(designerId: string) {
  const [designer, designStats, salesStats, recentDesigns] = await Promise.all([
    prisma.designerProfile.findUnique({
      where: { id: designerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            designs: true,
            followers: true,
            reviews: true
          }
        }
      }
    }),
    prisma.marketplaceDesign.aggregate({
      where: {
        designerId,
        isActive: true
      },
      _count: { _all: true }
    }),
    prisma.designPurchase.aggregate({
      where: {
        designerId,
        status: 'COMPLETED'
      },
      _count: { _all: true }
    }),
    prisma.marketplaceDesign.findMany({
      where: {
        designerId,
        isActive: true
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        design: {
          select: {
            imageUrl: true
          }
        },
        _count: {
          select: {
            likes: true,
            purchases: true
          }
        }
      }
    })
  ])

  if (!designer) return null

  return {
    profile: {
      id: designer.id,
      displayName: designer.displayName,
      bio: designer.bio,
      tier: designer.tier,
      averageRating: Number(designer.averageRating),
      isVerified: designer.isVerified,
      joinedAt: designer.user.createdAt,
      user: designer.user
    },
    stats: {
      totalDesigns: designer._count.designs,
      totalSales: salesStats._count._all,
      followerCount: designer._count.followers,
      reviewCount: designer._count.reviews
    },
    recentDesigns: recentDesigns.map(design => ({
      id: design.id,
      title: design.title,
      imageUrl: design.design?.imageUrl || design.thumbnail,
      likes: design._count.likes,
      sales: design._count.purchases,
      createdAt: design.createdAt
    }))
  }
}