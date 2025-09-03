import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  designIds: z.array(z.string().cuid()).max(50).optional()
})

const updateCollectionSchema = createCollectionSchema.partial()

// GET /api/marketplace/collections - Get collections with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const search = searchParams.get('search')
    const designerId = searchParams.get('designerId')
    const isPublic = searchParams.get('isPublic')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (designerId) {
      where.designerId = designerId
    }
    
    if (isPublic !== null) {
      where.isPublic = isPublic === 'true'
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [collections, total] = await Promise.all([
      prisma.designCollection.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
            },
            take: 6 // Preview designs
          },
          _count: {
            select: {
              designs: true
            }
          }
        }
      }),
      prisma.designCollection.count({ where })
    ])

    const collectionsWithPreviews = collections.map(collection => ({
      ...collection,
      designCount: collection._count.designs,
      previewDesigns: collection.designs.map(design => ({
        id: design.marketplaceDesign.id,
        imageUrl: design.marketplaceDesign.design?.imageUrl || design.marketplaceDesign.thumbnail
      }))
    }))

    return NextResponse.json({
      success: true,
      data: {
        collections: collectionsWithPreviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    })
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/collections - Create collection
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get designer profile
    const designerProfile = await prisma.designerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!designerProfile) {
      return NextResponse.json(
        { success: false, error: 'Designer profile required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, isPublic, designIds } = createCollectionSchema.parse(body)

    // Verify designs belong to the designer if provided
    if (designIds && designIds.length > 0) {
      const designCount = await prisma.marketplaceDesign.count({
        where: {
          id: { in: designIds },
          designerId: designerProfile.id
        }
      })

      if (designCount !== designIds.length) {
        return NextResponse.json(
          { success: false, error: 'One or more designs do not belong to you' },
          { status: 403 }
        )
      }
    }

    const collection = await prisma.designCollection.create({
      data: {
        designerId: designerProfile.id,
        name,
        description,
        isPublic,
        designs: designIds ? {
          create: designIds.map(designId => ({
            marketplaceDesignId: designId
          }))
        } : undefined
      },
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
      data: { collection }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create collection' },
      { status: 500 }
    )
  }
}