import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIGenerationRequest, AIGenerationResponse, ProductCategory } from '@/types'

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
  tshirt: {
    aspectRatio: '3:4',
    placement: 'center chest area',
    maxWidth: '10 inches',
    maxHeight: '12 inches',
    backgroundColor: 'transparent or solid colors that work on fabric',
    style: 'suitable for screen printing or DTG printing',
  },
  cap: {
    aspectRatio: '2:1', 
    placement: 'front panel center',
    maxWidth: '4 inches',
    maxHeight: '2 inches',
    backgroundColor: 'transparent background',
    style: 'suitable for embroidery or vinyl application',
  },
  'tote-bag': {
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
  
  let enhancedPrompt = `Create a professional apparel design for a ${productCategory} with the following requirements:

USER REQUEST: "${userPrompt}"

TECHNICAL CONSTRAINTS:
- Aspect ratio: ${constraints.aspectRatio}
- Placement: ${constraints.placement}
- Maximum size: ${constraints.maxWidth} x ${constraints.maxHeight}
- Background: ${constraints.backgroundColor}
- Print method: ${constraints.style}

DESIGN REQUIREMENTS:
- High contrast and readability when printed on fabric
- Scalable vector-style design elements
- Clean, professional appearance
- Colors that reproduce well in printing
- Avoid fine details that may not print clearly`

  if (style) {
    enhancedPrompt += `\n- Style preference: ${style}`
  }

  enhancedPrompt += `\n\nGenerate an image that meets these specifications and would look excellent on a ${productCategory}.`

  return enhancedPrompt
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

    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.9,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      },
    })

    // For now, we'll generate a text description and use that for image generation
    // In a real implementation, you'd use an image generation model
    const textPrompt = `${enhancedPrompt}

Please provide a detailed description of the design that would be created, including:
1. Visual elements and composition
2. Color scheme
3. Typography (if any)
4. Overall style and feel
5. How it would look on the ${request.productCategory}

Format your response as a JSON object with these fields:
{
  "description": "detailed visual description",
  "elements": ["list", "of", "design", "elements"],
  "colors": ["color1", "color2", "color3"],
  "style": "style description"
}`

    const result = await model.generateContent(textPrompt)
    const response = await result.response
    const text = response.text()

    const generationTime = Date.now() - startTime

    // For now, return a placeholder response
    // In production, you'd integrate with an actual image generation service
    return {
      success: true,
      imageUrl: `/api/ai/placeholder-design?category=${request.productCategory}&prompt=${encodeURIComponent(request.prompt)}`,
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

// Mock suggestions for local development
const MOCK_SUGGESTIONS = {
  TSHIRT: [
    'Mountain Silhouette',
    'Vintage Band Logo', 
    'Geometric Pattern',
    'City Skyline',
    'Abstract Art',
    'Nature Quote',
    'Minimalist Design',
    'Retro Sunset'
  ],
  CAP: [
    'Team Logo',
    'City Name',
    'Simple Icon', 
    'Monogram',
    'Sports Theme',
    'Brand Symbol',
    'Number Design',
    'Text Logo'
  ],
  TOTE_BAG: [
    'Eco Message',
    'Coffee Theme',
    'Book Lover',
    'Plant Design',
    'Market Bag',
    'Daily Mantra',
    'Simple Quote',
    'Abstract Pattern'
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