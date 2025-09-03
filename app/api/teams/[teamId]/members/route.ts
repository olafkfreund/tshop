import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { teamService } from '@/lib/team-management'
import { prisma } from '@/lib/db'

// GET /api/teams/[teamId]/members - Get team members
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { teamId } = params

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

    // Check if user is team member
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const members = await teamService.getTeamMembers(teamId)

    return NextResponse.json({
      success: true,
      members,
    })

  } catch (error: any) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

// POST /api/teams/[teamId]/members - Invite team member
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { teamId } = params
    const body = await request.json()
    const { email, role = 'MEMBER' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

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

    const invite = await teamService.inviteTeamMember({
      teamId,
      email,
      role,
      invitedBy: user.id,
    })

    return NextResponse.json({
      success: true,
      invite,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error inviting team member:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to invite team member' },
      { status: 500 }
    )
  }
}