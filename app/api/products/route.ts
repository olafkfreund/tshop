import { NextRequest, NextResponse } from 'next/server'
import { getProducts, testConnection } from '@/lib/db-direct'
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
      const dbProducts = await getProducts()
      
      // Filter by category if provided
      let filteredProducts = dbProducts
      if (category) {
        filteredProducts = dbProducts.filter(p => p.category === category.toUpperCase())
      }
      
      total = filteredProducts.length
      
      // Apply pagination
      products = filteredProducts.slice(skip, skip + limit)

      // If no products from database, use mock data
      if (products.length === 0 && total === 0) {
        throw new Error('No products in database, falling back to mock data')
      }

    } catch (dbError) {
      console.error('📦 Database error, using mock products data:', dbError)
      
      // Test connection to provide better debugging
      const connectionHealthy = await testConnection()
      if (!connectionHealthy) {
        console.error('❌ Database connection test failed')
      }
      
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