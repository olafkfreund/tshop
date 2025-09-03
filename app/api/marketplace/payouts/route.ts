import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'

const createPayoutRequestSchema = z.object({
  amount: z.number().min(10).max(10000), // Minimum $10, maximum $10,000
  method: z.enum(['PAYPAL', 'STRIPE', 'BANK_TRANSFER']),
  payoutDetails: z.record(z.string()) // Email for PayPal, bank details, etc.
})

// GET /api/marketplace/payouts - Get designer payouts with pagination
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Get designer profile
    const designerProfile = await prisma.designerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!designerProfile) {
      return NextResponse.json(
        { success: false, error: 'Designer profile not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const where: any = { designerId: designerProfile.id }
    if (status) {
      where.status = status
    }

    const [payouts, total] = await Promise.all([
      prisma.designerPayout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              designPurchases: true
            }
          }
        }
      }),
      prisma.designerPayout.count({ where })
    ])

    // Calculate summary statistics
    const summary = await prisma.designerPayout.aggregate({
      where: { designerId: designerProfile.id },
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    })

    const pendingEarnings = await prisma.designerPayout.aggregate({
      where: { 
        designerId: designerProfile.id,
        status: 'PENDING'
      },
      _sum: {
        amount: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        payouts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        summary: {
          totalEarnings: summary._sum.amount || 0,
          totalPayouts: summary._count._all,
          pendingAmount: pendingEarnings._sum.amount || 0,
          availableForPayout: designerProfile.totalEarnings
        }
      }
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/payouts - Request payout
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
    const { amount, method, payoutDetails } = createPayoutRequestSchema.parse(body)

    // Get designer profile
    const designerProfile = await prisma.designerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!designerProfile) {
      return NextResponse.json(
        { success: false, error: 'Designer profile not found' },
        { status: 404 }
      )
    }

    // Check if designer has enough balance
    const availableBalance = Number(designerProfile.totalEarnings)
    
    // Get pending payouts total
    const pendingPayouts = await prisma.designerPayout.aggregate({
      where: {
        designerId: designerProfile.id,
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      _sum: { amount: true }
    })

    const pendingAmount = Number(pendingPayouts._sum.amount || 0)
    const actualAvailable = availableBalance - pendingAmount

    if (amount > actualAvailable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient balance',
          details: {
            requested: amount,
            available: actualAvailable,
            pending: pendingAmount,
            total: availableBalance
          }
        },
        { status: 400 }
      )
    }

    // Validate payout details based on method
    if (method === 'PAYPAL' && !payoutDetails.email) {
      return NextResponse.json(
        { success: false, error: 'PayPal email is required' },
        { status: 400 }
      )
    }

    if (method === 'BANK_TRANSFER') {
      const required = ['accountNumber', 'routingNumber', 'accountHolderName']
      const missing = required.filter(field => !payoutDetails[field])
      if (missing.length > 0) {
        return NextResponse.json(
          { success: false, error: `Missing bank details: ${missing.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Create payout request
    const payout = await prisma.designerPayout.create({
      data: {
        designerId: designerProfile.id,
        amount,
        currency: 'USD',
        method,
        payoutDetails,
        status: 'PENDING',
        source: 'MANUAL_REQUEST'
      }
    })

    // For Stripe payouts, create Express account if needed
    if (method === 'STRIPE') {
      try {
        // Check if designer has a Stripe account
        let stripeAccountId = designerProfile.stripeAccountId

        if (!stripeAccountId) {
          // Create Stripe Express account
          const account = await stripe.accounts.create({
            type: 'express',
            country: 'US', // Could be made dynamic based on user location
            email: session.user.email!,
            metadata: {
              designerId: designerProfile.id,
              userId: session.user.id
            }
          })

          stripeAccountId = account.id

          // Update designer profile with Stripe account ID
          await prisma.designerProfile.update({
            where: { id: designerProfile.id },
            data: { stripeAccountId }
          })
        }

        // Update payout with Stripe account ID
        await prisma.designerPayout.update({
          where: { id: payout.id },
          data: { 
            stripeAccountId,
            status: 'PROCESSING'
          }
        })
      } catch (stripeError) {
        console.error('Stripe account creation failed:', stripeError)
        
        // Update payout status to failed
        await prisma.designerPayout.update({
          where: { id: payout.id },
          data: { status: 'FAILED' }
        })

        return NextResponse.json(
          { success: false, error: 'Failed to setup Stripe payout' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: { payout }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating payout request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payout request' },
      { status: 500 }
    )
  }
}