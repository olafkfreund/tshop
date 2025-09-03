import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { CartService } from '@/lib/cart'
import { createCheckoutSession } from '@/lib/stripe'

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: any = { userId: session.user.id }
    if (status) {
      where.status = status.toUpperCase()
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true
                }
              },
              variant: true,
              design: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order.id,
          status: order.status,
          subtotal: order.subtotal,
          shipping: order.shipping,
          tax: order.tax,
          discount: order.discount,
          total: order.total,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          shippingAddress: JSON.parse(order.shippingAddress),
          billingAddress: JSON.parse(order.billingAddress),
          items: order.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            customization: item.customization ? JSON.parse(item.customization) : null,
            product: {
              id: item.product.id,
              name: item.product.name,
              category: item.product.category,
              images: item.product.images
            },
            variant: item.variant,
            design: item.design
          }))
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order from cart
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      cartItems,
      shippingAddress,
      billingAddress,
      paymentMethodId,
      createCheckout = false
    } = body

    // Validate cart items
    const cart = await CartService.getUserCart(session.user.id)
    
    if (!cart.items.length) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Validate cart to ensure items are still available
    const validation = await CartService.validateCart(session.user.id, null)
    
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Cart validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Calculate totals
    const totals = await CartService.getCartTotals(cart, shippingAddress)

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        discount: 0, // Could add discount logic here
        total: totals.total,
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: JSON.stringify(billingAddress || shippingAddress),
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            designId: item.design?.id,
            quantity: item.quantity,
            unitPrice: Number(item.variant?.price || item.product?.basePrice || 0),
            totalPrice: Number(item.variant?.price || item.product?.basePrice || 0) * item.quantity,
            customization: item.customization ? JSON.stringify(item.customization) : null
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            },
            variant: true,
            design: true
          }
        }
      }
    })

    // If creating checkout session, create Stripe checkout
    if (createCheckout) {
      const checkoutSession = await createCheckoutSession({
        userId: session.user.id,
        items: cart.items.map(item => ({
          name: `${item.product?.name} - ${item.variant?.colorName} ${item.variant?.sizeName || ''}`.trim(),
          description: item.product?.description,
          price: Math.round(Number(item.variant?.price || item.product?.basePrice || 0) * 100), // Convert to cents
          quantity: item.quantity,
          images: item.product?.images?.filter(img => img.isPrimary).map(img => img.url) || []
        })),
        successUrl: `${process.env.NEXTAUTH_URL}/orders/${order.id}?success=true`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/checkout?canceled=true`,
        customerEmail: session.user.email!,
        metadata: {
          orderId: order.id
        }
      })

      // Update order with checkout session ID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentId: checkoutSession.id,
          paymentProvider: 'stripe'
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          order,
          checkoutUrl: checkoutSession.url
        }
      })
    }

    // Clear user's cart after successful order creation
    await CartService.clearCart(session.user.id, null)

    return NextResponse.json({
      success: true,
      data: order
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}