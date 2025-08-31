'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAnalytics } from '@/lib/analytics'
import {
  Heart,
  Download,
  Share2,
  Eye,
  ShoppingCart,
  User,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Search,
  SortAsc
} from 'lucide-react'

interface Design {
  id: string
  name: string
  description?: string
  previewUrl: string
  tags: string[]
  isPublic: boolean
  createdAt: string
  usageCount: number
  likesCount: number
  user: {
    id: string
    name?: string
    image?: string
  }
  product: {
    id: string
    name: string
    category: {
      name: string
      slug: string
    }
  }
  variant: {
    colorName: string
  }
  _count: {
    likes: number
    orderItems: number
  }
}

interface DesignGalleryProps {
  designs: Design[]
  currentPage: number
  totalPages: number
  totalCount: number
  filters: { [key: string]: string | undefined }
  userId?: string
}

function DesignCard({ design, userId }: { design: Design; userId?: string }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(design._count.likes)
  const [imageLoading, setImageLoading] = useState(true)
  
  const { data: session } = useSession()
  const { trackEvent } = useAnalytics()

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!session?.user) {
      // Redirect to login
      window.location.href = '/auth/signin?callbackUrl=/designs'
      return
    }

    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1)

    try {
      const response = await fetch(`/api/designs/${design.id}/like`, {
        method: newLikedState ? 'POST' : 'DELETE',
      })

      if (!response.ok) {
        // Revert on error
        setIsLiked(!newLikedState)
        setLikesCount(prev => newLikedState ? prev - 1 : prev + 1)
      }

      trackEvent({
        action: newLikedState ? 'design_liked' : 'design_unliked',
        category: 'engagement',
        label: design.name,
        custom_parameters: {
          design_id: design.id,
          creator_id: design.user.id,
        },
      })
    } catch (error) {
      // Revert on error
      setIsLiked(!newLikedState)
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: design.name,
          text: `Check out this amazing design: ${design.name}`,
          url: `${window.location.origin}/designs/${design.id}`,
        })
        
        trackEvent({
          action: 'design_shared',
          category: 'social',
          label: design.name,
          custom_parameters: {
            design_id: design.id,
            share_method: 'native',
          },
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/designs/${design.id}`)
        trackEvent({
          action: 'design_shared',
          category: 'social',
          label: design.name,
          custom_parameters: {
            design_id: design.id,
            share_method: 'clipboard',
          },
        })
      } catch (error) {
        console.error('Failed to copy to clipboard')
      }
    }
  }

  const handleUseDesign = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    trackEvent({
      action: 'design_use_started',
      category: 'conversion',
      label: design.name,
      custom_parameters: {
        design_id: design.id,
        product_id: design.product.id,
      },
    })
  }

  return (
    <div className="group card overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Design Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={design.previewUrl}
          alt={design.name}
          fill
          className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800">
            {design.product.category.name}
          </span>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleLike}
                className={`p-2 rounded-full transition-colors ${
                  isLiked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-white/90 text-gray-600 hover:bg-white hover:text-primary-600 transition-colors"
              >
                <Share2 className="h-4 w-4" />
              </button>
              
              <Link
                href={`/designs/${design.id}`}
                className="p-2 rounded-full bg-white/90 text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Use Design Button */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Link
              href={`/design/customize/${design.id}?product=${design.product.id}`}
              onClick={handleUseDesign}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Use This Design</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Design Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
            {design.name}
          </h3>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Heart className="h-3 w-3" />
            <span>{likesCount}</span>
          </div>
        </div>

        {design.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {design.description}
          </p>
        )}

        {/* Creator Info */}
        <div className="flex items-center space-x-2 mb-3">
          {design.user.image ? (
            <Image
              src={design.user.image}
              alt={design.user.name || 'Creator'}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-gray-500" />
            </div>
          )}
          <span className="text-xs text-gray-600">
            by {design.user.name || 'Anonymous'}
          </span>
        </div>

        {/* Tags */}
        {design.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {design.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
              >
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </span>
            ))}
            {design.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{design.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{design.usageCount}</span>
            </span>
            <span className="flex items-center space-x-1">
              <ShoppingCart className="h-3 w-3" />
              <span>{design._count.orderItems}</span>
            </span>
          </div>
          <span className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(design.createdAt).toLocaleDateString()}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function SearchAndSort({ 
  filters,
  totalCount 
}: {
  filters: { [key: string]: string | undefined }
  totalCount: number
}) {
  const router = useRouter()

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'sort' && key !== 'page') {
        params.set(key, value)
      }
    })
    
    if (sort !== 'newest') {
      params.set('sort', sort)
    }
    
    router.push(`/designs?${params.toString()}`)
  }

  return (
    <div className="flex flex-col space-y-4 mb-6
                    sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <p className="text-sm text-gray-600">
        {totalCount.toLocaleString()} design{totalCount !== 1 ? 's' : ''} found
      </p>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <SortAsc className="h-4 w-4 text-gray-400" />
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => handleSortChange(e.target.value)}
            className="input text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Used</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function Pagination({ currentPage, totalPages, filters }: { 
  currentPage: number
  totalPages: number
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
    
    router.push(`/designs?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </button>
      
      <div className="flex items-center space-x-1">
        {[...Array(Math.min(7, totalPages))].map((_, i) => {
          let page = currentPage - 3 + i
          if (totalPages <= 7) {
            page = i + 1
          } else if (currentPage <= 4) {
            page = i + 1
          } else if (currentPage >= totalPages - 3) {
            page = totalPages - 6 + i
          }
          
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
  )
}

export default function DesignGallery({ 
  designs, 
  currentPage, 
  totalPages, 
  totalCount,
  filters, 
  userId 
}: DesignGalleryProps) {
  if (designs.length === 0) {
    return (
      <div className="text-center py-16">
        <Search className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          No designs found
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {filters.search 
            ? `No designs match "${filters.search}". Try adjusting your search or filters.`
            : 'No designs match your current filters. Try adjusting your selection.'
          }
        </p>
        <div className="space-x-4">
          <Link href="/designs" className="btn-primary">
            View All Designs
          </Link>
          <Link href="/design/create" className="btn-secondary">
            Create Your Own
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Search and Sort */}
      <SearchAndSort filters={filters} totalCount={totalCount} />

      {/* Designs Grid */}
      <div className="grid grid-cols-1 gap-6
                      sm:grid-cols-2
                      lg:grid-cols-3
                      xl:grid-cols-4">
        {designs.map((design) => (
          <DesignCard key={design.id} design={design} userId={userId} />
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