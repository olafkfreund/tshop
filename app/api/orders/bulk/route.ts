import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db'

interface BulkOrderItem {
  designId: string
  productId: string
  quantity: number
  size?: string
  color?: string
  customizations?: any
}

// GET /api/orders/bulk - Get bulk order templates and history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get bulk orders (orders with quantity >= 10)
    const bulkOrders = await prisma.order.findMany({
      where: {
        AND: [
          {
            OR: [
              { userId: user.id },
              teamId ? { teamId } : {},
            ],
          },
          {
            orderItems: {
              some: {
                quantity: {
                  gte: 10,
                },
              },
            },
          },
        ],
      },
      include: {
        orderItems: {
          include: {
            product: true,
            design: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Get bulk order templates (frequently ordered combinations)
    const templates = await generateBulkOrderTemplates(user.id, teamId)

    return NextResponse.json({
      success: true,
      bulkOrders: bulkOrders.map(order => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
        uniqueDesigns: order.orderItems.length,
        createdAt: order.createdAt,
        team: order.team,
        items: order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          product: item.product,
          design: item.design,
        })),
      })),
      templates,
    })

  } catch (error: any) {
    console.error('Error fetching bulk orders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bulk orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders/bulk - Create bulk order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { items, teamId, shippingAddress, orderNotes, splitShipping } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate team access if teamId is provided
    if (teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: user.id,
        },
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You are not a member of this team' },
          { status: 403 }
        )
      }
    }

    // Validate and calculate pricing for all items
    const orderItems = []
    let totalAmount = 0

    for (const item of items) {
      const { designId, productId, quantity, size, color } = item

      if (quantity <= 0) {
        throw new Error(`Invalid quantity for item: ${quantity}`)
      }

      // Get product and calculate volume pricing
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          pricingTiers: {
            orderBy: { minQuantity: 'asc' },
          },
        },
      })

      if (!product) {
        throw new Error(`Product not found: ${productId}`)
      }

      // Get design if specified
      let design = null
      if (designId) {
        design = await prisma.design.findUnique({
          where: { id: designId },
        })

        if (!design) {
          throw new Error(`Design not found: ${designId}`)
        }

        // Check if user has access to design
        const hasAccess = design.userId === user.id || 
                         design.isPublic ||
                         await checkDesignAccess(designId, user.id, teamId)

        if (!hasAccess) {
          throw new Error(`Access denied to design: ${designId}`)
        }
      }

      // Calculate volume pricing
      const pricing = calculateBulkPricing(product, quantity, teamId)
      const itemTotal = pricing.pricePerUnit * quantity

      orderItems.push({
        productId,
        designId: designId || undefined,
        quantity,
        pricePerUnit: pricing.pricePerUnit,
        size: size || 'M',
        color: color || 'white',
        customizations: item.customizations || undefined,
      })

      totalAmount += itemTotal
    }

    // Create the bulk order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        teamId: teamId || undefined,
        status: 'PENDING',
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        shippingAddress: shippingAddress || undefined,
        orderNotes: orderNotes || undefined,
        metadata: {
          isBulkOrder: true,
          splitShipping: splitShipping || false,
          itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        },
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
            design: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        type: 'BULK_ORDER_CREATED',
        userId: user.id,
        teamId: teamId || undefined,
        metadata: {
          orderId: order.id,
          itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: order.totalAmount,
          uniqueProducts: order.orderItems.length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
        estimatedDelivery: calculateEstimatedDelivery(order.orderItems),
        createdAt: order.createdAt,
        items: order.orderItems,
        team: order.team,
      },
      message: 'Bulk order created successfully',
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating bulk order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create bulk order' },
      { status: 500 }
    )
  }
}

async function generateBulkOrderTemplates(userId: string, teamId?: string | null) {
  // Get frequently ordered product/design combinations
  const popularCombinations = await prisma.orderItem.groupBy({
    by: ['productId', 'designId'],
    where: {
      order: {
        OR: [
          { userId },
          teamId ? { teamId } : {},
        ],
      },
      quantity: {
        gte: 5, // Only consider items with quantity 5+
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  })

  const templates = await Promise.all(
    popularCombinations.map(async (combo) => {
      const product = await prisma.product.findUnique({
        where: { id: combo.productId },
        select: {
          id: true,
          name: true,
          basePrice: true,
          imageUrl: true,
        },
      })

      let design = null
      if (combo.designId) {
        design = await prisma.design.findUnique({
          where: { id: combo.designId },
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        })
      }

      return {
        productId: combo.productId,
        designId: combo.designId,
        product,
        design,
        orderCount: combo._count.id,
        totalQuantity: combo._sum.quantity || 0,
        suggestedQuantity: Math.max(10, Math.ceil((combo._sum.quantity || 0) / combo._count.id)),
      }
    })
  )

  return templates.filter(template => template.product) // Remove templates with missing products
}

function calculateBulkPricing(product: any, quantity: number, teamId?: string | null) {
  let teamMultiplier = 1

  // Apply team-based bulk discounts (this would be enhanced with actual team data)
  if (teamId) {
    if (quantity >= 50) {
      teamMultiplier = 0.85 // 15% bulk discount for 50+ items
    } else if (quantity >= 25) {
      teamMultiplier = 0.90 // 10% bulk discount for 25+ items
    } else if (quantity >= 10) {
      teamMultiplier = 0.95 // 5% bulk discount for 10+ items
    }
  } else {
    // Individual bulk pricing
    if (quantity >= 50) {
      teamMultiplier = 0.90 // 10% bulk discount
    } else if (quantity >= 25) {
      teamMultiplier = 0.95 // 5% bulk discount
    }
  }

  // Find applicable volume tier
  let applicableTier = null
  if (product.pricingTiers) {
    for (const tier of product.pricingTiers) {
      if (quantity >= tier.minQuantity && 
          (tier.maxQuantity === null || quantity <= tier.maxQuantity)) {
        applicableTier = tier
        break
      }
    }
  }

  const tierDiscount = applicableTier ? applicableTier.discountPercent / 100 : 0
  const basePrice = product.basePrice
  const discountedPrice = basePrice * (1 - tierDiscount)
  const finalPrice = discountedPrice * teamMultiplier

  return {
    pricePerUnit: parseFloat(finalPrice.toFixed(2)),
    tierDiscount: tierDiscount * 100,
    bulkDiscount: (1 - teamMultiplier) * 100,
    totalDiscount: ((basePrice - finalPrice) / basePrice) * 100,
  }
}

async function checkDesignAccess(designId: string, userId: string, teamId?: string | null) {
  const shareAccess = await prisma.designShare.findFirst({
    where: {
      designId,
      sharedWithId: userId,
    },
  })

  if (shareAccess) {
    return true
  }

  if (teamId) {
    const teamDesign = await prisma.design.findFirst({
      where: {
        id: designId,
        teamId,
      },
    })
    return !!teamDesign
  }

  return false
}

function calculateEstimatedDelivery(orderItems: any[]) {
  // Calculate estimated delivery based on bulk order processing time
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  
  let processingDays = 3 // Base processing time
  if (totalItems >= 100) {
    processingDays = 7
  } else if (totalItems >= 50) {
    processingDays = 5
  }

  const estimatedDate = new Date()
  estimatedDate.setDate(estimatedDate.getDate() + processingDays + 5) // +5 for shipping
  
  return estimatedDate.toISOString().split('T')[0]
}