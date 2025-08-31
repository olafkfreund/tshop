import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMockProduct } from '@/lib/mock-products'

interface RouteParams {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    let product = null

    try {
      // Try to get product from database first
      product = await prisma.product.findUnique({
        where: { id },
        include: {
          images: {
            orderBy: { isPrimary: 'desc' },
          },
          variants: {
            orderBy: [
              { colorSlug: 'asc' },
              { sizeName: 'asc' },
            ],
          },
          specs: true,
        },
      })
    } catch (dbError) {
      console.log('📦 Using mock product data (database not available)')
      // Fall back to mock data
      product = getMockProduct(id)
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}