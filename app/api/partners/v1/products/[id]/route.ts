import { NextRequest, NextResponse } from 'next/server'
import { withPartnerAuth } from '@/lib/partner-auth'
import { prisma } from '@/lib/db'

// GET /api/partners/v1/products/[id] - Get specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPartnerAuth(request, 'products:read', async (apiKey, req) => {
    try {
      const { id } = params

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          pricingTiers: {
            orderBy: { minQuantity: 'asc' },
          },
          orderItems: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              order: {
                select: {
                  id: true,
                  status: true,
                  createdAt: true,
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
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          product: formatDetailedProductForApi(product),
        },
      })

    } catch (error: any) {
      console.error('Error fetching product:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch product' },
        { status: 500 }
      )
    }
  })
}

function formatDetailedProductForApi(product: any) {
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
      createdAt: tier.createdAt,
    })) || [],
    recentOrders: product.orderItems?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      order: item.order,
    })) || [],
    stats: {
      totalOrders: product._count?.orderItems || 0,
      totalRevenue: product.orderItems?.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.pricePerUnit), 0) || 0,
    },
  }
}