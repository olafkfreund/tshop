import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMockProducts } from '@/lib/mock-products'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    let products: any[] = []
    let total = 0

    try {
      // Try to use real database first
      const where: any = {}
      if (category) {
        where.category = category
      }

      const [dbProducts, dbTotal] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: {
              orderBy: { isPrimary: 'desc' },
            },
            variants: {
              orderBy: { price: 'asc' },
            },
            specs: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ])

      products = dbProducts
      total = dbTotal

      // If no products from database, use mock data
      if (products.length === 0) {
        throw new Error('No products in database, falling back to mock data')
      }

    } catch (dbError) {
      console.log('📦 Using mock products data (database not available)')
      
      // Use mock products
      const mockProducts = getMockProducts(category || undefined)
      total = mockProducts.length
      
      // Apply pagination to mock products
      products = mockProducts.slice(skip, skip + limit)
    }

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}