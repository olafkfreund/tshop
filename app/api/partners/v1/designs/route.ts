import { NextRequest, NextResponse } from 'next/server'
import { withPartnerAuth } from '@/lib/partner-auth'
import { prisma } from '@/lib/db'

// GET /api/partners/v1/designs - List designs
export async function GET(request: NextRequest) {
  return withPartnerAuth(request, 'designs:read', async (apiKey, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const status = searchParams.get('status') // 'draft', 'published', 'archived'
      const userId = searchParams.get('userId')
      const search = searchParams.get('search')

      const skip = (page - 1) * limit

      const where: any = {
        OR: [
          { userId: { in: await getTeamUserIds(apiKey.teamId) } },
          { teamId: apiKey.teamId },
          {
            shares: {
              some: {
                sharedWith: {
                  teamMembers: {
                    some: { teamId: apiKey.teamId },
                  },
                },
              },
            },
          },
        ],
      }

      if (status) {
        where.status = status.toUpperCase()
      }

      if (userId) {
        where.userId = userId
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [designs, total] = await Promise.all([
        prisma.design.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            comments: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            _count: {
              select: {
                comments: true,
                shares: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.design.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return NextResponse.json({
        success: true,
        data: {
          designs: designs.map(formatDesignForApi),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      })

    } catch (error: any) {
      console.error('Error fetching designs:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch designs' },
        { status: 500 }
      )
    }
  })
}

// POST /api/partners/v1/designs - Create design
export async function POST(request: NextRequest) {
  return withPartnerAuth(request, 'designs:write', async (apiKey, req) => {
    try {
      const body = await req.json()
      const {
        title,
        description,
        designData,
        imageUrl,
        productType,
        isPublic = false,
        status = 'DRAFT',
        metadata = {}
      } = body

      if (!title || !designData) {
        return NextResponse.json(
          { error: 'Title and design data are required' },
          { status: 400 }
        )
      }

      // Get a user from the team to assign as creator (API designs)
      const teamOwner = await prisma.teamMember.findFirst({
        where: {
          teamId: apiKey.teamId,
          role: 'OWNER',
        },
        include: { user: true },
      })

      if (!teamOwner) {
        return NextResponse.json(
          { error: 'Team owner not found' },
          { status: 404 }
        )
      }

      const design = await prisma.design.create({
        data: {
          title: title.trim(),
          description: description?.trim(),
          designData: JSON.stringify(designData),
          imageUrl,
          productType: productType?.toUpperCase() || 'TSHIRT',
          isPublic,
          status: status.toUpperCase(),
          userId: teamOwner.userId,
          teamId: apiKey.teamId,
          metadata: {
            ...metadata,
            createdViaApi: true,
            apiKeyId: apiKey.id,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // Create analytics event
      await prisma.analyticsEvent.create({
        data: {
          type: 'DESIGN_CREATED_API',
          userId: teamOwner.userId,
          teamId: apiKey.teamId,
          metadata: {
            designId: design.id,
            apiKeyId: apiKey.id,
            productType: design.productType,
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          design: formatDesignForApi(design),
        },
      }, { status: 201 })

    } catch (error: any) {
      console.error('Error creating design:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create design' },
        { status: 500 }
      )
    }
  })
}

async function getTeamUserIds(teamId: string): Promise<string[]> {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  })
  return members.map(member => member.userId)
}

function formatDesignForApi(design: any) {
  return {
    id: design.id,
    title: design.title,
    description: design.description,
    productType: design.productType,
    imageUrl: design.imageUrl,
    isPublic: design.isPublic,
    status: design.status,
    approvalStatus: design.approvalStatus,
    designData: design.designData ? JSON.parse(design.designData) : null,
    metadata: design.metadata || {},
    createdAt: design.createdAt,
    updatedAt: design.updatedAt,
    user: design.user ? {
      id: design.user.id,
      name: design.user.name,
      email: design.user.email,
    } : null,
    team: design.team ? {
      id: design.team.id,
      name: design.team.name,
    } : null,
    stats: {
      commentCount: design._count?.comments || 0,
      shareCount: design._count?.shares || 0,
    },
    recentComments: design.comments || [],
  }
}