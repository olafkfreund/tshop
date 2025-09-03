import { NextRequest, NextResponse } from 'next/server'
import { fulfillmentService } from '@/lib/fulfillment/fulfillment-service'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, provider } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    if (!provider || !['PRINTFUL', 'PRINTIFY'].includes(provider)) {
      return NextResponse.json({ error: 'Valid provider is required (PRINTFUL or PRINTIFY)' }, { status: 400 })
    }

    // Get the order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        shippingAddress: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (order.status !== 'PAID') {
      return NextResponse.json({ error: 'Order must be paid before fulfillment' }, { status: 400 })
    }

    // Submit order to fulfillment provider
    const result = await fulfillmentService.submitOrder(order, order.items, provider)

    if (result.success) {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' }
      })

      // Create fulfillment record
      await fulfillmentService.updateFulfillmentRecord(
        orderId,
        provider,
        result.externalOrderId!,
        'PENDING',
        result.trackingNumber ? {
          trackingNumber: result.trackingNumber,
          trackingUrl: '',
          estimatedDelivery: result.estimatedDelivery
        } : undefined
      )
    }

    return NextResponse.json({
      success: result.success,
      externalOrderId: result.externalOrderId,
      estimatedDelivery: result.estimatedDelivery,
      provider: result.provider,
      error: result.error
    })

  } catch (error) {
    console.error('Error submitting fulfillment order:', error)
    return NextResponse.json(
      { error: 'Failed to submit fulfillment order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get fulfillment order
    const fulfillmentOrder = await prisma.fulfillmentOrder.findUnique({
      where: { orderId },
      include: {
        order: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!fulfillmentOrder) {
      return NextResponse.json({ error: 'Fulfillment order not found' }, { status: 404 })
    }

    if (fulfillmentOrder.order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get latest status from provider if we have external order ID
    let latestStatus = {
      status: fulfillmentOrder.status,
      trackingNumber: fulfillmentOrder.trackingNumber,
      trackingUrl: fulfillmentOrder.trackingUrl,
      estimatedDelivery: fulfillmentOrder.estimatedDelivery
    }

    if (fulfillmentOrder.externalOrderId) {
      try {
        const providerStatus = await fulfillmentService.getOrderStatus(
          fulfillmentOrder.externalOrderId,
          fulfillmentOrder.provider
        )
        
        latestStatus = {
          status: providerStatus.status,
          trackingNumber: providerStatus.trackingNumber || fulfillmentOrder.trackingNumber,
          trackingUrl: providerStatus.trackingUrl || fulfillmentOrder.trackingUrl,
          estimatedDelivery: providerStatus.estimatedDelivery || fulfillmentOrder.estimatedDelivery
        }

        // Update our record if status changed
        if (providerStatus.status !== fulfillmentOrder.status) {
          await fulfillmentService.updateFulfillmentRecord(
            orderId,
            fulfillmentOrder.provider,
            fulfillmentOrder.externalOrderId,
            providerStatus.status,
            providerStatus.trackingNumber ? {
              trackingNumber: providerStatus.trackingNumber,
              trackingUrl: providerStatus.trackingUrl || '',
              estimatedDelivery: providerStatus.estimatedDelivery
            } : undefined
          )
        }
      } catch (error) {
        console.error('Error getting latest status from provider:', error)
        // Fall back to database record
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      provider: fulfillmentOrder.provider,
      externalOrderId: fulfillmentOrder.externalOrderId,
      status: latestStatus.status,
      trackingNumber: latestStatus.trackingNumber,
      trackingUrl: latestStatus.trackingUrl,
      estimatedDelivery: latestStatus.estimatedDelivery,
      createdAt: fulfillmentOrder.createdAt,
      updatedAt: fulfillmentOrder.updatedAt
    })

  } catch (error) {
    console.error('Error getting fulfillment order status:', error)
    return NextResponse.json(
      { error: 'Failed to get fulfillment order status' },
      { status: 500 }
    )
  }
}