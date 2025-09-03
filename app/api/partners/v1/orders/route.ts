import { NextRequest, NextResponse } from 'next/server'
import { withPartnerAuth } from '@/lib/partner-auth'
import { prisma } from '@/lib/db'

// GET /api/partners/v1/orders - List orders
export async function GET(request: NextRequest) {
  return withPartnerAuth(request, 'orders:read', async (apiKey, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const status = searchParams.get('status')
      const userId = searchParams.get('userId')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      const skip = (page - 1) * limit

      const where: any = {
        OR: [
          { userId: { in: await getTeamUserIds(apiKey.teamId) } },
          { teamId: apiKey.teamId },
        ],
      }

      if (status) {
        where.status = status.toUpperCase()
      }

      if (userId) {
        where.userId = userId
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    imageUrl: true,
                  },
                },
                design: {
                  select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                  },
                },
              },
            },
            _count: {
              select: {
                orderItems: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return NextResponse.json({
        success: true,
        data: {
          orders: orders.map(formatOrderForApi),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      })

    } catch (error: any) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch orders' },
        { status: 500 }
      )
    }
  })
}

// POST /api/partners/v1/orders - Create order
export async function POST(request: NextRequest) {
  return withPartnerAuth(request, 'orders:write', async (apiKey, req) => {
    try {
      const body = await req.json()
      const {
        items,
        shippingAddress,
        billingAddress,
        userId,
        orderNotes,
        metadata = {}
      } = body

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Order items are required' },
          { status: 400 }
        )
      }

      if (!shippingAddress) {
        return NextResponse.json(
          { error: 'Shipping address is required' },
          { status: 400 }
        )
      }

      // Validate user belongs to team or use default team user
      let targetUserId = userId
      if (!targetUserId) {
        const teamOwner = await prisma.teamMember.findFirst({
          where: {
            teamId: apiKey.teamId,
            role: 'OWNER',
          },
          select: { userId: true },
        })
        
        if (!teamOwner) {
          return NextResponse.json(
            { error: 'Team owner not found' },
            { status: 404 }
          )
        }
        
        targetUserId = teamOwner.userId
      } else {
        // Verify user is team member
        const isTeamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: apiKey.teamId,
            userId: targetUserId,
          },
        })

        if (!isTeamMember) {
          return NextResponse.json(
            { error: 'User is not a member of this team' },
            { status: 403 }
          )
        }
      }

      // Process and validate order items
      const processedItems = []
      let totalAmount = 0

      for (const item of items) {
        const { productId, designId, quantity, size, color, customizations } = item

        if (!productId || !quantity || quantity <= 0) {
          return NextResponse.json(
            { error: 'Each item must have productId and positive quantity' },
            { status: 400 }
          )
        }

        // Get product and calculate pricing
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
            { error: `Product not found: ${productId}` },
            { status: 404 }
          )
        }

        // Validate design access if specified
        if (designId) {
          const designAccess = await prisma.design.findFirst({
            where: {
              id: designId,
              OR: [
                { userId: { in: await getTeamUserIds(apiKey.teamId) } },
                { teamId: apiKey.teamId },
                { isPublic: true },
                {
                  shares: {
                    some: {
                      sharedWith: {
                        teamMembers: {
                          some: { teamId: apiKey.teamId },
                        },
                      },
                    },
                  },
                },
              ],
            },
          })

          if (!designAccess) {
            return NextResponse.json(
              { error: `Design not found or access denied: ${designId}` },
              { status: 404 }
            )
          }
        }

        // Calculate volume pricing
        const pricing = calculateVolumePricing(product, quantity, apiKey.teamId)
        const itemTotal = pricing.pricePerUnit * quantity

        processedItems.push({
          productId,
          designId: designId || undefined,
          quantity,
          pricePerUnit: pricing.pricePerUnit,
          size: size || 'M',
          color: color || 'white',
          customizations: customizations || undefined,
        })

        totalAmount += itemTotal
      }

      // Create the order
      const order = await prisma.order.create({
        data: {
          userId: targetUserId,
          teamId: apiKey.teamId,
          status: 'PENDING',
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          shippingAddress: JSON.stringify(shippingAddress),
          billingAddress: billingAddress ? JSON.stringify(billingAddress) : undefined,
          orderNotes: orderNotes?.trim(),
          metadata: {
            ...metadata,
            createdViaApi: true,
            apiKeyId: apiKey.id,
            apiKeyName: apiKey.name,
          },
          orderItems: {
            create: processedItems,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  imageUrl: true,
                },
              },
              design: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      })

      // Create analytics event
      await prisma.analyticsEvent.create({
        data: {
          type: 'ORDER_CREATED_API',
          userId: targetUserId,
          teamId: apiKey.teamId,
          metadata: {
            orderId: order.id,
            apiKeyId: apiKey.id,
            totalAmount: order.totalAmount,
            itemCount: processedItems.length,
            uniqueProducts: new Set(processedItems.map(item => item.productId)).size,
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          order: formatDetailedOrderForApi(order),
        },
      }, { status: 201 })

    } catch (error: any) {
      console.error('Error creating order:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create order' },
        { status: 500 }
      )
    }
  })
}

async function getTeamUserIds(teamId: string): Promise<string[]> {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  })
  return members.map(member => member.userId)
}

function calculateVolumePricing(product: any, quantity: number, teamId: string) {
  let teamMultiplier = 0.95 // 5% team discount for API orders

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
    teamDiscount: (1 - teamMultiplier) * 100,
    totalDiscount: ((basePrice - finalPrice) / basePrice) * 100,
  }
}

function formatOrderForApi(order: any) {
  return {
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
    billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : null,
    orderNotes: order.orderNotes,
    metadata: order.metadata || {},
    user: order.user,
    team: order.team,
    stats: {
      itemCount: order._count?.orderItems || 0,
      totalQuantity: order.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
    },
    items: order.orderItems?.slice(0, 3).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      size: item.size,
      color: item.color,
      product: item.product,
      design: item.design,
    })) || [],
  }
}

function formatDetailedOrderForApi(order: any) {
  return {
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
    billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : null,
    orderNotes: order.orderNotes,
    metadata: order.metadata || {},
    fulfillmentStatus: order.fulfillmentStatus,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery,
    user: order.user,
    team: order.team,
    items: order.orderItems?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      size: item.size,
      color: item.color,
      customizations: item.customizations,
      product: item.product,
      design: item.design,
    })) || [],
    stats: {
      itemCount: order.orderItems?.length || 0,
      totalQuantity: order.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      uniqueProducts: new Set(order.orderItems?.map((item: any) => item.productId) || []).size,
    },
  }
}