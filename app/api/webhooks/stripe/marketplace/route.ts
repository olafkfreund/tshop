import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')!

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle design purchase payment completion
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object

      // Check if this is a design license purchase
      if (paymentIntent.metadata?.type === 'design_license_purchase') {
        await handleDesignPurchaseCompletion(paymentIntent)
      }
    }

    // Handle payment failures
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object

      if (paymentIntent.metadata?.type === 'design_license_purchase') {
        await handleDesignPurchaseFailure(paymentIntent)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleDesignPurchaseCompletion(paymentIntent: any) {
  try {
    const purchaseId = paymentIntent.metadata.purchaseId
    
    if (!purchaseId) {
      console.error('No purchaseId in payment intent metadata')
      return
    }

    // Update purchase status to completed
    const purchase = await prisma.designPurchase.update({
      where: { id: purchaseId },
      data: {
        status: 'COMPLETED',
        purchasedAt: new Date(),
        stripePaymentIntentId: paymentIntent.id
      },
      include: {
        designer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        marketplaceDesign: {
          include: {
            design: {
              select: {
                id: true,
                prompt: true,
                imageUrl: true
              }
            }
          }
        }
      }
    })

    // Update designer profile stats
    await prisma.designerProfile.update({
      where: { id: purchase.designerId },
      data: {
        totalSales: { increment: 1 },
        totalEarnings: { increment: purchase.designerEarnings }
      }
    })

    // Create designer payout record
    await prisma.designerPayout.create({
      data: {
        designerId: purchase.designerId,
        amount: purchase.designerEarnings,
        currency: 'USD',
        source: 'DESIGN_SALE',
        sourceId: purchase.id,
        status: 'PENDING'
      }
    })

    // For exclusive licenses, deactivate the design
    if (purchase.licenseType === 'EXCLUSIVE') {
      await prisma.marketplaceDesign.update({
        where: { id: purchase.marketplaceDesignId },
        data: { isActive: false }
      })
    }

    console.log(`Design purchase completed: ${purchaseId}`)
  } catch (error) {
    console.error('Error handling design purchase completion:', error)
  }
}

async function handleDesignPurchaseFailure(paymentIntent: any) {
  try {
    const purchaseId = paymentIntent.metadata.purchaseId
    
    if (!purchaseId) {
      console.error('No purchaseId in payment intent metadata')
      return
    }

    // Update purchase status to failed
    await prisma.designPurchase.update({
      where: { id: purchaseId },
      data: {
        status: 'FAILED',
        stripePaymentIntentId: paymentIntent.id
      }
    })

    console.log(`Design purchase failed: ${purchaseId}`)
  } catch (error) {
    console.error('Error handling design purchase failure:', error)
  }
}