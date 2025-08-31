'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  Search,
  X,
  Filter,
  Crown,
  Star,
  Palette,
  Grid3X3,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  templatesCount?: number
}

interface SearchParams {
  category?: string
  style?: string
  color?: string
  sort?: string
  search?: string
  page?: string
  type?: 'free' | 'premium' | 'all'
}

interface TemplateFiltersProps {
  categories: Category[]
  currentFilters: SearchParams
}

const STYLE_OPTIONS = [
  'Modern',
  'Classic',
  'Minimalist',
  'Bold',
  'Vintage',
  'Elegant',
  'Playful',
  'Professional',
  'Artistic',
  'Geometric',
  'Typography',
  'Illustration'
]

const COLOR_OPTIONS = [
  { name: 'Black', value: 'black', color: '#000000' },
  { name: 'White', value: 'white', color: '#FFFFFF' },
  { name: 'Red', value: 'red', color: '#EF4444' },
  { name: 'Blue', value: 'blue', color: '#3B82F6' },
  { name: 'Green', value: 'green', color: '#10B981' },
  { name: 'Yellow', value: 'yellow', color: '#F59E0B' },
  { name: 'Purple', value: 'purple', color: '#8B5CF6' },
  { name: 'Pink', value: 'pink', color: '#EC4899' },
  { name: 'Orange', value: 'orange', color: '#F97316' },
  { name: 'Gray', value: 'gray', color: '#6B7280' },
  { name: 'Brown', value: 'brown', color: '#92400E' },
  { name: 'Teal', value: 'teal', color: '#14B8A6' }
]

export default function TemplateFilters({ categories, currentFilters }: TemplateFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(currentFilters.search || '')
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    styles: false,
    colors: false,
    types: true
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (currentFilters[key as keyof SearchParams] === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    params.set('page', '1')
    router.push(`/templates?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push('/templates')
    setSearchQuery('')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    } else {
      params.delete('search')
    }
    
    params.set('page', '1')
    router.push(`/templates?${params.toString()}`)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const activeFiltersCount = Object.entries(currentFilters).filter(
    ([key, value]) => value && value !== 'all' && key !== 'page' && key !== 'sort'
  ).length

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                const params = new URLSearchParams(searchParams)
                params.delete('search')
                params.set('page', '1')
                router.push(`/templates?${params.toString()}`)
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
        </form>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Active Filters</span>
            <button
              onClick={clearAllFilters}
              className="text-xs text-primary-600 hover:text-primary-700 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(currentFilters).map(([key, value]) => {
              if (!value || value === 'all' || key === 'page' || key === 'sort') return null
              
              return (
                <button
                  key={`${key}-${value}`}
                  onClick={() => updateFilter(key, value)}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full hover:bg-primary-200 transition-colors"
                >
                  <span>{value}</span>
                  <X className="h-3 w-3" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Template Type */}
      <div>
        <button
          onClick={() => toggleSection('types')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span>Template Type</span>
          </h3>
          {expandedSections.types ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
        
        {expandedSections.types && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="all"
                checked={!currentFilters.type || currentFilters.type === 'all'}
                onChange={() => updateFilter('type', 'all')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-gray-700">All Templates</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="free"
                checked={currentFilters.type === 'free'}
                onChange={() => updateFilter('type', 'free')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-gray-700 flex items-center space-x-1">
                <Star className="h-3 w-3 text-green-600" />
                <span>Free Templates</span>
              </span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="premium"
                checked={currentFilters.type === 'premium'}
                onChange={() => updateFilter('type', 'premium')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-gray-700 flex items-center space-x-1">
                <Crown className="h-3 w-3 text-purple-600" />
                <span>Premium Templates</span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Categories */}
      <div>
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <Grid3X3 className="h-4 w-4 text-gray-400" />
            <span>Categories</span>
          </h3>
          {expandedSections.categories ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
        
        {expandedSections.categories && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={currentFilters.category === category.slug}
                    onChange={() => updateFilter('category', category.slug)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </span>
                </div>
                {category.templatesCount && (
                  <span className="text-xs text-gray-500">
                    {category.templatesCount}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Styles */}
      <div>
        <button
          onClick={() => toggleSection('styles')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <Palette className="h-4 w-4 text-gray-400" />
            <span>Style</span>
          </h3>
          {expandedSections.styles ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
        
        {expandedSections.styles && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {STYLE_OPTIONS.map((style) => (
              <label key={style} className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentFilters.style === style.toLowerCase()}
                  onChange={() => updateFilter('style', style.toLowerCase())}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                  {style}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Colors */}
      <div>
        <button
          onClick={() => toggleSection('colors')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-sm font-medium text-gray-900">Colors</h3>
          {expandedSections.colors ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
        
        {expandedSections.colors && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={() => updateFilter('color', color.value)}
                className={`group flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                  currentFilters.color === color.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 border-gray-300 ${
                    color.value === 'white' ? 'border-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-xs text-gray-600 mt-1 group-hover:text-gray-900">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Tags */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {[
            'business',
            'logo',
            'typography',
            'quote',
            'vintage',
            'modern',
            'minimal',
            'colorful'
          ].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                params.set('search', tag)
                params.set('page', '1')
                router.push(`/templates?${params.toString()}`)
              }}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {activeFiltersCount === 0 ? (
            'Showing all templates'
          ) : (
            `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`
          )}
        </div>
      </div>
    </div>
  )
}