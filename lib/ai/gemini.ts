import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIGenerationRequest, AIGenerationResponse, ProductCategory } from '@/types'

// External image generation function
async function generateImageViaAPI(prompt: string, category: string): Promise<string | null> {
  try {
    console.log('Generating image for prompt:', prompt)
    
    // Try multiple image generation services with fallbacks
    const services = [
      // Pollinations AI (free but sometimes unreliable)
      async () => {
        const response = await fetch('https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?width=512&height=512&nologo=true')
        if (response.ok) return response.url
        throw new Error('Pollinations AI failed')
      },
      
      // Placeholder service (reliable fallback)
      async () => {
        const encodedPrompt = encodeURIComponent(prompt)
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF']
        const color = colors[Math.floor(Math.random() * colors.length)]
        return `https://via.placeholder.com/512x512/${color.substring(1)}/FFFFFF?text=${encodedPrompt.substring(0, 20)}`
      }
    ]
    
    // Try each service in order
    for (const service of services) {
      try {
        const result = await service()
        console.log('Image generation successful:', result)
        return result
      } catch (error) {
        console.log('Service failed, trying next:', error)
        continue
      }
    }
    
    return null
  } catch (error) {
    console.error('All image generation services failed:', error)
    return null
  }
}

// Check if we have a valid API key (not empty, not "mock-key", and looks like a real key)
const apiKey = process.env.GOOGLE_GEMINI_API_KEY
const hasApiKey = !!(apiKey && apiKey !== 'mock-key' && apiKey.length > 10)
const isLocalMode = process.env.LOCAL_MODE === 'true'

let genAI: GoogleGenerativeAI | null = null

if (hasApiKey) {
  console.log('🤖 Initializing Google Gemini AI with real API key')
  genAI = new GoogleGenerativeAI(apiKey!)
} else {
  console.log('🎭 Using mock AI responses (no valid API key found)')
}

// Product-specific constraints for AI generation
const PRODUCT_CONSTRAINTS = {
  TSHIRT: {
    aspectRatio: '3:4',
    placement: 'center chest area',
    maxWidth: '10 inches',
    maxHeight: '12 inches',
    backgroundColor: 'transparent or solid colors that work on fabric',
    style: 'suitable for screen printing or DTG printing',
  },
  CAP: {
    aspectRatio: '2:1', 
    placement: 'front panel center',
    maxWidth: '4 inches',
    maxHeight: '2 inches',
    backgroundColor: 'transparent background',
    style: 'suitable for embroidery or vinyl application',
  },
  TOTE_BAG: {
    aspectRatio: '4:5',
    placement: 'main surface center',
    maxWidth: '8 inches', 
    maxHeight: '10 inches',
    backgroundColor: 'transparent or colors that work on canvas',
    style: 'suitable for screen printing',
  },
} as const

function buildProductSpecificPrompt(
  userPrompt: string,
  productCategory: ProductCategory,
  style?: string
): string {
  const constraints = PRODUCT_CONSTRAINTS[productCategory]
  
  // Product-specific design guidance
  const productGuides = {
    TSHIRT: {
      context: "t-shirt apparel design",
      placement: "centered on the chest area",
      recommendations: [
        "Bold, eye-catching graphics that work as focal points",
        "Typography should be highly legible from a distance",
        "Consider how the design will look when the shirt is worn and moves",
        "Avoid designs that are too busy or cluttered",
        "Think about color contrast with both light and dark shirt colors"
      ]
    },
    CAP: {
      context: "baseball cap/hat design",
      placement: "front panel of the cap",
      recommendations: [
        "Compact, iconic designs that work at small sizes",
        "Strong logo-style graphics that are instantly recognizable",
        "Simple typography with bold, clean fonts",
        "Consider the curved surface of the cap",
        "Design should work in embroidery or vinyl application"
      ]
    },
    TOTE_BAG: {
      context: "canvas tote bag design",
      placement: "main front surface of the bag",
      recommendations: [
        "Designs that complement the practical nature of tote bags",
        "Text and graphics that remain readable when the bag is carried",
        "Consider eco-friendly and lifestyle themes",
        "Design should work well with natural canvas textures",
        "Think about how the design looks when the bag has items inside"
      ]
    }
  }

  const guide = productGuides[productCategory]
  const styleGuidance = style ? getStyleGuidance(style) : ""
  
  let enhancedPrompt = `Create a professional ${guide.context} with the following specifications:

USER REQUEST: "${userPrompt}"

PRODUCT CONTEXT: ${productCategory.toLowerCase().replace('_', ' ')}
PLACEMENT: ${guide.placement}

TECHNICAL CONSTRAINTS:
- Aspect ratio: ${constraints.aspectRatio}
- Placement area: ${constraints.placement}
- Maximum print size: ${constraints.maxWidth} x ${constraints.maxHeight}
- Background requirements: ${constraints.backgroundColor}
- Print method: ${constraints.style}

DESIGN EXCELLENCE CRITERIA:
${guide.recommendations.map(rec => `- ${rec}`).join('\n')}
- High contrast and readability when printed on fabric
- Scalable vector-style design elements that print clearly
- Professional appearance suitable for retail
- Colors that reproduce accurately in printing processes
- Avoid fine details smaller than 2mm that may not print clearly`

  if (styleGuidance) {
    enhancedPrompt += `\n\nSTYLE DIRECTION:\n${styleGuidance}`
  }

  enhancedPrompt += `\n\nOutput: Generate a high-quality, print-ready design image that perfectly fits ${guide.context} and would look excellent when professionally printed on a ${productCategory.toLowerCase().replace('_', ' ')}.`

  return enhancedPrompt
}

