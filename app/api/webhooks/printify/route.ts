import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fulfillmentService } from '@/lib/fulfillment/fulfillment-service'
import crypto from 'crypto'

// Printify webhook events
interface PrintifyWebhook {
  id: string
  type: string
  created_at: string
  resource: {
    id: string
    type: string
    attributes?: {
      status?: string
      external_id?: string
      tracking_number?: string
      tracking_url?: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-pfy-signature')
    
    // Verify webhook signature if secret is configured
    if (process.env.PRINTIFY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.PRINTIFY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expectedSignature}`))) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const webhook: PrintifyWebhook = JSON.parse(body)
    
    console.log('Received Printify webhook:', webhook.type, webhook.resource)

    // Handle different webhook types
    switch (webhook.type) {
      case 'order:sent-to-production':
        await handleOrderSentToProduction(webhook)
        break
      
      case 'order:shipment:created':
        await handleShipmentCreated(webhook)
        break
      
      case 'order:shipment:delivered':
        await handleShipmentDelivered(webhook)
        break
      
      case 'order:canceled':
        await handleOrderCanceled(webhook)
        break
      
      default:
        console.log('Unhandled Printify webhook type:', webhook.type)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing Printify webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleOrderSentToProduction(webhook: PrintifyWebhook) {
  const { resource } = webhook
  if (resource.type !== 'order' || !resource.attributes?.external_id) return

  try {
    const externalId = resource.attributes.external_id
    
    // Find our order by external_id
    const tshopOrder = await prisma.order.findFirst({
      where: { id: externalId },
      include: { fulfillment: true }
    })

    if (!tshopOrder) {
      console.error('Order not found for external_id:', externalId)
      return
    }

    // Update fulfillment record
    await fulfillmentService.updateFulfillmentRecord(
      tshopOrder.id,
      'PRINTIFY',
      resource.id,
      'PROCESSING'
    )

    // Update main order status
    await prisma.order.update({
      where: { id: tshopOrder.id },
      data: { 
        status: 'PROCESSING',
        updatedAt: new Date()
      }
    })

    console.log(`Order ${tshopOrder.id} sent to production`)

  } catch (error) {
    console.error('Error handling order sent to production:', error)
  }
}

async function handleShipmentCreated(webhook: PrintifyWebhook) {
  const { resource } = webhook
  if (resource.type !== 'order' || !resource.attributes?.external_id) return

  try {
    const externalId = resource.attributes.external_id
    
    // Update order status
    await prisma.order.update({
      where: { id: externalId },
      data: { 
        status: 'SHIPPED',
        updatedAt: new Date()
      }
    })

    // Update fulfillment with tracking info
    await fulfillmentService.updateFulfillmentRecord(
      externalId,
      'PRINTIFY',
      resource.id,
      'SHIPPED',
      resource.attributes.tracking_number ? {
        trackingNumber: resource.attributes.tracking_number,
        trackingUrl: resource.attributes.tracking_url || '',
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days estimate
      } : undefined
    )

    console.log(`Order ${externalId} shipped`)

    // TODO: Send shipping notification email to customer

  } catch (error) {
    console.error('Error handling shipment created:', error)
  }
}

async function handleShipmentDelivered(webhook: PrintifyWebhook) {
  const { resource } = webhook
  if (resource.type !== 'order' || !resource.attributes?.external_id) return

  try {
    const externalId = resource.attributes.external_id
    
    // Update order status
    await prisma.order.update({
      where: { id: externalId },
      data: { 
        status: 'DELIVERED',
        updatedAt: new Date()
      }
    })

    // Update fulfillment status
    await fulfillmentService.updateFulfillmentRecord(
      externalId,
      'PRINTIFY',
      resource.id,
      'DELIVERED'
    )

    console.log(`Order ${externalId} delivered`)

    // TODO: Send delivery confirmation email
    // TODO: Request review from customer

  } catch (error) {
    console.error('Error handling shipment delivered:', error)
  }
}

async function handleOrderCanceled(webhook: PrintifyWebhook) {
  const { resource } = webhook
  if (resource.type !== 'order' || !resource.attributes?.external_id) return

  try {
    const externalId = resource.attributes.external_id
    
    await prisma.order.update({
      where: { id: externalId },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    await fulfillmentService.updateFulfillmentRecord(
      externalId,
      'PRINTIFY',
      resource.id,
      'CANCELLED'
    )

    console.log(`Order ${externalId} canceled`)

    // TODO: Send cancellation notification
    // TODO: Process refund if needed

  } catch (error) {
    console.error('Error handling order canceled:', error)
  }
}