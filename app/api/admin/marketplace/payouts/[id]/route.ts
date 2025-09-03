import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const updatePayoutSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  failureReason: z.string().optional(),
  externalTransactionId: z.string().optional(),
  adminNotes: z.string().max(1000).optional()
})

// GET /api/admin/marketplace/payouts/[id] - Get payout details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id } = params

    const payout = await prisma.designerPayout.findUnique({
      where: { id },
      include: {
        designer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true
              }
            }
          }
        },
        designPurchases: {
          include: {
            marketplaceDesign: {
              include: {
                design: {
                  select: {
                    id: true,
                    prompt: true,
                    imageUrl: true
                  }
                }
              }
            },
            buyer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { purchasedAt: 'desc' }
        }
      }
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    // Calculate additional metrics
    const relatedSales = payout.designPurchases.length
    const totalRevenue = payout.designPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.price), 
      0
    )

    const payoutWithMetrics = {
      ...payout,
      metrics: {
        relatedSales,
        totalRevenue,
        platformFee: totalRevenue - Number(payout.amount),
        royaltyRate: totalRevenue > 0 ? (Number(payout.amount) / totalRevenue) : 0
      }
    }

    return NextResponse.json({
      success: true,
      data: { payout: payoutWithMetrics }
    })
  } catch (error) {
    console.error('Error fetching payout details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payout details' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/marketplace/payouts/[id] - Update payout status/details
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id } = params
    const body = await request.json()
    const validatedData = updatePayoutSchema.parse(body)

    // Get existing payout
    const existingPayout = await prisma.designerPayout.findUnique({
      where: { id },
      include: {
        designer: {
          select: {
            id: true,
            totalEarnings: true
          }
        }
      }
    })

    if (!existingPayout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    // Handle status changes that affect designer balance
    let designerBalanceUpdate: any = {}
    
    if (validatedData.status && validatedData.status !== existingPayout.status) {
      if (existingPayout.status === 'COMPLETED' && validatedData.status !== 'COMPLETED') {
        // Payout was completed but now being reverted - add money back
        designerBalanceUpdate = {
          totalEarnings: { increment: existingPayout.amount }
        }
      } else if (existingPayout.status !== 'COMPLETED' && validatedData.status === 'COMPLETED') {
        // Payout is being marked as completed - deduct money
        designerBalanceUpdate = {
          totalEarnings: { decrement: existingPayout.amount }
        }
      }
    }

    // Update payout
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    }

    if (validatedData.status === 'COMPLETED' && !existingPayout.processedAt) {
      updateData.processedAt = new Date()
    }

    const updatedPayout = await prisma.$transaction(async (tx) => {
      // Update payout
      const payout = await tx.designerPayout.update({
        where: { id },
        data: updateData,
        include: {
          designer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      // Update designer balance if needed
      if (Object.keys(designerBalanceUpdate).length > 0) {
        await tx.designerProfile.update({
          where: { id: existingPayout.designer.id },
          data: designerBalanceUpdate
        })
      }

      return payout
    })

    // Log the admin action
    console.log(`Admin ${session.user.id} updated payout ${id}:`, {
      changes: validatedData,
      balanceUpdate: designerBalanceUpdate
    })

    return NextResponse.json({
      success: true,
      data: { payout: updatedPayout }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating payout:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update payout' },
      { status: 500 }
    )
  }
}