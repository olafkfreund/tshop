'use client'

import { useState, useEffect } from 'react'
import { useAnalytics } from '@/lib/analytics'
import { 
  Share2, 
  Instagram, 
  Facebook, 
  Twitter, 
  Camera, 
  Gift,
  Heart,
  Star,
  Download,
  X
} from 'lucide-react'

interface PostPurchaseShareProps {
  order: {
    id: string
    items: Array<{
      id: string
      product: {
        name: string
        images?: Array<{ url: string; isPrimary?: boolean }>
      }
      design?: {
        name: string
        imageUrl: string
      }
      variant: {
        colorName: string
        sizeName: string
      }
      quantity: number
    }>
    total: string
    createdAt: Date
  }
  onShare?: (platform: string) => void
  onDismiss?: () => void
}

const BRANDED_SHARE_TEMPLATES = {
  celebration: {
    title: "🎉 Order Celebration!",
    message: "Just ordered my custom {productType} from TShop! Can't wait to wear it! ✨",
    bgColor: "from-purple-500 to-pink-500",
    emoji: "🎉"
  },
  excited: {
    title: "😍 So Excited!",
    message: "My perfect {productType} is on its way! Thanks to TShop's amazing AI design tool 🤖",
    bgColor: "from-blue-500 to-cyan-500",
    emoji: "😍"
  },
  proud: {
    title: "💪 Custom Creation!",
    message: "Designed and ordered my unique {productType} on TShop! AI-powered custom apparel is the future 🚀",
    bgColor: "from-green-500 to-emerald-500",
    emoji: "💪"
  }
}

