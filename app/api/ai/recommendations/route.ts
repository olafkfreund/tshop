import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { advancedAI, PersonalizationData } from '@/lib/ai/advanced-ai-service'
import { auth } from '@/lib/auth'
import { getUserDesigns, getUserPreferences } from '@/lib/db-direct'
import { trackAPIError } from '@/lib/error-tracking'

const RecommendationsSchema = z.object({
  limit: z.number().min(1).max(10).optional().default(5),
  includeHistory: z.boolean().optional().default(true)
})

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)
    const { limit, includeHistory } = RecommendationsSchema.parse(queryParams)

    // Gather personalization data
    const personalizationData: PersonalizationData = await gatherPersonalizationData(
      session.user.id,
      includeHistory
    )

    // Generate recommendations
    const recommendations = await advancedAI.generatePersonalizedRecommendations(
      personalizationData,
      limit
    )

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        personalizationScore: calculatePersonalizationScore(personalizationData),
        userProfile: {
          designsCreated: personalizationData.history.designsCreated,
          favoriteStyles: personalizationData.preferences.favoriteStyles,
          experienceLevel: getExperienceLevel(personalizationData.history.designsCreated)
        }
      }
    })

  } catch (error) {
    console.error('Recommendations error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    trackAPIError({
      code: 'RECOMMENDATIONS_ERROR',
      message: error instanceof Error ? error.message : 'Recommendations generation failed',
      details: error
    })

    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

// Helper function to gather user personalization data
async function gatherPersonalizationData(
  userId: string,
  includeHistory: boolean
): Promise<PersonalizationData> {
  try {
    // Get user designs and preferences
    const userDesigns = includeHistory ? await getUserDesigns(userId, 50) : []
    const userPreferences = await getUserPreferences(userId)

    // Analyze user design patterns
    const stylesUsed = userDesigns
      .map(d => d.style)
      .filter(Boolean)
      .reduce((acc: Record<string, number>, style) => {
        acc[style] = (acc[style] || 0) + 1
        return acc
      }, {})

    const mostUsedPrompts = userDesigns
      .map(d => d.prompt)
      .filter(Boolean)
      .slice(0, 10)

    const successfulDesigns = userDesigns
      .filter(d => d.likes > 5 || d.orders > 0)
      .map(d => d.id)

    return {
      userId,
      preferences: {
        favoriteStyles: userPreferences?.favoriteStyles || Object.keys(stylesUsed).slice(0, 3),
        favoriteColors: userPreferences?.favoriteColors || ['blue', 'black', 'white'],
        preferredComplexity: userPreferences?.preferredComplexity || 
          (userDesigns.length > 10 ? 'complex' : userDesigns.length > 5 ? 'moderate' : 'simple'),
        productPreferences: userPreferences?.productPreferences || ['TSHIRT']
      },
      history: {
        designsCreated: userDesigns.length,
        stylesUsed: Object.keys(stylesUsed),
        mostUsedPrompts,
        successfulDesigns
      }
    }
  } catch (error) {
    console.error('Error gathering personalization data:', error)
    
    // Return default personalization data
    return {
      userId,
      preferences: {
        favoriteStyles: ['modern', 'minimalist'],
        favoriteColors: ['blue', 'black', 'white'],
        preferredComplexity: 'simple',
        productPreferences: ['TSHIRT']
      },
      history: {
        designsCreated: 0,
        stylesUsed: [],
        mostUsedPrompts: [],
        successfulDesigns: []
      }
    }
  }
}

function calculatePersonalizationScore(data: PersonalizationData): number {
  let score = 0
  
  // More designs = better personalization
  score += Math.min(data.history.designsCreated * 2, 40)
  
  // Variety in styles used
  score += Math.min(data.history.stylesUsed.length * 5, 25)
  
  // Successful designs
  score += Math.min(data.history.successfulDesigns.length * 3, 15)
  
  // Defined preferences
  if (data.preferences.favoriteStyles.length > 0) score += 10
  if (data.preferences.favoriteColors.length > 0) score += 5
  if (data.preferences.productPreferences.length > 0) score += 5
  
  return Math.min(score, 100)
}

function getExperienceLevel(designCount: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (designCount === 0) return 'beginner'
  if (designCount < 5) return 'beginner'
  if (designCount < 15) return 'intermediate'
  if (designCount < 50) return 'advanced'
  return 'expert'
}