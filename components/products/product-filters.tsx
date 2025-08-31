'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  X,
  Palette,
  Ruler,
  Tag,
  DollarSign
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductFiltersProps {
  categories: Category[]
  currentFilters: {
    category?: string
    color?: string
    size?: string
    price?: string
    [key: string]: string | undefined
  }
}

const COLORS = [
  { value: 'black', label: 'Black', color: '#000000' },
  { value: 'white', label: 'White', color: '#FFFFFF' },
  { value: 'red', label: 'Red', color: '#EF4444' },
  { value: 'blue', label: 'Blue', color: '#3B82F6' },
  { value: 'green', label: 'Green', color: '#10B981' },
  { value: 'yellow', label: 'Yellow', color: '#F59E0B' },
  { value: 'purple', label: 'Purple', color: '#8B5CF6' },
  { value: 'pink', label: 'Pink', color: '#EC4899' },
  { value: 'gray', label: 'Gray', color: '#6B7280' },
  { value: 'navy', label: 'Navy', color: '#1E3A8A' },
]

const SIZES = [
  { value: 'xs', label: 'XS' },
  { value: 's', label: 'S' },
  { value: 'm', label: 'M' },
  { value: 'l', label: 'L' },
  { value: 'xl', label: 'XL' },
  { value: 'xxl', label: 'XXL' },
  { value: 'xxxl', label: 'XXXL' },
]

const PRICE_RANGES = [
  { value: '0-20', label: 'Under $20' },
  { value: '20-40', label: '$20 - $40' },
  { value: '40-60', label: '$40 - $60' },
  { value: '60-80', label: '$60 - $80' },
  { value: '80-100', label: '$80 - $100' },
  { value: '100+', label: '$100+' },
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

export default function ProductFilters({ categories, currentFilters }: ProductFiltersProps) {
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
    
    router.push(`/products?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams)
    
    // Keep only search and sort parameters
    const search = params.get('search')
    const sort = params.get('sort')
    
    params.clear()
    
    if (search) params.set('search', search)
    if (sort) params.set('sort', sort)
    
    router.push(`/products?${params.toString()}`)
  }

  const hasActiveFilters = Object.keys(currentFilters).some(
    key => currentFilters[key] && !['search', 'sort', 'page'].includes(key)
  )

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Filters</span>
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
            if (!value || ['search', 'sort', 'page'].includes(key)) return null

            let displayValue = value
            if (key === 'category') {
              const category = categories.find(c => c.slug === value)
              displayValue = category?.name || value
            } else if (key === 'color') {
              const color = COLORS.find(c => c.value === value)
              displayValue = color?.label || value
            } else if (key === 'size') {
              const size = SIZES.find(s => s.value === value)
              displayValue = size?.label || value
            } else if (key === 'price') {
              const price = PRICE_RANGES.find(p => p.value === value)
              displayValue = price?.label || value
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
        title="Categories"
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

      {/* Colors */}
      <FilterSection
        title="Colors"
        icon={<Palette className="h-4 w-4 text-gray-400" />}
      >
        <div className="grid grid-cols-3 gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateFilter('color', color.value)}
              className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                currentFilters.color === color.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color.color }}
              />
              <span className="text-xs">{color.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Sizes */}
      <FilterSection
        title="Sizes"
        icon={<Ruler className="h-4 w-4 text-gray-400" />}
      >
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => updateFilter('size', size.value)}
              className={`py-2 px-3 text-center text-sm font-medium rounded-lg border transition-colors ${
                currentFilters.size === size.value
                  ? 'border-primary-600 bg-primary-100 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection
        title="Price Range"
        icon={<DollarSign className="h-4 w-4 text-gray-400" />}
      >
        {PRICE_RANGES.map((price) => (
          <button
            key={price.value}
            onClick={() => updateFilter('price', price.value)}
            className={`block w-full text-left py-2 px-3 rounded-lg transition-colors ${
              currentFilters.price === price.value
                ? 'bg-primary-100 text-primary-700'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {price.label}
          </button>
        ))}
      </FilterSection>
    </div>
  )
}