import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db'

// GET /api/pricing/volume - Get volume pricing tiers and discounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const teamId = searchParams.get('teamId')
    const quantity = parseInt(searchParams.get('quantity') || '1')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get product with base pricing
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        pricingTiers: {
          orderBy: { minQuantity: 'asc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get team-specific pricing if team is specified
    let teamMultiplier = 1
    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { plan: true },
      })

      if (team) {
        // Apply team-based discounts
        switch (team.plan) {
          case 'BUSINESS':
            teamMultiplier = 0.95 // 5% discount
            break
          case 'ENTERPRISE':
            teamMultiplier = 0.90 // 10% discount
            break
        }
      }
    }

    // Calculate pricing for different quantities
    const pricingInfo = calculateVolumePricing(product, quantity, teamMultiplier)

    // Get all available tiers for display
    const allTiers = product.pricingTiers.map(tier => ({
      id: tier.id,
      minQuantity: tier.minQuantity,
      maxQuantity: tier.maxQuantity,
      discountPercent: tier.discountPercent,
      pricePerUnit: parseFloat((product.basePrice * (1 - tier.discountPercent / 100) * teamMultiplier).toFixed(2)),
      totalSavings: parseFloat(((product.basePrice - (product.basePrice * (1 - tier.discountPercent / 100) * teamMultiplier)) * tier.minQuantity).toFixed(2)),
      isActive: quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity),
    }))

    return NextResponse.json({
      success: true,
      pricing: {
        basePrice: product.basePrice,
        quantity,
        currentTier: pricingInfo.tier,
        pricePerUnit: pricingInfo.pricePerUnit,
        totalPrice: pricingInfo.totalPrice,
        totalSavings: pricingInfo.totalSavings,
        teamDiscount: teamMultiplier < 1 ? ((1 - teamMultiplier) * 100) : 0,
      },
      tiers: allTiers,
      recommendations: getVolumeRecommendations(allTiers, quantity),
    })

  } catch (error: any) {
    console.error('Error calculating volume pricing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate volume pricing' },
      { status: 500 }
    )
  }
}

// POST /api/pricing/volume - Create or update volume pricing tiers (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin (you'd implement proper admin check here)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { productId, tiers } = body

    if (!productId || !Array.isArray(tiers)) {
      return NextResponse.json(
        { error: 'Product ID and tiers array are required' },
        { status: 400 }
      )
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete existing tiers
    await prisma.pricingTier.deleteMany({
      where: { productId },
    })

    // Create new tiers
    const createdTiers = await Promise.all(
      tiers.map((tier: any) => 
        prisma.pricingTier.create({
          data: {
            productId,
            name: tier.name,
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity || null,
            discountPercent: tier.discountPercent,
            isActive: tier.isActive !== false,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      tiers: createdTiers,
      message: `Created ${createdTiers.length} pricing tiers`,
    })

  } catch (error: any) {
    console.error('Error creating volume pricing tiers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create volume pricing tiers' },
      { status: 500 }
    )
  }
}

function calculateVolumePricing(
  product: any, 
  quantity: number, 
  teamMultiplier: number = 1
) {
  const basePrice = product.basePrice
  
  // Find applicable tier
  let applicableTier = null
  for (const tier of product.pricingTiers) {
    if (quantity >= tier.minQuantity && 
        (tier.maxQuantity === null || quantity <= tier.maxQuantity)) {
      applicableTier = tier
      break
    }
  }

  const discountPercent = applicableTier ? applicableTier.discountPercent : 0
  const discountedPrice = basePrice * (1 - discountPercent / 100)
  const finalPrice = discountedPrice * teamMultiplier
  const totalPrice = finalPrice * quantity
  
  // Calculate savings compared to base price
  const savingsPerUnit = basePrice - finalPrice
  const totalSavings = savingsPerUnit * quantity

  return {
    tier: applicableTier,
    pricePerUnit: parseFloat(finalPrice.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    totalSavings: parseFloat(totalSavings.toFixed(2)),
    discountPercent: discountPercent + ((1 - teamMultiplier) * 100),
  }
}

function getVolumeRecommendations(tiers: any[], currentQuantity: number) {
  const recommendations = []

  // Find next tier that would give better pricing
  const nextTier = tiers.find(tier => 
    tier.minQuantity > currentQuantity && 
    tier.discountPercent > (tiers.find(t => t.isActive)?.discountPercent || 0)
  )

  if (nextTier) {
    const additionalItems = nextTier.minQuantity - currentQuantity
    const additionalSavings = (nextTier.totalSavings - (tiers.find(t => t.isActive)?.totalSavings || 0))
    
    recommendations.push({
      type: 'NEXT_TIER',
      message: `Buy ${additionalItems} more items to save an additional $${additionalSavings.toFixed(2)}`,
      quantity: nextTier.minQuantity,
      savings: additionalSavings,
    })
  }

  // Suggest bulk order if current quantity is small
  if (currentQuantity < 10) {
    const bulkTier = tiers.find(tier => tier.minQuantity >= 25)
    if (bulkTier) {
      recommendations.push({
        type: 'BULK_ORDER',
        message: `Consider bulk ordering ${bulkTier.minQuantity} items for maximum savings`,
        quantity: bulkTier.minQuantity,
        savings: bulkTier.totalSavings,
      })
    }
  }

  return recommendations
}