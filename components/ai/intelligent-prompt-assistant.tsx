'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAnalytics } from '@/lib/analytics'
import { 
  Wand2, 
  Lightbulb, 
  Target, 
  Sparkles, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown,
  TrendingUp,
  Palette,
  Eye,
  Zap
} from 'lucide-react'

interface PromptSuggestion {
  prompt: string
  category: string
  confidence: number
  expectedStyle: string
  rationale: string
}

interface PromptOptimization {
  optimized: string
  improvements: string[]
  confidence: number
  metrics: {
    wordCount: {
      original: number
      optimized: number
      change: string
    }
    scores: {
      clarity: number
      technical: number
      creativity: number
      overall: number
    }
    improvements: {
      hasColorDescription: boolean
      hasStyleDescription: boolean
      hasCompositionDetails: boolean
      hasTechnicalSpecs: boolean
    }
  }
}

interface IntelligentPromptAssistantProps {
  currentPrompt: string
  onPromptChange: (prompt: string) => void
  productType: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
  onPromptSelected: (prompt: string) => void
  className?: string
}

export default function IntelligentPromptAssistant({
  currentPrompt,
  onPromptChange,
  productType,
  onPromptSelected,
  className = ''
}: IntelligentPromptAssistantProps) {
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([])
  const [optimization, setOptimization] = useState<PromptOptimization | null>(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'suggestions' | 'optimize' | 'variations'>('suggestions')
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null)

  const { trackEvent } = useAnalytics()

  // Load personalized recommendations
  useEffect(() => {
    loadRecommendations()
  }, [productType])

  const loadRecommendations = async () => {
    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/ai/recommendations?limit=4`)
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.data.recommendations)
        
        trackEvent({
          action: 'ai_recommendations_loaded',
          category: 'ai_enhancement',
          custom_parameters: {
            product_type: productType,
            recommendation_count: data.data.recommendations.length,
            personalization_score: data.data.personalizationScore
          }
        })
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const optimizePrompt = async () => {
    if (!currentPrompt || currentPrompt.length < 5) return

    setIsOptimizing(true)
    try {
      const response = await fetch('/api/ai/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: currentPrompt,
          productType,
          optimizationGoals: ['clarity', 'commercial_appeal', 'technical_accuracy']
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setOptimization(data.data)
        
        trackEvent({
          action: 'prompt_optimized',
          category: 'ai_enhancement',
          custom_parameters: {
            original_length: currentPrompt.length,
            optimized_length: data.data.optimized.length,
            confidence: data.data.confidence,
            overall_score: data.data.metrics.scores.overall
          }
        })
      }
    } catch (error) {
      console.error('Failed to optimize prompt:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleSuggestionClick = (suggestion: PromptSuggestion) => {
    onPromptSelected(suggestion.prompt)
    
    trackEvent({
      action: 'ai_suggestion_selected',
      category: 'ai_enhancement',
      custom_parameters: {
        suggestion_category: suggestion.category,
        confidence: suggestion.confidence,
        expected_style: suggestion.expectedStyle
      }
    })
  }

  const handleOptimizedPromptAccept = () => {
    if (optimization) {
      onPromptChange(optimization.optimized)
      
      trackEvent({
        action: 'optimized_prompt_accepted',
        category: 'ai_enhancement',
        custom_parameters: {
          confidence: optimization.confidence,
          overall_score: optimization.metrics.scores.overall,
          word_count_change: optimization.metrics.wordCount.change
        }
      })
    }
  }

  const promptStrength = useMemo(() => {
    if (!currentPrompt) return 0
    
    let score = 0
    const words = currentPrompt.split(' ')
    
    // Length scoring
    if (words.length >= 5) score += 20
    if (words.length >= 10) score += 20
    
    // Content scoring
    const hasColor = /\b(red|blue|green|yellow|black|white|colorful|vibrant|muted)\b/i.test(currentPrompt)
    const hasStyle = /\b(modern|vintage|abstract|minimalist|artistic|geometric)\b/i.test(currentPrompt)
    const hasDetails = /\b(detailed|intricate|simple|clean|bold|subtle)\b/i.test(currentPrompt)
    
    if (hasColor) score += 20
    if (hasStyle) score += 20
    if (hasDetails) score += 20
    
    return Math.min(score, 100)
  }, [currentPrompt])

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600 bg-green-100'
    if (strength >= 60) return 'text-yellow-600 bg-yellow-100'
    if (strength >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return 'Excellent'
    if (strength >= 60) return 'Good'
    if (strength >= 40) return 'Fair'
    return 'Needs Work'
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Wand2 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Prompt Assistant</h3>
        </div>
        
        {currentPrompt && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStrengthColor(promptStrength)}`}>
            <Target className="h-4 w-4" />
            <span>{getStrengthLabel(promptStrength)} ({promptStrength}%)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSelectedTab('suggestions')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'suggestions'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          <span>Suggestions</span>
        </button>
        
        <button
          onClick={() => setSelectedTab('optimize')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'optimize'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Optimize</span>
        </button>
        
        <button
          onClick={() => setSelectedTab('variations')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'variations'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Variations</span>
        </button>
      </div>

      {/* Content */}
      {selectedTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Personalized suggestions based on your design history
            </p>
            <button
              onClick={loadRecommendations}
              disabled={isLoadingSuggestions}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center space-x-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingSuggestions ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg p-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-all hover:border-indigo-300 hover:shadow-sm ${
                    expandedSuggestion === index ? 'border-indigo-300 bg-indigo-50' : 'bg-white'
                  }`}
                  onClick={() => setExpandedSuggestion(expandedSuggestion === index ? null : index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {suggestion.prompt}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Palette className="h-3 w-3" />
                          <span>{suggestion.category}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{suggestion.confidence}% match</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{suggestion.expectedStyle}</span>
                        </span>
                      </div>
                      
                      {expandedSuggestion === index && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-xs text-gray-600 mb-3">
                            <strong>Why this works:</strong> {suggestion.rationale}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSuggestionClick(suggestion)
                            }}
                            className="w-full bg-indigo-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                          >
                            Use This Prompt
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'optimize' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Improve your current prompt for better results
            </p>
            <button
              onClick={optimizePrompt}
              disabled={isOptimizing || !currentPrompt || currentPrompt.length < 5}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Zap className={`h-4 w-4 ${isOptimizing ? 'animate-pulse' : ''}`} />
              <span>{isOptimizing ? 'Optimizing...' : 'Optimize'}</span>
            </button>
          </div>

          {!currentPrompt || currentPrompt.length < 5 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Enter a prompt to get optimization suggestions</p>
            </div>
          ) : optimization ? (
            <div className="space-y-4">
              {/* Optimization Results */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Optimized Prompt</h4>
                <p className="text-sm text-green-800 mb-3">{optimization.optimized}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-green-700">
                    <span>Confidence: {optimization.confidence}%</span>
                    <span>Score: {optimization.metrics.scores.overall}/100</span>
                    <span>Words: {optimization.metrics.wordCount.change} change</span>
                  </div>
                  <button
                    onClick={handleOptimizedPromptAccept}
                    className="bg-green-600 text-white py-1 px-3 rounded text-xs font-medium hover:bg-green-700"
                  >
                    Use This Version
                  </button>
                </div>
              </div>

              {/* Improvements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Improvements Made</h4>
                <ul className="space-y-1">
                  {optimization.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start space-x-2">
                      <ThumbsUp className="h-3 w-3 mt-0.5 text-blue-600" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{optimization.metrics.scores.clarity}</div>
                  <div className="text-xs text-gray-600">Clarity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{optimization.metrics.scores.technical}</div>
                  <div className="text-xs text-gray-600">Technical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{optimization.metrics.scores.creativity}</div>
                  <div className="text-xs text-gray-600">Creative</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {selectedTab === 'variations' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate creative variations of your current prompt
          </p>
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Variation generation will be available in the design editor</p>
          </div>
        </div>
      )}
    </div>
  )
}