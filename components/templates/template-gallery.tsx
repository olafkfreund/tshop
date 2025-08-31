'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'
import {
  Play,
  Heart,
  Download,
  Eye,
  User,
  Crown,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description?: string
  imageUrl: string
  previewUrl?: string
  category: {
    name: string
    slug: string
  }
  creator: {
    id: string
    name?: string
    image?: string
  }
  isPremium: boolean
  usageCount: number
  weeklyUsage: number
  tags: string[]
  createdAt: Date
  _count: {
    designs: number
  }
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

interface TemplateGalleryProps {
  templates: Template[]
  currentPage: number
  totalPages: number
  totalCount: number
  filters: SearchParams
  userId?: string
}

export default function TemplateGallery({
  templates,
  currentPage,
  totalPages,
  totalCount,
  filters,
  userId
}: TemplateGalleryProps) {
  const [likedTemplates, setLikedTemplates] = useState<Set<string>>(new Set())
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const router = useRouter()
  const { trackEvent } = useAnalytics()

  const handleTemplateClick = (template: Template) => {
    trackEvent({
      action: 'template_viewed',
      category: 'templates',
      custom_parameters: {
        template_id: template.id,
        template_name: template.name,
        category: template.category.slug,
        is_premium: template.isPremium,
      },
    })

    router.push(`/editor?template=${template.id}`)
  }

  const handleTemplatePreview = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation()
    setPreviewTemplate(template)
    
    trackEvent({
      action: 'template_previewed',
      category: 'templates',
      custom_parameters: {
        template_id: template.id,
        template_name: template.name,
      },
    })
  }

  const handleTemplateLike = async (e: React.MouseEvent, template: Template) => {
    e.stopPropagation()
    
    if (!userId) {
      router.push('/auth/signin?callbackUrl=/templates')
      return
    }

    const isLiked = likedTemplates.has(template.id)
    
    try {
      const response = await fetch(`/api/templates/${template.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      })

      if (response.ok) {
        const newLikedTemplates = new Set(likedTemplates)
        if (isLiked) {
          newLikedTemplates.delete(template.id)
        } else {
          newLikedTemplates.add(template.id)
        }
        setLikedTemplates(newLikedTemplates)

        trackEvent({
          action: isLiked ? 'template_unliked' : 'template_liked',
          category: 'templates',
          custom_parameters: {
            template_id: template.id,
            template_name: template.name,
          },
        })
      }
    } catch (error) {
      console.error('Failed to like template:', error)
    }
  }

  const formatUsageCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const buildPaginationUrl = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      }
    })
    params.set('page', page.toString())
    return `/templates?${params.toString()}`
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Play className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
        <p className="text-gray-600 mb-6">
          {filters.search || filters.category || filters.style || filters.color 
            ? 'Try adjusting your filters to see more results.'
            : 'Check back later for new templates.'
          }
        </p>
        {(filters.search || filters.category || filters.style || filters.color) && (
          <button
            onClick={() => router.push('/templates')}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{((currentPage - 1) * 16) + 1}</span> to{' '}
          <span className="font-medium">
            {Math.min(currentPage * 16, totalCount)}
          </span>{' '}
          of <span className="font-medium">{totalCount.toLocaleString()}</span> templates
        </div>

        {/* Sort Options */}
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => {
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([key, value]) => {
              if (value && value !== 'all' && key !== 'sort') {
                params.set(key, value)
              }
            })
            if (e.target.value !== 'newest') {
              params.set('sort', e.target.value)
            }
            params.set('page', '1')
            router.push(`/templates?${params.toString()}`)
          }}
          className="input text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="popular">Most Popular</option>
          <option value="trending">Trending</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-6
                      sm:grid-cols-2
                      lg:grid-cols-3
                      xl:grid-cols-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
            onClick={() => handleTemplateClick(template)}
          >
            {/* Template Image */}
            <div className="relative aspect-square overflow-hidden rounded-t-lg">
              <img
                src={template.imageUrl}
                alt={template.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2">
                  <button
                    onClick={(e) => handleTemplatePreview(e, template)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    title="Preview template"
                  >
                    <Eye className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => handleTemplateLike(e, template)}
                    className={`p-2 rounded-full shadow-lg transition-colors ${
                      likedTemplates.has(template.id)
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title={likedTemplates.has(template.id) ? 'Unlike template' : 'Like template'}
                  >
                    <Heart className={`h-4 w-4 ${likedTemplates.has(template.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Premium Badge */}
              {template.isPremium && (
                <div className="absolute top-2 right-2">
                  <div className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <Crown className="h-3 w-3" />
                    <span>Premium</span>
                  </div>
                </div>
              )}

              {/* Usage Count */}
              <div className="absolute bottom-2 left-2">
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                  <Download className="h-3 w-3" />
                  <span>{formatUsageCount(template.usageCount)}</span>
                </div>
              </div>
            </div>

            {/* Template Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                {template.name}
              </h3>
              
              {template.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              {/* Creator & Category */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {template.creator.image ? (
                    <img
                      src={template.creator.image}
                      alt={template.creator.name || 'Creator'}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-gray-500" />
                    </div>
                  )}
                  <span className="text-xs text-gray-600">
                    {template.creator.name || 'Anonymous'}
                  </span>
                </div>
                
                <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                  {template.category.name}
                </span>
              </div>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{template.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          {/* Previous Button */}
          {currentPage > 1 ? (
            <a
              href={buildPaginationUrl(currentPage - 1)}
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </a>
          ) : (
            <div className="flex items-center space-x-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </div>
          )}

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (currentPage <= 4) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = currentPage - 3 + i
              }

              return (
                <a
                  key={pageNum}
                  href={buildPaginationUrl(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pageNum === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </a>
              )
            })}
          </div>

          {/* Next Button */}
          {currentPage < totalPages ? (
            <a
              href={buildPaginationUrl(currentPage + 1)}
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </a>
          ) : (
            <div className="flex items-center space-x-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {previewTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    by {previewTemplate.creator.name || 'Anonymous'}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <img
                  src={previewTemplate.previewUrl || previewTemplate.imageUrl}
                  alt={previewTemplate.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {previewTemplate.description && (
                <p className="text-gray-700 mb-4">
                  {previewTemplate.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Download className="h-4 w-4" />
                    <span>{formatUsageCount(previewTemplate.usageCount)} uses</span>
                  </div>
                  <span className="text-primary-600">
                    {previewTemplate.category.name}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setPreviewTemplate(null)
                    handleTemplateClick(previewTemplate)
                  }}
                  className="btn-primary"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}