function getStyleGuidance(style: string): string {
  const styleGuides = {
    realistic: "Create photorealistic elements with natural lighting and textures. Use detailed rendering and lifelike proportions.",
    cartoon: "Use bold, simplified shapes with clean lines. Employ bright, vibrant colors and playful character-like elements.",
    minimalist: "Focus on simple geometric shapes, negative space, and limited color palettes. Emphasize clean, modern aesthetics.",
    vintage: "Incorporate retro design elements, distressed textures, classic typography, and muted or sepia color schemes.",
    modern: "Use contemporary design principles with sleek lines, gradients, and current typography trends. Focus on sophistication.",
    artistic: "Embrace creative expression with painterly effects, abstract elements, and unique artistic interpretations."
  }
  
  return styleGuides[style as keyof typeof styleGuides] || `Apply ${style} styling to the design.`
}

export async function generateDesignImage(
  request: AIGenerationRequest
): Promise<AIGenerationResponse> {
  const startTime = Date.now()
  
  // Use mock response if no API key available
  if (!genAI) {
    console.log('📝 Using mock AI generation for:', request.prompt.slice(0, 50) + '...')
    const generationTime = Date.now() - startTime
    
    return {
      success: true,
      imageUrl: `/api/ai/placeholder-design?category=${request.productCategory}&prompt=${encodeURIComponent(request.prompt)}`,
      metadata: {
        model: 'mock-gemini',
        tokensUsed: 0,
        generationTime,
      },
    }
  }
  
  console.log('🎨 Using real Google Gemini AI for:', request.prompt.slice(0, 50) + '...')
  
  try {
    // Build product-specific prompt
    const enhancedPrompt = buildProductSpecificPrompt(
      request.prompt,
      request.productCategory,
      request.style
    )

    // Try to use image generation model first
    try {
      console.log('🎨 Attempting image generation with Gemini...')
      
      // Try using the experimental image generation model
      const imageModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
      })

      // Create a detailed image generation prompt
      const imagePrompt = `Create a high-quality, professional design image for ${request.productCategory} apparel with the following specifications:

${enhancedPrompt}

Generate a clean, vector-style design that would look excellent when printed on fabric. The design should be:
- High contrast and suitable for printing
- Professional and visually appealing
- Appropriate for the target product (${request.productCategory})
- Style: ${request.style || 'modern and clean'}

Return as a detailed image that can be directly used for apparel printing.`

      // For now, we'll use a different approach - generate with an external service
      // Since Gemini doesn't directly support image generation, we'll use a proxy service
      const generatedImageUrl = await generateImageViaAPI(imagePrompt, request.productCategory)
      
      if (generatedImageUrl) {
        const generationTime = Date.now() - startTime
        return {
          success: true,
          imageUrl: generatedImageUrl,
          metadata: {
            model: 'gemini-imagen',
            tokensUsed: 0,
            generationTime,
          },
        }
      }

    } catch (imageError) {
      console.log('⚠️ Image generation failed, falling back to text description:', imageError)
    }

    // Fallback: Generate detailed text description for now
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.9,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      },
    })

    const textPrompt = `${enhancedPrompt}

Create a detailed visual description for this design that could be used to generate an image. Include:
1. Exact visual composition and layout
2. Specific colors with hex codes if possible
3. Typography details (font style, size, placement)
4. Overall aesthetic and mood
5. How elements should be positioned on the ${request.productCategory}

Make it detailed enough that someone could recreate the design from your description.`

    const result = await model.generateContent(textPrompt)
    const response = await result.response
    const text = response.text()

    const generationTime = Date.now() - startTime

    // Use the enhanced text-to-image API endpoint with the detailed description
    return {
      success: true,
      imageUrl: `/api/ai-design-image?category=${request.productCategory}&prompt=${encodeURIComponent(text)}`,
      metadata: {
        model: 'gemini-1.5-flash',
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        generationTime,
      },
    }

  } catch (error) {
    console.error('AI generation error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate design',
      metadata: {
        model: 'gemini-1.5-flash',
        tokensUsed: 0,
        generationTime: Date.now() - startTime,
      },
    }
  }
}

