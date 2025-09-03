import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const updateMarketplaceDesignSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  category: z.string().optional(),
  basePrice: z.number().min(0.99).max(999.99).optional(),
  licenseType: z.enum(['STANDARD', 'EXTENDED', 'EXCLUSIVE']).optional(),
  isActive: z.boolean().optional()
})

// GET /api/marketplace/designs/[id] - Get marketplace design by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    const design = await prisma.marketplaceDesign.findUnique({
      where: { id },
      include: {
        design: {
          select: {
            id: true,
            prompt: true,
            imageUrl: true,
            createdAt: true,
            updatedAt: true
          }
        },
        designer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        purchases: {
          select: {
            id: true,
            createdAt: true,
            licenseType: true,
            price: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            likes: true,
            purchases: true
          }
        }
      }
    })

    if (!design) {
      return NextResponse.json(
        { success: false, error: 'Design not found' },
        { status: 404 }
      )
    }

    // Check if current user has liked this design
    const session = await auth()
    const userLike = session?.user?.id ? await prisma.designLike.findUnique({
      where: {
        userId_marketplaceDesignId: {
          userId: session.user.id,
          marketplaceDesignId: id
        }
      }
    }) : null

    const designWithStats = {
      ...design,
      likeCount: design._count.likes,
      purchaseCount: design._count.purchases,
      isLikedByUser: !!userLike,
      totalRevenue: design.purchases.reduce((sum, purchase) => sum + Number(purchase.price), 0)
    }

    return NextResponse.json({
      success: true,
      data: { design: designWithStats }
    })
  } catch (error) {
    console.error('Error fetching marketplace design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch design' },
      { status: 500 }
    )
  }
}

// PUT /api/marketplace/designs/[id] - Update marketplace design
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

    const { id } = params
    const body = await request.json()
    const validatedData = updateMarketplaceDesignSchema.parse(body)

    // Check if user owns this design
    const existingDesign = await prisma.marketplaceDesign.findUnique({
      where: { id },
      include: {
        designer: {
          select: { userId: true }
        }
      }
    })

    if (!existingDesign) {
      return NextResponse.json(
        { success: false, error: 'Design not found' },
        { status: 404 }
      )
    }

    if (existingDesign.designer.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const updatedDesign = await prisma.marketplaceDesign.update({
      where: { id },
      data: validatedData,
      include: {
        design: {
          select: {
            id: true,
            prompt: true,
            imageUrl: true,
            createdAt: true
          }
        },
        designer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
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

    return NextResponse.json({
      success: true,
      data: { design: updatedDesign }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating marketplace design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update design' },
      { status: 500 }
    )
  }
}

// DELETE /api/marketplace/designs/[id] - Delete/deactivate marketplace design
export async function DELETE(
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

    const { id } = params

    // Check if user owns this design
    const existingDesign = await prisma.marketplaceDesign.findUnique({
      where: { id },
      include: {
        designer: {
          select: { userId: true }
        },
        purchases: {
          select: { id: true }
        }
      }
    })

    if (!existingDesign) {
      return NextResponse.json(
        { success: false, error: 'Design not found' },
        { status: 404 }
      )
    }

    if (existingDesign.designer.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // If design has purchases, deactivate instead of delete
    if (existingDesign.purchases.length > 0) {
      await prisma.marketplaceDesign.update({
        where: { id },
        data: { isActive: false }
      })

      return NextResponse.json({
        success: true,
        message: 'Design deactivated due to existing purchases'
      })
    } else {
      // Safe to delete if no purchases
      await prisma.marketplaceDesign.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        message: 'Design removed from marketplace'
      })
    }
  } catch (error) {
    console.error('Error deleting marketplace design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete design' },
      { status: 500 }
    )
  }
}