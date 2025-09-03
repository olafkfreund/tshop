import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { auditLogger } from '@/lib/audit-logger'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const action = searchParams.get('action')
    const severity = searchParams.get('severity')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    // Verify user has access to team and audit logs
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }, // Only owners and admins can view audit logs
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build filters
    const filters: any = { teamId }
    if (action) filters.action = action
    if (severity) filters.severity = severity
    if (userId) filters.userId = userId
    if (startDate) {
      filters.startDate = new Date(startDate)
    }
    if (endDate) {
      filters.endDate = new Date(endDate)
    }

    // Get audit logs
    const logs = await auditLogger.query({
      ...filters,
      limit,
      offset: (page - 1) * limit,
    })

    // Get total count for pagination
    const totalCount = await prisma.auditLog.count({
      where: {
        teamId: filters.teamId,
        ...(filters.action && { action: filters.action }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && filters.endDate && {
          timestamp: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          severity: log.severity,
          timestamp: log.timestamp,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          details: log.details ? JSON.parse(log.details) : {},
          user: log.user ? {
            id: log.user.id,
            name: log.user.name,
            email: log.user.email,
          } : null,
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    })

  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId, action, resourceType, resourceId, details, severity = 'LOW' } = body

    if (!teamId || !action || !resourceType) {
      return NextResponse.json(
        { error: 'teamId, action, and resourceType are required' },
        { status: 400 }
      )
    }

    // Verify user has access to team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Log the audit event
    await auditLogger.log({
      userId: session.user.id,
      teamId,
      action,
      resourceType,
      resourceId,
      details: details || {},
      severity,
    })

    return NextResponse.json({
      success: true,
      message: 'Audit log created successfully',
    })

  } catch (error: any) {
    console.error('Error creating audit log:', error)
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    )
  }
}