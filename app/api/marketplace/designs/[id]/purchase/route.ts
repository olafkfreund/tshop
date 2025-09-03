import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'

interface RouteParams {
  params: {
    id: string
  }
}

const purchaseDesignSchema = z.object({
  licenseType: z.enum(['STANDARD', 'EXTENDED', 'EXCLUSIVE']),
  intendedUse: z.string().min(1).max(500).optional()
})

// POST /api/marketplace/designs/[id]/purchase - Purchase design license
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: designId } = params
    const body = await request.json()
    const { licenseType, intendedUse } = purchaseDesignSchema.parse(body)

    // Get design details
    const design = await prisma.marketplaceDesign.findUnique({
      where: { id: designId, isActive: true },
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
        design: {
          select: {
            id: true,
            prompt: true,
            imageUrl: true
          }
        }
      }
    })

    if (!design) {
      return NextResponse.json(
        { success: false, error: 'Design not found or unavailable' },
        { status: 404 }
      )
    }

    // Don't allow purchasing your own designs
    if (design.designer.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot purchase your own design' },
        { status: 400 }
      )
    }

    // Check if user already purchased this license type for this design
    const existingPurchase = await prisma.designPurchase.findFirst({
      where: {
        marketplaceDesignId: designId,
        buyerId: session.user.id,
        licenseType,
        status: 'COMPLETED'
      }
    })

    if (existingPurchase) {
      return NextResponse.json(
        { success: false, error: 'You already own this license for this design' },
        { status: 409 }
      )
    }

    // For exclusive licenses, check if anyone already owns it
    if (licenseType === 'EXCLUSIVE') {
      const exclusivePurchase = await prisma.designPurchase.findFirst({
        where: {
          marketplaceDesignId: designId,
          licenseType: 'EXCLUSIVE',
          status: 'COMPLETED'
        }
      })

      if (exclusivePurchase) {
        return NextResponse.json(
          { success: false, error: 'Exclusive license already sold' },
          { status: 409 }
        )
      }
    }

    // Calculate pricing based on license type
    let price = Number(design.basePrice)
    let licensePriceMultiplier = 1

    switch (licenseType) {
      case 'STANDARD':
        licensePriceMultiplier = 1
        break
      case 'EXTENDED':
        licensePriceMultiplier = 2.5
        break
      case 'EXCLUSIVE':
        licensePriceMultiplier = 10
        break
    }

    price = Math.round(price * licensePriceMultiplier * 100) / 100

    // Calculate designer earnings
    const royaltyRate = Number(design.royaltyRate)
    const designerEarnings = Math.round(price * royaltyRate * 100) / 100
    const platformFee = price - designerEarnings

    // Create pending purchase record
    const purchase = await prisma.designPurchase.create({
      data: {
        marketplaceDesignId: designId,
        buyerId: session.user.id,
        designerId: design.designerId,
        licenseType,
        price,
        designerEarnings,
        platformFee,
        intendedUse,
        status: 'PENDING'
      }
    })

    // Create Stripe payment intent
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          type: 'design_license_purchase',
          purchaseId: purchase.id,
          designId: design.id,
          licenseType,
          buyerId: session.user.id,
          designerId: design.designerId
        },
        description: `${licenseType} license for "${design.title}"`
      })

      // Update purchase with payment intent ID
      await prisma.designPurchase.update({
        where: { id: purchase.id },
        data: { stripePaymentIntentId: paymentIntent.id }
      })

      return NextResponse.json({
        success: true,
        data: {
          purchase: {
            id: purchase.id,
            designTitle: design.title,
            licenseType,
            price,
            designerEarnings,
            platformFee
          },
          payment: {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
          }
        }
      })
    } catch (stripeError) {
      console.error('Stripe payment intent creation failed:', stripeError)
      
      // Clean up pending purchase if Stripe fails
      await prisma.designPurchase.delete({
        where: { id: purchase.id }
      })
      
      return NextResponse.json(
        { success: false, error: 'Payment processing failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error purchasing design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process purchase' },
      { status: 500 }
    )
  }
}

// GET /api/marketplace/designs/[id]/purchase - Get user's purchase status for this design
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        data: { purchases: [] }
      })
    }

    const { id: designId } = params

    const purchases = await prisma.designPurchase.findMany({
      where: {
        marketplaceDesignId: designId,
        buyerId: session.user.id,
        status: 'COMPLETED'
      },
      select: {
        id: true,
        licenseType: true,
        price: true,
        purchasedAt: true,
        intendedUse: true
      },
      orderBy: { purchasedAt: 'desc' }
    })

    // Check what licenses are still available
    const allPurchases = await prisma.designPurchase.findMany({
      where: {
        marketplaceDesignId: designId,
        status: 'COMPLETED'
      },
      select: {
        licenseType: true
      }
    })

    const soldLicenses = new Set(allPurchases.map(p => p.licenseType))
    const availableLicenses = ['STANDARD', 'EXTENDED', 'EXCLUSIVE'].filter(license => {
      // Exclusive can only be sold once
      if (license === 'EXCLUSIVE' && soldLicenses.has('EXCLUSIVE')) return false
      return true
    })

    return NextResponse.json({
      success: true,
      data: {
        userPurchases: purchases,
        availableLicenses,
        hasStandardLicense: purchases.some(p => p.licenseType === 'STANDARD'),
        hasExtendedLicense: purchases.some(p => p.licenseType === 'EXTENDED'),
        hasExclusiveLicense: purchases.some(p => p.licenseType === 'EXCLUSIVE')
      }
    })
  } catch (error) {
    console.error('Error fetching purchase status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase status' },
      { status: 500 }
    )
  }
}