export default function PostPurchaseShare({ 
  order, 
  onShare, 
  onDismiss 
}: PostPurchaseShareProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('celebration')
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [shareCount, setShareCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  
  const { trackEvent } = useAnalytics()

  // Show share prompt after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) {
        setShowSharePrompt(true)
        trackEvent({
          action: 'post_purchase_share_shown',
          category: 'social',
          custom_parameters: {
            order_id: order.id,
            item_count: order.items.length,
            order_total: order.total
          }
        })
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [dismissed, order, trackEvent])

  // Auto-dismiss after 30 seconds if not interacted with
  useEffect(() => {
    if (showSharePrompt) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, 30000)

      return () => clearTimeout(timer)
    }
  }, [showSharePrompt])

  const handleDismiss = () => {
    setShowSharePrompt(false)
    setDismissed(true)
    onDismiss?.()
    
    trackEvent({
      action: 'post_purchase_share_dismissed',
      category: 'social',
      custom_parameters: {
        order_id: order.id,
        time_shown: 30
      }
    })
  }

  const getProductType = () => {
    const productTypes = order.items.map(item => item.product.name.toLowerCase())
    const uniqueTypes = [...new Set(productTypes)]
    
    if (uniqueTypes.length === 1) {
      return uniqueTypes[0]
    } else if (uniqueTypes.length === 2) {
      return `${uniqueTypes[0]} and ${uniqueTypes[1]}`
    } else {
      return `${uniqueTypes.slice(0, -1).join(', ')} and ${uniqueTypes[uniqueTypes.length - 1]}`
    }
  }

  const getShareText = (template: keyof typeof BRANDED_SHARE_TEMPLATES) => {
    const templateData = BRANDED_SHARE_TEMPLATES[template]
    return templateData.message.replace('{productType}', getProductType())
  }

  const generateShareImage = async (template: keyof typeof BRANDED_SHARE_TEMPLATES) => {
    // This would generate a branded share image with the order details
    // For now, return the first design image or product image
    const firstItem = order.items[0]
    if (firstItem.design?.imageUrl) {
      return firstItem.design.imageUrl
    } else if (firstItem.product.images?.[0]?.url) {
      return firstItem.product.images[0].url
    }
    return '/images/tshop-logo.png' // Fallback to brand logo
  }

  const handlePlatformShare = async (platform: string) => {
    const shareText = getShareText(selectedTemplate as keyof typeof BRANDED_SHARE_TEMPLATES)
    const shareImage = await generateShareImage(selectedTemplate as keyof typeof BRANDED_SHARE_TEMPLATES)
    const shareUrl = `${window.location.origin}/orders/${order.id}/share`
    
    let platformUrl = ''
    
    switch (platform) {
      case 'instagram':
        // Instagram requires special handling for stories
        platformUrl = `https://www.instagram.com/create/story/?media=${encodeURIComponent(shareImage)}`
        break
      case 'facebook':
        platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        break
      case 'twitter':
        platformUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=TShop,CustomApparel,AIDesign`
        break
      default:
        // Native share or copy link
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'My TShop Order',
              text: shareText,
              url: shareUrl
            })
          } catch (err) {
            console.log('Share cancelled or failed:', err)
            return
          }
        } else {
          // Copy to clipboard
          navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
          alert('Share text copied to clipboard!')
        }
    }

    if (platformUrl) {
      window.open(platformUrl, 'share-window', 'width=600,height=500,scrollbars=yes,resizable=yes')
    }

    // Track the share
    trackEvent({
      action: 'post_purchase_shared',
      category: 'social',
      custom_parameters: {
        platform,
        template: selectedTemplate,
        order_id: order.id,
        order_total: order.total,
        item_count: order.items.length
      }
    })

    // Increment share count and dismiss
    setShareCount(prev => prev + 1)
    onShare?.(platform)
    
    // Auto-dismiss after successful share
    setTimeout(() => {
      handleDismiss()
    }, 2000)
  }

  const downloadBrandedImage = async () => {
    // Generate and download a branded share image
    const shareImage = await generateShareImage(selectedTemplate as keyof typeof BRANDED_SHARE_TEMPLATES)
    
    trackEvent({
      action: 'branded_image_downloaded',
      category: 'social',
      custom_parameters: {
        template: selectedTemplate,
        order_id: order.id
      }
    })

    // For now, just download the design/product image
    // In a real implementation, you'd generate a branded template image
    const link = document.createElement('a')
    link.href = shareImage || '/images/tshop-logo.png'
    link.download = `tshop-order-${order.id.slice(-8)}.png`
    link.click()
  }

  if (!showSharePrompt || dismissed) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className={`bg-gradient-to-r ${BRANDED_SHARE_TEMPLATES[selectedTemplate as keyof typeof BRANDED_SHARE_TEMPLATES].bgColor} p-6 text-white relative`}>
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <div className="text-4xl mb-2">
              {BRANDED_SHARE_TEMPLATES[selectedTemplate as keyof typeof BRANDED_SHARE_TEMPLATES].emoji}
            </div>
            <h2 className="text-xl font-bold mb-2">
              {BRANDED_SHARE_TEMPLATES[selectedTemplate as keyof typeof BRANDED_SHARE_TEMPLATES].title}
            </h2>
            <p className="text-white/90 text-sm">
              Share your awesome order with friends!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</p>
                <p className="text-sm text-gray-600">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            
            {/* Show first design or product image */}
            <div className="flex space-x-2 overflow-x-auto">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={item.id} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                  {item.design?.imageUrl || item.product.images?.[0]?.url ? (
                    <img
                      src={item.design?.imageUrl || item.product.images?.[0]?.url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Choose your vibe:</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(BRANDED_SHARE_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedTemplate === key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">{template.emoji}</div>
                  <div className="text-xs font-medium text-gray-700">
                    {template.title.replace(/[🎉😍💪]/g, '').trim()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Text */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-700">
              "{getShareText(selectedTemplate as keyof typeof BRANDED_SHARE_TEMPLATES)}"
            </p>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handlePlatformShare('instagram')}
                className="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                <Instagram className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Instagram</span>
              </button>
              
              <button
                onClick={() => handlePlatformShare('facebook')}
                className="flex flex-col items-center p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Facebook className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Facebook</span>
              </button>
              
              <button
                onClick={() => handlePlatformShare('twitter')}
                className="flex flex-col items-center p-3 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
              >
                <Twitter className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Twitter</span>
              </button>
            </div>

            {/* Additional Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePlatformShare('native')}
                className="flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">More Options</span>
              </button>
              
              <button
                onClick={downloadBrandedImage}
                className="flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Download</span>
              </button>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Heart className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-blue-900 mb-1">
                  Share & Get Rewarded!
                </p>
                <p className="text-xs text-blue-700">
                  Your friends get 10% off their first order, and you get points for every share!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}