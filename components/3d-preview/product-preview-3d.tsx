'use client'

import { useState, useEffect } from 'react'
import { ProductCategory } from '@prisma/client'
import TShirtPreview from './tshirt-preview'
import { COLORS } from '@/lib/constants'
import { RotateCcw, Palette, Maximize2, Minimize2 } from 'lucide-react'

interface ProductPreview3DProps {
  productCategory: ProductCategory
  designImageUrl?: string
  selectedColor?: string
  selectedSize?: string
  className?: string
}

// Simplified 3D components for Cap and Tote Bag
function CapPreview({ designImageUrl, color }: { designImageUrl?: string; color: string }) {
  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
      {/* Cap silhouette */}
      <div className="relative">
        <div 
          className="w-48 h-32 rounded-full shadow-lg relative transform rotate-6"
          style={{ backgroundColor: color }}
        >
          {/* Bill */}
          <div 
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-6 rounded-full shadow-md"
            style={{ backgroundColor: color, filter: 'brightness(0.8)' }}
          />
          
          {/* Design overlay */}
          {designImageUrl && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-12 flex items-center justify-center">
              <img
                src={designImageUrl}
                alt="Design"
                className="max-w-full max-h-full object-contain"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
              />
            </div>
          )}
          
          {/* Adjustment strap */}
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-6 h-4 bg-black bg-opacity-20 rounded"></div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 text-xs text-gray-600 bg-white bg-opacity-80 px-2 py-1 rounded">
        3D Cap Preview
      </div>
    </div>
  )
}

function ToteBagPreview({ designImageUrl, color }: { designImageUrl?: string; color: string }) {
  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
      {/* Tote bag shape */}
      <div className="relative transform -rotate-3">
        {/* Handles */}
        <div className="flex justify-between mb-2 px-8">
          <div 
            className="w-3 h-16 rounded-full shadow-sm"
            style={{ backgroundColor: color, filter: 'brightness(0.9)' }}
          />
          <div 
            className="w-3 h-16 rounded-full shadow-sm"
            style={{ backgroundColor: color, filter: 'brightness(0.9)' }}
          />
        </div>
        
        {/* Main bag body */}
        <div 
          className="w-48 h-56 rounded-b-lg shadow-lg relative"
          style={{ backgroundColor: color }}
        >
          {/* Design overlay */}
          {designImageUrl && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-32 flex items-center justify-center">
              <img
                src={designImageUrl}
                alt="Design"
                className="max-w-full max-h-full object-contain"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
            </div>
          )}
          
          {/* Seam details */}
          <div className="absolute inset-x-4 top-0 h-px bg-black bg-opacity-10"></div>
          <div className="absolute left-0 top-0 bottom-0 w-px bg-black bg-opacity-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-px bg-black bg-opacity-10"></div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 text-xs text-gray-600 bg-white bg-opacity-80 px-2 py-1 rounded">
        3D Tote Bag Preview
      </div>
    </div>
  )
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
          <TShirtPreview
            designImageUrl={designImageUrl}
            color={currentColor}
            style="regular"
            showControls={true}
            autoRotate={autoRotate}
          />
        )
      case 'CAP':
        return (
          <CapPreview
            designImageUrl={designImageUrl}
            color={currentColor}
          />
        )
      case 'TOTE_BAG':
        return (
          <ToteBagPreview
            designImageUrl={designImageUrl}
            color={currentColor}
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