import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { fulfillmentService } from '@/lib/fulfillment/fulfillment-service'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const quoteRequestSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string(),
    quantity: z.number().min(1),
    customization: z.any().optional(),
  })),
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string().optional(),
  }),
  strategy: z.enum(['cost', 'speed', 'quality']).default('cost'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    
    // Validate request body
    const validation = quoteRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid quote request',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { items, shippingAddress, strategy } = validation.data

    // Get detailed product and variant info
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            variants: {
              where: { id: item.variantId },
            },
          },
        })

        if (!product || product.variants.length === 0) {
          throw new Error(`Product or variant not found: ${item.productId}/${item.variantId}`)
        }

        return {
          ...item,
          product,
          variant: product.variants[0],
          unitPrice: product.variants[0].price,
        }
      })
    )

    // Create temporary order object for quoting
    const tempOrder = {
      id: `quote-${Date.now()}`,
      shippingAddress,
      user: session?.user,
    }

    // Get quotes from all providers
    const quotes = await fulfillmentService.getQuotes(tempOrder, orderItems)

    if (quotes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No fulfillment providers available for this order',
        },
        { status: 400 }
      )
    }

    // Select best provider based on strategy
    const selectedQuote = fulfillmentService.selectProvider(quotes, strategy)

    if (!selectedQuote) {
      return NextResponse.json(
        {
          success: false,
          error: 'No suitable fulfillment provider found',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        quotes: quotes.map(quote => ({
          provider: quote.provider,
          totalCost: quote.totalCost,
          shippingCost: quote.shippingCost,
          tax: quote.tax,
          productionTime: quote.productionTime,
          estimatedDelivery: quote.estimatedDelivery,
          available: quote.items.every(item => item.available),
        })),
        recommended: {
          provider: selectedQuote.provider,
          totalCost: selectedQuote.totalCost,
          shippingCost: selectedQuote.shippingCost,
          tax: selectedQuote.tax,
          productionTime: selectedQuote.productionTime,
          estimatedDelivery: selectedQuote.estimatedDelivery,
          strategy,
        },
      },
    })

  } catch (error) {
    console.error('Error getting fulfillment quote:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get quote',
      },
      { status: 500 }
    )
  }
}