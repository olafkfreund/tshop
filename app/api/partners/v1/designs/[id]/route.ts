import { NextRequest, NextResponse } from 'next/server'
import { withPartnerAuth } from '@/lib/partner-auth'
import { prisma } from '@/lib/db'

// GET /api/partners/v1/designs/[id] - Get specific design
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPartnerAuth(request, 'designs:read', async (apiKey, req) => {
    try {
      const { id } = params

      const design = await prisma.design.findFirst({
        where: {
          id,
          OR: [
            { userId: { in: await getTeamUserIds(apiKey.teamId) } },
            { teamId: apiKey.teamId },
            { isPublic: true },
            {
              shares: {
                some: {
                  sharedWith: {
                    teamMembers: {
                      some: { teamId: apiKey.teamId },
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
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
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: true,
              shares: true,
            },
          },
        },
      })

      if (!design) {
        return NextResponse.json(
          { error: 'Design not found or access denied' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          design: formatDetailedDesignForApi(design),
        },
      })

    } catch (error: any) {
      console.error('Error fetching design:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch design' },
        { status: 500 }
      )
    }
  })
}

// PUT /api/partners/v1/designs/[id] - Update design
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPartnerAuth(request, 'designs:write', async (apiKey, req) => {
    try {
      const { id } = params
      const body = await req.json()
      
      const {
        title,
        description,
        designData,
        imageUrl,
        productType,
        isPublic,
        status,
        metadata = {}
      } = body

      // Check if design exists and user has access
      const existingDesign = await prisma.design.findFirst({
        where: {
          id,
          OR: [
            { userId: { in: await getTeamUserIds(apiKey.teamId) } },
            { teamId: apiKey.teamId },
          ],
        },
      })

      if (!existingDesign) {
        return NextResponse.json(
          { error: 'Design not found or access denied' },
          { status: 404 }
        )
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      }

      if (title !== undefined) updateData.title = title.trim()
      if (description !== undefined) updateData.description = description?.trim()
      if (designData !== undefined) updateData.designData = JSON.stringify(designData)
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl
      if (productType !== undefined) updateData.productType = productType.toUpperCase()
      if (isPublic !== undefined) updateData.isPublic = isPublic
      if (status !== undefined) {
        updateData.status = status.toUpperCase()
        // Reset approval if changing status
        if (status.toUpperCase() !== existingDesign.status) {
          updateData.approvalStatus = 'PENDING'
          updateData.approvedAt = null
          updateData.approvedById = null
        }
      }

      // Merge metadata
      if (Object.keys(metadata).length > 0) {
        updateData.metadata = {
          ...(existingDesign.metadata || {}),
          ...metadata,
          lastApiUpdate: new Date().toISOString(),
          apiKeyId: apiKey.id,
        }
      }

      const updatedDesign = await prisma.design.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // Create analytics event
      await prisma.analyticsEvent.create({
        data: {
          type: 'DESIGN_UPDATED_API',
          userId: updatedDesign.userId,
          teamId: apiKey.teamId,
          metadata: {
            designId: updatedDesign.id,
            apiKeyId: apiKey.id,
            updatedFields: Object.keys(updateData),
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          design: formatDetailedDesignForApi(updatedDesign),
        },
      })

    } catch (error: any) {
      console.error('Error updating design:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update design' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/partners/v1/designs/[id] - Delete design
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPartnerAuth(request, 'designs:delete', async (apiKey, req) => {
    try {
      const { id } = params

      // Check if design exists and user has access
      const existingDesign = await prisma.design.findFirst({
        where: {
          id,
          OR: [
            { userId: { in: await getTeamUserIds(apiKey.teamId) } },
            { teamId: apiKey.teamId },
          ],
        },
      })

      if (!existingDesign) {
        return NextResponse.json(
          { error: 'Design not found or access denied' },
          { status: 404 }
        )
      }

      // Check if design is being used in orders
      const ordersWithDesign = await prisma.orderItem.count({
        where: { designId: id },
      })

      if (ordersWithDesign > 0) {
        return NextResponse.json(
          { error: 'Cannot delete design that is used in orders. Archive it instead.' },
          { status: 400 }
        )
      }

      // Soft delete by updating status to DELETED
      const deletedDesign = await prisma.design.update({
        where: { id },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            ...(existingDesign.metadata || {}),
            deletedViaApi: true,
            deletedBy: apiKey.id,
            deletedAt: new Date().toISOString(),
          },
        },
      })

      // Create analytics event
      await prisma.analyticsEvent.create({
        data: {
          type: 'DESIGN_DELETED_API',
          userId: deletedDesign.userId,
          teamId: apiKey.teamId,
          metadata: {
            designId: deletedDesign.id,
            apiKeyId: apiKey.id,
            designTitle: deletedDesign.title,
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Design deleted successfully',
        data: {
          designId: id,
          deletedAt: deletedDesign.deletedAt,
        },
      })

    } catch (error: any) {
      console.error('Error deleting design:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete design' },
        { status: 500 }
      )
    }
  })
}

async function getTeamUserIds(teamId: string): Promise<string[]> {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  })
  return members.map(member => member.userId)
}

function formatDetailedDesignForApi(design: any) {
  return {
    id: design.id,
    title: design.title,
    description: design.description,
    productType: design.productType,
    imageUrl: design.imageUrl,
    isPublic: design.isPublic,
    status: design.status,
    approvalStatus: design.approvalStatus,
    approvedAt: design.approvedAt,
    designData: design.designData ? JSON.parse(design.designData) : null,
    metadata: design.metadata || {},
    createdAt: design.createdAt,
    updatedAt: design.updatedAt,
    deletedAt: design.deletedAt,
    user: design.user ? {
      id: design.user.id,
      name: design.user.name,
      email: design.user.email,
    } : null,
    team: design.team ? {
      id: design.team.id,
      name: design.team.name,
    } : null,
    approvedBy: design.approvedBy ? {
      id: design.approvedBy.id,
      name: design.approvedBy.name,
      email: design.approvedBy.email,
    } : null,
    stats: {
      commentCount: design._count?.comments || 0,
      shareCount: design._count?.shares || 0,
    },
    comments: design.comments?.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      type: comment.type,
      createdAt: comment.createdAt,
      user: comment.user,
      replies: comment.replies?.map((reply: any) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        user: reply.user,
      })) || [],
    })) || [],
    shares: design.shares?.map((share: any) => ({
      id: share.id,
      permission: share.permission,
      createdAt: share.createdAt,
      sharedWith: share.sharedWith,
      sharedBy: share.sharedBy,
    })) || [],
  }
}