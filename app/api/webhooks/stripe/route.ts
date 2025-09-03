import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { validateWebhookSignature, getCheckoutSession } from '@/lib/stripe'
import { 
  createOrder, 
  createOrderItem, 
  updateOrderStatus,
  clearCart 
} from '@/lib/db-direct'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }
    
    // Validate webhook signature and get event
    let event: Stripe.Event
    try {
      event = validateWebhookSignature(body, signature)
    } catch (error) {
      console.error('Webhook signature validation failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(checkoutSession)
        break
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(paymentIntent)
        break
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id)
  
  try {
    // Get full session details with line items
    const fullSession = await getCheckoutSession(session.id)
    
    if (!fullSession) {
      console.error('Could not retrieve full session details')
      return
    }
    
    // Extract metadata
    const metadata = fullSession.metadata || {}
    const userId = metadata.userId || null
    const sessionId = metadata.sessionId || null
    const fulfillmentType = metadata.fulfillmentType || 'standard'
    const shippingRate = metadata.shippingRate || 'standard'
    
    // Calculate totals from line items
    let subtotal = 0
    let shipping = 0
    const lineItems = fullSession.line_items?.data || []
    
    lineItems.forEach(item => {
      if (item.description?.includes('Shipping')) {
        shipping = item.amount_total || 0
      } else {
        subtotal += item.amount_total || 0
      }
    })
    
    const tax = 0 // TODO: Calculate tax based on shipping address
    const total = fullSession.amount_total || 0
    
    // Create order in database
    const order = await createOrder({
      userId: userId || undefined,
      sessionId: sessionId || undefined,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      subtotal: subtotal / 100, // Convert from cents to dollars
      shipping: shipping / 100,
      tax: tax / 100,
      total: total / 100,
      currency: session.currency || 'usd',
      status: 'paid',
      customerEmail: session.customer_email || '',
      customerName: session.customer_details?.name || undefined,
      shippingAddress: session.shipping_details?.address,
      billingAddress: session.customer_details?.address,
      metadata: {
        fulfillmentType,
        shippingRate,
        stripeCustomerId: session.customer,
      }
    })
    
    console.log('Order created:', order.id)
    
    // Create order items
    // Note: In a real implementation, we'd need to parse the cart items from metadata
    // or retrieve them from the database using the cartId
    
    // Clear the user's cart after successful order
    if (userId) {
      await clearCart(userId, undefined)
    } else if (sessionId) {
      await clearCart(undefined, sessionId)
    }
    
    // TODO: Send order confirmation email
    // TODO: Trigger fulfillment process with Printful/Printify
    
  } catch (error) {
    console.error('Error processing checkout session:', error)
    // TODO: Send alert to admin about failed order processing
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id)
  
  // Update order status if needed
  // This is a backup in case checkout.session.completed wasn't received
  const metadata = paymentIntent.metadata
  if (metadata?.orderId) {
    await updateOrderStatus(metadata.orderId, 'paid', {
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'succeeded',
    })
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id)
  
  // Update order status to failed
  const metadata = paymentIntent.metadata
  if (metadata?.orderId) {
    await updateOrderStatus(metadata.orderId, 'payment_failed', {
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'failed',
      failureReason: paymentIntent.last_payment_error?.message,
    })
  }
  
  // TODO: Send payment failure email to customer
}