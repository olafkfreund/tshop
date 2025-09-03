'use client'

import { useState } from 'react'
import { ProductCategory } from '@prisma/client'
import { Download, Share2, Heart, Edit3, ShoppingCart, Upload } from 'lucide-react'
import EnhancedPreview from '@/components/3d-preview/enhanced-preview'
import SocialShare from '@/components/social/social-share'
import { useAnalytics } from '@/lib/analytics'

interface DesignPreviewProps {
  imageUrl: string
  productCategory: ProductCategory
  designId?: string
  prompt?: string
  onEdit?: () => void
  onAddToCart?: () => void
}

const PRODUCT_MOCKUPS = {
  TSHIRT: {
    name: 'T-Shirt',
    mockupUrl: '/images/mockups/tshirt-mockup.png',
    designPosition: { x: '50%', y: '35%', width: '45%', height: 'auto' },
  },
  CAP: {
    name: 'Cap', 
    mockupUrl: '/images/mockups/cap-mockup.png',
    designPosition: { x: '50%', y: '25%', width: '35%', height: 'auto' },
  },
  TOTE_BAG: {
    name: 'Tote Bag',
    mockupUrl: '/images/mockups/tote-mockup.png', 
    designPosition: { x: '50%', y: '40%', width: '40%', height: 'auto' },
  },
}

export default function DesignPreview({ 
  imageUrl, 
  productCategory, 
  designId,
  prompt,
  onEdit,
  onAddToCart 
}: DesignPreviewProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const { trackEvent } = useAnalytics()
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const mockup = PRODUCT_MOCKUPS[productCategory]

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `design-${designId || Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading design:', error)
      alert('Failed to download design')
    }
  }


  const handleGallerySubmit = async (formData: {
    designName: string
    description: string
    isPublic: boolean
  }) => {
    if (!prompt) {
      alert('No prompt available for this design')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designName: formData.designName,
          description: formData.description,
          imageUrl,
          prompt,
          productCategory,
          style: 'modern', // Default style - could be enhanced
          tags: extractTagsFromPrompt(prompt),
          isPublic: formData.isPublic
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Design successfully added to gallery!')
        setShowGalleryModal(false)
      } else {
        alert(data.error || 'Failed to add design to gallery')
      }
    } catch (error) {
      console.error('Error submitting to gallery:', error)
      alert('Error submitting design to gallery')
    } finally {
      setIsSubmitting(false)
    }
  }

  const extractTagsFromPrompt = (prompt: string): string[] => {
    // Extract meaningful tags from the prompt
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 5) // Limit to 5 tags
    
    return [...new Set(words)] // Remove duplicates
  }

  return (
    <div className="card overflow-hidden">
      {/* Preview Area */}
      <div className="relative">
        <EnhancedPreview
          productCategory={productCategory}
          designImageUrl={imageUrl}
          color="white"
          defaultView="3d"
          className="min-h-[400px]"
        />
        
        {/* Like button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors shadow-lg ${
            isLiked 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-white">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={onEdit}
            className="btn-secondary text-sm py-2 px-3"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Design
          </button>
          
          <button
            onClick={onAddToCart}
            className="btn-primary text-sm py-2 px-3"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleDownload}
            className="btn-ghost text-sm py-2 px-2"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </button>

          <div className="relative">
            <SocialShare
              type="design"
              item={{
                id: designId || `design-${Date.now()}`,
                name: prompt || `Custom ${mockup.name} Design`,
                imageUrl: imageUrl,
                description: prompt,
                product: {
                  name: mockup.name,
                  type: productCategory
                }
              }}
              className="w-full"
            />
          </div>

          <button
            onClick={() => setShowGalleryModal(true)}
            disabled={!prompt}
            className="btn-ghost text-sm py-2 px-2 disabled:opacity-50"
            title={!prompt ? 'No prompt available' : 'Submit to gallery'}
          >
            <Upload className="h-4 w-4 mr-1" />
            Gallery
          </button>
        </div>
      </div>

      {/* Design Info */}
      <div className="px-4 pb-4 border-t bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600 mt-2">
            Perfect for {mockup.name.toLowerCase()}s • AI Generated
          </p>
          {designId && (
            <p className="text-xs text-gray-500 mt-1">
              Design ID: {designId}
            </p>
          )}
        </div>
      </div>

      {/* Gallery Submission Modal */}
      {showGalleryModal && (
        <GallerySubmissionModal
          onClose={() => setShowGalleryModal(false)}
          onSubmit={handleGallerySubmit}
          isSubmitting={isSubmitting}
          productType={mockup.name}
        />
      )}
    </div>
  )
}

interface GallerySubmissionModalProps {
  onClose: () => void
  onSubmit: (data: { designName: string; description: string; isPublic: boolean }) => void
  isSubmitting: boolean
  productType: string
}

function GallerySubmissionModal({ onClose, onSubmit, isSubmitting, productType }: GallerySubmissionModalProps) {
  const [designName, setDesignName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!designName.trim()) {
      alert('Please enter a design name')
      return
    }
    onSubmit({
      designName: designName.trim(),
      description: description.trim(),
      isPublic
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Submit to Gallery
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="designName" className="block text-sm font-medium text-gray-700 mb-1">
              Design Name *
            </label>
            <input
              id="designName"
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder={`My ${productType} Design`}
              className="input"
              maxLength={100}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others about your design..."
              className="input min-h-[80px] resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center">
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              Make this design public in the gallery
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary disabled:opacity-50"
              disabled={isSubmitting || !designName.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit to Gallery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}