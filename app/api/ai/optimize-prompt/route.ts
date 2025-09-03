import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { advancedAI } from '@/lib/ai/advanced-ai-service'
import { auth } from '@/lib/auth'
import { trackAPIError } from '@/lib/error-tracking'

const PromptOptimizationSchema = z.object({
  originalPrompt: z.string().min(5, 'Prompt must be at least 5 characters'),
  productType: z.enum(['TSHIRT', 'CAP', 'TOTE_BAG']),
  targetStyle: z.string().optional(),
  optimizationGoals: z.array(z.enum([
    'clarity',
    'creativity', 
    'technical_accuracy',
    'commercial_appeal',
    'artistic_quality'
  ])).optional().default(['clarity', 'commercial_appeal'])
})

export async function POST(request: NextRequest) {
  try {
    // Get user session (optional for this endpoint)
    const session = await auth()

    // Parse request body
    const body = await request.json()
    const validatedData = PromptOptimizationSchema.parse(body)

    // Optimize the prompt
    const optimization = await advancedAI.optimizeDesignPrompt(
      validatedData.originalPrompt,
      validatedData.productType,
      validatedData.targetStyle
    )

    // Calculate improvement metrics
    const improvementMetrics = calculateImprovementMetrics(
      validatedData.originalPrompt,
      optimization.optimizedPrompt
    )

    return NextResponse.json({
      success: true,
      data: {
        original: validatedData.originalPrompt,
        optimized: optimization.optimizedPrompt,
        improvements: optimization.improvements,
        confidence: optimization.confidence,
        metrics: improvementMetrics,
        suggestions: {
          productType: validatedData.productType,
          targetStyle: validatedData.targetStyle,
          goals: validatedData.optimizationGoals
        }
      }
    })

  } catch (error) {
    console.error('Prompt optimization error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    trackAPIError({
      code: 'PROMPT_OPTIMIZATION_ERROR',
      message: error instanceof Error ? error.message : 'Prompt optimization failed',
      details: error
    })

    return NextResponse.json(
      { success: false, error: 'Failed to optimize prompt' },
      { status: 500 }
    )
  }
}

function calculateImprovementMetrics(original: string, optimized: string) {
  const originalWords = original.split(' ').length
  const optimizedWords = optimized.split(' ').length
  
  // Calculate various metrics
  const lengthChange = ((optimizedWords - originalWords) / originalWords * 100).toFixed(1)
  const clarityScore = calculateClarityScore(optimized)
  const technicalScore = calculateTechnicalScore(optimized)
  const creativityScore = calculateCreativityScore(optimized)

  return {
    wordCount: {
      original: originalWords,
      optimized: optimizedWords,
      change: lengthChange + '%'
    },
    scores: {
      clarity: clarityScore,
      technical: technicalScore,
      creativity: creativityScore,
      overall: Math.round((clarityScore + technicalScore + creativityScore) / 3)
    },
    improvements: {
      hasColorDescription: optimized.toLowerCase().includes('color'),
      hasStyleDescription: hasStyleKeywords(optimized),
      hasCompositionDetails: hasCompositionKeywords(optimized),
      hasTechnicalSpecs: hasTechnicalKeywords(optimized)
    }
  }
}

function calculateClarityScore(text: string): number {
  let score = 50 // Base score
  
  // Bonus for descriptive words
  const descriptiveWords = ['detailed', 'clear', 'sharp', 'defined', 'precise', 'specific']
  descriptiveWords.forEach(word => {
    if (text.toLowerCase().includes(word)) score += 10
  })
  
  // Bonus for color descriptions
  const colorWords = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'colorful', 'vibrant', 'muted']
  colorWords.forEach(word => {
    if (text.toLowerCase().includes(word)) score += 5
  })
  
  return Math.min(score, 100)
}

function calculateTechnicalScore(text: string): number {
  let score = 40 // Base score
  
  // Bonus for technical terms
  const technicalTerms = ['vector', 'high resolution', 'print ready', 'clean lines', 'scalable']
  technicalTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 15
  })
  
  // Bonus for printing considerations
  const printingTerms = ['solid colors', 'no gradients', 'bold design', 'simple shapes']
  printingTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 10
  })
  
  return Math.min(score, 100)
}

function calculateCreativityScore(text: string): number {
  let score = 60 // Base score
  
  // Bonus for creative terms
  const creativeTerms = ['artistic', 'creative', 'unique', 'innovative', 'imaginative', 'original']
  creativeTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 8
  })
  
  // Bonus for style references
  const styleTerms = ['modern', 'vintage', 'abstract', 'minimalist', 'artistic', 'geometric']
  styleTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 5
  })
  
  return Math.min(score, 100)
}

function hasStyleKeywords(text: string): boolean {
  const styleKeywords = ['style', 'aesthetic', 'artistic', 'modern', 'vintage', 'minimalist', 'abstract']
  return styleKeywords.some(keyword => text.toLowerCase().includes(keyword))
}

function hasCompositionKeywords(text: string): boolean {
  const compositionKeywords = ['centered', 'balanced', 'asymmetric', 'layout', 'composition', 'placement']
  return compositionKeywords.some(keyword => text.toLowerCase().includes(keyword))
}

function hasTechnicalKeywords(text: string): boolean {
  const technicalKeywords = ['vector', 'resolution', 'print', 'scalable', 'clean', 'sharp', 'defined']
  return technicalKeywords.some(keyword => text.toLowerCase().includes(keyword))
}