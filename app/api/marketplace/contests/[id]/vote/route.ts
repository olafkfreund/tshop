import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const voteSchema = z.object({
  entryId: z.string().cuid()
})

// POST /api/marketplace/contests/[id]/vote - Vote for a contest entry
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
    const { entryId } = voteSchema.parse(body)

    // Check if contest exists and is in voting period
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
    if (contest.endDate > now) {
      return NextResponse.json(
        { success: false, error: 'Contest is still accepting entries, voting not yet open' },
        { status: 400 }
      )
    }

    if (contest.votingEndDate < now) {
      return NextResponse.json(
        { success: false, error: 'Voting period has ended' },
        { status: 400 }
      )
    }

    // Verify the entry belongs to this contest
    const entry = await prisma.contestEntry.findFirst({
      where: {
        id: entryId,
        contestId,
        status: 'SUBMITTED'
      },
      include: {
        marketplaceDesign: {
          include: {
            designer: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    })

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Contest entry not found' },
        { status: 404 }
      )
    }

    // Don't allow users to vote for their own entries
    if (entry.marketplaceDesign.designer.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot vote for your own entry' },
        { status: 400 }
      )
    }

    // Check if user already voted in this contest
    const existingVote = await prisma.contestVote.findFirst({
      where: {
        userId: session.user.id,
        entry: {
          contestId
        }
      }
    })

    if (existingVote) {
      // Update existing vote to new entry
      const updatedVote = await prisma.contestVote.update({
        where: { id: existingVote.id },
        data: { entryId }
      })

      return NextResponse.json({
        success: true,
        data: {
          vote: updatedVote,
          message: 'Vote updated successfully'
        }
      })
    } else {
      // Create new vote
      const vote = await prisma.contestVote.create({
        data: {
          userId: session.user.id,
          entryId
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          vote,
          message: 'Vote submitted successfully'
        }
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting vote:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit vote' },
      { status: 500 }
    )
  }
}

// DELETE /api/marketplace/contests/[id]/vote - Remove vote
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

    const { id: contestId } = params

    // Check if contest is still in voting period
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
    if (contest.votingEndDate < now) {
      return NextResponse.json(
        { success: false, error: 'Voting period has ended' },
        { status: 400 }
      )
    }

    // Find and delete user's vote
    const existingVote = await prisma.contestVote.findFirst({
      where: {
        userId: session.user.id,
        entry: {
          contestId
        }
      }
    })

    if (!existingVote) {
      return NextResponse.json(
        { success: false, error: 'No vote found to remove' },
        { status: 404 }
      )
    }

    await prisma.contestVote.delete({
      where: { id: existingVote.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Vote removed successfully'
    })
  } catch (error) {
    console.error('Error removing vote:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove vote' },
      { status: 500 }
    )
  }
}