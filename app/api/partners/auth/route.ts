import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db'
import { generateApiKey, hashApiKey } from '@/lib/partner-auth'

// GET /api/partners/auth - Get partner API credentials
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
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

    // Check if user is team owner/admin with API access
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Check if team plan supports API access
    if (!['BUSINESS', 'ENTERPRISE'].includes(teamMember.team.plan)) {
      return NextResponse.json(
        { error: 'API access requires Business or Enterprise plan' },
        { status: 403 }
      )
    }

    // Get existing API keys
    const apiKeys = await prisma.partnerApiKey.findMany({
      where: { teamId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true,
        rateLimit: true,
        usage: {
          select: {
            requestCount: true,
            lastRequestAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      team: {
        id: teamMember.team.id,
        name: teamMember.team.name,
        plan: teamMember.team.plan,
      },
      apiKeys,
      limits: getApiLimits(teamMember.team.plan),
    })

  } catch (error: any) {
    console.error('Error fetching partner credentials:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API credentials' },
      { status: 500 }
    )
  }
}

// POST /api/partners/auth - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { teamId, name, permissions = [], rateLimit } = body

    if (!teamId || !name) {
      return NextResponse.json(
        { error: 'Team ID and API key name are required' },
        { status: 400 }
      )
    }

    // Get user and validate permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
      include: {
        team: {
          select: {
            plan: true,
          },
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    if (!['BUSINESS', 'ENTERPRISE'].includes(teamMember.team.plan)) {
      return NextResponse.json(
        { error: 'API access requires Business or Enterprise plan' },
        { status: 403 }
      )
    }

    // Check API key limits
    const existingKeys = await prisma.partnerApiKey.count({
      where: {
        teamId,
        isActive: true,
      },
    })

    const limits = getApiLimits(teamMember.team.plan)
    if (existingKeys >= limits.maxApiKeys) {
      return NextResponse.json(
        { error: `Maximum ${limits.maxApiKeys} API keys allowed for ${teamMember.team.plan} plan` },
        { status: 403 }
      )
    }

    // Validate permissions
    const validPermissions = [
      'designs:read', 'designs:write', 'designs:delete',
      'products:read', 'products:write',
      'orders:read', 'orders:write',
      'teams:read', 'teams:write',
      'analytics:read'
    ]

    const filteredPermissions = permissions.filter((p: string) => validPermissions.includes(p))

    // Generate API key
    const apiKey = generateApiKey()
    const hashedKey = hashApiKey(apiKey)

    // Create API key record
    const newApiKey = await prisma.partnerApiKey.create({
      data: {
        teamId,
        name: name.trim(),
        keyHash: hashedKey,
        keyPrefix: apiKey.substring(0, 8),
        permissions: filteredPermissions,
        rateLimit: Math.min(rateLimit || limits.defaultRateLimit, limits.maxRateLimit),
        isActive: true,
        createdById: user.id,
      },
    })

    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        type: 'API_KEY_CREATED',
        userId: user.id,
        teamId,
        metadata: {
          apiKeyId: newApiKey.id,
          apiKeyName: name,
          permissions: filteredPermissions,
        },
      },
    })

    return NextResponse.json({
      success: true,
      apiKey: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: apiKey, // Only returned once during creation
        keyPrefix: newApiKey.keyPrefix,
        permissions: newApiKey.permissions,
        rateLimit: newApiKey.rateLimit,
        createdAt: newApiKey.createdAt,
      },
      warning: 'Save this API key securely. It will not be shown again.',
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    )
  }
}

// DELETE /api/partners/auth - Revoke API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const apiKeyId = searchParams.get('apiKeyId')
    const teamId = searchParams.get('teamId')

    if (!apiKeyId || !teamId) {
      return NextResponse.json(
        { error: 'API key ID and team ID are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify permissions
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Deactivate API key
    const apiKey = await prisma.partnerApiKey.update({
      where: {
        id: apiKeyId,
        teamId, // Ensure key belongs to the team
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedById: user.id,
      },
    })

    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        type: 'API_KEY_REVOKED',
        userId: user.id,
        teamId,
        metadata: {
          apiKeyId,
          apiKeyName: apiKey.name,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    })

  } catch (error: any) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}

function getApiLimits(plan: string) {
  switch (plan) {
    case 'ENTERPRISE':
      return {
        maxApiKeys: 10,
        defaultRateLimit: 10000, // requests per hour
        maxRateLimit: 50000,
        features: ['webhooks', 'batch_operations', 'advanced_analytics'],
      }
    case 'BUSINESS':
      return {
        maxApiKeys: 5,
        defaultRateLimit: 1000,
        maxRateLimit: 5000,
        features: ['basic_analytics'],
      }
    default:
      return {
        maxApiKeys: 0,
        defaultRateLimit: 0,
        maxRateLimit: 0,
        features: [],
      }
  }
}