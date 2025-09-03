import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { advancedAI } from '@/lib/ai/advanced-ai-service'
import { AIUsageLimiter } from '@/lib/ai/usage-limiter'
import { auth } from '@/lib/auth'
import { trackAPIError } from '@/lib/error-tracking'

const StyleTransferSchema = z.object({
  sourceImageUrl: z.string().url('Valid image URL required'),
  targetStyle: z.enum([
    'abstract',
    'vintage', 
    'minimalist',
    'artistic',
    'watercolor',
    'sketch',
    'pop-art',
    'grunge'
  ]),
  intensity: z.number().min(0).max(100),
  preserveText: z.boolean().optional().default(false),
  productType: z.enum(['TSHIRT', 'CAP', 'TOTE_BAG'])
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
    const validatedData = StyleTransferSchema.parse(body)

    // Check usage limits
    const usageCheck = await AIUsageLimiter.checkUsage(session.user.id)
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

    // Apply style transfer
    const result = await advancedAI.applyStyleTransfer(validatedData)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    // Record usage
    await AIUsageLimiter.recordUsage(session.user.id, 'style_transfer')

    return NextResponse.json({
      success: true,
      data: {
        prompt: result.prompt,
        imageUrl: result.imageUrl,
        appliedStyle: validatedData.targetStyle,
        intensity: validatedData.intensity,
        productType: validatedData.productType
      }
    })

  } catch (error) {
    console.error('Style transfer error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    trackAPIError({
      code: 'STYLE_TRANSFER_ERROR',
      message: error instanceof Error ? error.message : 'Style transfer failed',
      details: error
    })

    return NextResponse.json(
      { success: false, error: 'Style transfer failed' },
      { status: 500 }
    )
  }
}