import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { auditLogger, AuditAction, AuditResourceType, AuditSeverity } from '@/lib/audit-logger'
import { prisma } from '@/lib/db'

// GET /api/security/incidents - Get security incidents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const assignedTo = searchParams.get('assignedTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    // Verify user has access to team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const where: any = { teamId }
    if (status) where.status = status
    if (severity) where.severity = severity
    if (assignedTo) where.assignedTo = assignedTo

    const [incidents, total] = await Promise.all([
      prisma.securityIncident.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { detectedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.securityIncident.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        incidents: incidents.map(formatIncidentForApi),
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
    console.error('Error fetching security incidents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security incidents' },
      { status: 500 }
    )
  }
}

// POST /api/security/incidents - Create security incident
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      teamId,
      type,
      severity = 'MEDIUM',
      title,
      description,
      details = {},
      userId,
      assignedTo,
    } = body

    if (!teamId || !type || !title || !description) {
      return NextResponse.json(
        { error: 'teamId, type, title, and description are required' },
        { status: 400 }
      )
    }

    // Verify user has admin access to team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create security incident
    const incident = await prisma.securityIncident.create({
      data: {
        type,
        severity,
        title: title.trim(),
        description: description.trim(),
        details: JSON.stringify(details),
        userId,
        teamId,
        assignedTo,
        detectedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Log security incident creation
    await auditLogger.log({
      userId: session.user.id,
      teamId,
      action: AuditAction.SECURITY_VIOLATION,
      resourceType: AuditResourceType.SYSTEM,
      resourceId: incident.id,
      details: {
        incidentType: type,
        severity,
        title,
      },
      severity: severity === 'CRITICAL' ? AuditSeverity.CRITICAL : AuditSeverity.HIGH,
    })

    return NextResponse.json({
      success: true,
      data: {
        incident: formatIncidentForApi(incident),
      },
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating security incident:', error)
    return NextResponse.json(
      { error: 'Failed to create security incident' },
      { status: 500 }
    )
  }
}

function formatIncidentForApi(incident: any) {
  return {
    id: incident.id,
    type: incident.type,
    severity: incident.severity,
    title: incident.title,
    description: incident.description,
    details: incident.details ? JSON.parse(incident.details) : {},
    status: incident.status,
    detectedAt: incident.detectedAt,
    resolvedAt: incident.resolvedAt,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
    user: incident.user,
    assignee: incident.assignee,
  }
}