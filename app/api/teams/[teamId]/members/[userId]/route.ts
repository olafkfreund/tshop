import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { teamService } from '@/lib/team-management'
import { prisma } from '@/lib/db'

// PUT /api/teams/[teamId]/members/[userId] - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string; userId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { teamId, userId } = params
    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updatedMember = await teamService.updateMemberRole({
      teamId,
      userId,
      newRole: role,
      updatedBy: currentUser.id,
    })

    return NextResponse.json({
      success: true,
      member: updatedMember,
    })

  } catch (error: any) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update member role' },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[teamId]/members/[userId] - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; userId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { teamId, userId } = params

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    await teamService.removeTeamMember({
      teamId,
      userId,
      removedBy: currentUser.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    })

  } catch (error: any) {
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove team member' },
      { status: 500 }
    )
  }
}