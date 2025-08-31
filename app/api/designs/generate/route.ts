import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, product_type = 'tshirt', style = 'modern' } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    const isLocalMode = process.env.LOCAL_MODE === 'true'
    const mockApiUrl = process.env.MOCK_API_URL

    // Check if we should use real Gemini API or mock
    const shouldUseMock = 
      !geminiApiKey || 
      geminiApiKey === 'mock-key' || 
      geminiApiKey === 'your-real-gemini-api-key-here'

    if (shouldUseMock) {
      // Use mock API for local development
      console.log('🎭 Using mock AI generation for prompt:', prompt)
      
      if (isLocalMode && mockApiUrl) {
        try {
          const mockResponse = await fetch(`${mockApiUrl}/ai/generate-design`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
              product_type,
              style,
              user_id: session.user.id,
            }),
          })

          if (mockResponse.ok) {
            const mockData = await mockResponse.json()
            return NextResponse.json({
              success: true,
              design_url: mockData.design_url,
              design_id: mockData.design_id,
              prompt_used: prompt,
              processing_time: mockData.processing_time,
              provider: 'mock',
              message: 'Generated using mock AI service',
            })
          }
        } catch (mockError) {
          console.warn('Mock API failed, using fallback generation:', mockError)
        }
      }

      // Fallback mock generation (no external service needed)
      return NextResponse.json({
        success: true,
        design_url: '/api/mock-design-image?' + new URLSearchParams({
          prompt: prompt.slice(0, 50),
          product: product_type,
          style,
          seed: Date.now().toString()
        }),
        design_id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prompt_used: prompt,
        processing_time: Math.random() * 2 + 1,
        provider: 'mock-fallback',
        message: 'Generated using built-in mock AI (add real GEMINI_API_KEY for AI generation)',
      })
    }

    // Use real Google Gemini API
    console.log('🤖 Using real Gemini AI for prompt:', prompt)
    
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
      }
    })

    // Create a design-focused prompt
    const designPrompt = `Create a design concept for a ${product_type} with the following requirements:

Style: ${style}
User prompt: "${prompt}"
Product type: ${product_type}

Please provide a detailed description of a design that would work well for ${product_type} printing, including:
1. Main visual elements
2. Color scheme suggestions
3. Typography if any text is involved
4. Layout and composition
5. Style characteristics

Keep the design suitable for apparel printing with good contrast and clear elements.`

    const startTime = Date.now()
    const result = await model.generateContent(designPrompt)
    const processingTime = (Date.now() - startTime) / 1000

    const designDescription = result.response.text()

    // For now, we return the AI description and a placeholder image
    // In a full implementation, you'd use this description to generate an actual image
    // using services like DALL-E, Midjourney API, or Stable Diffusion
    
    return NextResponse.json({
      success: true,
      design_description: designDescription,
      design_url: '/api/ai-design-image?' + new URLSearchParams({
        description: designDescription.slice(0, 200),
        product: product_type,
        style,
        seed: Date.now().toString()
      }),
      design_id: `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prompt_used: prompt,
      processing_time: processingTime,
      provider: 'google-gemini',
      message: 'Generated using Google Gemini AI',
    })

  } catch (error) {
    console.error('Design generation error:', error)
    
    // Fallback to mock generation on any error
    return NextResponse.json({
      success: true,
      design_url: '/api/mock-design-image?' + new URLSearchParams({
        prompt: 'error-fallback',
        product: 'tshirt',
        style: 'simple',
        seed: Date.now().toString()
      }),
      design_id: `fallback_${Date.now()}`,
      prompt_used: 'Error occurred, showing fallback design',
      processing_time: 0.5,
      provider: 'error-fallback',
      message: 'Using fallback design due to API error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'AI generation temporarily unavailable'
    }, { status: 200 }) // Return 200 with fallback instead of error
  }
}