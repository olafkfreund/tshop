import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { teamService } from '@/lib/team-management'
import { prisma } from '@/lib/db'

// GET /api/teams/[teamId] - Get team details
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

    const team = await teamService.getTeam(teamId, true)

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      team,
    })

  } catch (error: any) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

// PUT /api/teams/[teamId] - Update team
export async function PUT(
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

    // Check permissions
    try {
      await teamService.checkPermission(user.id, teamId, 'manage_settings')
    } catch {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      team: updatedTeam,
    })

  } catch (error: any) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update team' },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[teamId] - Delete team
export async function DELETE(
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

    // Check if user is team owner
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: 'OWNER',
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Only team owners can delete teams' },
        { status: 403 }
      )
    }

    // Delete team (cascade will handle related records)
    await prisma.team.delete({
      where: { id: teamId },
    })

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully',
    })

  } catch (error: any) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete team' },
      { status: 500 }
    )
  }
}