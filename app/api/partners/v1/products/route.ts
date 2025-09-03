import { NextRequest, NextResponse } from 'next/server'
import { withPartnerAuth } from '@/lib/partner-auth'
import { prisma } from '@/lib/db'

// GET /api/partners/v1/products - List products
export async function GET(request: NextRequest) {
  return withPartnerAuth(request, 'products:read', async (apiKey, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const category = searchParams.get('category')
      const available = searchParams.get('available')

      const skip = (page - 1) * limit

      const where: any = {}

      if (category) {
        where.category = category.toUpperCase()
      }

      if (available === 'true') {
        where.isAvailable = true
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            pricingTiers: {
              orderBy: { minQuantity: 'asc' },
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
        prisma.product.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return NextResponse.json({
        success: true,
        data: {
          products: products.map(formatProductForApi),
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
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch products' },
        { status: 500 }
      )
    }
  })
}

function formatProductForApi(product: any) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    basePrice: product.basePrice,
    imageUrl: product.imageUrl,
    isAvailable: product.isAvailable,
    specifications: product.specifications ? JSON.parse(product.specifications) : {},
    metadata: product.metadata || {},
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    pricingTiers: product.pricingTiers?.map((tier: any) => ({
      id: tier.id,
      minQuantity: tier.minQuantity,
      maxQuantity: tier.maxQuantity,
      discountPercent: tier.discountPercent,
    })) || [],
    stats: {
      orderCount: product._count?.orderItems || 0,
    },
  }
}