'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Filter, 
  Search, 
  X, 
  TrendingUp, 
  Clock, 
  Heart, 
  Eye,
  Palette,
  Tag,
  User
} from 'lucide-react'

interface GalleryFiltersProps {
  searchParams: {
    category?: string
    style?: string
    sort?: string
    search?: string
  }
}

const PRODUCT_CATEGORIES = {
  'all': 'All Products',
  'tshirt': 'T-Shirts', 
  'cap': 'Caps',
  'tote_bag': 'Tote Bags'
}

const STYLES = [
  'minimalist',
  'vintage', 
  'modern',
  'artistic',
  'cartoon',
  'realistic',
  'abstract',
  'geometric',
  'nature',
  'urban'
]

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'recent', label: 'Most Recent', icon: Clock },
  { value: 'liked', label: 'Most Liked', icon: Heart },
  { value: 'viewed', label: 'Most Viewed', icon: Eye }
]

const POPULAR_TAGS = [
  'nature', 'abstract', 'geometric', 'vintage', 'modern',
  'minimalist', 'colorful', 'black-white', 'artistic', 'creative'
]

export default function GalleryFilters({ searchParams }: GalleryFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category || 'all')
  const [selectedStyle, setSelectedStyle] = useState(searchParams.style || '')
  const [selectedSort, setSelectedSort] = useState(searchParams.sort || 'trending')
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '')
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    style: true,
    tags: false,
    advanced: false
  })

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(currentSearchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`/gallery?${params.toString()}`)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    updateFilters({ category, style: selectedStyle, sort: selectedSort, search: searchQuery })
  }

  const handleStyleChange = (style: string) => {
    const newStyle = style === selectedStyle ? '' : style
    setSelectedStyle(newStyle)
    updateFilters({ category: selectedCategory, style: newStyle, sort: selectedSort, search: searchQuery })
  }

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort)
    updateFilters({ category: selectedCategory, style: selectedStyle, sort, search: searchQuery })
  }

  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    updateFilters({ category: selectedCategory, style: selectedStyle, sort: selectedSort, search })
  }

  const clearAllFilters = () => {
    setSelectedCategory('all')
    setSelectedStyle('')
    setSelectedSort('trending')
    setSearchQuery('')
    router.push('/gallery')
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const hasActiveFilters = selectedCategory !== 'all' || selectedStyle || searchQuery || selectedSort !== 'trending'

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 sticky top-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Search Designs</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
        <div className="space-y-2">
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedSort === option.value
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Product Category */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3"
        >
          <span className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Product Type
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${expandedSections.category ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.category && (
          <div className="space-y-2">
            {Object.entries(PRODUCT_CATEGORIES).map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleCategoryChange(value)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategory === value
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Style */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('style')}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3"
        >
          <span className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Design Style
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${expandedSections.style ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.style && (
          <div className="flex flex-wrap gap-2">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => handleStyleChange(style)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedStyle === style
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Tags */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('tags')}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3"
        >
          <span className="flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Popular Tags
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${expandedSections.tags ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.tags && (
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleSearchChange(tag)}
                className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Active Filters:</div>
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
                {PRODUCT_CATEGORIES[selectedCategory as keyof typeof PRODUCT_CATEGORIES]}
                <button
                  onClick={() => handleCategoryChange('all')}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {selectedStyle && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                {selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)}
                <button
                  onClick={() => handleStyleChange(selectedStyle)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {searchQuery && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                "{searchQuery}"
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {selectedSort !== 'trending' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                {SORT_OPTIONS.find(opt => opt.value === selectedSort)?.label}
                <button
                  onClick={() => handleSortChange('trending')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Community Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <User className="h-4 w-4 mr-2" />
          Community Stats
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total Designs:</span>
            <span className="font-medium">1,247</span>
          </div>
          <div className="flex justify-between">
            <span>Active Creators:</span>
            <span className="font-medium">342</span>
          </div>
          <div className="flex justify-between">
            <span>This Week:</span>
            <span className="font-medium">89 new</span>
          </div>
        </div>
      </div>
    </div>
  )
}