import { NextRequest, NextResponse } from 'next/server'
import { adminApiRoute } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export const GET = adminApiRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search')

    const skip = (page - 1) * limit
    
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              members: true,
              designs: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.team.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        teams: teams.map(team => ({
          id: team.id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          plan: team.plan,
          size: team.size,
          industry: team.industry,
          memberCount: team._count.members,
          designCount: team._count.designs,
          orderCount: team._count.orders,
          creator: team.creator,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    })

  } catch (error: any) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
})

export const POST = adminApiRoute(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { action, teamId, data } = body

    switch (action) {
      case 'suspend':
        await prisma.team.update({
          where: { id: teamId },
          data: { isActive: false, updatedAt: new Date() },
        })
        return NextResponse.json({ success: true, message: 'Team suspended' })

      case 'activate':
        await prisma.team.update({
          where: { id: teamId },
          data: { isActive: true, updatedAt: new Date() },
        })
        return NextResponse.json({ success: true, message: 'Team activated' })

      case 'update_plan':
        await prisma.team.update({
          where: { id: teamId },
          data: { 
            plan: data.plan,
            monthlyAILimit: data.monthlyAILimit || undefined,
            memberLimit: data.memberLimit || undefined,
            updatedAt: new Date(),
          },
        })
        return NextResponse.json({ success: true, message: 'Team plan updated' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
})