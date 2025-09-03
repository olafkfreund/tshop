import { NextRequest, NextResponse } from 'next/server'
import { withPartnerAuth } from '@/lib/partner-auth'
import { prisma } from '@/lib/db'

// GET /api/partners/webhooks/[id] - Get specific webhook
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPartnerAuth(request, 'webhooks:read', async (apiKey, req) => {
    try {
      const { id } = params

      const webhook = await prisma.partnerWebhook.findFirst({
        where: {
          id,
          teamId: apiKey.teamId,
        },
        include: {
          deliveries: {
            orderBy: { scheduledFor: 'desc' },
            take: 50,
          },
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
      })

      if (!webhook) {
        return NextResponse.json(
          { error: 'Webhook not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          webhook: formatDetailedWebhookForApi(webhook),
        },
      })

    } catch (error: any) {
      console.error('Error fetching webhook:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch webhook' },
        { status: 500 }
      )
    }
  })
}

// PUT /api/partners/webhooks/[id] - Update webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPartnerAuth(request, 'webhooks:write', async (apiKey, req) => {
    try {
      const { id } = params
      const body = await req.json()
      const { url, events, isActive, description } = body

      // Check if webhook exists and belongs to team
      const existingWebhook = await prisma.partnerWebhook.findFirst({
        where: {
          id,
          teamId: apiKey.teamId,
        },
      })

      if (!existingWebhook) {
        return NextResponse.json(
          { error: 'Webhook not found' },
          { status: 404 }
        )
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      }

      if (url !== undefined) {
        try {
          new URL(url)
          updateData.url = url.trim()
        } catch {
          return NextResponse.json(
            { error: 'Invalid URL format' },
            { status: 400 }
          )
        }
      }

      if (events !== undefined) {
        if (!Array.isArray(events) || events.length === 0) {
          return NextResponse.json(
            { error: 'Events must be a non-empty array' },
            { status: 400 }
          )
        }

        const validEvents = [
          'order.created', 'order.updated', 'order.completed', 'order.cancelled',
          'design.created', 'design.updated', 'design.approved', 'design.rejected',
          'team.member.added', 'team.member.removed', 'team.updated',
        ]

        const invalidEvents = events.filter((event: string) => !validEvents.includes(event))
        if (invalidEvents.length > 0) {
          return NextResponse.json(
            { error: `Invalid events: ${invalidEvents.join(', ')}` },
            { status: 400 }
          )
        }

        updateData.events = events
      }

      if (isActive !== undefined) {
        updateData.isActive = isActive
      }

      if (description !== undefined) {
        updateData.description = description?.trim()
      }

      const updatedWebhook = await prisma.partnerWebhook.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({
        success: true,
        data: {
          webhook: formatWebhookForApi(updatedWebhook),
        },
      })

    } catch (error: any) {
      console.error('Error updating webhook:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update webhook' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/partners/webhooks/[id] - Delete webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPartnerAuth(request, 'webhooks:delete', async (apiKey, req) => {
    try {
      const { id } = params

      // Check if webhook exists and belongs to team
      const existingWebhook = await prisma.partnerWebhook.findFirst({
        where: {
          id,
          teamId: apiKey.teamId,
        },
      })

      if (!existingWebhook) {
        return NextResponse.json(
          { error: 'Webhook not found' },
          { status: 404 }
        )
      }

      // Delete webhook and related deliveries (cascade)
      await prisma.partnerWebhook.delete({
        where: { id },
      })

      return NextResponse.json({
        success: true,
        message: 'Webhook deleted successfully',
        data: {
          webhookId: id,
          deletedAt: new Date(),
        },
      })

    } catch (error: any) {
      console.error('Error deleting webhook:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete webhook' },
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
  }
}

function formatDetailedWebhookForApi(webhook: any) {
  return {
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    isActive: webhook.isActive,
    description: webhook.description,
    secret: webhook.secret,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
    deliveries: webhook.deliveries?.map((delivery: any) => ({
      id: delivery.id,
      eventType: delivery.eventType,
      status: delivery.status,
      scheduledFor: delivery.scheduledFor,
      deliveredAt: delivery.deliveredAt,
      attempts: delivery.attempts,
      responseStatus: delivery.responseStatus,
      errorMessage: delivery.errorMessage,
    })) || [],
    stats: {
      totalDeliveries: webhook._count?.deliveries || 0,
      successfulDeliveries: webhook.deliveries?.filter((d: any) => d.status === 'DELIVERED').length || 0,
      failedDeliveries: webhook.deliveries?.filter((d: any) => d.status === 'FAILED').length || 0,
      pendingDeliveries: webhook.deliveries?.filter((d: any) => d.status === 'PENDING').length || 0,
    },
  }
}