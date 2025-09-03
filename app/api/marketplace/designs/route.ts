import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createMarketplaceDesignSchema = z.object({
  designId: z.string().cuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  category: z.string().optional(),
  basePrice: z.number().min(0.99).max(999.99),
  licenseType: z.enum(['STANDARD', 'EXTENDED', 'EXCLUSIVE']),
  royaltyRate: z.number().min(0.1).max(0.7).optional(),
  isActive: z.boolean().default(true)
})

const updateMarketplaceDesignSchema = createMarketplaceDesignSchema.partial()

// GET /api/marketplace/designs - Get marketplace designs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const designerId = searchParams.get('designerId')
    const licenseType = searchParams.get('licenseType')
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const featured = searchParams.get('featured') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { isActive: true }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }
    
    if (category) {
      where.category = category
    }
    
    if (designerId) {
      where.designerId = designerId
    }
    
    if (licenseType) {
      where.licenseType = licenseType
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {}
      if (minPrice !== undefined) where.basePrice.gte = minPrice
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice
    }
    
    if (featured) {
      where.isFeatured = true
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'popularity') {
      // Sort by likes count
      orderBy.likes = { _count: sortOrder }
    } else if (sortBy === 'sales') {
      // Sort by purchases count
      orderBy.purchases = { _count: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    const [designs, total] = await Promise.all([
      prisma.marketplaceDesign.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
          likes: {
            select: {
              userId: true
            }
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
      }),
      prisma.marketplaceDesign.count({ where })
    ])

    // Get current user's liked designs if authenticated
    const session = await auth()
    const userLikedDesigns = session?.user?.id ? await prisma.designLike.findMany({
      where: {
        userId: session.user.id,
        marketplaceDesignId: { in: designs.map(d => d.id) }
      },
      select: { marketplaceDesignId: true }
    }) : []

    const likedDesignIds = new Set(userLikedDesigns.map(like => like.marketplaceDesignId))

    const designsWithStats = designs.map(design => ({
      ...design,
      likeCount: design._count.likes,
      purchaseCount: design._count.purchases,
      isLikedByUser: likedDesignIds.has(design.id),
      thumbnail: design.thumbnail || design.design?.imageUrl
    }))

    return NextResponse.json({
      success: true,
      data: {
        designs: designsWithStats,
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
    console.error('Error fetching marketplace designs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch designs' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/designs - Create marketplace design listing
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
        { success: false, error: 'Designer profile required. Create one first.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createMarketplaceDesignSchema.parse(body)

    // Verify the design belongs to the user
    const design = await prisma.design.findFirst({
      where: {
        id: validatedData.designId,
        userId: session.user.id
      }
    })

    if (!design) {
      return NextResponse.json(
        { success: false, error: 'Design not found or access denied' },
        { status: 404 }
      )
    }

    // Check if design is already listed
    const existingListing = await prisma.marketplaceDesign.findFirst({
      where: {
        designId: validatedData.designId,
        designerId: designerProfile.id
      }
    })

    if (existingListing) {
      return NextResponse.json(
        { success: false, error: 'Design is already listed in marketplace' },
        { status: 409 }
      )
    }

    // Set default royalty rate based on designer tier
    let defaultRoyaltyRate = 0.30 // 30% for STARTER
    if (designerProfile.tier === 'PRO') defaultRoyaltyRate = 0.35
    if (designerProfile.tier === 'ELITE') defaultRoyaltyRate = 0.40

    const marketplaceDesign = await prisma.marketplaceDesign.create({
      data: {
        designId: validatedData.designId,
        designerId: designerProfile.id,
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags || [],
        category: validatedData.category,
        basePrice: validatedData.basePrice,
        licenseType: validatedData.licenseType,
        royaltyRate: validatedData.royaltyRate || defaultRoyaltyRate,
        isActive: validatedData.isActive,
        thumbnail: design.imageUrl
      },
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { design: marketplaceDesign }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating marketplace design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create marketplace listing' },
      { status: 500 }
    )
  }
}