'use client'

import { useState, useEffect } from 'react'
import { useAnalytics } from '@/lib/analytics'
import { Heart, Eye, Share2, Wand2, User, Calendar, Tag } from 'lucide-react'
import SocialShare from '@/components/social/social-share'

interface GalleryDesign {
  id: string
  designName: string
  description?: string
  imageUrl: string
  prompt: string
  productCategory: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
  style?: string
  tags?: string[]
  isPublic: boolean
  createdAt: string
  likes: number
  views: number
  authorName?: string
}

interface GalleryGridProps {
  searchParams: {
    category?: string
    style?: string
    sort?: string
    search?: string
  }
}

export default function GalleryGrid({ searchParams }: GalleryGridProps) {
  const [designs, setDesigns] = useState<GalleryDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [likedDesigns, setLikedDesigns] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState(searchParams.sort || 'trending')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const { trackEvent } = useAnalytics()

  useEffect(() => {
    loadGalleryDesigns()
  }, [searchParams, sortBy])

  const loadGalleryDesigns = async (offset = 0) => {
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams()
      if (searchParams.category && searchParams.category !== 'all') {
        params.set('category', searchParams.category.toUpperCase())
      }
      if (searchParams.style) {
        params.set('style', searchParams.style)
      }
      if (searchParams.search) {
        params.set('search', searchParams.search)
      }
      params.set('sort', sortBy)
      params.set('limit', '20')
      params.set('offset', offset.toString())

      const response = await fetch(`/api/gallery?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        if (offset === 0) {
          setDesigns(data.data.designs)
        } else {
          setDesigns(prev => [...prev, ...data.data.designs])
        }
        setHasMore(data.data.hasMore)

        // Track gallery view
        trackEvent({
          action: 'gallery_viewed',
          category: 'engagement',
          custom_parameters: {
            filter_category: searchParams.category,
            filter_style: searchParams.style,
            sort_by: sortBy,
            result_count: data.data.designs.length
          }
        })
      } else {
        console.error('Failed to load gallery:', data.error)
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    loadGalleryDesigns(designs.length)
  }

  const handleLike = async (designId: string) => {
    try {
      const isLiked = likedDesigns.has(designId)
      const action = isLiked ? 'unlike' : 'like'

      const response = await fetch('/api/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId, action })
      })

      if (response.ok) {
        setLikedDesigns(prev => {
          const newSet = new Set(prev)
          if (isLiked) {
            newSet.delete(designId)
          } else {
            newSet.add(designId)
          }
          return newSet
        })

        setDesigns(prev => prev.map(design => 
          design.id === designId 
            ? { ...design, likes: design.likes + (isLiked ? -1 : 1) }
            : design
        ))

        // Track like action
        trackEvent({
          action: isLiked ? 'design_unliked' : 'design_liked',
          category: 'engagement',
          custom_parameters: {
            design_id: designId,
            design_category: designs.find(d => d.id === designId)?.productCategory
          }
        })
      }
    } catch (error) {
      console.error('Error updating like:', error)
    }
  }

  const handleUsePrompt = (prompt: string, productCategory: string, designName: string) => {
    trackEvent({
      action: 'gallery_design_used',
      category: 'conversion',
      custom_parameters: {
        source_design_name: designName,
        product_category: productCategory,
        prompt_length: prompt.length
      }
    })

    const params = new URLSearchParams({
      prompt,
      category: productCategory
    })
    window.location.href = `/ai-design?${params.toString()}`
  }

  const handleViewDesign = async (design: GalleryDesign) => {
    // Track view
    await fetch('/api/gallery', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId: design.id, action: 'view' })
    })

    // Update local state
    setDesigns(prev => prev.map(d => 
      d.id === design.id ? { ...d, views: d.views + 1 } : d
    ))

    trackEvent({
      action: 'gallery_design_viewed',
      category: 'engagement',
      custom_parameters: {
        design_id: design.id,
        design_name: design.designName,
        author: design.authorName
      }
    })
  }

  if (loading) {
    return <GalleryLoadingSkeleton />
  }

  if (designs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No designs found</h3>
        <p className="text-gray-600 mb-6">Try adjusting your filters or be the first to share a design!</p>
        <a 
          href="/ai-design" 
          className="btn-primary inline-flex items-center space-x-2"
        >
          <Wand2 className="h-4 w-4" />
          <span>Create Your First Design</span>
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort and View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Showing {designs.length} design{designs.length !== 1 ? 's' : ''}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="trending">Trending</option>
            <option value="recent">Most Recent</option>
            <option value="liked">Most Liked</option>
            <option value="viewed">Most Viewed</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" 
        : "space-y-6"
      }>
        {designs.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            viewMode={viewMode}
            isLiked={likedDesigns.has(design.id)}
            onLike={() => handleLike(design.id)}
            onUsePrompt={() => handleUsePrompt(design.prompt, design.productCategory, design.designName)}
            onView={() => handleViewDesign(design)}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary px-8 py-3"
          >
            {loadingMore ? 'Loading...' : 'Load More Designs'}
          </button>
        </div>
      )}
    </div>
  )
}

interface DesignCardProps {
  design: GalleryDesign
  viewMode: 'grid' | 'list'
  isLiked: boolean
  onLike: () => void
  onUsePrompt: () => void
  onView: () => void
}

function DesignCard({ design, viewMode, isLiked, onLike, onUsePrompt, onView }: DesignCardProps) {
  const productNames = {
    TSHIRT: 'T-Shirt',
    CAP: 'Cap', 
    TOTE_BAG: 'Tote Bag'
  }

  const getStyleBadgeColor = (style?: string) => {
    const styles = {
      minimalist: 'bg-gray-100 text-gray-700',
      vintage: 'bg-amber-100 text-amber-700',
      modern: 'bg-blue-100 text-blue-700', 
      artistic: 'bg-purple-100 text-purple-700',
      cartoon: 'bg-pink-100 text-pink-700',
      realistic: 'bg-green-100 text-green-700'
    }
    return styles[style as keyof typeof styles] || 'bg-blue-100 text-blue-700'
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-6">
        <div className="flex space-x-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-lg overflow-hidden cursor-pointer" onClick={onView}>
              <img
                src={design.imageUrl}
                alt={design.designName}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary-600" onClick={onView}>
                  {design.designName}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <User className="h-4 w-4" />
                  <span>{design.authorName || 'Anonymous'}</span>
                  <Calendar className="h-4 w-4 ml-2" />
                  <span>{new Date(design.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {design.style && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStyleBadgeColor(design.style)}`}>
                    {design.style}
                  </span>
                )}
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {productNames[design.productCategory]}
                </span>
              </div>
            </div>
            
            {design.description && (
              <p className="text-gray-700 mb-4 line-clamp-2">{design.description}</p>
            )}

            {design.tags && design.tags.length > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="h-4 w-4 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {design.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                  {design.tags.length > 4 && (
                    <span className="text-xs text-gray-500">+{design.tags.length - 4} more</span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{design.views}</span>
                </div>
                <button
                  onClick={onLike}
                  className={`flex items-center space-x-1 transition-colors ${
                    isLiked ? 'text-red-500' : 'hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{design.likes}</span>
                </button>
                
                <SocialShare
                  type="design"
                  item={{
                    id: design.id,
                    name: design.designName,
                    imageUrl: design.imageUrl,
                    description: design.description,
                    creator: { name: design.authorName },
                    product: { name: productNames[design.productCategory], type: design.productCategory }
                  }}
                />
              </div>
              
              <button
                onClick={onUsePrompt}
                className="btn-primary text-sm px-4 py-2 flex items-center space-x-2"
              >
                <Wand2 className="h-4 w-4" />
                <span>Use This Design</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="aspect-square relative group cursor-pointer" onClick={onView}>
        <img
          src={design.imageUrl}
          alt={design.designName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity">
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <SocialShare
              type="design"
              item={{
                id: design.id,
                name: design.designName,
                imageUrl: design.imageUrl,
                description: design.description,
                creator: { name: design.authorName },
                product: { name: productNames[design.productCategory], type: design.productCategory }
              }}
              className="!p-1.5 !bg-white !rounded-full !shadow-md"
            />
            <button
              onClick={(e) => { e.stopPropagation(); onLike() }}
              className={`p-1.5 rounded-full shadow-md transition-colors ${
                isLiked ? 'bg-red-500 text-white' : 'bg-white hover:bg-red-50 text-gray-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate cursor-pointer hover:text-primary-600" onClick={onView}>
              {design.designName}
            </h3>
            <p className="text-sm text-gray-600">by {design.authorName || 'Anonymous'}</p>
          </div>
          {design.style && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStyleBadgeColor(design.style)}`}>
              {design.style}
            </span>
          )}
        </div>
        
        {design.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{design.description}</p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {design.views}
            </div>
            <div className="flex items-center gap-1">
              <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
              {design.likes}
            </div>
          </div>
          <span className="text-xs font-medium">{productNames[design.productCategory]}</span>
        </div>
        
        <button
          onClick={onUsePrompt}
          className="btn-primary w-full text-sm flex items-center justify-center gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Use This Design
        </button>
      </div>
    </div>
  )
}

function GalleryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg aspect-square mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex items-center space-x-4">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-full mt-3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}