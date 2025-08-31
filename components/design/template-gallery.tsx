'use client'

import { useState, useEffect } from 'react'
import { Wand2, Sparkles, Star, Loader2 } from 'lucide-react'
import { DesignTemplate, getTemplatesByCategory, getPopularTemplates } from '@/lib/design-templates'
import { ProductCategory } from '@/types'

interface TemplateGalleryProps {
  selectedCategory?: ProductCategory
  onTemplateSelect: (template: DesignTemplate) => void
  className?: string
}

export default function TemplateGallery({ 
  selectedCategory, 
  onTemplateSelect, 
  className = '' 
}: TemplateGalleryProps) {
  const [viewMode, setViewMode] = useState<'category' | 'popular'>('popular')
  const [isLoading, setIsLoading] = useState(true)

  const templates = viewMode === 'category' && selectedCategory
    ? getTemplatesByCategory(selectedCategory)
    : getPopularTemplates(12)

  // Simulate loading for better UX
  useEffect(() => {
    setIsLoading(true)
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [viewMode, selectedCategory])

  if (templates.length === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Design Templates
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('popular')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'popular'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Popular
          </button>
          {selectedCategory && (
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'category'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              For {selectedCategory}s
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4
                        sm:grid-cols-3
                        lg:grid-cols-4
                        xl:grid-cols-6">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4
                        sm:grid-cols-3
                        lg:grid-cols-4
                        xl:grid-cols-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => onTemplateSelect(template)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Click any template to customize it with AI
        </p>
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: DesignTemplate
  onSelect: () => void
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <div 
      className="group cursor-pointer rounded-lg border bg-white overflow-hidden hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      {/* Template Image */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        <img
          src={template.imageUrl}
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Overlay indicators */}
        <div className="absolute top-2 right-2 flex gap-1">
          {template.isFeatured && (
            <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </div>
          )}
          {template.isPopular && (
            <div className="bg-primary-500 text-white p-1 rounded-full">
              <Star className="h-3 w-3 fill-current" />
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <Wand2 className="h-4 w-4 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {template.name}
            </h4>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {template.description}
            </p>
          </div>
        </div>

        {/* Template metadata */}
        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStyleBadgeClass(template.style)}`}>
            {template.style}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star className="h-3 w-3" />
            {template.popularity}
          </div>
        </div>
      </div>
    </div>
  )
}

function getStyleBadgeClass(style: DesignTemplate['style']): string {
  const styles = {
    minimalist: 'bg-gray-100 text-gray-700',
    vintage: 'bg-amber-100 text-amber-700',
    modern: 'bg-blue-100 text-blue-700',
    artistic: 'bg-purple-100 text-purple-700',
    cartoon: 'bg-pink-100 text-pink-700',
    realistic: 'bg-green-100 text-green-700',
  }
  return styles[style] || styles.modern
}