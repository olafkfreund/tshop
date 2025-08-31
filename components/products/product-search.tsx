'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'
import { Search, X } from 'lucide-react'

interface ProductSearchProps {
  initialValue?: string
  placeholder?: string
  className?: string
}

export default function ProductSearch({ 
  initialValue = '', 
  placeholder = 'Search products...',
  className = ''
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [isSearching, setIsSearching] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { trackSearchPerformed } = useAnalytics()

  useEffect(() => {
    setSearchTerm(initialValue)
  }, [initialValue])

  const handleSearch = async (term: string) => {
    if (term === searchTerm) return

    setIsSearching(true)
    setSearchTerm(term)

    // Build new search params
    const params = new URLSearchParams(searchParams)
    
    if (term.trim()) {
      params.set('search', term.trim())
      params.set('page', '1') // Reset to first page
    } else {
      params.delete('search')
    }

    // Navigate with new params
    router.push(`/products?${params.toString()}`)

    // Track search
    if (term.trim()) {
      trackSearchPerformed(term.trim(), 0) // Result count will be updated by the server
    }

    setIsSearching(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchTerm)
  }

  const clearSearch = () => {
    setSearchTerm('')
    handleSearch('')
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== initialValue) {
        handleSearch(searchTerm)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, initialValue])

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="input pl-10 pr-10 w-full"
          disabled={isSearching}
        />
        
        {(searchTerm || isSearching) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            ) : (
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search suggestions could be added here */}
      {searchTerm && !isSearching && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Placeholder for search suggestions */}
          <div className="p-3 text-sm text-gray-500">
            Press Enter to search for "{searchTerm}"
          </div>
        </div>
      )}
    </form>
  )
}