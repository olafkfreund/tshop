'use client'

import { useState, useEffect } from 'react'
import { ProductCategory } from '@prisma/client'
import RealisticTShirt from './realistic-tshirt'
import RealisticCap from './realistic-cap'
import RealisticTote from './realistic-tote'
import { COLORS } from '@/lib/constants'
import { RotateCcw, Palette, Maximize2, Minimize2 } from 'lucide-react'

interface ProductPreview3DProps {
  productCategory: ProductCategory
  designImageUrl?: string
  selectedColor?: string
  selectedSize?: string
  className?: string
}


export default function ProductPreview3D({
  productCategory,
  designImageUrl,
  selectedColor = '#FFFFFF',
  selectedSize,
  className = ''
}: ProductPreview3DProps) {
  const [currentColor, setCurrentColor] = useState(selectedColor)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    setCurrentColor(selectedColor)
  }, [selectedColor])

  const renderPreview = () => {
    switch (productCategory) {
      case 'TSHIRT':
        return (
          <RealisticTShirt
            designImageUrl={designImageUrl}
            color={currentColor}
            autoRotate={autoRotate}
          />
        )
      case 'CAP':
        return (
          <RealisticCap
            designImageUrl={designImageUrl}
            color={currentColor}
            autoRotate={autoRotate}
          />
        )
      case 'TOTE_BAG':
        return (
          <RealisticTote
            designImageUrl={designImageUrl}
            color={currentColor}
            autoRotate={autoRotate}
          />
        )
      default:
        return null
    }
  }

  const PreviewContainer = ({ children }: { children: React.ReactNode }) => (
    <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {children}
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Auto-rotate toggle for T-shirts */}
        {productCategory === 'TSHIRT' && (
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg bg-white bg-opacity-90 hover:bg-opacity-100 transition-colors ${
              autoRotate ? 'text-primary-600' : 'text-gray-600'
            }`}
            title={autoRotate ? 'Stop auto-rotation' : 'Start auto-rotation'}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        
        {/* Color picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded-lg bg-white bg-opacity-90 hover:bg-opacity-100 transition-colors text-gray-600"
            title="Change color"
          >
            <Palette className="h-4 w-4" />
          </button>
          
          {showColorPicker && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border p-3 z-10">
              <div className="grid grid-cols-5 gap-2">
                {COLORS.slice(0, 10).map((color) => (
                  <button
                    key={color.slug}
                    onClick={() => {
                      setCurrentColor(color.hex)
                      setShowColorPicker(false)
                    }}
                    className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                      currentColor === color.hex ? 'border-primary-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Fullscreen toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-lg bg-white bg-opacity-90 hover:bg-opacity-100 transition-colors text-gray-600"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Fullscreen close overlay */}
      {isFullscreen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8">
          <div className="w-full max-w-4xl h-full max-h-[600px] relative">
            {renderPreview()}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <PreviewContainer>
      {!isFullscreen && renderPreview()}
    </PreviewContainer>
  )
}

// Click outside handler
function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}