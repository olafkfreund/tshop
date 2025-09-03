import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const submitEntrySchema = z.object({
  marketplaceDesignId: z.string().cuid(),
  description: z.string().max(500).optional()
})

// GET /api/marketplace/contests/[id]/entries - Get contest entries
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: contestId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const sortBy = searchParams.get('sortBy') || 'votes' // votes, recent, random

    const skip = (page - 1) * limit

    // Build order by clause
    let orderBy: any
    switch (sortBy) {
      case 'votes':
        orderBy = { votes: { _count: 'desc' } }
        break
      case 'recent':
        orderBy = { createdAt: 'desc' }
        break
      case 'random':
        // Postgres specific random ordering
        orderBy = undefined // Will handle separately
        break
      default:
        orderBy = { votes: { _count: 'desc' } }
    }

    const whereClause = {
      contestId,
      status: 'SUBMITTED'
    }

    const [entries, total] = await Promise.all([
      sortBy === 'random' 
        ? prisma.$queryRaw`
            SELECT ce.*, md.title, md.thumbnail, d.image_url, dp.display_name, u.name, u.image as user_image
            FROM "ContestEntry" ce
            JOIN "MarketplaceDesign" md ON ce.marketplace_design_id = md.id
            LEFT JOIN "Design" d ON md.design_id = d.id
            JOIN "DesignerProfile" dp ON md.designer_id = dp.id
            JOIN "User" u ON dp.user_id = u.id
            WHERE ce.contest_id = ${contestId} AND ce.status = 'SUBMITTED'
            ORDER BY RANDOM()
            LIMIT ${limit} OFFSET ${skip}
          `
        : prisma.contestEntry.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy,
            include: {
              marketplaceDesign: {
                include: {
                  design: {
                    select: {
                      id: true,
                      imageUrl: true,
                      prompt: true
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
              },
              votes: {
                select: {
                  id: true,
                  userId: true
                }
              },
              _count: {
                select: { votes: true }
              }
            }
          }),
      prisma.contestEntry.count({ where: whereClause })
    ])

    // Check if user has voted on any entries (if authenticated)
    const session = await auth()
    let userVotes: string[] = []
    
    if (session?.user?.id) {
      const votes = await prisma.contestVote.findMany({
        where: {
          userId: session.user.id,
          entry: { contestId }
        },
        select: { entryId: true }
      })
      userVotes = votes.map(v => v.entryId)
    }

    // Format entries with vote information
    const entriesWithVotes = Array.isArray(entries) ? entries.map((entry: any) => ({
      ...entry,
      voteCount: entry._count?.votes || 0,
      hasUserVoted: userVotes.includes(entry.id),
      designer: entry.marketplaceDesign?.designer || {
        displayName: entry.display_name,
        user: {
          id: entry.user_id,
          name: entry.name,
          image: entry.user_image
        }
      },
      design: entry.marketplaceDesign?.design || {
        imageUrl: entry.image_url
      }
    })) : []

    return NextResponse.json({
      success: true,
      data: {
        entries: entriesWithVotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        userVotes
      }
    })
  } catch (error) {
    console.error('Error fetching contest entries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entries' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/contests/[id]/entries - Submit contest entry
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

    const { id: contestId } = params
    const body = await request.json()
    const { marketplaceDesignId, description } = submitEntrySchema.parse(body)

    // Check if contest exists and is accepting entries
    const contest = await prisma.designContest.findUnique({
      where: { id: contestId }
    })

    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    if (contest.startDate > now) {
      return NextResponse.json(
        { success: false, error: 'Contest has not started yet' },
        { status: 400 }
      )
    }

    if (contest.endDate < now) {
      return NextResponse.json(
        { success: false, error: 'Contest entry period has ended' },
        { status: 400 }
      )
    }

    // Verify the design belongs to the user
    const design = await prisma.marketplaceDesign.findFirst({
      where: {
        id: marketplaceDesignId,
        designer: {
          userId: session.user.id
        }
      }
    })

    if (!design) {
      return NextResponse.json(
        { success: false, error: 'Design not found or access denied' },
        { status: 404 }
      )
    }

    // Check if user already submitted this design to this contest
    const existingEntry = await prisma.contestEntry.findFirst({
      where: {
        contestId,
        marketplaceDesignId
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: 'This design is already submitted to this contest' },
        { status: 409 }
      )
    }

    // Check max entries limit if set
    if (contest.maxEntries) {
      const userEntryCount = await prisma.contestEntry.count({
        where: {
          contestId,
          marketplaceDesign: {
            designer: {
              userId: session.user.id
            }
          }
        }
      })

      if (userEntryCount >= contest.maxEntries) {
        return NextResponse.json(
          { success: false, error: `Maximum ${contest.maxEntries} entries per user` },
          { status: 400 }
        )
      }
    }

    const entry = await prisma.contestEntry.create({
      data: {
        contestId,
        marketplaceDesignId,
        description,
        status: 'SUBMITTED'
      },
      include: {
        marketplaceDesign: {
          include: {
            design: {
              select: {
                id: true,
                imageUrl: true,
                prompt: true
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { entry }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting contest entry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit entry' },
      { status: 500 }
    )
  }
}