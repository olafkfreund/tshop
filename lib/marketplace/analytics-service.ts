import { prisma } from '@/lib/prisma'

export interface DesignerAnalytics {
  overview: {
    totalDesigns: number
    totalSales: number
    totalEarnings: number
    averageRating: number
    followerCount: number
    profileViews: number
  }
  performance: {
    topDesigns: Array<{
      id: string
      title: string
      sales: number
      revenue: number
      likes: number
      imageUrl: string
    }>
    salesByMonth: Array<{
      month: string
      sales: number
      revenue: number
    }>
    licenseBreakdown: Record<string, { count: number; revenue: number }>
  }
  audience: {
    topCountries: Array<{ country: string; buyers: number }>
    buyerRetention: number
    averageOrderValue: number
  }
  trends: {
    growthRate: number
    topTags: Array<{ tag: string; count: number }>
    seasonalTrends: Array<{ period: string; performance: number }>
  }
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics for a designer
   */
  static async getDesignerAnalytics(
    designerId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<DesignerAnalytics> {
    const [overview, performance, audience, trends] = await Promise.all([
      this.getOverviewMetrics(designerId, dateRange),
      this.getPerformanceMetrics(designerId, dateRange),
      this.getAudienceMetrics(designerId, dateRange),
      this.getTrendMetrics(designerId, dateRange)
    ])

    return {
      overview,
      performance,
      audience,
      trends
    }
  }

  /**
   * Get overview metrics
   */
  private static async getOverviewMetrics(
    designerId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    const designer = await prisma.designerProfile.findUnique({
      where: { id: designerId },
      include: {
        _count: {
          select: {
            designs: true,
            followers: true
          }
        }
      }
    })

    if (!designer) {
      throw new Error('Designer not found')
    }

    // Get sales count and total earnings
    const salesStats = await prisma.designPurchase.aggregate({
      where: {
        designerId,
        status: 'COMPLETED',
        ...(dateRange && {
          purchasedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        })
      },
      _count: { _all: true },
      _sum: { designerEarnings: true }
    })

    // Get profile views (if tracked)
    // This would require implementing profile view tracking
    const profileViews = 0 // Placeholder

    return {
      totalDesigns: designer._count.designs,
      totalSales: salesStats._count._all,
      totalEarnings: Number(salesStats._sum.designerEarnings || 0),
      averageRating: Number(designer.averageRating),
      followerCount: designer._count.followers,
      profileViews
    }
  }

  /**
   * Get performance metrics
   */
  private static async getPerformanceMetrics(
    designerId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    // Top performing designs
    const topDesigns = await prisma.marketplaceDesign.findMany({
      where: {
        designerId,
        isActive: true
      },
      include: {
        design: {
          select: {
            imageUrl: true
          }
        },
        purchases: {
          where: {
            status: 'COMPLETED',
            ...(dateRange && {
              purchasedAt: {
                gte: dateRange.start,
                lte: dateRange.end
              }
            })
          },
          select: {
            price: true,
            designerEarnings: true
          }
        },
        likes: {
          select: { id: true }
        }
      },
      take: 10
    })

    const topDesignsWithStats = topDesigns
      .map(design => ({
        id: design.id,
        title: design.title,
        sales: design.purchases.length,
        revenue: design.purchases.reduce((sum, p) => sum + Number(p.designerEarnings), 0),
        likes: design.likes.length,
        imageUrl: design.design?.imageUrl || design.thumbnail || ''
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Sales by month
    const salesByMonth = await prisma.$queryRaw<Array<{
      month: string
      sales: bigint
      revenue: number
    }>>`
      SELECT 
        TO_CHAR(purchased_at, 'YYYY-MM') as month,
        COUNT(*) as sales,
        SUM(designer_earnings) as revenue
      FROM "DesignPurchase"
      WHERE designer_id = ${designerId}
        AND status = 'COMPLETED'
        ${dateRange ? `AND purchased_at >= ${dateRange.start} AND purchased_at <= ${dateRange.end}` : ''}
      GROUP BY TO_CHAR(purchased_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `

    const formattedSalesByMonth = salesByMonth.map(row => ({
      month: row.month,
      sales: Number(row.sales),
      revenue: Number(row.revenue)
    }))

    // License breakdown
    const licenseBreakdown = await prisma.designPurchase.groupBy({
      by: ['licenseType'],
      where: {
        designerId,
        status: 'COMPLETED',
        ...(dateRange && {
          purchasedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        })
      },
      _count: { _all: true },
      _sum: { designerEarnings: true }
    })

    const formattedLicenseBreakdown = licenseBreakdown.reduce((acc, item) => {
      acc[item.licenseType] = {
        count: item._count._all,
        revenue: Number(item._sum.designerEarnings || 0)
      }
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    return {
      topDesigns: topDesignsWithStats,
      salesByMonth: formattedSalesByMonth,
      licenseBreakdown: formattedLicenseBreakdown
    }
  }

  /**
   * Get audience metrics
   */
  private static async getAudienceMetrics(
    designerId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    // Average order value
    const orderValue = await prisma.designPurchase.aggregate({
      where: {
        designerId,
        status: 'COMPLETED',
        ...(dateRange && {
          purchasedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        })
      },
      _avg: { price: true }
    })

    // Buyer retention (customers who bought multiple times)
    const totalBuyers = await prisma.designPurchase.groupBy({
      by: ['buyerId'],
      where: {
        designerId,
        status: 'COMPLETED'
      }
    })

    const repeatBuyers = await prisma.designPurchase.groupBy({
      by: ['buyerId'],
      where: {
        designerId,
        status: 'COMPLETED'
      },
      having: {
        buyerId: {
          _count: {
            gt: 1
          }
        }
      }
    })

    const retentionRate = totalBuyers.length > 0 
      ? (repeatBuyers.length / totalBuyers.length) * 100 
      : 0

    return {
      topCountries: [], // Would require IP geolocation tracking
      buyerRetention: retentionRate,
      averageOrderValue: Number(orderValue._avg.price || 0)
    }
  }

  /**
   * Get trend metrics
   */
  private static async getTrendMetrics(
    designerId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    // Growth rate calculation (current period vs previous period)
    const currentPeriodSales = await prisma.designPurchase.count({
      where: {
        designerId,
        status: 'COMPLETED',
        ...(dateRange && {
          purchasedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        })
      }
    })

    // Calculate previous period
    let previousPeriodSales = 0
    if (dateRange) {
      const periodLength = dateRange.end.getTime() - dateRange.start.getTime()
      const previousStart = new Date(dateRange.start.getTime() - periodLength)
      const previousEnd = dateRange.start

      previousPeriodSales = await prisma.designPurchase.count({
        where: {
          designerId,
          status: 'COMPLETED',
          purchasedAt: {
            gte: previousStart,
            lt: previousEnd
          }
        }
      })
    }

    const growthRate = previousPeriodSales > 0 
      ? ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100 
      : 0

    // Top tags from designer's designs
    const designs = await prisma.marketplaceDesign.findMany({
      where: { designerId },
      select: { tags: true }
    })

    const tagCounts = designs.reduce((acc, design) => {
      design.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    return {
      growthRate,
      topTags,
      seasonalTrends: [] // Would require historical seasonal analysis
    }
  }

  /**
   * Get platform-wide analytics summary
   */
  static async getPlatformAnalytics() {
    const [
      totalDesigners,
      totalDesigns,
      totalSales,
      totalRevenue,
      recentActivity
    ] = await Promise.all([
      prisma.designerProfile.count(),
      prisma.marketplaceDesign.count({ where: { isActive: true } }),
      prisma.designPurchase.count({ where: { status: 'COMPLETED' } }),
      prisma.designPurchase.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { price: true }
      }),
      prisma.designPurchase.findMany({
        where: { status: 'COMPLETED' },
        take: 10,
        orderBy: { purchasedAt: 'desc' },
        include: {
          marketplaceDesign: {
            select: { title: true }
          },
          buyer: {
            select: { name: true }
          }
        }
      })
    ])

    return {
      totals: {
        designers: totalDesigners,
        designs: totalDesigns,
        sales: totalSales,
        revenue: Number(totalRevenue._sum.price || 0)
      },
      recentActivity: recentActivity.map(sale => ({
        id: sale.id,
        designTitle: sale.marketplaceDesign.title,
        buyerName: sale.buyer.name,
        price: Number(sale.price),
        purchasedAt: sale.purchasedAt
      }))
    }
  }

  /**
   * Get designer leaderboard
   */
  static async getDesignerLeaderboard(
    metric: 'earnings' | 'sales' | 'followers' = 'earnings',
    limit: number = 10
  ) {
    const orderBy: any = {}
    
    switch (metric) {
      case 'earnings':
        orderBy.totalEarnings = 'desc'
        break
      case 'sales':
        orderBy.totalSales = 'desc'
        break
      case 'followers':
        // This would require a computed field or separate query
        orderBy.totalSales = 'desc' // Fallback to sales for now
        break
    }

    const designers = await prisma.designerProfile.findMany({
      take: limit,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            designs: true,
            followers: true
          }
        }
      }
    })

    return designers.map((designer, index) => ({
      rank: index + 1,
      designer: {
        id: designer.id,
        displayName: designer.displayName,
        user: designer.user,
        tier: designer.tier,
        totalEarnings: Number(designer.totalEarnings),
        totalSales: designer.totalSales,
        averageRating: Number(designer.averageRating),
        designCount: designer._count.designs,
        followerCount: designer._count.followers
      }
    }))
  }
}