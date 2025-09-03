import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createDesignerSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  portfolioUrl: z.string().url().optional(),
  socialLinks: z.record(z.string().url()).optional()
})

const updateDesignerSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  portfolioUrl: z.string().url().optional(),
  socialLinks: z.record(z.string().url()).optional()
})

// GET /api/marketplace/designers - Get all designers with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const search = searchParams.get('search')
    const tier = searchParams.get('tier')
    const sortBy = searchParams.get('sortBy') || 'totalEarnings'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (tier) {
      where.tier = tier
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [designers, total] = await Promise.all([
      prisma.designerProfile.findMany({
        where,
        skip,
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
          designs: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              basePrice: true,
              createdAt: true
            },
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 4
          },
          followers: {
            select: { id: true }
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
      prisma.designerProfile.count({ where })
    ])

    const designersWithStats = designers.map(designer => ({
      ...designer,
      followerCount: designer._count.followers,
      designCount: designer._count.designs,
      reviewCount: designer._count.reviews,
      recentDesigns: designer.designs
    }))

    return NextResponse.json({
      success: true,
      data: {
        designers: designersWithStats,
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
    console.error('Error fetching designers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch designers' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/designers - Create designer profile
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createDesignerSchema.parse(body)

    // Check if user already has a designer profile
    const existingProfile = await prisma.designerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Designer profile already exists' },
        { status: 409 }
      )
    }

    const designerProfile = await prisma.designerProfile.create({
      data: {
        userId: session.user.id,
        displayName: validatedData.displayName,
        bio: validatedData.bio,
        portfolioUrl: validatedData.portfolioUrl,
        socialLinks: validatedData.socialLinks || {},
        tier: 'STARTER'
      },
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
    })

    return NextResponse.json({
      success: true,
      data: { designer: designerProfile }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating designer profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create designer profile' },
      { status: 500 }
    )
  }
}

// PUT /api/marketplace/designers - Update designer profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateDesignerSchema.parse(body)

    const designerProfile = await prisma.designerProfile.update({
      where: { userId: session.user.id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
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
    })

    return NextResponse.json({
      success: true,
      data: { designer: designerProfile }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating designer profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update designer profile' },
      { status: 500 }
    )
  }
}