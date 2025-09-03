import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { advancedAI } from '@/lib/ai/advanced-ai-service'
import { AIUsageLimiter } from '@/lib/ai/usage-limiter'
import { auth } from '@/lib/auth'
import { trackAPIError } from '@/lib/error-tracking'

const VariationsSchema = z.object({
  basePrompt: z.string().min(10, 'Base prompt must be at least 10 characters'),
  productType: z.enum(['TSHIRT', 'CAP', 'TOTE_BAG']),
  variationCount: z.number().min(1).max(6).optional().default(3),
  variationType: z.enum(['style', 'color', 'composition', 'mixed']).optional().default('mixed')
})

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = VariationsSchema.parse(body)

    // Check usage limits (variations count as multiple generations)
    const usageCheck = await AIUsageLimiter.checkUsage(session.user.id, validatedData.variationCount)
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usage limit exceeded', 
          limits: usageCheck 
        },
        { status: 429 }
      )
    }

    // Generate design variations
    const variations = await advancedAI.generateDesignVariations(
      validatedData.basePrompt,
      validatedData.productType,
      validatedData.variationCount
    )

    // Record usage for each variation
    for (let i = 0; i < variations.length; i++) {
      await AIUsageLimiter.recordUsage(session.user.id, 'design_variation')
    }

    return NextResponse.json({
      success: true,
      data: {
        variations,
        basePrompt: validatedData.basePrompt,
        productType: validatedData.productType,
        generationStats: {
          requested: validatedData.variationCount,
          generated: variations.length,
          variationType: validatedData.variationType
        }
      }
    })

  } catch (error) {
    console.error('Design variations error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    trackAPIError({
      code: 'VARIATIONS_ERROR',
      message: error instanceof Error ? error.message : 'Variations generation failed',
      details: error
    })

    return NextResponse.json(
      { success: false, error: 'Failed to generate variations' },
      { status: 500 }
    )
  }
}