import { NextRequest, NextResponse } from 'next/server'
import { withPartnerAuth } from '@/lib/partner-auth'
import { prisma } from '@/lib/db'

// GET /api/partners/v1/teams - Get team information
export async function GET(request: NextRequest) {
  return withPartnerAuth(request, 'teams:read', async (apiKey, req) => {
    try {
      const team = await prisma.team.findUnique({
        where: { id: apiKey.teamId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          orders: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          designs: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              members: true,
              orders: true,
              designs: true,
              apiKeys: true,
            },
          },
        },
      })

      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          team: formatTeamForApi(team),
        },
      })

    } catch (error: any) {
      console.error('Error fetching team:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch team' },
        { status: 500 }
      )
    }
  })
}

function formatTeamForApi(team: any) {
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    description: team.description,
    industry: team.industry,
    size: team.size,
    plan: team.plan,
    branding: {
      logoUrl: team.logoUrl,
      primaryColor: team.primaryColor,
      customDomain: team.customDomain,
    },
    limits: {
      monthlyAILimit: team.monthlyAILimit,
      memberLimit: team.memberLimit,
      designStorageLimit: team.designStorageLimit,
    },
    settings: {
      requireApproval: team.requireApproval,
      allowPublicSharing: team.allowPublicSharing,
      enableWebhooks: team.enableWebhooks,
    },
    members: team.members?.map((member: any) => ({
      id: member.id,
      role: member.role,
      permissions: member.permissions,
      joinedAt: member.joinedAt,
      user: member.user,
    })) || [],
    recentOrders: team.orders || [],
    recentDesigns: team.designs || [],
    stats: {
      memberCount: team._count?.members || 0,
      orderCount: team._count?.orders || 0,
      designCount: team._count?.designs || 0,
      apiKeyCount: team._count?.apiKeys || 0,
    },
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  }
}