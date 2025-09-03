import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createContestSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  theme: z.string().min(3).max(100),
  rules: z.string().min(10).max(1000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  votingEndDate: z.string().datetime(),
  maxEntries: z.number().min(10).max(1000).optional(),
  prizes: z.array(z.object({
    place: z.number().min(1).max(10),
    amount: z.number().min(1),
    description: z.string().max(200)
  })).min(1).max(10),
  eligibilityRules: z.array(z.string()).max(10).optional(),
  tags: z.array(z.string()).max(10).optional(),
  productType: z.enum(['TSHIRT', 'CAP', 'TOTE_BAG', 'ANY']).optional()
})

// GET /api/marketplace/contests - Get design contests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const status = searchParams.get('status') // UPCOMING, ACTIVE, VOTING, COMPLETED
    const search = searchParams.get('search')
    const theme = searchParams.get('theme')
    const sortBy = searchParams.get('sortBy') || 'startDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { theme: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (theme) {
      where.theme = { contains: theme, mode: 'insensitive' }
    }
    
    if (status) {
      const now = new Date()
      switch (status) {
        case 'UPCOMING':
          where.startDate = { gt: now }
          break
        case 'ACTIVE':
          where.AND = [
            { startDate: { lte: now } },
            { endDate: { gt: now } }
          ]
          break
        case 'VOTING':
          where.AND = [
            { endDate: { lte: now } },
            { votingEndDate: { gt: now } }
          ]
          break
        case 'COMPLETED':
          where.votingEndDate = { lt: now }
          break
      }
    }

    const [contests, total] = await Promise.all([
      prisma.designContest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          entries: {
            select: { id: true },
            where: { status: 'SUBMITTED' }
          },
          votes: {
            select: { id: true }
          },
          _count: {
            select: {
              entries: true,
              votes: true
            }
          }
        }
      }),
      prisma.designContest.count({ where })
    ])

    // Calculate contest status and stats
    const now = new Date()
    const contestsWithStatus = contests.map(contest => {
      let contestStatus: string
      
      if (contest.startDate > now) {
        contestStatus = 'UPCOMING'
      } else if (contest.endDate > now) {
        contestStatus = 'ACTIVE'
      } else if (contest.votingEndDate > now) {
        contestStatus = 'VOTING'
      } else {
        contestStatus = 'COMPLETED'
      }

      return {
        ...contest,
        status: contestStatus,
        entryCount: contest._count.entries,
        voteCount: contest._count.votes,
        daysRemaining: contestStatus === 'ACTIVE' 
          ? Math.ceil((contest.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : contestStatus === 'VOTING'
            ? Math.ceil((contest.votingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        contests: contestsWithStatus,
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
    console.error('Error fetching contests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contests' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/contests - Create design contest (admin only)
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

    const body = await request.json()
    const validatedData = createContestSchema.parse(body)

    // Validate date logic
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)
    const votingEndDate = new Date(validatedData.votingEndDate)

    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    if (endDate >= votingEndDate) {
      return NextResponse.json(
        { success: false, error: 'Voting end date must be after contest end date' },
        { status: 400 }
      )
    }

    // Calculate total prize pool
    const totalPrizePool = validatedData.prizes.reduce((sum, prize) => sum + prize.amount, 0)

    const contest = await prisma.designContest.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        theme: validatedData.theme,
        rules: validatedData.rules,
        startDate,
        endDate,
        votingEndDate,
        maxEntries: validatedData.maxEntries,
        totalPrizePool,
        prizes: validatedData.prizes,
        eligibilityRules: validatedData.eligibilityRules || [],
        tags: validatedData.tags || [],
        productType: validatedData.productType,
        createdById: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      data: { contest }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating contest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create contest' },
      { status: 500 }
    )
  }
}