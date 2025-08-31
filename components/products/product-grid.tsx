'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { useAnalytics } from '@/lib/analytics'
import {
  Package,
  Heart,
  ShoppingCart,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react'

interface Product {
  id: string
  name: string
  slug?: string
  description?: string
  basePrice: string
  images: Array<{ url: string; alt?: string }>
  variants: Array<{ price: string }>
  category: { name: string; slug: string }
  _count: {
    orderItems: number
    designs: number
  }
}

interface ProductGridProps {
  products: Product[]
  currentPage: number
  totalPages: number
  filters: { [key: string]: string | undefined }
}

function ProductCard({ product }: { product: Product }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  
  const { trackProductViewed, trackEvent } = useAnalytics()
  
  const primaryImage = product.images[0]
  const lowestPrice = product.variants[0]?.price || product.basePrice
  const isPopular = product._count.orderItems > 10
  const hasCustomDesigns = product._count.designs > 0

  const handleProductView = () => {
    trackProductViewed(product.id, product.name, product.category.name)
  }

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsFavorite(!isFavorite)
    
    trackEvent({
      action: isFavorite ? 'remove_from_favorites' : 'add_to_favorites',
      category: 'engagement',
      label: product.name,
      custom_parameters: {
        product_id: product.id,
      },
    })
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // This would open a quick add modal or redirect to product page
    trackEvent({
      action: 'quick_add_attempt',
      category: 'ecommerce',
      label: product.name,
      custom_parameters: {
        product_id: product.id,
      },
    })
  }

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      onClick={handleProductView}
      className="group block card overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <>
            <img
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
            />
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {isPopular && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <Star className="h-3 w-3 mr-1" />
              Popular
            </span>
          )}
          {hasCustomDesigns && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Designs
            </span>
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-full transition-colors ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleQuickAdd}
              className="p-2 rounded-full bg-white/90 text-gray-600 hover:bg-white hover:text-primary-600 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
            
            <button
              className="p-2 rounded-full bg-white/90 text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick View Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="p-4">
            <button className="w-full bg-white text-gray-900 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              Quick View
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <div className="mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {product.category.name}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium text-gray-900">
              From {formatPrice(Number(lowestPrice))}
            </p>
            {product._count.designs > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {product._count.designs} custom design{product._count.designs !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">(24)</span>
          </div>
        </div>

        {/* Color Options Preview */}
        <div className="mt-4 flex items-center space-x-2">
          <span className="text-xs text-gray-500">Colors:</span>
          <div className="flex space-x-1">
            {['#000000', '#FFFFFF', '#EF4444', '#3B82F6'].map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
            ))}
            <span className="text-xs text-gray-500">+6</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function Pagination({ currentPage, totalPages, filters }: { 
  currentPage: number; 
  totalPages: number; 
  filters: { [key: string]: string | undefined }
}) {
  const router = useRouter()

  const changePage = (page: number) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value)
      }
    })
    
    if (page > 1) {
      params.set('page', page.toString())
    }
    
    router.push(`/products?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-12">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const page = currentPage - 2 + i
            if (page < 1 || page > totalPages) return null
            
            return (
              <button
                key={page}
                onClick={() => changePage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>
        
        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  )
}

export default function ProductGrid({ products, currentPage, totalPages, filters }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          No products found
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {filters.search 
            ? `No products match "${filters.search}". Try adjusting your search or filters.`
            : 'No products match your current filters. Try adjusting your selection.'
          }
        </p>
        <div className="space-x-4">
          <Link href="/products" className="btn-primary">
            View All Products
          </Link>
          <Link href="/design/create" className="btn-secondary">
            Create Custom Design
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, products.length)} of {products.length} results
        </p>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">View:</span>
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <div className="grid grid-cols-2 gap-1 w-4 h-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-current w-1 h-1 rounded-sm" />
              ))}
            </div>
          </button>
          <button className="p-1 text-primary-600">
            <div className="grid grid-cols-3 gap-1 w-4 h-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-current w-1 h-1 rounded-sm" />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6
                      sm:grid-cols-2
                      lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        filters={filters} 
      />
    </div>
  )
}