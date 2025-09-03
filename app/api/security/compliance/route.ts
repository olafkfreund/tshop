import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { complianceManager, DEFAULT_COMPLIANCE_POLICIES } from '@/lib/compliance-manager'
import { prisma } from '@/lib/db'

// GET /api/security/compliance - Get team compliance status and policies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const days = parseInt(searchParams.get('days') || '30')

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

    // Get compliance status and policies
    const [complianceStatus, policies, violations] = await Promise.all([
      complianceManager.getTeamComplianceStatus(teamId, days),
      prisma.compliancePolicy.findMany({
        where: { teamId },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          approver: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { violations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complianceViolation.findMany({
        where: {
          teamId,
          detectedAt: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          policy: {
            select: { id: true, name: true, policyType: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { detectedAt: 'desc' },
        take: 50,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        complianceStatus,
        policies: policies.map(formatPolicyForApi),
        violations: violations.map(formatViolationForApi),
      },
    })

  } catch (error: any) {
    console.error('Error fetching compliance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    )
  }
}

// POST /api/security/compliance - Create new compliance policy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      teamId,
      policyType,
      name,
      description,
      rules,
      isRequired = false,
      effectiveFrom,
      expiresAt,
    } = body

    if (!teamId || !policyType || !name || !rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'teamId, policyType, name, and rules are required' },
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

    // Create policy
    const policy = await complianceManager.createPolicy(
      teamId,
      {
        policyType,
        name: name.trim(),
        description: description?.trim(),
        rules,
        isRequired,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      session.user.id
    )

    const policyWithRelations = await prisma.compliancePolicy.findUnique({
      where: { id: policy.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { violations: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        policy: formatPolicyForApi(policyWithRelations!),
      },
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating compliance policy:', error)
    return NextResponse.json(
      { error: 'Failed to create compliance policy' },
      { status: 500 }
    )
  }
}

function formatPolicyForApi(policy: any) {
  return {
    id: policy.id,
    policyType: policy.policyType,
    name: policy.name,
    description: policy.description,
    rules: policy.rules ? JSON.parse(policy.rules) : [],
    isActive: policy.isActive,
    isRequired: policy.isRequired,
    effectiveFrom: policy.effectiveFrom,
    expiresAt: policy.expiresAt,
    approvedAt: policy.approvedAt,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
    creator: policy.creator,
    approver: policy.approver,
    stats: {
      violationCount: policy._count?.violations || 0,
    },
  }
}

function formatViolationForApi(violation: any) {
  return {
    id: violation.id,
    violationType: violation.violationType,
    severity: violation.severity,
    title: violation.title,
    description: violation.description,
    details: violation.details ? JSON.parse(violation.details) : {},
    status: violation.status,
    detectedAt: violation.detectedAt,
    resolvedAt: violation.resolvedAt,
    resolution: violation.resolution,
    policy: violation.policy,
    user: violation.user,
  }
}