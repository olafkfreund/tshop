import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db'

// GET /api/designs/[designId]/share - Get sharing information
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

    // Get design with sharing info
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        shares: {
          include: {
            sharedWith: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            sharedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    // Check if user can view sharing info (owner or shared with)
    const canView = design.userId === user.id || 
                   design.shares.some(share => share.sharedWithId === user.id)

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      sharing: {
        isPublic: design.isPublic,
        shareToken: design.shareToken,
        shares: design.shares,
      },
    })

  } catch (error: any) {
    console.error('Error fetching design sharing info:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sharing information' },
      { status: 500 }
    )
  }
}

// POST /api/designs/[id]/share - Share design with users or make public
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
    const { emails, permission, makePublic, message } = body

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

    // Get design
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

    // Check if user can share (owner or team member with appropriate permissions)
    const userMembership = design.team?.members[0]
    const canShare = design.userId === user.id || 
                    (userMembership && ['OWNER', 'ADMIN', 'MANAGER'].includes(userMembership.role))

    if (!canShare) {
      return NextResponse.json(
        { error: 'You do not have permission to share this design' },
        { status: 403 }
      )
    }

    const results = {
      shared: [] as any[],
      failed: [] as string[],
      publicLink: null as string | null,
    }

    // Handle making design public
    if (makePublic !== undefined) {
      const updatedDesign = await prisma.design.update({
        where: { id: designId },
        data: {
          isPublic: makePublic,
          shareToken: makePublic ? (design.shareToken || generateShareToken()) : null,
          updatedAt: new Date(),
        },
      })

      if (makePublic) {
        results.publicLink = `${process.env.NEXTAUTH_URL}/designs/shared/${updatedDesign.shareToken}`
      }
    }

    // Handle sharing with specific users
    if (emails && Array.isArray(emails) && emails.length > 0) {
      const validPermissions = ['VIEW', 'COMMENT', 'EDIT']
      const sharePermission = validPermissions.includes(permission) ? permission : 'VIEW'

      for (const email of emails) {
        try {
          // Find user by email
          const targetUser = await prisma.user.findUnique({
            where: { email },
          })

          if (!targetUser) {
            results.failed.push(`${email} (user not found)`)
            continue
          }

          // Check if already shared
          const existingShare = await prisma.designShare.findFirst({
            where: {
              designId,
              sharedWithId: targetUser.id,
            },
          })

          if (existingShare) {
            // Update existing share
            const updatedShare = await prisma.designShare.update({
              where: { id: existingShare.id },
              data: {
                permission: sharePermission,
                updatedAt: new Date(),
              },
              include: {
                sharedWith: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            })
            results.shared.push(updatedShare)
          } else {
            // Create new share
            const newShare = await prisma.designShare.create({
              data: {
                designId,
                sharedWithId: targetUser.id,
                sharedById: user.id,
                permission: sharePermission,
                message: message?.trim() || undefined,
              },
              include: {
                sharedWith: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            })
            results.shared.push(newShare)
          }
        } catch (error) {
          results.failed.push(`${email} (error sharing)`)
        }
      }
    }

    // Update design activity
    await prisma.design.update({
      where: { id: designId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      results,
      message: `Design sharing updated successfully`,
    })

  } catch (error: any) {
    console.error('Error sharing design:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to share design' },
      { status: 500 }
    )
  }
}

// DELETE /api/designs/[id]/share - Remove sharing or revoke access
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
    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('shareId')
    const makePrivate = searchParams.get('makePrivate') === 'true'

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

    // Get design
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

    // Check permissions
    const userMembership = design.team?.members[0]
    const canRevoke = design.userId === user.id || 
                     (userMembership && ['OWNER', 'ADMIN', 'MANAGER'].includes(userMembership.role))

    if (!canRevoke) {
      return NextResponse.json(
        { error: 'You do not have permission to revoke sharing' },
        { status: 403 }
      )
    }

    if (makePrivate) {
      // Make design private
      await prisma.design.update({
        where: { id: designId },
        data: {
          isPublic: false,
          shareToken: null,
          updatedAt: new Date(),
        },
      })
    }

    if (shareId) {
      // Remove specific share
      await prisma.designShare.delete({
        where: { id: shareId },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Sharing access revoked successfully',
    })

  } catch (error: any) {
    console.error('Error revoking design sharing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to revoke sharing access' },
      { status: 500 }
    )
  }
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}