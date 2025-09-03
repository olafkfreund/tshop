import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { PayoutService } from '@/lib/marketplace/payout-service'
import { z } from 'zod'

const updatePayoutSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  failureReason: z.string().optional(),
  externalTransactionId: z.string().optional()
})

// GET /api/admin/marketplace/payouts - Get all payouts for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // TODO: Add admin role check
    // For now, we'll assume the admin check is implemented elsewhere
    // const isAdmin = await checkAdminRole(session.user.id)
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { success: false, error: 'Admin access required' },
    //     { status: 403 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const status = searchParams.get('status')
    const designerId = searchParams.get('designerId')
    const method = searchParams.get('method')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (designerId) {
      where.designerId = designerId
    }
    
    if (method) {
      where.method = method
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [payouts, total] = await Promise.all([
      prisma.designerPayout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          designer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          },
          designPurchases: {
            take: 5, // Show recent purchases that contributed to this payout
            include: {
              marketplaceDesign: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      }),
      prisma.designerPayout.count({ where })
    ])

    // Get summary statistics
    const [statistics, pendingSummary] = await Promise.all([
      PayoutService.getPayoutStatistics(),
      PayoutService.getPendingPayoutsSummary()
    ])

    return NextResponse.json({
      success: true,
      data: {
        payouts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        statistics,
        pendingSummary
      }
    })
  } catch (error) {
    console.error('Error fetching admin payouts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}

// POST /api/admin/marketplace/payouts - Manually trigger payout processing
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // TODO: Add admin role check
    // const isAdmin = await checkAdminRole(session.user.id)
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { success: false, error: 'Admin access required' },
    //     { status: 403 }
    //   )
    // }

    console.log(`Manual payout processing triggered by admin: ${session.user.id}`)

    // Process all pending payouts
    const results = await PayoutService.processAllPendingPayouts()

    // Calculate summary stats
    const totalProcessed = results.length
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    const summary = {
      timestamp: new Date().toISOString(),
      triggeredBy: session.user.id,
      totalProcessed,
      successful,
      failed,
      successRate: totalProcessed > 0 ? Math.round((successful / totalProcessed) * 100) : 0
    }

    // Log the manual trigger
    console.log('Manual payout processing completed:', summary)

    return NextResponse.json({
      success: true,
      data: {
        summary,
        results: results.map(r => ({
          payoutId: r.payoutId,
          success: r.success,
          message: r.message,
          error: r.error
        }))
      }
    })
  } catch (error) {
    console.error('Error in manual payout processing:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Payout processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}