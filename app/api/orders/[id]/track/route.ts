import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { fulfillmentService } from '@/lib/fulfillment/fulfillment-service'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    const { id } = params

    // Get the order with fulfillment info
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        fulfillment: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if user owns this order (or is admin)
    if (order.userId !== session?.user?.id && session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    if (!order.fulfillment || order.fulfillment.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          status: order.status,
          message: 'Order is being processed',
          timeline: [
            {
              status: 'Order Placed',
              date: order.createdAt,
              completed: true,
              description: 'Your order has been received and is being prepared for fulfillment.',
            },
            {
              status: 'Processing',
              date: null,
              completed: false,
              description: 'Your order is being prepared for production.',
            },
          ],
        },
      })
    }

    const fulfillmentOrder = order.fulfillment[0]

    // Get latest status from fulfillment provider
    let trackingInfo
    try {
      trackingInfo = await fulfillmentService.getOrderStatus(
        fulfillmentOrder.externalOrderId!,
        fulfillmentOrder.provider
      )

      // Update our database with latest info
      await fulfillmentService.updateFulfillmentRecord(
        order.id,
        fulfillmentOrder.provider,
        fulfillmentOrder.externalOrderId!,
        trackingInfo.status,
        trackingInfo.trackingNumber ? {
          trackingNumber: trackingInfo.trackingNumber,
          trackingUrl: trackingInfo.trackingUrl || '',
          estimatedDelivery: trackingInfo.estimatedDelivery,
        } : undefined
      )
    } catch (error) {
      console.error('Error getting tracking info:', error)
      // Fall back to database info
      trackingInfo = {
        status: fulfillmentOrder.status,
        trackingNumber: fulfillmentOrder.trackingNumber || undefined,
        trackingUrl: fulfillmentOrder.trackingUrl || undefined,
        estimatedDelivery: fulfillmentOrder.estimatedDelivery || undefined,
      }
    }

    // Build timeline based on status
    const timeline = buildOrderTimeline(order, fulfillmentOrder, trackingInfo)

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        status: trackingInfo.status,
        provider: fulfillmentOrder.provider,
        externalOrderId: fulfillmentOrder.externalOrderId,
        trackingNumber: trackingInfo.trackingNumber,
        trackingUrl: trackingInfo.trackingUrl,
        estimatedDelivery: trackingInfo.estimatedDelivery,
        timeline,
        items: order.items.map(item => ({
          id: item.id,
          name: item.product.name,
          variant: `${item.variant.colorName} - ${item.variant.sizeName}`,
          quantity: item.quantity,
          status: trackingInfo.status,
        })),
      },
    })

  } catch (error) {
    console.error('Error tracking order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track order',
      },
      { status: 500 }
    )
  }
}

function buildOrderTimeline(order: any, fulfillment: any, tracking: any) {
  const timeline = []

  // Order placed
  timeline.push({
    status: 'Order Placed',
    date: order.createdAt,
    completed: true,
    description: 'Your order has been received and payment confirmed.',
  })

  // Processing
  const isProcessing = ['PENDING', 'PROCESSING'].includes(tracking.status.toUpperCase())
  timeline.push({
    status: 'Processing',
    date: isProcessing ? fulfillment.createdAt : fulfillment.createdAt,
    completed: !isProcessing,
    description: 'Your design is being prepared for printing.',
  })

  // Production
  const isInProduction = ['PRINTING', 'PRINTED', 'SHIPPED', 'DELIVERED'].includes(tracking.status.toUpperCase())
  timeline.push({
    status: 'In Production',
    date: isInProduction ? fulfillment.updatedAt : null,
    completed: isInProduction,
    description: 'Your items are being printed and prepared for shipping.',
  })

  // Shipped
  const isShipped = ['SHIPPED', 'DELIVERED'].includes(tracking.status.toUpperCase())
  if (isShipped || tracking.trackingNumber) {
    timeline.push({
      status: 'Shipped',
      date: isShipped ? fulfillment.updatedAt : null,
      completed: isShipped,
      description: tracking.trackingNumber 
        ? `Your order has been shipped. Tracking: ${tracking.trackingNumber}`
        : 'Your order has been shipped.',
    })
  }

  // Delivered
  const isDelivered = tracking.status.toUpperCase() === 'DELIVERED'
  if (isDelivered) {
    timeline.push({
      status: 'Delivered',
      date: fulfillment.updatedAt,
      completed: true,
      description: 'Your order has been delivered successfully!',
    })
  } else if (tracking.estimatedDelivery) {
    timeline.push({
      status: 'Estimated Delivery',
      date: tracking.estimatedDelivery,
      completed: false,
      description: `Expected delivery by ${tracking.estimatedDelivery.toLocaleDateString()}`,
    })
  }

  return timeline
}