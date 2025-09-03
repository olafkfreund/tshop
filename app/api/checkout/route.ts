import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CartService } from '@/lib/cart'
import { createCheckoutSession, PRODUCT_PRICES } from '@/lib/stripe'
import { z } from 'zod'

const checkoutSchema = z.object({
  shippingRate: z.enum(['standard', 'express']).default('standard'),
  fulfillmentType: z.enum(['standard', 'premium']).default('standard'),
})

export async function POST(request: NextRequest) {
  try {
    // Get authentication session
    const session = await auth()
    
    // Get session ID from cookies for guest users
    const sessionId = request.cookies.get('session')?.value
    
    if (!session?.user?.id && !sessionId) {
      return NextResponse.json(
        { error: 'No cart found' },
        { status: 400 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const validation = checkoutSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { shippingRate, fulfillmentType } = validation.data
    
    // Get cart items
    const cart = session?.user?.id 
      ? await CartService.getUserCart(session.user.id)
      : await CartService.getGuestCart(sessionId!)
    
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }
    
    // Prepare line items for Stripe
    const lineItems = cart.items.map(item => {
      // Determine product type from product name or category
      let productType: keyof typeof PRODUCT_PRICES = 'TSHIRT'
      if (item.product.name?.toLowerCase().includes('cap')) {
        productType = 'CAP'
      } else if (item.product.name?.toLowerCase().includes('tote')) {
        productType = 'TOTE_BAG'
      }
      
      const priceType = fulfillmentType === 'premium' ? 'premium' : 'base'
      const unitPrice = PRODUCT_PRICES[productType][priceType]
      
      return {
        name: `${item.product.name} - ${item.variant.name}`,
        description: item.customization?.designName || 'Custom Design',
        price: unitPrice,
        quantity: item.quantity,
        images: item.product.images?.length > 0 ? [item.product.images[0].url] : undefined,
      }
    })
    
    // Add shipping as a line item
    const shippingPrice = shippingRate === 'express' ? 999 : 499 // $9.99 or $4.99
    lineItems.push({
      name: `${shippingRate === 'express' ? 'Express' : 'Standard'} Shipping`,
      description: shippingRate === 'express' ? '2-3 business days' : '5-7 business days',
      price: shippingPrice,
      quantity: 1,
      images: undefined,
    })
    
    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
    const checkoutSession = await createCheckoutSession({
      userId: session?.user?.id,
      items: lineItems,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/cart`,
      customerEmail: session?.user?.email,
      metadata: {
        cartId: cart.id,
        userId: session?.user?.id || '',
        sessionId: sessionId || '',
        fulfillmentType,
        shippingRate,
      },
    })
    
    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
    
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}