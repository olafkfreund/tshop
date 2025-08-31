import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { generateDesignImage, validateDesignPrompt } from '@/lib/ai/gemini'
import { AIUsageLimiter, getGuestUsageFromSession, setGuestUsageInSession } from '@/lib/ai/usage-limiter'
import { prisma } from '@/lib/db'
import { ProductCategory } from '@/types'
import { z } from 'zod'

const generateRequestSchema = z.object({
  prompt: z.string().min(3).max(500),
  productCategory: z.enum(['TSHIRT', 'CAP', 'TOTE_BAG']),
  style: z.enum(['realistic', 'cartoon', 'minimalist', 'vintage', 'modern', 'artistic']).optional(),
  saveDesign: z.boolean().default(false),
  designName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    
    // Validate request body
    const validation = generateRequestSchema.safeParse(body)
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

    const { prompt, productCategory, style, saveDesign, designName } = validation.data

    // Check usage limits
    let usageCheck
    if (session?.user?.id) {
      // Registered user
      usageCheck = await AIUsageLimiter.checkUsage(session.user.id)
    } else {
      // Guest user - get usage from session/cookies
      const sessionData = { aiUsage: { count: 0 } } // This would come from session store
      usageCheck = getGuestUsageFromSession(sessionData)
    }

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI generation limit reached',
          usageInfo: {
            remainingDaily: usageCheck.remainingDaily,
            remainingMonthly: usageCheck.remainingMonthly,
            tier: usageCheck.tier,
            resetTime: usageCheck.resetTime,
          },
        },
        { status: 429 }
      )
    }

    // Validate prompt content
    const promptValidation = await validateDesignPrompt(prompt)
    if (!promptValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt validation failed',
          issues: promptValidation.issues,
          suggestions: promptValidation.suggestions,
        },
        { status: 400 }
      )
    }

    // Generate the design
    const aiResponse = await generateDesignImage({
      prompt,
      productCategory: productCategory.toLowerCase() as ProductCategory,
      style,
      userId: session?.user?.id,
    })

    if (!aiResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: aiResponse.error,
        },
        { status: 500 }
      )
    }

    // Record usage
    if (session?.user?.id) {
      await AIUsageLimiter.recordUsage(session.user.id, aiResponse.metadata?.tokensUsed)
    } else {
      // Update guest session usage
      // This would update session storage in a real implementation
    }

    // Save design if requested
    let savedDesign = null
    if (saveDesign && session?.user?.id && aiResponse.imageUrl) {
      try {
        savedDesign = await prisma.design.create({
          data: {
            userId: session.user.id,
            name: designName || `AI Generated Design`,
            description: `AI-generated design for ${productCategory.toLowerCase()} with prompt: "${prompt}"`,
            prompt,
            imageUrl: aiResponse.imageUrl,
            category: 'GRAPHIC', // Default category
            tags: JSON.stringify([productCategory.toLowerCase(), style || 'ai-generated']),
            isPublic: false,
          },
        })
      } catch (error) {
        console.error('Error saving design:', error)
        // Don't fail the whole request if saving fails
      }
    }

    // Get updated usage stats
    const updatedUsage = session?.user?.id 
      ? await AIUsageLimiter.checkUsage(session.user.id)
      : usageCheck

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: aiResponse.imageUrl,
        designId: savedDesign?.id,
        metadata: aiResponse.metadata,
      },
      usageInfo: {
        remainingDaily: updatedUsage.remainingDaily - 1,
        remainingMonthly: updatedUsage.remainingMonthly - 1,
        tier: updatedUsage.tier,
        resetTime: updatedUsage.resetTime,
      },
    })

  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}