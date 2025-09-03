import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional()
})

const addDesignsSchema = z.object({
  designIds: z.array(z.string().cuid()).min(1).max(20)
})

// GET /api/marketplace/collections/[id] - Get collection by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    const collection = await prisma.designCollection.findUnique({
      where: { id },
      include: {
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
        designs: {
          include: {
            marketplaceDesign: {
              include: {
                design: {
                  select: {
                    id: true,
                    prompt: true,
                    imageUrl: true,
                    createdAt: true
                  }
                },
                likes: {
                  select: { id: true }
                },
                purchases: {
                  select: { id: true }
                },
                _count: {
                  select: {
                    likes: true,
                    purchases: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            designs: true
          }
        }
      }
    })

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if collection is public or belongs to current user
    const session = await auth()
    const isOwner = session?.user?.id && collection.designer.userId === session.user.id

    if (!collection.isPublic && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Collection is private' },
        { status: 403 }
      )
    }

    const collectionWithStats = {
      ...collection,
      designCount: collection._count.designs,
      designs: collection.designs.map(design => ({
        ...design.marketplaceDesign,
        likeCount: design.marketplaceDesign._count.likes,
        purchaseCount: design.marketplaceDesign._count.purchases
      }))
    }

    return NextResponse.json({
      success: true,
      data: { collection: collectionWithStats }
    })
  } catch (error) {
    console.error('Error fetching collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection' },
      { status: 500 }
    )
  }
}

// PUT /api/marketplace/collections/[id] - Update collection
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
    const validatedData = updateCollectionSchema.parse(body)

    // Check if user owns this collection
    const existingCollection = await prisma.designCollection.findUnique({
      where: { id },
      include: {
        designer: {
          select: { userId: true }
        }
      }
    })

    if (!existingCollection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    if (existingCollection.designer.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const updatedCollection = await prisma.designCollection.update({
      where: { id },
      data: validatedData,
      include: {
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
        designs: {
          include: {
            marketplaceDesign: {
              include: {
                design: {
                  select: {
                    id: true,
                    imageUrl: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            designs: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { collection: updatedCollection }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update collection' },
      { status: 500 }
    )
  }
}

// DELETE /api/marketplace/collections/[id] - Delete collection
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

    // Check if user owns this collection
    const existingCollection = await prisma.designCollection.findUnique({
      where: { id },
      include: {
        designer: {
          select: { userId: true }
        }
      }
    })

    if (!existingCollection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    if (existingCollection.designer.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    await prisma.designCollection.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete collection' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/collections/[id]/designs - Add designs to collection
export async function POST(
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
    const { designIds } = addDesignsSchema.parse(body)

    // Check if user owns this collection
    const collection = await prisma.designCollection.findUnique({
      where: { id },
      include: {
        designer: {
          select: { 
            id: true,
            userId: true 
          }
        }
      }
    })

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    if (collection.designer.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify designs belong to the designer
    const designCount = await prisma.marketplaceDesign.count({
      where: {
        id: { in: designIds },
        designerId: collection.designer.id
      }
    })

    if (designCount !== designIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more designs do not belong to you' },
        { status: 403 }
      )
    }

    // Add designs to collection (ignore duplicates)
    const designsToAdd = designIds.map(designId => ({
      collectionId: id,
      marketplaceDesignId: designId
    }))

    // Use createMany with skipDuplicates to avoid conflicts
    const result = await prisma.collectionDesign.createMany({
      data: designsToAdd,
      skipDuplicates: true
    })

    return NextResponse.json({
      success: true,
      data: {
        added: result.count,
        message: `${result.count} designs added to collection`
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error adding designs to collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add designs to collection' },
      { status: 500 }
    )
  }
}