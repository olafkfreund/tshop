'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AI_STYLES } from '@/lib/constants'
import { useAnalytics } from '@/lib/analytics'

// Product categories with display names
const PRODUCT_CATEGORIES = [
  { id: 'TSHIRT', name: 'T-Shirt', icon: '👕', price: '$24.99' },
  { id: 'CAP', name: 'Cap', icon: '🧢', price: '$19.99' },
  { id: 'TOTE_BAG', name: 'Tote Bag', icon: '👜', price: '$14.99' },
]

// Design templates/suggestions
const DESIGN_SUGGESTIONS = {
  TSHIRT: [
    'Vintage motorcycle with flames',
    'Sacred geometry mandala',
    'Neon cyberpunk cityscape',
    'Abstract watercolor splash',
    'Minimalist mountain landscape',
  ],
  CAP: [
    'Classic sports team logo',
    'City skyline silhouette',
    'Minimalist compass icon',
    'Vintage monogram design',
    'Mountain peak adventure',
  ],
  TOTE_BAG: [
    'Save the planet earth design',
    'Coffee lover quote',
    'Botanical floral pattern',
    'Bookworm library theme',
    'Fresh farmers market vibes',
  ],
}

export default function AIDesignPage() {
  const router = useRouter()
  const analytics = useAnalytics()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [generatedDesign, setGeneratedDesign] = useState<{
    imageUrl: string
    designId?: string
  } | null>(null)
  const [usageInfo, setUsageInfo] = useState<{
    remainingDaily: number
    remainingMonthly: number
    tier: string
  } | null>(null)
  
  const [formData, setFormData] = useState({
    prompt: '',
    productCategory: 'TSHIRT',
    style: 'modern',
    saveDesign: false,
    designName: '',
  })

  const [showSuggestions, setShowSuggestions] = useState(false)

  // Get AI usage on mount
  useEffect(() => {
    checkUsage()
    
    // Track page view
    analytics.trackPageView('/ai-design', 'AI Design Generator')
  }, [])

  const checkUsage = async () => {
    try {
      const response = await fetch('/api/ai/usage')
      if (response.ok) {
        const data = await response.json()
        setUsageInfo(data)
      }
    } catch (error) {
      console.error('Failed to check usage:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError('')
    setGeneratedDesign(null)

    // Track design generation start
    const generationStartTime = Date.now()
    analytics.trackEvent({
      action: 'design_generation_started',
      category: 'ai_design',
      label: formData.productCategory,
      custom_parameters: {
        prompt: formData.prompt,
        product_category: formData.productCategory,
        style: formData.style
      }
    })

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Generation limit reached. ${data.usageInfo?.remainingDaily === 0 ? 'Daily limit exhausted. Resets at midnight.' : 'Please try again later.'}`)
        } else {
          setError(data.error || 'Failed to generate design')
        }
        return
      }

      if (data.success) {
        const generationTime = Date.now() - generationStartTime
        
        setGeneratedDesign({
          imageUrl: data.data.imageUrl,
          designId: data.data.designId,
        })
        
        // Track successful design generation
        analytics.trackDesignCreated(
          data.data.designId || 'ai-generated',
          formData.productCategory,
          true
        )
        
        analytics.trackEvent({
          action: 'design_generation_completed',
          category: 'ai_design',
          label: formData.productCategory,
          value: generationTime,
          custom_parameters: {
            prompt: formData.prompt,
            product_category: formData.productCategory,
            style: formData.style,
            generation_time_ms: generationTime,
            ai_model: data.data.metadata?.model,
            tokens_used: data.data.metadata?.tokensUsed
          }
        })
        
        // Update usage info
        if (data.usageInfo) {
          setUsageInfo(data.usageInfo)
        }
      }
    } catch (error) {
      const generationTime = Date.now() - generationStartTime
      
      setError('An error occurred. Please try again.')
      
      // Track failed generation
      analytics.trackError(
        error instanceof Error ? error.message : 'Design generation failed',
        'ai_design_generation',
        'high'
      )
      
      analytics.trackEvent({
        action: 'design_generation_failed',
        category: 'ai_design',
        label: formData.productCategory,
        value: generationTime,
        custom_parameters: {
          prompt: formData.prompt,
          product_category: formData.productCategory,
          style: formData.style,
          generation_time_ms: generationTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddToCart = async () => {
    if (!generatedDesign) return
    
    // Track add to cart click
    analytics.trackEvent({
      action: 'add_to_cart_clicked',
      category: 'ai_design',
      label: formData.productCategory,
      custom_parameters: {
        design_id: generatedDesign.designId,
        product_category: formData.productCategory,
        source: 'ai_design_page'
      }
    })
    
    // For now, redirect to product page with design
    // In a full implementation, we'd add directly to cart
    router.push(`/products?design=${encodeURIComponent(generatedDesign.imageUrl)}&category=${formData.productCategory}`)
  }

  const handleEditDesign = () => {
    if (!generatedDesign) return
    
    // Track edit design click
    analytics.trackEvent({
      action: 'edit_design_clicked',
      category: 'ai_design',
      label: formData.productCategory,
      custom_parameters: {
        design_id: generatedDesign.designId,
        product_category: formData.productCategory,
        source: 'ai_design_page'
      }
    })
    
    // Pass design data to editor page
    router.push(`/editor?productType=${formData.productCategory}&aiImage=${encodeURIComponent(generatedDesign.imageUrl)}`)
  }

  const selectSuggestion = (suggestion: string) => {
    setFormData(prev => ({ ...prev, prompt: suggestion }))
    setShowSuggestions(false)
  }

  const selectedCategory = PRODUCT_CATEGORIES.find(cat => cat.id === formData.productCategory)
  const suggestions = DESIGN_SUGGESTIONS[formData.productCategory as keyof typeof DESIGN_SUGGESTIONS]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Design Generator
          </h1>
          <p className="text-lg text-gray-600">
            Create unique custom designs for your apparel in seconds
          </p>
          
          {usageInfo && (
            <div className="mt-4 inline-flex items-center space-x-4 bg-white rounded-full px-4 py-2 shadow-sm">
              <span className="text-sm text-gray-500">
                Daily: <span className="font-medium text-gray-900">{usageInfo.remainingDaily}</span> remaining
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">
                Plan: <span className="font-medium text-indigo-600">{usageInfo.tier}</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Design Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Product
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PRODUCT_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, productCategory: category.id }))}
                      className={`relative rounded-lg border-2 p-4 text-center transition-all ${
                        formData.productCategory === category.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{category.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Design Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                    Design Description
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    Need ideas?
                  </button>
                </div>
                
                {showSuggestions && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Click a suggestion:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectSuggestion(suggestion)}
                          className="text-xs px-3 py-1 bg-white rounded-full border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={3}
                  required
                  minLength={3}
                  maxLength={500}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={`Describe your ${selectedCategory?.name.toLowerCase()} design...`}
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  disabled={isGenerating}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.prompt.length}/500 characters
                </p>
              </div>

              {/* Style Selection */}
              <div>
                <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                  Design Style
                </label>
                <select
                  id="style"
                  name="style"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.style}
                  onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                  disabled={isGenerating}
                >
                  {AI_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label} - {style.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                type="submit"
                disabled={isGenerating || !formData.prompt}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Design...
                  </>
                ) : (
                  'Generate Design'
                )}
              </button>
            </form>
          </div>

          {/* Design Preview */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Design Preview</h3>
            
            {generatedDesign ? (
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={generatedDesign.imageUrl}
                    alt="Generated design"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Add to Cart - {selectedCategory?.price}
                  </button>
                  
                  <button
                    onClick={handleEditDesign}
                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit Design
                  </button>
                  
                  <button
                    onClick={() => {
                      setGeneratedDesign(null)
                      setFormData(prev => ({ ...prev, prompt: '' }))
                    }}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create New Design
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Your design will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tips for Great Designs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600">1</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Be Specific</h4>
                <p className="text-sm text-gray-500">Include details about colors, style, and mood</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600">2</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Keep It Simple</h4>
                <p className="text-sm text-gray-500">Designs that are too complex may not print well</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600">3</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Consider the Product</h4>
                <p className="text-sm text-gray-500">Different designs work better on different products</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}