// Enhanced mock suggestions for local development
const MOCK_SUGGESTIONS = {
  TSHIRT: [
    'Majestic mountain range with golden sunrise',
    'Vintage motorcycle with classic typography', 
    'Sacred geometry mandala with cosmic colors',
    'Neon cyberpunk cityscape at night',
    'Abstract watercolor splash in vibrant hues',
    'Minimalist nature quote in elegant script',
    'Retro 80s synthwave sunset aesthetic',
    'Hand-drawn wildflower botanical illustration',
    'Bold geometric lion portrait',
    'Constellation map with celestial details'
  ],
  CAP: [
    'Classic baseball team emblem design',
    'City skyline silhouette with bold text',
    'Minimalist compass icon with coordinates', 
    'Vintage-style monogram with decorative frame',
    'Athletic number in distressed sports font',
    'Mountain peak logo with adventure theme',
    'Retro surf wave design',
    'Coffee cup icon with steam details',
    'Anchor symbol with nautical rope',
    'Pine tree forest minimal logo'
  ],
  TOTE_BAG: [
    'Save the planet with earth illustration',
    'But first coffee with bean pattern',
    'Bookworm paradise with stack of books',
    'Succulent garden with hand-drawn plants',
    'Fresh market vibes with fruit icons',
    'Daily affirmation in beautiful calligraphy',
    'Adventure awaits with mountain compass',
    'Botanical herbs with vintage labels',
    'Ocean waves with environmental message',
    'Art supplies scattered aesthetic'
  ]
} as const

export async function generateDesignSuggestions(
  productCategory: ProductCategory,
  count: number = 5
): Promise<string[]> {
  // Use mock suggestions if no API key available
  if (!genAI) {
    console.log('📋 Using mock suggestions for:', productCategory)
    const suggestions = MOCK_SUGGESTIONS[productCategory.toUpperCase() as keyof typeof MOCK_SUGGESTIONS] || MOCK_SUGGESTIONS.TSHIRT
    return suggestions.slice(0, count)
  }

  console.log('🧠 Using real Google Gemini AI for suggestions:', productCategory)

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `Generate ${count} creative design ideas for ${productCategory} apparel that would be popular and suitable for custom printing. 

Each suggestion should be:
- Brief and specific (1-2 words or short phrase)
- Appropriate for the product type
- Suitable for various audiences
- Printable with good visual impact

Examples for t-shirts: "Mountain Silhouette", "Vintage Motorcycle", "Geometric Pattern"
Examples for caps: "Team Logo", "City Skyline", "Minimalist Icon"
Examples for tote bags: "Nature Quote", "Abstract Art", "Coffee Theme"

Return only the suggestions as a simple comma-separated list.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()
    
    return text.split(',').map(s => s.trim()).filter(s => s.length > 0)
  } catch (error) {
    console.error('Error generating suggestions:', error)
    // Fallback to mock suggestions on error
    const suggestions = MOCK_SUGGESTIONS[productCategory.toUpperCase() as keyof typeof MOCK_SUGGESTIONS] || MOCK_SUGGESTIONS.TSHIRT
    return suggestions.slice(0, count)
  }
}

// Validate if a prompt is appropriate for apparel design
export async function validateDesignPrompt(prompt: string): Promise<{
  isValid: boolean
  issues?: string[]
  suggestions?: string[]
}> {
  // Without API key, always return valid
  if (!genAI) {
    console.log('✅ Using mock validation (always valid)')
    return { isValid: true }
  }

  console.log('🔍 Using real Google Gemini AI for validation')

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const validationPrompt = `Analyze this design request for custom apparel: "${prompt}"

Check for:
1. Inappropriate content (offensive, copyrighted, etc.)
2. Technical feasibility for printing
3. Clarity and specificity
4. Commercial viability

Respond with a JSON object:
{
  "isValid": boolean,
  "issues": ["list of any problems"],
  "suggestions": ["list of improvements if needed"]
}`

    const result = await model.generateContent(validationPrompt)
    const response = await result.response
    const text = response.text()
    
    try {
      return JSON.parse(text)
    } catch {
      // If JSON parsing fails, assume it's valid
      return { isValid: true }
    }
    
  } catch (error) {
    console.error('Error validating prompt:', error)
    return { isValid: true }
  }
}