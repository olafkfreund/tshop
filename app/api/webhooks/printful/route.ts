import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fulfillmentService } from '@/lib/fulfillment/fulfillment-service'
import crypto from 'crypto'

// Printful webhook events
interface PrintfulWebhook {
  type: string
  created: number
  retries: number
  store: number
  data: {
    order?: {
      id: number
      external_id: string
      status: string
      shipping: string
      created: number
      updated: number
    }
    shipment?: {
      id: number
      carrier: string
      service: string
      tracking_number: string
      tracking_url: string
      created: number
      shipped_at: number
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-pf-signature')
    
    // Verify webhook signature if secret is configured
    if (process.env.PRINTFUL_WEBHOOK_SECRET) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.PRINTFUL_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const webhook: PrintfulWebhook = JSON.parse(body)
    
    console.log('Received Printful webhook:', webhook.type, webhook.data)

    // Handle different webhook types
    switch (webhook.type) {
      case 'order_updated':
        await handleOrderUpdated(webhook)
        break
      
      case 'order_failed':
        await handleOrderFailed(webhook)
        break
      
      case 'order_canceled':
        await handleOrderCanceled(webhook)
        break
      
      case 'package_shipped':
        await handlePackageShipped(webhook)
        break
      
      case 'package_returned':
        await handlePackageReturned(webhook)
        break
      
      default:
        console.log('Unhandled Printful webhook type:', webhook.type)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing Printful webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleOrderUpdated(webhook: PrintfulWebhook) {
  const { order } = webhook.data
  if (!order) return

  try {
    // Find our order by external_id
    const tshopOrder = await prisma.order.findFirst({
      where: { id: order.external_id },
      include: { fulfillment: true }
    })

    if (!tshopOrder) {
      console.error('Order not found for external_id:', order.external_id)
      return
    }

    // Update fulfillment record
    await fulfillmentService.updateFulfillmentRecord(
      tshopOrder.id,
      'PRINTFUL',
      order.id.toString(),
      order.status
    )

    // Update main order status based on fulfillment status
    const orderStatusMap: { [key: string]: string } = {
      'draft': 'PENDING',
      'pending': 'PROCESSING',
      'confirmed': 'PROCESSING', 
      'inprocess': 'PRINTED',
      'onhold': 'PROCESSING',
      'partial': 'SHIPPED',
      'fulfilled': 'SHIPPED',
      'canceled': 'CANCELLED',
      'failed': 'CANCELLED',
    }

    const newStatus = orderStatusMap[order.status] || 'PROCESSING'

    await prisma.order.update({
      where: { id: tshopOrder.id },
      data: { 
        status: newStatus as any,
        updatedAt: new Date()
      }
    })

    console.log(`Updated order ${tshopOrder.id} status to ${newStatus}`)

  } catch (error) {
    console.error('Error handling order update:', error)
  }
}

async function handleOrderFailed(webhook: PrintfulWebhook) {
  const { order } = webhook.data
  if (!order) return

  try {
    await prisma.order.update({
      where: { id: order.external_id },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    await fulfillmentService.updateFulfillmentRecord(
      order.external_id,
      'PRINTFUL',
      order.id.toString(),
      'FAILED'
    )

    console.log(`Marked order ${order.external_id} as failed`)

    // TODO: Send notification to customer about failed order
    
  } catch (error) {
    console.error('Error handling failed order:', error)
  }
}

async function handleOrderCanceled(webhook: PrintfulWebhook) {
  const { order } = webhook.data
  if (!order) return

  try {
    await prisma.order.update({
      where: { id: order.external_id },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    await fulfillmentService.updateFulfillmentRecord(
      order.external_id,
      'PRINTFUL',
      order.id.toString(),
      'CANCELLED'
    )

    console.log(`Canceled order ${order.external_id}`)

    // TODO: Send notification to customer about canceled order
    // TODO: Process refund if payment was captured

  } catch (error) {
    console.error('Error handling canceled order:', error)
  }
}

async function handlePackageShipped(webhook: PrintfulWebhook) {
  const { order, shipment } = webhook.data
  if (!order || !shipment) return

  try {
    // Update order status
    await prisma.order.update({
      where: { id: order.external_id },
      data: { 
        status: 'SHIPPED',
        updatedAt: new Date()
      }
    })

    // Update fulfillment with tracking info
    await fulfillmentService.updateFulfillmentRecord(
      order.external_id,
      'PRINTFUL',
      order.id.toString(),
      'SHIPPED',
      {
        trackingNumber: shipment.tracking_number,
        trackingUrl: shipment.tracking_url,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days estimate
      }
    )

    console.log(`Order ${order.external_id} shipped with tracking ${shipment.tracking_number}`)

    // TODO: Send shipping notification email to customer

  } catch (error) {
    console.error('Error handling package shipped:', error)
  }
}

async function handlePackageReturned(webhook: PrintfulWebhook) {
  const { order } = webhook.data
  if (!order) return

  try {
    await fulfillmentService.updateFulfillmentRecord(
      order.external_id,
      'PRINTFUL',
      order.id.toString(),
      'CANCELLED'
    )

    console.log(`Package returned for order ${order.external_id}`)

    // TODO: Handle returned package logic
    // TODO: Notify customer about return

  } catch (error) {
    console.error('Error handling package return:', error)
  }
}