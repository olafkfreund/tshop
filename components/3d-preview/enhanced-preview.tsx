'use client'

import { useState, useEffect } from 'react'
import { ProductCategory } from '@prisma/client'
import { Cube, Image, RotateCcw, ZoomIn, ZoomOut, Maximize2, Camera } from 'lucide-react'
import ThreeDTShirt from './three-d-tshirt'
import RealisticMockup from './realistic-mockup'
import CapCameraAR from '@/components/ar-preview/cap-camera-ar'
import { useAnalytics } from '@/lib/analytics'

interface EnhancedPreviewProps {
  productCategory: ProductCategory
  designImageUrl?: string
  color?: string
  logoImageUrl?: string
  className?: string
  defaultView?: '2d' | '3d'
}

// Check if 3D is supported
const is3DSupported = () => {
  if (typeof window === 'undefined') return false
  
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch (e) {
    return false
  }
}

export default function EnhancedPreview({ 
  productCategory, 
  designImageUrl, 
  color = 'white',
  logoImageUrl,
  className = '',
  defaultView = '2d'
}: EnhancedPreviewProps) {
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'ar'>(defaultView)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [webglSupported, setWebglSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAR, setShowAR] = useState(false)
  
  const { trackEvent } = useAnalytics()

  // Check WebGL support on mount
  useEffect(() => {
    setWebglSupported(is3DSupported())
  }, [])

  // Feature support detection
  const supports3D = productCategory === 'TSHIRT' && webglSupported
  const supportsAR = productCategory === 'CAP' && typeof navigator !== 'undefined' && 
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia

  const handleViewModeChange = (mode: '2d' | '3d' | 'ar') => {
    if (mode === '3d' && !supports3D) return
    if (mode === 'ar' && !supportsAR) return
    
    if (mode === 'ar') {
      setShowAR(true)
      return
    }
    
    setLoading(true)
    setViewMode(mode)
    
    // Track view mode change
    trackEvent({
      action: 'preview_mode_changed',
      category: 'engagement',
      custom_parameters: {
        from_mode: viewMode,
        to_mode: mode,
        product_category: productCategory,
        supports_3d: supports3D
      }
    })
    
    // Small delay for smooth transition
    setTimeout(() => setLoading(false), 500)
  }

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    trackEvent({
      action: 'preview_fullscreen_toggled',
      category: 'engagement',
      custom_parameters: {
        is_fullscreen: !isFullscreen,
        view_mode: viewMode
      }
    })
  }

  const PreviewContent = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Switching view...</p>
          </div>
        </div>
      )
    }

    if (viewMode === '3d' && supports3D) {
      return (
        <ThreeDTShirt
          designImageUrl={designImageUrl}
          color={color}
          logoImageUrl={logoImageUrl}
          className="w-full h-full"
        />
      )
    }

    return (
      <RealisticMockup
        productCategory={productCategory}
        designImageUrl={designImageUrl}
        color={color}
        className="w-full h-full"
      />
    )
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <div className={`rounded-xl overflow-hidden bg-white shadow-lg ${isFullscreen ? 'fixed inset-4 z-50' : 'w-full h-full min-h-[400px]'}`}>
          
          {/* Preview Content */}
          <div className="w-full h-full">
            <PreviewContent />
          </div>
          
          {/* Controls Bar */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            {/* View Mode Toggle */}
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleViewModeChange('2d')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === '2d'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Image className="h-4 w-4" />
                  <span>2D</span>
                </button>
                
                {supports3D && (
                  <button
                    onClick={() => handleViewModeChange('3d')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === '3d'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Cube className="h-4 w-4" />
                    <span>3D</span>
                  </button>
                )}
                
                {supportsAR && (
                  <button
                    onClick={() => handleViewModeChange('ar')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      showAR
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Camera className="h-4 w-4" />
                    <span>AR</span>
                  </button>
                )}
                
                {!supports3D && productCategory === 'TSHIRT' && (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    3D not supported
                  </div>
                )}
                
                {!supportsAR && productCategory === 'CAP' && (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    AR not supported
                  </div>
                )}
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex items-center space-x-2">
              {/* Fullscreen Toggle */}
              <button
                onClick={handleFullscreen}
                className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              {viewMode === '3d' ? 'Interactive 3D' : 'High Quality'} Preview
            </div>
            
            {viewMode === '3d' && (
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                Drag • Zoom • Rotate
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-lg">
            {productCategory === 'TSHIRT' ? 'T-Shirt' : 
             productCategory === 'CAP' ? 'Cap' : 'Tote Bag'} • {color.charAt(0).toUpperCase() + color.slice(1)}
          </div>

          {/* Instructions for 3D mode */}
          {viewMode === '3d' && supports3D && !isFullscreen && (
            <div className="absolute bottom-16 right-4 bg-black bg-opacity-75 text-white rounded-lg p-2 text-xs max-w-xs">
              <div className="flex items-center space-x-2 mb-1">
                <RotateCcw className="h-3 w-3" />
                <span>Drag to rotate</span>
              </div>
              <div className="flex items-center space-x-2">
                <ZoomIn className="h-3 w-3" />
                <span>Scroll to zoom</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleFullscreen}
        />
      )}

      {/* AR Modal */}
      {showAR && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl h-full max-h-[600px] bg-white rounded-xl overflow-hidden">
            <CapCameraAR
              designImageUrl={designImageUrl}
              color={color}
              className="w-full h-full"
              onClose={() => setShowAR(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}

// Export enhanced preview as default, with backward compatibility
export { RealisticMockup as BasicPreview }