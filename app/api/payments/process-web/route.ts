import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { paymentDetails, amount, currency = 'usd', orderId } = await request.json()

    if (!paymentDetails || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment data' },
        { status: 400 }
      )
    }

    // Create payment method from Web Payments API card details
    let paymentMethod
    
    try {
      paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: paymentDetails.cardNumber,
          exp_month: paymentDetails.expiryMonth,
          exp_year: paymentDetails.expiryYear,
          cvc: paymentDetails.cardSecurityCode,
        },
        billing_details: {
          name: paymentDetails.cardholderName || '',
        },
      })
    } catch (error: any) {
      console.error('Error creating payment method:', error)
      return NextResponse.json({
        success: false,
        error: 'Invalid payment details',
      })
    }

    // Create and confirm payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethod.id,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        orderId: orderId || 'unknown',
        source: 'web_payments_api',
      },
    })

    // Handle the payment result
    if (paymentIntent.status === 'requires_action') {
      // 3D Secure or other authentication required
      return NextResponse.json({
        success: false,
        requiresAction: true,
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
        },
      })
    } else if (paymentIntent.status === 'succeeded') {
      // Payment succeeded
      console.log('Web payment succeeded:', paymentIntent.id)
      
      // Here you would typically:
      // 1. Update order status in database
      // 2. Send confirmation email
      // 3. Trigger fulfillment process
      // 4. Update inventory
      
      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      })
    } else {
      // Payment failed
      return NextResponse.json({
        success: false,
        error: 'Payment failed',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      })
    }

  } catch (error: any) {
    console.error('Web payment processing error:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    } else if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment request',
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Payment processing failed',
      }, { status: 500 })
    }
  }
}