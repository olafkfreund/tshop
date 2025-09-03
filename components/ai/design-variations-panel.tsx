'use client'

import { useState } from 'react'
import { useAnalytics } from '@/lib/analytics'
import { 
  Sparkles, 
  Shuffle, 
  Eye, 
  Heart, 
  Download, 
  Loader2, 
  RefreshCw,
  CheckCircle,
  Copy,
  Wand2
} from 'lucide-react'

interface DesignVariation {
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

interface DesignVariationsPanelProps {
  basePrompt: string
  productType: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
  onVariationSelected: (variation: DesignVariation) => void
  className?: string
}

const VARIATION_TYPES = [
  {
    id: 'mixed',
    name: 'Mixed Variations',
    description: 'Explore different styles, colors, and compositions',
    icon: Sparkles
  },
  {
    id: 'style',
    name: 'Style Variations',
    description: 'Same concept with different artistic approaches',
    icon: Wand2
  },
  {
    id: 'color',
    name: 'Color Variations',
    description: 'Different color schemes and palettes',
    icon: Eye
  },
  {
    id: 'composition',
    name: 'Layout Variations',
    description: 'Different arrangements and compositions',
    icon: Shuffle
  }
]

export default function DesignVariationsPanel({
  basePrompt,
  productType,
  onVariationSelected,
  className = ''
}: DesignVariationsPanelProps) {
  const [variations, setVariations] = useState<DesignVariation[]>([])
  const [selectedVariationType, setSelectedVariationType] = useState<string>('mixed')
  const [variationCount, setVariationCount] = useState<number>(4)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [selectedVariation, setSelectedVariation] = useState<string>('')
  const [error, setError] = useState<string>('')

  const { trackEvent } = useAnalytics()

  const generateVariations = async () => {
    if (!basePrompt || basePrompt.length < 5) {
      setError('Please provide a base prompt to generate variations')
      return
    }

    setIsGenerating(true)
    setError('')
    
    try {
      const response = await fetch('/api/ai/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePrompt,
          productType,
          variationCount,
          variationType: selectedVariationType
        })
      })

      const data = await response.json()

      if (data.success) {
        setVariations(data.data.variations)
        
        trackEvent({
          action: 'design_variations_generated',
          category: 'ai_enhancement',
          custom_parameters: {
            base_prompt_length: basePrompt.length,
            variation_type: selectedVariationType,
            variation_count: data.data.variations.length,
            product_type: productType
          }
        })
      } else {
        setError(data.error || 'Failed to generate variations')
      }
    } catch (error) {
      console.error('Variation generation error:', error)
      setError('Failed to generate variations. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVariationSelect = (variation: DesignVariation) => {
    setSelectedVariation(variation.id)
    onVariationSelected(variation)
    
    trackEvent({
      action: 'design_variation_selected',
      category: 'ai_enhancement',
      custom_parameters: {
        variation_id: variation.id,
        variation_style: variation.style,
        color_scheme: variation.variations.color_scheme,
        composition: variation.variations.composition
      }
    })
  }

  const copyPromptToClipboard = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Design Variations</h3>
        </div>
        
        {variations.length > 0 && (
          <button
            onClick={() => {
              setVariations([])
              setSelectedVariation('')
              setError('')
            }}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Configuration */}
      <div className="space-y-4 mb-6">
        {/* Variation Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">Variation Type</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {VARIATION_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedVariationType(type.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all hover:scale-105 ${
                    selectedVariationType === type.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${
                    selectedVariationType === type.id ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                  <div className={`font-medium text-sm ${
                    selectedVariationType === type.id ? 'text-indigo-900' : 'text-gray-900'
                  }`}>
                    {type.name}
                  </div>
                  <div className={`text-xs mt-1 ${
                    selectedVariationType === type.id ? 'text-indigo-700' : 'text-gray-600'
                  }`}>
                    {type.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Variation Count */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-900">Number of variations:</label>
          <select
            value={variationCount}
            onChange={(e) => setVariationCount(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={3}>3 variations</option>
            <option value={4}>4 variations</option>
            <option value={5}>5 variations</option>
            <option value={6}>6 variations</option>
          </select>
        </div>

        {/* Base Prompt Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">Base Prompt</label>
          <p className="text-sm text-gray-700 font-mono bg-white p-3 rounded border">
            {basePrompt || 'No base prompt provided'}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-red-800">
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Generate Button */}
      {variations.length === 0 && (
        <button
          onClick={generateVariations}
          disabled={!basePrompt || basePrompt.length < 5 || isGenerating}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-6"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Variations...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate {variationCount} Variations</span>
            </>
          )}
        </button>
      )}

      {/* Variations Grid */}
      {variations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Generated Variations</h4>
            <span className="text-sm text-gray-600">{variations.length} variations</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {variations.map((variation, index) => (
              <div
                key={variation.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedVariation === variation.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => handleVariationSelect(variation)}
              >
                {/* Variation Preview */}
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={variation.imageUrl}
                    alt={`Variation ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedVariation === variation.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-6 w-6 text-indigo-500 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                {/* Variation Details */}
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Variation {index + 1}</h5>
                    <p className="text-sm text-gray-600">{variation.style}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Color Scheme:</span>
                      <span className="font-medium text-gray-900">{variation.variations.color_scheme}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Composition:</span>
                      <span className="font-medium text-gray-900">{variation.variations.composition}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Elements:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {variation.variations.elements.map((element, i) => (
                          <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {element}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Generated Prompt</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyPromptToClipboard(variation.prompt)
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 font-mono">
                      {variation.prompt}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVariationSelect(variation)
                      }}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        selectedVariation === variation.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedVariation === variation.id ? 'Selected' : 'Select'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Preview functionality
                      }}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Download functionality
                      }}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Generate More Button */}
          <button
            onClick={() => {
              setVariations([])
              generateVariations()
            }}
            className="w-full bg-white border border-indigo-600 text-indigo-600 py-2 px-4 rounded-md font-medium hover:bg-indigo-50 flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Generate New Variations</span>
          </button>
        </div>
      )}
    </div>
  )
}