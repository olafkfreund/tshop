'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  X,
  Tag,
  Palette,
  Grid3x3,
  Sparkles,
  Search
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface DesignFiltersProps {
  categories: Category[]
  currentFilters: {
    category?: string
    style?: string
    color?: string
    search?: string
    [key: string]: string | undefined
  }
}

const DESIGN_STYLES = [
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'modern', label: 'Modern' },
  { value: 'retro', label: 'Retro' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'typography', label: 'Typography' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'photography', label: 'Photography' },
  { value: 'artistic', label: 'Artistic' },
  { value: 'cute', label: 'Cute' },
  { value: 'cool', label: 'Cool' },
  { value: 'funny', label: 'Funny' },
  { value: 'inspirational', label: 'Inspirational' },
]

const COLOR_PALETTES = [
  { value: 'monochrome', label: 'Monochrome', colors: ['#000000', '#FFFFFF', '#808080'] },
  { value: 'colorful', label: 'Colorful', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'] },
  { value: 'pastel', label: 'Pastel', colors: ['#FFB3E6', '#B3E5FC', '#C8E6C9', '#FFCC80'] },
  { value: 'neon', label: 'Neon', colors: ['#FF073A', '#39FF14', '#FF073A', '#FFFF33'] },
  { value: 'earth', label: 'Earth Tones', colors: ['#8B4513', '#DEB887', '#CD853F', '#D2691E'] },
  { value: 'ocean', label: 'Ocean', colors: ['#006994', '#47B5FF', '#DDE6ED', '#9BB0C1'] },
  { value: 'sunset', label: 'Sunset', colors: ['#FF6B35', '#F7931E', '#FFD23F', '#FF5722'] },
  { value: 'forest', label: 'Forest', colors: ['#355E3B', '#228B22', '#90EE90', '#98FB98'] },
]

interface FilterSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, icon, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

export default function DesignFilters({ categories, currentFilters }: DesignFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || '')
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (currentFilters[key] === value) {
      // Remove filter if clicking the same value
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    // Reset to first page when filtering
    params.set('page', '1')
    
    router.push(`/designs?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    } else {
      params.delete('search')
    }
    
    params.set('page', '1')
    router.push(`/designs?${params.toString()}`)
  }

  const clearSearch = () => {
    setSearchTerm('')
    const params = new URLSearchParams(searchParams)
    params.delete('search')
    router.push(`/designs?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams)
    params.clear()
    setSearchTerm('')
    router.push('/designs')
  }

  const hasActiveFilters = Object.keys(currentFilters).some(
    key => currentFilters[key] && !['sort', 'page'].includes(key)
  )

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search designs..."
            className="input pl-10 pr-10 w-full"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </form>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Active Filters</span>
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(currentFilters).map(([key, value]) => {
            if (!value || ['sort', 'page'].includes(key)) return null

            let displayValue = value
            if (key === 'category') {
              const category = categories.find(c => c.slug === value)
              displayValue = category?.name || value
            } else if (key === 'style') {
              const style = DESIGN_STYLES.find(s => s.value === value)
              displayValue = style?.label || value
            } else if (key === 'color') {
              const color = COLOR_PALETTES.find(c => c.value === value)
              displayValue = color?.label || value
            }

            return (
              <button
                key={`${key}-${value}`}
                onClick={() => updateFilter(key, value)}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full hover:bg-primary-200 transition-colors"
              >
                <span>{displayValue}</span>
                <X className="h-3 w-3" />
              </button>
            )
          })}
        </div>
      )}

      {/* Categories */}
      <FilterSection
        title="Product Categories"
        icon={<Tag className="h-4 w-4 text-gray-400" />}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => updateFilter('category', category.slug)}
            className={`block w-full text-left py-2 px-3 rounded-lg transition-colors ${
              currentFilters.category === category.slug
                ? 'bg-primary-100 text-primary-700'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </FilterSection>

      {/* Design Styles */}
      <FilterSection
        title="Design Styles"
        icon={<Sparkles className="h-4 w-4 text-gray-400" />}
      >
        <div className="grid grid-cols-2 gap-2">
          {DESIGN_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => updateFilter('style', style.value)}
              className={`py-2 px-3 text-left text-sm rounded-lg transition-colors ${
                currentFilters.style === style.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Color Palettes */}
      <FilterSection
        title="Color Palettes"
        icon={<Palette className="h-4 w-4 text-gray-400" />}
      >
        {COLOR_PALETTES.map((palette) => (
          <button
            key={palette.value}
            onClick={() => updateFilter('color', palette.value)}
            className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
              currentFilters.color === palette.value
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-200'
                : 'hover:bg-gray-100 text-gray-700 border-2 border-transparent'
            }`}
          >
            <div className="flex space-x-1">
              {palette.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{palette.label}</span>
          </button>
        ))}
      </FilterSection>

      {/* Popular Tags */}
      <FilterSection
        title="Popular Tags"
        icon={<Grid3x3 className="h-4 w-4 text-gray-400" />}
        defaultOpen={false}
      >
        <div className="flex flex-wrap gap-2">
          {[
            'trending', 'new', 'bestseller', 'exclusive', 'limited', 
            'seasonal', 'holiday', 'birthday', 'wedding', 'corporate'
          ].map((tag) => (
            <button
              key={tag}
              onClick={() => updateFilter('style', tag)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                currentFilters.style === tag
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  )
}