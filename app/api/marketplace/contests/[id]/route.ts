import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/marketplace/contests/[id] - Get contest details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    const contest = await prisma.designContest.findUnique({
      where: { id },
      include: {
        entries: {
          where: { status: 'SUBMITTED' },
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
              select: { id: true }
            },
            _count: {
              select: { votes: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        votes: {
          select: {
            id: true,
            userId: true,
            entryId: true
          }
        },
        _count: {
          select: {
            entries: true,
            votes: true
          }
        }
      }
    })

    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      )
    }

    // Calculate contest status
    const now = new Date()
    let status: string
    let canSubmit = false
    let canVote = false
    
    if (contest.startDate > now) {
      status = 'UPCOMING'
    } else if (contest.endDate > now) {
      status = 'ACTIVE'
      canSubmit = true
    } else if (contest.votingEndDate > now) {
      status = 'VOTING'
      canVote = true
    } else {
      status = 'COMPLETED'
    }

    // Check if user has voted (if authenticated)
    const session = await auth()
    let userVote = null
    if (session?.user?.id) {
      userVote = contest.votes.find(vote => vote.userId === session.user.id)
    }

    // Sort entries by vote count for leaderboard
    const entriesWithStats = contest.entries.map(entry => ({
      ...entry,
      voteCount: entry._count.votes,
      designer: entry.marketplaceDesign.designer,
      design: entry.marketplaceDesign.design
    })).sort((a, b) => b.voteCount - a.voteCount)

    const contestWithStatus = {
      ...contest,
      status,
      canSubmit,
      canVote,
      userVote,
      entryCount: contest._count.entries,
      totalVotes: contest._count.votes,
      entries: entriesWithStats,
      daysRemaining: status === 'ACTIVE' 
        ? Math.ceil((contest.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : status === 'VOTING'
          ? Math.ceil((contest.votingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0
    }

    return NextResponse.json({
      success: true,
      data: { contest: contestWithStatus }
    })
  } catch (error) {
    console.error('Error fetching contest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contest' },
      { status: 500 }
    )
  }
}