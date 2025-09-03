import { NextRequest, NextResponse } from 'next/server'
import { generateDesignImage, validateDesignPrompt } from '@/lib/ai/gemini'
import { AIUsageLimiter, getGuestUsageFromSession, setGuestUsageInSession } from '@/lib/ai/usage-limiter'
import { query } from '@/lib/db-direct'
import { ProductCategory } from '@/types'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/lib/auth'

const generateRequestSchema = z.object({
  prompt: z.string().min(3).max(500),
  productCategory: z.enum(['TSHIRT', 'CAP', 'TOTE_BAG']),
  style: z.enum(['realistic', 'cartoon', 'minimalist', 'vintage', 'modern', 'artistic']).optional(),
  saveDesign: z.boolean().default(false),
  designName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Get authentication session
    const session = await auth()
    const body = await request.json()
    
    const cookieStore = cookies()
    let sessionId = cookieStore.get('ai-session')?.value
    
    if (!sessionId) {
      sessionId = 'ai-session-' + Date.now()
    }
    
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
      // Guest user - get usage from cookies
      const guestUsageData = cookieStore.get('ai-usage')?.value
      const sessionData = guestUsageData ? JSON.parse(guestUsageData) : { count: 0, lastReset: new Date().toDateString() }
      
      // Reset daily count if it's a new day
      const today = new Date().toDateString()
      if (sessionData.lastReset !== today) {
        sessionData.count = 0
        sessionData.lastReset = today
      }
      
      usageCheck = getGuestUsageFromSession({ aiUsage: sessionData })
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
      productCategory: productCategory as ProductCategory, // Keep uppercase for PRODUCT_CONSTRAINTS
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

    // Save design if requested (only for authenticated users)
    let savedDesign = null
    if (saveDesign && session?.user?.id && aiResponse.imageUrl) {
      try {
        const savedDesignRows = await query(`
          INSERT INTO designs (id, user_id, name, description, prompt, image_url, category, tags, is_public, created_at, updated_at)
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'GRAPHIC', $6, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [
          session.user.id,
          designName || 'AI Generated Design',
          `AI-generated design for ${productCategory.toLowerCase()} with prompt: "${prompt}"`,
          prompt,
          aiResponse.imageUrl,
          JSON.stringify([productCategory.toLowerCase(), style || 'ai-generated'])
        ])
        savedDesign = savedDesignRows[0]
      } catch (error) {
        console.error('Error saving design:', error)
        // Don't fail the whole request if saving fails
      }
    }

    // Record usage
    if (session?.user?.id) {
      await AIUsageLimiter.recordUsage(session.user.id, aiResponse.metadata?.tokensUsed)
    } else {
      // Update guest session usage in cookies
      const guestUsageData = cookieStore.get('ai-usage')?.value
      const sessionData = guestUsageData ? JSON.parse(guestUsageData) : { count: 0, lastReset: new Date().toDateString() }
      sessionData.count = (sessionData.count || 0) + 1
      
      // Set updated usage in cookies
      const response = NextResponse.json({
        success: true,
        data: {
          imageUrl: aiResponse.imageUrl,
          designId: savedDesign?.id, // Will be null for guest users
          metadata: aiResponse.metadata,
        },
        usageInfo: {
          remainingDaily: Math.max(0, 2 - sessionData.count), // FREE tier limit
          remainingMonthly: Math.max(0, 2 - sessionData.count), // Same as daily for guests
          tier: 'FREE',
        },
      })
      
      response.cookies.set('ai-session', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      response.cookies.set('ai-usage', JSON.stringify(sessionData), {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      return response
    }

    // Get updated usage stats
    const updatedUsage = session?.user?.id 
      ? await AIUsageLimiter.checkUsage(session.user.id)
      : usageCheck

    // For registered users, return updated usage info
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