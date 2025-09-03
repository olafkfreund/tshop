import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { teamService } from '@/lib/team-management'
import { prisma } from '@/lib/db'

// GET /api/teams/invite/[token] - Get invite details
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      )
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invite has already been processed' },
        { status: 400 }
      )
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        team: invite.team,
        inviter: invite.inviter,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    })

  } catch (error: any) {
    console.error('Error fetching invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invite' },
      { status: 500 }
    )
  }
}

// POST /api/teams/invite/[token] - Accept invite
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { token } = params

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get invite details first
    const invite = await prisma.teamInvite.findUnique({
      where: { token },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      )
    }

    // Check if invite email matches user email
    if (invite.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Invite email does not match your account' },
        { status: 403 }
      )
    }

    const member = await teamService.acceptInvite(token, user.id)

    return NextResponse.json({
      success: true,
      member,
      message: 'Successfully joined team!',
    })

  } catch (error: any) {
    console.error('Error accepting invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept invite' },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/invite/[token] - Reject invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      )
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invite has already been processed' },
        { status: 400 }
      )
    }

    // Update invite status to rejected
    await prisma.teamInvite.update({
      where: { token },
      data: { status: 'REJECTED' },
    })

    return NextResponse.json({
      success: true,
      message: 'Invite rejected successfully',
    })

  } catch (error: any) {
    console.error('Error rejecting invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject invite' },
      { status: 500 }
    )
  }
}