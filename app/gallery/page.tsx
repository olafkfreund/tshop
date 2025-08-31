'use client'

import { useState, useEffect } from 'react'
import { ProductCategory } from '@/types'
import Header from '@/components/navigation/header'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { Heart, Eye, Share2, Filter, Grid, List, Wand2 } from 'lucide-react'

interface GalleryDesign {
  id: string
  designName: string
  description?: string
  imageUrl: string
  prompt: string
  productCategory: ProductCategory
  style?: string
  tags?: string[]
  isPublic: boolean
  createdAt: string
  likes: number
  views: number
  authorName?: string
}

export default function GalleryPage() {
  const [designs, setDesigns] = useState<GalleryDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [likedDesigns, setLikedDesigns] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadGalleryDesigns()
  }, [selectedCategory, selectedStyle])

  const loadGalleryDesigns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'ALL') {
        params.set('category', selectedCategory)
      }
      if (selectedStyle) {
        params.set('style', selectedStyle)
      }
      params.set('limit', '20')

      const response = await fetch(`/api/gallery?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setDesigns(data.data.designs)
      } else {
        console.error('Failed to load gallery:', data.error)
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setLoading(false)
    }
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
      }
    } catch (error) {
      console.error('Error updating like:', error)
    }
  }

  const handleUsePrompt = (prompt: string, productCategory: ProductCategory) => {
    const params = new URLSearchParams({
      prompt,
      category: productCategory
    })
    window.location.href = `/design?${params.toString()}`
  }

  const handleShare = (design: GalleryDesign) => {
    if (navigator.share) {
      navigator.share({
        title: `Check out "${design.designName}" on TShop`,
        text: design.description || `AI-generated ${design.productCategory.toLowerCase()} design`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const styles = ['minimalist', 'vintage', 'modern', 'artistic', 'cartoon', 'realistic']

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 sm:text-5xl">Design Gallery</h1>
            <p className="text-xl opacity-90 mb-8">
              Discover amazing AI-generated designs from our community. Get inspired and create your own masterpiece!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-600" />
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'ALL')}
                className="input text-sm"
              >
                <option value="ALL">All Products</option>
                {Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>

              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="input text-sm"
              >
                <option value="">All Styles</option>
                {styles.map(style => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No designs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or be the first to share a design!</p>
            <a href="/design" className="btn-primary inline-flex items-center">
              <Wand2 className="h-4 w-4 mr-2" />
              Create Design
            </a>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-6"}>
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                viewMode={viewMode}
                isLiked={likedDesigns.has(design.id)}
                onLike={() => handleLike(design.id)}
                onUsePrompt={() => handleUsePrompt(design.prompt, design.productCategory)}
                onShare={() => handleShare(design)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface DesignCardProps {
  design: GalleryDesign
  viewMode: 'grid' | 'list'
  isLiked: boolean
  onLike: () => void
  onUsePrompt: () => void
  onShare: () => void
}

function DesignCard({ design, viewMode, isLiked, onLike, onUsePrompt, onShare }: DesignCardProps) {
  const getStyleBadgeClass = (style: string): string => {
    const styles = {
      minimalist: 'bg-gray-100 text-gray-700',
      vintage: 'bg-amber-100 text-amber-700',
      modern: 'bg-blue-100 text-blue-700',
      artistic: 'bg-purple-100 text-purple-700',
      cartoon: 'bg-pink-100 text-pink-700',
      realistic: 'bg-green-100 text-green-700',
    }
    return styles[style as keyof typeof styles] || styles.modern
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="aspect-square relative group">
        <img
          src={design.imageUrl}
          alt={design.designName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity">
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onShare}
              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={onLike}
              className={`p-1.5 rounded-full shadow-md ${
                isLiked ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-600'
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
            <h3 className="font-semibold text-gray-900 truncate">{design.designName}</h3>
            <p className="text-sm text-gray-600">by {design.authorName}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStyleBadgeClass(design.style || 'modern')}`}>
            {design.style}
          </span>
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
          <span className="text-xs">{PRODUCT_CATEGORIES[design.productCategory]}</span>
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