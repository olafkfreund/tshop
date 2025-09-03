import { NextRequest, NextResponse } from 'next/server'
import { generateDesignSuggestions } from '@/lib/ai/gemini'
import { ProductCategory } from '@/types'
import { z } from 'zod'

const suggestionsRequestSchema = z.object({
  productCategory: z.enum(['TSHIRT', 'CAP', 'TOTE_BAG']),
  count: z.number().min(1).max(20).default(5),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = suggestionsRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { productCategory, count } = validation.data

    // Generate suggestions
    const suggestions = await generateDesignSuggestions(
      productCategory,
      count
    )

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        productCategory,
      },
    })

  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate suggestions',
      },
      { status: 500 }
    )
  }
}

// GET endpoint for cached/popular suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as ProductCategory | null

    // In a real implementation, you might cache popular suggestions
    // For now, generate them dynamically
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category parameter required' },
        { status: 400 }
      )
    }

    const suggestions = await generateDesignSuggestions(category, 8)

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        category,
      },
    })

  } catch (error) {
    console.error('Error getting suggestions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get suggestions',
      },
      { status: 500 }
    )
  }
}