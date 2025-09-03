'use client'

import { useState } from 'react'
import { useAnalytics } from '@/lib/analytics'
import { 
  Palette, 
  Sliders, 
  Eye, 
  Download, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react'

interface StyleTransferPanelProps {
  currentImageUrl?: string
  productType: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
  onStyleApplied: (result: { prompt: string; imageUrl: string }) => void
  className?: string
}

const STYLE_OPTIONS = [
  {
    id: 'abstract',
    name: 'Abstract',
    description: 'Geometric shapes and bold colors',
    preview: '/styles/abstract-preview.jpg',
    characteristics: 'Non-representational, modern aesthetic'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro and nostalgic feel',
    preview: '/styles/vintage-preview.jpg',
    characteristics: 'Aged textures, muted colors'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean and simple design',
    preview: '/styles/minimalist-preview.jpg',
    characteristics: 'Clean lines, limited palette'
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Expressive and creative',
    preview: '/styles/artistic-preview.jpg',
    characteristics: 'Painterly, expressive brushstrokes'
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Fluid and organic',
    preview: '/styles/watercolor-preview.jpg',
    characteristics: 'Soft edges, translucent effects'
  },
  {
    id: 'sketch',
    name: 'Sketch',
    description: 'Hand-drawn aesthetic',
    preview: '/styles/sketch-preview.jpg',
    characteristics: 'Pencil-like textures, artistic lines'
  },
  {
    id: 'pop-art',
    name: 'Pop Art',
    description: 'Bold and commercial',
    preview: '/styles/pop-art-preview.jpg',
    characteristics: 'Bright colors, graphic style'
  },
  {
    id: 'grunge',
    name: 'Grunge',
    description: 'Edgy and distressed',
    preview: '/styles/grunge-preview.jpg',
    characteristics: 'Rough textures, dark aesthetic'
  }
]

export default function StyleTransferPanel({
  currentImageUrl,
  productType,
  onStyleApplied,
  className = ''
}: StyleTransferPanelProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [intensity, setIntensity] = useState<number>(70)
  const [preserveText, setPreserveText] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [result, setResult] = useState<{ prompt: string; imageUrl: string } | null>(null)
  const [error, setError] = useState<string>('')

  const { trackEvent } = useAnalytics()

  const handleStyleTransfer = async () => {
    if (!currentImageUrl || !selectedStyle) {
      setError('Please select a style and ensure you have a design loaded')
      return
    }

    setIsProcessing(true)
    setError('')
    
    try {
      const response = await fetch('/api/ai/style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImageUrl: currentImageUrl,
          targetStyle: selectedStyle,
          intensity,
          preserveText,
          productType
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          prompt: data.data.prompt,
          imageUrl: data.data.imageUrl
        })

        trackEvent({
          action: 'style_transfer_completed',
          category: 'ai_enhancement',
          custom_parameters: {
            style: selectedStyle,
            intensity,
            product_type: productType,
            preserve_text: preserveText
          }
        })
      } else {
        setError(data.error || 'Style transfer failed')
      }
    } catch (error) {
      console.error('Style transfer error:', error)
      setError('Failed to apply style transfer. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApplyResult = () => {
    if (result) {
      onStyleApplied(result)
      
      trackEvent({
        action: 'style_transfer_applied',
        category: 'ai_enhancement',
        custom_parameters: {
          style: selectedStyle,
          intensity
        }
      })
    }
  }

  const resetPanel = () => {
    setResult(null)
    setError('')
    setSelectedStyle('')
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Style Transfer</h3>
        </div>
        
        {result && (
          <button
            onClick={resetPanel}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Start Over</span>
          </button>
        )}
      </div>

      {!currentImageUrl ? (
        <div className="text-center py-12 text-gray-500">
          <Palette className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">Load a design to apply style transfer</p>
        </div>
      ) : result ? (
        /* Result Display */
        <div className="space-y-6">
          {/* Before/After Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Original</h4>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={currentImageUrl}
                  alt="Original design"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                With {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} Style
              </h4>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={result.imageUrl}
                  alt="Styled design"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Result Actions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Style Transfer Complete!</h4>
                <p className="text-sm text-green-800 mt-1">
                  Your design has been transformed with the {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name.toLowerCase()} style.
                </p>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={handleApplyResult}
                    className="bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Apply This Style</span>
                  </button>
                  <button
                    onClick={() => {/* Download functionality */}}
                    className="bg-white border border-green-600 text-green-600 py-2 px-4 rounded-md text-sm font-medium hover:bg-green-50 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Prompt */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Generated Prompt</h4>
            <p className="text-sm text-blue-800 font-mono bg-white p-3 rounded border">
              {result.prompt}
            </p>
          </div>
        </div>
      ) : (
        /* Style Selection and Configuration */
        <div className="space-y-6">
          {/* Style Selection Grid */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Choose a Style</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedStyle === style.id
                      ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="text-xs opacity-90">{style.description}</div>
                  </div>
                  {selectedStyle === style.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-purple-500 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          {selectedStyle && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name} Style
                </h4>
                <p className="text-sm text-gray-600">
                  {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.characteristics}
                </p>
              </div>

              {/* Intensity Slider */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                    <Sliders className="h-4 w-4" />
                    <span>Style Intensity</span>
                  </span>
                  <span className="text-sm text-gray-600">{intensity}%</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Subtle</span>
                  <span>Moderate</span>
                  <span>Strong</span>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="preserveText"
                  checked={preserveText}
                  onChange={(e) => setPreserveText(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="preserveText" className="text-sm text-gray-700">
                  Preserve text elements
                </label>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Error</h4>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Apply Button */}
          <button
            onClick={handleStyleTransfer}
            disabled={!selectedStyle || isProcessing}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Applying Style...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Apply Style Transfer</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}