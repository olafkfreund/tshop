import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db'

// GET /api/designs/[designId]/approval - Get design approval status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: designId } = params

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

    // Get design with approval info
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    // Check access: owner or team member
    const hasAccess = design.userId === user.id || 
                     (design.team && design.team.members.length > 0)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      approval: {
        status: design.approvalStatus,
        approvedAt: design.approvedAt,
        approvedBy: design.approvedBy,
        requiresApproval: design.team?.requireApproval || false,
      },
    })

  } catch (error: any) {
    console.error('Error fetching design approval:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approval status' },
      { status: 500 }
    )
  }
}

// POST /api/designs/[designId]/approval - Approve or reject design
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: designId } = params
    const body = await request.json()
    const { action, comment } = body // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
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

    // Get design with team info
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    })

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    // Check if user can approve (must be team member with MANAGER, ADMIN, or OWNER role)
    const userMembership = design.team?.members[0]
    if (!userMembership || !['OWNER', 'ADMIN', 'MANAGER'].includes(userMembership.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to approve designs' },
        { status: 403 }
      )
    }

    // Can't approve your own design (unless you're the team owner)
    if (design.userId === user.id && userMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'You cannot approve your own design' },
        { status: 403 }
      )
    }

    // Update design approval status
    const updatedDesign = await prisma.design.update({
      where: { id: designId },
      data: {
        approvalStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedAt: action === 'approve' ? new Date() : null,
        approvedById: action === 'approve' ? user.id : null,
        updatedAt: new Date(),
      },
      include: {
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Add approval comment if provided
    if (comment?.trim()) {
      await prisma.designComment.create({
        data: {
          content: comment.trim(),
          designId,
          userId: user.id,
          type: action === 'approve' ? 'APPROVAL' : 'REJECTION',
        },
      })
    }

    return NextResponse.json({
      success: true,
      design: {
        id: updatedDesign.id,
        approvalStatus: updatedDesign.approvalStatus,
        approvedAt: updatedDesign.approvedAt,
        approvedBy: updatedDesign.approvedBy,
      },
      message: `Design ${action}d successfully`,
    })

  } catch (error: any) {
    console.error('Error updating design approval:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update approval status' },
      { status: 500 }
    )
  }
}

// DELETE /api/designs/[designId]/approval - Reset approval status
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: designId } = params

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

    // Get design with team info
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    })

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    // Only owner or the person who approved can reset approval
    const userMembership = design.team?.members[0]
    const canReset = design.userId === user.id || // design owner
                    design.approvedById === user.id || // person who approved
                    (userMembership && ['OWNER', 'ADMIN'].includes(userMembership.role)) // team owner/admin

    if (!canReset) {
      return NextResponse.json(
        { error: 'You do not have permission to reset approval status' },
        { status: 403 }
      )
    }

    // Reset approval status
    const updatedDesign = await prisma.design.update({
      where: { id: designId },
      data: {
        approvalStatus: 'PENDING',
        approvedAt: null,
        approvedById: null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      design: {
        id: updatedDesign.id,
        approvalStatus: updatedDesign.approvalStatus,
        approvedAt: updatedDesign.approvedAt,
        approvedBy: null,
      },
      message: 'Approval status reset successfully',
    })

  } catch (error: any) {
    console.error('Error resetting design approval:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reset approval status' },
      { status: 500 }
    )
  }
}