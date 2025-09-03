import { NextRequest, NextResponse } from 'next/server'
import { withPartnerAuth } from '@/lib/partner-auth'
import { prisma } from '@/lib/db'

// GET /api/partners/webhooks - List team webhooks
export async function GET(request: NextRequest) {
  return withPartnerAuth(request, 'webhooks:read', async (apiKey, req) => {
    try {
      const webhooks = await prisma.partnerWebhook.findMany({
        where: { teamId: apiKey.teamId },
        include: {
          deliveries: {
            select: {
              id: true,
              eventType: true,
              status: true,
              scheduledFor: true,
              deliveredAt: true,
              attempts: true,
            },
            orderBy: { scheduledFor: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        success: true,
        data: {
          webhooks: webhooks.map(formatWebhookForApi),
        },
      })

    } catch (error: any) {
      console.error('Error fetching webhooks:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch webhooks' },
        { status: 500 }
      )
    }
  })
}

// POST /api/partners/webhooks - Create webhook
export async function POST(request: NextRequest) {
  return withPartnerAuth(request, 'webhooks:write', async (apiKey, req) => {
    try {
      const body = await req.json()
      const { url, events, isActive = true, description } = body

      if (!url || !events || !Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          { error: 'URL and events array are required' },
          { status: 400 }
        )
      }

      // Validate URL
      try {
        new URL(url)
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }

      // Validate events
      const validEvents = [
        'order.created', 'order.updated', 'order.completed', 'order.cancelled',
        'design.created', 'design.updated', 'design.approved', 'design.rejected',
        'team.member.added', 'team.member.removed', 'team.updated',
      ]

      const invalidEvents = events.filter((event: string) => !validEvents.includes(event))
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid events: ${invalidEvents.join(', ')}. Valid events: ${validEvents.join(', ')}` },
          { status: 400 }
        )
      }

      const webhook = await prisma.partnerWebhook.create({
        data: {
          teamId: apiKey.teamId,
          url: url.trim(),
          events,
          isActive,
          description: description?.trim(),
          secret: generateWebhookSecret(),
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          webhook: formatWebhookForApi(webhook),
        },
      }, { status: 201 })

    } catch (error: any) {
      console.error('Error creating webhook:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create webhook' },
        { status: 500 }
      )
    }
  })
}

function formatWebhookForApi(webhook: any) {
  return {
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    isActive: webhook.isActive,
    description: webhook.description,
    secret: webhook.secret,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
    recentDeliveries: webhook.deliveries || [],
    stats: {
      totalDeliveries: webhook._count?.deliveries || 0,
    },
  }
}

function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'whs_'
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}