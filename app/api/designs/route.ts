import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { DesignCategory } from '@prisma/client'
import { z } from 'zod'

const createDesignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url(),
  category: z.enum(['TEXT', 'GRAPHIC', 'LOGO', 'ARTWORK', 'PATTERN']),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  prompt: z.string().optional(),
})

// GET /api/designs - Fetch user's designs or public designs
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category') as DesignCategory | null
    const isPublic = searchParams.get('public') === 'true'
    const userId = searchParams.get('userId')
    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {}
    
    if (category) {
      where.category = category
    }

    if (isPublic) {
      where.isPublic = true
    } else if (session?.user?.id) {
      where.userId = session.user.id
    } else if (userId) {
      where.userId = userId
      where.isPublic = true // Can only see public designs of other users
    } else {
      // No session and not requesting public designs
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get designs with user info for public designs
    const [designs, total] = await Promise.all([
      prisma.design.findMany({
        where,
        include: {
          user: isPublic ? {
            select: {
              id: true,
              name: true,
              avatar: true,
            }
          } : false,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.design.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: designs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })

  } catch (error) {
    console.error('Error fetching designs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch designs' },
      { status: 500 }
    )
  }
}

// POST /api/designs - Create a new design
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
    const validation = createDesignSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid design data',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const designData = validation.data

    // Create the design
    const design = await prisma.design.create({
      data: {
        ...designData,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: design,
    })

  } catch (error) {
    console.error('Error creating design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create design' },
      { status: 500 }
    )
  }
}