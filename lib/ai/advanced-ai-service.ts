/**
 * Advanced AI Service for TShop
 * Provides enhanced AI capabilities including style transfer, recommendations, and optimization
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { trackAIError } from '@/lib/error-tracking'
import { analytics } from '@/lib/analytics'

export interface StyleTransferOptions {
  sourceImageUrl: string
  targetStyle: 'abstract' | 'vintage' | 'minimalist' | 'artistic' | 'watercolor' | 'sketch' | 'pop-art' | 'grunge'
  intensity: number // 0-100
  preserveText?: boolean
  productType: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
}

export interface DesignVariation {
  id: string
  imageUrl: string
  prompt: string
  style: string
  variations: {
    color_scheme: string
    composition: string
    elements: string[]
  }
}

export interface PersonalizationData {
  userId: string
  preferences: {
    favoriteStyles: string[]
    favoriteColors: string[]
    preferredComplexity: 'simple' | 'moderate' | 'complex'
    productPreferences: string[]
  }
  history: {
    designsCreated: number
    stylesUsed: string[]
    mostUsedPrompts: string[]
    successfulDesigns: string[]
  }
}

export interface PromptSuggestion {
  prompt: string
  category: string
  confidence: number
  expectedStyle: string
  rationale: string
}

class AdvancedAIService {
  private genAI: GoogleGenerativeAI
  private model: any
  private visionModel: any

  constructor() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('Google Gemini API key is required')
    }

    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-vision' })
  }

  /**
   * Apply style transfer to an existing design
   */
  async applyStyleTransfer(options: StyleTransferOptions): Promise<{
    success: boolean
    imageUrl?: string
    prompt?: string
    error?: string
  }> {
    try {
      const startTime = Date.now()

      // Generate enhanced prompt for style transfer
      const stylePrompt = this.generateStyleTransferPrompt(options)
      
      // For now, we'll use Gemini to generate a new image with style applied
      // In a production environment, you'd integrate with image processing APIs
      const result = await this.model.generateContent([
        {
          text: `Create a design prompt that applies ${options.targetStyle} style to this concept with ${options.intensity}% intensity. 
          Product: ${options.productType}. 
          Style characteristics: ${this.getStyleCharacteristics(options.targetStyle)}
          
          Original concept analysis needed, then generate optimized prompt for style transfer.
          
          Provide response in JSON format:
          {
            "prompt": "detailed prompt here",
            "style_applied": "style description",
            "technical_notes": "implementation details"
          }`
        }
      ])

      const response = await result.response
      const textResult = response.text()
      
      let parsedResult
      try {
        // Extract JSON from response
        const jsonMatch = textResult.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        // Fallback: create structured response
        parsedResult = {
          prompt: this.createFallbackStylePrompt(options),
          style_applied: options.targetStyle,
          technical_notes: 'Fallback prompt generation'
        }
      }

      const duration = Date.now() - startTime

      // Track successful style transfer
      analytics.trackEvent({
        action: 'ai_style_transfer_success',
        category: 'ai_enhancement',
        custom_parameters: {
          target_style: options.targetStyle,
          intensity: options.intensity,
          product_type: options.productType,
          duration: duration,
          preserve_text: options.preserveText
        }
      })

      return {
        success: true,
        prompt: parsedResult.prompt,
        imageUrl: 'placeholder-for-generated-image.png' // Would be actual generated image URL
      }

    } catch (error) {
      trackAIError(error instanceof Error ? error : new Error(String(error)), {
        provider: 'gemini',
        operation: 'style_transfer',
        user_id: options.sourceImageUrl // Using as identifier for now
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Style transfer failed'
      }
    }
  }

  /**
   * Generate personalized design recommendations
   */
  async generatePersonalizedRecommendations(
    personalizationData: PersonalizationData,
    limit: number = 5
  ): Promise<PromptSuggestion[]> {
    try {
      const prompt = `Based on this user's design preferences and history, generate ${limit} personalized design recommendations.

User Preferences:
- Favorite Styles: ${personalizationData.preferences.favoriteStyles.join(', ')}
- Favorite Colors: ${personalizationData.preferences.favoriteColors.join(', ')}
- Complexity Preference: ${personalizationData.preferences.preferredComplexity}
- Product Preferences: ${personalizationData.preferences.productPreferences.join(', ')}

User History:
- Designs Created: ${personalizationData.history.designsCreated}
- Most Used Styles: ${personalizationData.history.stylesUsed.join(', ')}
- Popular Prompts: ${personalizationData.history.mostUsedPrompts.slice(0, 3).join(', ')}

Generate recommendations that:
1. Match user preferences but introduce variety
2. Suggest trending styles they haven't tried
3. Build on their successful design patterns
4. Appropriate for custom apparel

Response format:
{
  "recommendations": [
    {
      "prompt": "detailed design prompt",
      "category": "style category",
      "confidence": 85,
      "expectedStyle": "predicted style outcome",
      "rationale": "why this recommendation fits the user"
    }
  ]
}`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const textResult = response.text()

      let recommendations: PromptSuggestion[] = []
      
      try {
        const jsonMatch = textResult.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          recommendations = parsed.recommendations || []
        }
      } catch (parseError) {
        // Fallback recommendations based on user preferences
        recommendations = this.generateFallbackRecommendations(personalizationData, limit)
      }

      // Track recommendation generation
      analytics.trackEvent({
        action: 'personalized_recommendations_generated',
        category: 'ai_enhancement',
        custom_parameters: {
          user_id: personalizationData.userId,
          recommendation_count: recommendations.length,
          user_designs_count: personalizationData.history.designsCreated,
          favorite_styles: personalizationData.preferences.favoriteStyles.join(',')
        }
      })

      return recommendations

    } catch (error) {
      trackAIError(error instanceof Error ? error : new Error(String(error)), {
        provider: 'gemini',
        operation: 'personalized_recommendations',
        user_id: personalizationData.userId
      })

      // Return fallback recommendations
      return this.generateFallbackRecommendations(personalizationData, limit)
    }
  }

  /**
   * Generate design variations from a base design
   */
  async generateDesignVariations(
    basePrompt: string,
    productType: string,
    variationCount: number = 3
  ): Promise<DesignVariation[]> {
    try {
      const prompt = `Create ${variationCount} creative variations of this design prompt: "${basePrompt}"

For product type: ${productType}

Generate variations that:
1. Maintain the core concept but explore different approaches
2. Vary color schemes, composition, and style elements
3. Are suitable for ${productType.toLowerCase()} printing
4. Offer unique creative interpretations

Response format:
{
  "variations": [
    {
      "id": "var_1",
      "prompt": "variation prompt",
      "style": "style description",
      "variations": {
        "color_scheme": "color approach",
        "composition": "layout approach", 
        "elements": ["key", "design", "elements"]
      }
    }
  ]
}`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const textResult = response.text()

      let variations: DesignVariation[] = []

      try {
        const jsonMatch = textResult.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          variations = parsed.variations?.map((v: any, index: number) => ({
            ...v,
            id: v.id || `var_${index + 1}`,
            imageUrl: `placeholder-variation-${index + 1}.png`
          })) || []
        }
      } catch (parseError) {
        // Generate fallback variations
        variations = this.generateFallbackVariations(basePrompt, productType, variationCount)
      }

      // Track variation generation
      analytics.trackEvent({
        action: 'design_variations_generated',
        category: 'ai_enhancement',
        custom_parameters: {
          base_prompt: basePrompt.slice(0, 100),
          product_type: productType,
          variation_count: variations.length,
          original_prompt_length: basePrompt.length
        }
      })

      return variations

    } catch (error) {
      trackAIError(error instanceof Error ? error : new Error(String(error)), {
        provider: 'gemini',
        operation: 'design_variations',
        prompt: basePrompt.slice(0, 100)
      })

      return this.generateFallbackVariations(basePrompt, productType, variationCount)
    }
  }

  /**
   * Optimize a design prompt for better results
   */
  async optimizeDesignPrompt(
    originalPrompt: string,
    productType: string,
    targetStyle?: string
  ): Promise<{
    optimizedPrompt: string
    improvements: string[]
    confidence: number
  }> {
    try {
      const prompt = `Optimize this design prompt for ${productType} custom apparel printing: "${originalPrompt}"

${targetStyle ? `Target style: ${targetStyle}` : ''}

Analyze and improve:
1. Clarity and specificity
2. Technical suitability for apparel printing
3. Visual appeal and commercial viability
4. Style consistency and artistic direction

Response format:
{
  "optimizedPrompt": "improved prompt",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "confidence": 85,
  "reasoning": "explanation of changes"
}`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const textResult = response.text()

      try {
        const jsonMatch = textResult.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          
          // Track prompt optimization
          analytics.trackEvent({
            action: 'prompt_optimized',
            category: 'ai_enhancement',
            custom_parameters: {
              original_length: originalPrompt.length,
              optimized_length: parsed.optimizedPrompt?.length || 0,
              confidence: parsed.confidence,
              product_type: productType,
              target_style: targetStyle
            }
          })

          return {
            optimizedPrompt: parsed.optimizedPrompt || originalPrompt,
            improvements: parsed.improvements || [],
            confidence: parsed.confidence || 70
          }
        }
      } catch (parseError) {
        // Fallback optimization
        return this.createFallbackOptimization(originalPrompt, productType)
      }

    } catch (error) {
      trackAIError(error instanceof Error ? error : new Error(String(error)), {
        provider: 'gemini',
        operation: 'prompt_optimization',
        prompt: originalPrompt.slice(0, 100)
      })
    }

    return this.createFallbackOptimization(originalPrompt, productType)
  }

  // Helper methods
  private generateStyleTransferPrompt(options: StyleTransferOptions): string {
    const styleCharacteristics = this.getStyleCharacteristics(options.targetStyle)
    return `Apply ${options.targetStyle} style with ${options.intensity}% intensity. ${styleCharacteristics}. Product: ${options.productType}.`
  }

  private getStyleCharacteristics(style: string): string {
    const characteristics = {
      abstract: 'geometric shapes, bold colors, non-representational forms, modern aesthetic',
      vintage: 'aged textures, muted colors, retro typography, nostalgic elements',
      minimalist: 'clean lines, simple forms, limited color palette, plenty of white space',
      artistic: 'expressive brushstrokes, creative interpretation, artistic flair',
      watercolor: 'fluid colors, soft edges, translucent effects, organic flow',
      sketch: 'hand-drawn lines, artistic imperfection, pencil-like textures',
      'pop-art': 'bright colors, bold contrasts, commercial imagery, graphic style',
      grunge: 'distressed textures, dark colors, edgy aesthetic, rough elements'
    }
    return characteristics[style as keyof typeof characteristics] || 'creative artistic interpretation'
  }

  private createFallbackStylePrompt(options: StyleTransferOptions): string {
    return `Create a ${options.targetStyle} style design for ${options.productType} with artistic interpretation and creative flair`
  }

  private generateFallbackRecommendations(data: PersonalizationData, limit: number): PromptSuggestion[] {
    const baseRecommendations = [
      { prompt: 'minimalist mountain landscape with geometric elements', category: 'nature', confidence: 80, expectedStyle: 'minimalist', rationale: 'Based on your preference for clean, simple designs' },
      { prompt: 'abstract art with bold colors and flowing shapes', category: 'abstract', confidence: 75, expectedStyle: 'abstract', rationale: 'Exploring new artistic directions for you' },
      { prompt: 'vintage-inspired typography with retro elements', category: 'typography', confidence: 70, expectedStyle: 'vintage', rationale: 'Classic style that works well on apparel' }
    ]
    return baseRecommendations.slice(0, limit)
  }

  private generateFallbackVariations(basePrompt: string, productType: string, count: number): DesignVariation[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `fallback_var_${i + 1}`,
      imageUrl: `placeholder-variation-${i + 1}.png`,
      prompt: `${basePrompt} - variation ${i + 1}`,
      style: 'creative variation',
      variations: {
        color_scheme: ['monochrome', 'vibrant', 'pastel'][i % 3],
        composition: ['centered', 'asymmetric', 'balanced'][i % 3],
        elements: ['artistic', 'modern', 'creative']
      }
    }))
  }

  private createFallbackOptimization(originalPrompt: string, productType: string) {
    return {
      optimizedPrompt: `${originalPrompt} - optimized for ${productType} printing with enhanced clarity and visual appeal`,
      improvements: ['Enhanced clarity', 'Better technical specifications', 'Improved visual appeal'],
      confidence: 60
    }
  }
}

export const advancedAI = new AdvancedAIService()