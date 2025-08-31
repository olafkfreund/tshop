'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ProductCategory } from '@prisma/client'
import { AI_STYLES, PRODUCT_CATEGORIES } from '@/lib/constants'
import { Wand2, Loader2, Lightbulb, Sparkles, Eye } from 'lucide-react'

interface AIPromptFormProps {
  onGenerate: (result: any) => void
  selectedProduct?: ProductCategory
}

interface Suggestion {
  text: string
  category: ProductCategory
}

export default function AIPromptForm({ onGenerate, selectedProduct }: AIPromptFormProps) {
  const { data: session } = useSession()
  const [prompt, setPrompt] = useState('')
  const [productCategory, setProductCategory] = useState<ProductCategory>(
    selectedProduct || 'TSHIRT'
  )
  const [style, setStyle] = useState<string>('')
  const [saveDesign, setSaveDesign] = useState(!!session)
  const [designName, setDesignName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [usageInfo, setUsageInfo] = useState<any>(null)
  const [announcement, setAnnouncement] = useState('')
  const [predictivePreviews, setPredictivePreviews] = useState<string[]>([])
  const [loadingPreviews, setLoadingPreviews] = useState(false)
  const [showPreviews, setShowPreviews] = useState(false)

  // Load suggestions when product category changes
  useEffect(() => {
    loadSuggestions()
  }, [productCategory])

  // Debounced predictive preview generation
  const generatePredictivePreviews = useCallback(
    async (inputPrompt: string) => {
      if (inputPrompt.length < 10 || loadingPreviews) return

      setLoadingPreviews(true)
      try {
        // Generate style-enhanced preview variations
        const styleVariations = [
          { style: 'vibrant', description: 'with vibrant colors and bold contrasts' },
          { style: 'minimalist', description: 'in clean minimalist style with simple shapes' },
          { style: 'artistic', description: 'with artistic flair and creative interpretation' }
        ]

        const previews = styleVariations.map(variation => 
          `${inputPrompt} ${variation.description}`
        )
        
        setPredictivePreviews(previews)
        setShowPreviews(true)
      } catch (error) {
        console.error('Error generating predictive previews:', error)
      } finally {
        setLoadingPreviews(false)
      }
    },
    [loadingPreviews]
  )

  // Debounce prompt input for predictive previews
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (prompt.length >= 10) {
        generatePredictivePreviews(prompt)
      } else {
        setShowPreviews(false)
        setPredictivePreviews([])
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [prompt, generatePredictivePreviews])

  const loadSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/ai/suggestions?category=${productCategory}`)
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.data.suggestions)
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setAnnouncement('AI is generating your design...')

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          productCategory,
          style: style || undefined,
          saveDesign,
          designName: designName.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onGenerate(data.data)
        setUsageInfo(data.usageInfo)
        setAnnouncement('Design generated successfully!')
        
        // Clear form if successful
        setPrompt('')
        setDesignName('')
      } else {
        const errorMessage = data.error === 'AI generation limit reached' 
          ? 'You\'ve reached your daily AI generation limit. Try again tomorrow or consider upgrading your account.'
          : data.error || 'Failed to generate design. Please try again.'
        
        setAnnouncement(`Error: ${errorMessage}`)
        alert(errorMessage)
        
        if (data.usageInfo) {
          setUsageInfo(data.usageInfo)
        }
      }
    } catch (error) {
      console.error('Error generating design:', error)
      alert('An error occurred while generating the design')
    } finally {
      setIsGenerating(false)
    }
  }

  const useSuggestion = (suggestion: string) => {
    setPrompt(suggestion)
  }

  return (
    <div className="card p-6">
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">AI Design Generator</h2>
      </div>

      {/* Usage Info */}
      {usageInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Remaining:</strong> {usageInfo.remainingDaily} today, {usageInfo.remainingMonthly} this month
            <span className="ml-2 text-xs">({usageInfo.tier} tier)</span>
          </p>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Product Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Type
          </label>
          <select
            value={productCategory}
            onChange={(e) => setProductCategory(e.target.value as ProductCategory)}
            className="input"
            disabled={isGenerating}
          >
            {Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Design Prompt */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your design
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe your design (e.g., 'minimalist mountain landscape with sunset colors')...`}
            className="input min-h-[100px] resize-none"
            maxLength={500}
            disabled={isGenerating}
            required
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Be specific about colors, style, and elements you want</span>
            <span>{prompt.length}/500</span>
          </div>
        </div>

        {/* Predictive Previews */}
        {(showPreviews || loadingPreviews) && (
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-800">
                Preview Variations
              </h4>
              {loadingPreviews && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
            
            {loadingPreviews ? (
              <div className="text-sm text-blue-700">
                Generating preview variations...
              </div>
            ) : (
              <div className="space-y-2">
                {predictivePreviews.map((preview, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPrompt(preview)}
                    className="w-full text-left p-2 text-sm bg-white border border-blue-200 rounded-md hover:border-blue-300 hover:bg-blue-25 transition-colors"
                    disabled={isGenerating}
                  >
                    <span className="text-blue-800">{preview}</span>
                  </button>
                ))}
                <p className="text-xs text-blue-600 mt-2">
                  Click any variation to use it, or continue typing your own prompt
                </p>
              </div>
            )}
          </div>
        )}

        {/* Style Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Style (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2
                          sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setStyle('')}
              className={`p-2 text-sm border rounded-md transition-colors ${
                style === ''
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              disabled={isGenerating}
            >
              Any Style
            </button>
            {AI_STYLES.map((styleOption) => (
              <button
                key={styleOption.value}
                type="button"
                onClick={() => setStyle(styleOption.value)}
                className={`p-2 text-sm border rounded-md transition-colors ${
                  style === styleOption.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                disabled={isGenerating}
                title={styleOption.description}
              >
                {styleOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save Options */}
        {session && (
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={saveDesign}
                onChange={(e) => setSaveDesign(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={isGenerating}
              />
              <span className="ml-2 text-sm text-gray-700">
                Save design to my library
              </span>
            </label>
            
            {saveDesign && (
              <input
                type="text"
                placeholder="Design name (optional)"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="input"
                maxLength={100}
                disabled={isGenerating}
              />
            )}
          </div>
        )}

        {/* Generate Button */}
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className="btn-primary w-full text-base py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              AI is crafting your design...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5 mr-2" />
              Generate Design with AI
            </>
          )}
        </button>
      </form>

      {/* Suggestions */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-medium text-gray-700">
            Popular ideas for {PRODUCT_CATEGORIES[productCategory].toLowerCase()}
          </h3>
        </div>
        
        {loadingSuggestions ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading suggestions...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => useSuggestion(suggestion)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                disabled={isGenerating}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>Tips:</strong> Be specific about colors, objects, and style. 
          Mention if you want text included. Consider how the design will look on {PRODUCT_CATEGORIES[productCategory].toLowerCase()}.
        </p>
      </div>
    </div>
  )
}