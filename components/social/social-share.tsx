'use client'

import { useState } from 'react'
import { useAnalytics } from '@/lib/analytics'
import {
  Facebook,
  Twitter,
  Instagram,
  Link,
  Download,
  Check,
  Share2,
  MessageCircle,
  Heart,
  ExternalLink
} from 'lucide-react'

interface SocialShareProps {
  type: 'design' | 'product' | 'template' | 'order'
  item: {
    id: string
    name: string
    imageUrl: string
    description?: string
    creator?: {
      name?: string
      image?: string
    }
    product?: {
      name: string
      type: string
    }
  }
  shareUrl?: string
  className?: string
}

interface SocialPlatform {
  name: string
  icon: React.ComponentType<any>
  color: string
  shareUrl: (url: string, text: string) => string
  trackingName: string
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600 hover:bg-blue-700',
    shareUrl: (url, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    trackingName: 'facebook'
  },
  {
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-sky-500 hover:bg-sky-600',
    shareUrl: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&hashtags=TShop,CustomDesign,AI`,
    trackingName: 'twitter'
  },
  {
    name: 'Instagram Story',
    icon: Instagram,
    color: 'bg-pink-500 hover:bg-pink-600',
    shareUrl: (url, text) => `https://www.instagram.com/create/story/?media=${encodeURIComponent(url)}`,
    trackingName: 'instagram'
  }
]

export default function SocialShare({ 
  type, 
  item, 
  shareUrl,
  className = ''
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [shareCount, setShareCount] = useState(0)
  
  const { trackEvent } = useAnalytics()

  const getShareUrl = () => {
    if (shareUrl) return shareUrl
    
    const baseUrl = window.location.origin
    switch (type) {
      case 'design':
        return `${baseUrl}/designs/${item.id}`
      case 'product':
        return `${baseUrl}/products/${item.id}`
      case 'template':
        return `${baseUrl}/templates/${item.id}`
      case 'order':
        return `${baseUrl}/orders/${item.id}/share`
      default:
        return baseUrl
    }
  }

  const getShareText = () => {
    const creatorText = item.creator?.name ? ` by ${item.creator.name}` : ''
    const productText = item.product ? ` on ${item.product.name}` : ''
    
    switch (type) {
      case 'design':
        return `Check out this amazing custom design "${item.name}"${creatorText} created with TShop! 🎨✨`
      case 'product':
        return `I just customized this awesome ${item.name} on TShop! Check it out 👕⚡`
      case 'template':
        return `Found this incredible design template "${item.name}"${creatorText} on TShop! Perfect for custom apparel 🔥`
      case 'order':
        return `Just ordered my custom ${item.product?.name || 'apparel'} from TShop! Can't wait to wear it 🎉`
      default:
        return `Check out TShop - AI-powered custom apparel design! 🚀`
    }
  }

  const handlePlatformShare = async (platform: SocialPlatform) => {
    const url = getShareUrl()
    const text = getShareText()
    const shareLink = platform.shareUrl(url, text)

    // Track the share
    trackEvent({
      action: 'social_share_clicked',
      category: 'social',
      custom_parameters: {
        platform: platform.trackingName,
        content_type: type,
        content_id: item.id,
        content_name: item.name,
      },
    })

    // Open share window
    window.open(
      shareLink,
      'share-window',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    )

    // Increment share count (optimistic update)
    setShareCount(prev => prev + 1)
    setIsOpen(false)
  }

  const handleCopyLink = async () => {
    const url = getShareUrl()
    
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)

      trackEvent({
        action: 'link_copied',
        category: 'social',
        custom_parameters: {
          content_type: type,
          content_id: item.id,
        },
      })
    } catch (error) {
      console.error('Failed to copy link:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(item.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${item.name}-tshop-design.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      trackEvent({
        action: 'image_downloaded',
        category: 'social',
        custom_parameters: {
          content_type: type,
          content_id: item.id,
        },
      })
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Share2 className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Share</span>
        {shareCount > 0 && (
          <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
            {shareCount}
          </span>
        )}
      </button>

      {/* Share Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg border border-gray-200 shadow-lg z-20 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-1">Share your design</h3>
              <p className="text-sm text-gray-600">
                Spread the word about your awesome creation!
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  {item.product && (
                    <p className="text-sm text-gray-600">
                      {item.product.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Platforms */}
            <div className="p-4">
              <div className="space-y-2">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <button
                      key={platform.name}
                      onClick={() => handlePlatformShare(platform)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-white ${platform.color}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">Share on {platform.name}</span>
                      <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
                    </button>
                  )
                })}
              </div>

              {/* Additional Actions */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Link className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="font-medium text-gray-700">
                    {copiedLink ? 'Link Copied!' : 'Copy Link'}
                  </span>
                </button>

                <button
                  onClick={handleDownloadImage}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Download className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-700">Download Image</span>
                </button>
              </div>

              {/* Tips */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-blue-900 mb-1">
                      Sharing Tip
                    </p>
                    <p className="text-xs text-blue-700">
                      Tag your friends and use #TShopDesign to get featured on our community page!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Compact share button component for smaller spaces
export function CompactSocialShare({ 
  type, 
  item, 
  shareUrl,
  showCount = false 
}: SocialShareProps & { showCount?: boolean }) {
  const [shareCount, setShareCount] = useState(0)
  const { trackEvent } = useAnalytics()

  const handleQuickShare = () => {
    const url = shareUrl || `${window.location.origin}/${type}s/${item.id}`
    const text = `Check out "${item.name}" on TShop! 🎨`

    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: text,
        url: url,
      }).then(() => {
        trackEvent({
          action: 'native_share_completed',
          category: 'social',
          custom_parameters: {
            content_type: type,
            content_id: item.id,
          },
        })
        setShareCount(prev => prev + 1)
      }).catch(err => console.log('Error sharing:', err))
    } else {
      // Fallback to copy link
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!')
        trackEvent({
          action: 'link_copied_fallback',
          category: 'social',
          custom_parameters: {
            content_type: type,
            content_id: item.id,
          },
        })
      })
    }
  }

  return (
    <button
      onClick={handleQuickShare}
      className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title="Share"
    >
      <Share2 className="h-4 w-4 text-gray-600" />
      {showCount && shareCount > 0 && (
        <span className="text-xs text-gray-600">{shareCount}</span>
      )}
    </button>
  )
}