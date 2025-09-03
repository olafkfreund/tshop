'use client'

import { useState, useRef, useEffect } from 'react'
import { ProductCategory } from '@prisma/client'
import { LogoPlacement, COMPANY_BRANDING } from '@/lib/design-placement/logo-placement'
import { Move, RotateCcw, Maximize2, Eye, EyeOff } from 'lucide-react'

interface PlacementPreviewProps {
  productCategory: ProductCategory
  customDesignUrl?: string
  color?: string
  showBack?: boolean
  className?: string
}

export default function PlacementPreview({
  productCategory,
  customDesignUrl,
  color = 'white',
  showBack = false,
  className = ''
}: PlacementPreviewProps) {
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front')
  const [showGuidelines, setShowGuidelines] = useState(true)
  const [isInteractive, setIsInteractive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const placement = LogoPlacement.getPlacement(productCategory)
  const currentPlacement = placement[viewSide]

  // Product mockup configurations
  const MOCKUP_STYLES = {
    TSHIRT: {
      front: {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        shape: 'M140 120 L140 100 Q140 80 160 80 L180 80 Q190 70 210 70 L240 70 Q250 80 260 80 L280 80 Q300 80 300 100 L300 120 L320 130 L320 180 Q320 190 310 190 L300 190 L300 350 Q300 370 280 370 L160 370 Q140 370 140 350 L140 190 L130 190 Q120 190 120 180 L120 130 Z',
        designArea: { x: 200, y: 180, width: 120, height: 120 }
      },
      back: {
        background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
        shape: 'M140 120 L140 100 Q140 80 160 80 L180 80 Q190 70 210 70 L240 70 Q250 80 260 80 L280 80 Q300 80 300 100 L300 120 L320 130 L320 180 Q320 190 310 190 L300 190 L300 350 Q300 370 280 370 L160 370 Q140 370 140 350 L140 190 L130 190 Q120 190 120 180 L120 130 Z',
        designArea: { x: 200, y: 140, width: 40, height: 40 }
      }
    },
    CAP: {
      front: {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        shape: 'M200 120 Q80 120 80 180 Q80 220 120 240 L280 240 Q320 220 320 180 Q320 120 200 120 Z M200 240 Q140 250 140 270 Q140 280 200 280 Q260 280 260 270 Q260 250 200 240 Z',
        designArea: { x: 200, y: 160, width: 80, height: 60 }
      },
      back: {
        background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
        shape: 'M200 120 Q80 120 80 180 Q80 220 120 240 L280 240 Q320 220 320 180 Q320 120 200 120 Z',
        designArea: { x: 200, y: 160, width: 30, height: 30 }
      }
    },
    TOTE_BAG: {
      front: {
        background: 'linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%)',
        shape: 'M120 140 L280 140 L280 360 L120 360 Z M150 100 Q150 80 170 80 L180 80 Q190 80 190 100 L190 140 M210 100 Q210 80 230 80 L240 80 Q250 80 250 100 L250 140',
        designArea: { x: 200, y: 240, width: 100, height: 100 }
      },
      back: {
        background: 'linear-gradient(135deg, #f4f4f5 0%, #d4d4d8 100%)',
        shape: 'M120 140 L280 140 L280 360 L120 360 Z',
        designArea: { x: 200, y: 340, width: 25, height: 25 }
      }
    }
  }

  const currentMockup = MOCKUP_STYLES[productCategory][viewSide]

  const getColorValue = (colorName: string) => {
    const colors: Record<string, string> = {
      white: '#ffffff',
      black: '#1a1a1a',
      navy: '#1e40af',
      gray: '#6b7280',
      red: '#dc2626',
      natural: '#f5f5dc'
    }
    return colors[colorName] || colors.white
  }

  return (
    <div className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Controls Header */}
      <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-gray-900">Logo Placement Preview</h3>
          
          {/* Side Toggle */}
          <div className="flex items-center bg-white rounded-lg border">
            <button
              onClick={() => setViewSide('front')}
              className={`px-3 py-1 text-sm font-medium rounded-l-lg transition-colors ${
                viewSide === 'front' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setViewSide('back')}
              className={`px-3 py-1 text-sm font-medium rounded-r-lg transition-colors ${
                viewSide === 'back' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Back
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Guidelines Toggle */}
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className={`p-2 rounded-lg transition-colors ${
              showGuidelines 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={showGuidelines ? 'Hide guidelines' : 'Show guidelines'}
          >
            {showGuidelines ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          {/* Interactive Toggle */}
          <button
            onClick={() => setIsInteractive(!isInteractive)}
            className={`p-2 rounded-lg transition-colors ${
              isInteractive 
                ? 'bg-green-100 text-green-600' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={isInteractive ? 'Disable interaction' : 'Enable interaction'}
          >
            <Move className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div 
        ref={containerRef}
        className="relative p-8 min-h-[400px] flex items-center justify-center"
        style={{ background: currentMockup.background }}
      >
        {/* Product Mockup */}
        <div className="relative">
          <svg width="400" height="400" viewBox="0 0 400 400" className="drop-shadow-lg">
            {/* Product Shape */}
            <path
              d={currentMockup.shape}
              fill={getColorValue(color)}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="2"
            />
            
            {/* Design Area Guidelines */}
            {showGuidelines && (
              <>
                <rect
                  x={currentMockup.designArea.x - currentMockup.designArea.width / 2}
                  y={currentMockup.designArea.y - currentMockup.designArea.height / 2}
                  width={currentMockup.designArea.width}
                  height={currentMockup.designArea.height}
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.5)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                
                {/* Center Guidelines */}
                <line
                  x1={currentMockup.designArea.x}
                  y1={currentMockup.designArea.y - currentMockup.designArea.height / 2}
                  x2={currentMockup.designArea.x}
                  y2={currentMockup.designArea.y + currentMockup.designArea.height / 2}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <line
                  x1={currentMockup.designArea.x - currentMockup.designArea.width / 2}
                  y1={currentMockup.designArea.y}
                  x2={currentMockup.designArea.x + currentMockup.designArea.width / 2}
                  y2={currentMockup.designArea.y}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              </>
            )}
          </svg>

          {/* Custom Design Overlay */}
          {customDesignUrl && viewSide === 'front' && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${currentMockup.designArea.x}px`,
                top: `${currentMockup.designArea.y}px`,
                width: `${currentMockup.designArea.width}px`,
                height: `${currentMockup.designArea.height}px`,
                transform: 'translate(-50%, -50%)',
                transformOrigin: 'center center'
              }}
            >
              <img
                src={customDesignUrl}
                alt="Custom design"
                className="w-full h-full object-contain opacity-90"
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
                }}
              />
            </div>
          )}

          {/* Company Logo Overlay */}
          {viewSide === 'back' && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${currentMockup.designArea.x}px`,
                top: `${currentMockup.designArea.y}px`,
                width: `${currentMockup.designArea.width}px`,
                height: `${currentMockup.designArea.height}px`,
                transform: 'translate(-50%, -50%)',
                transformOrigin: 'center center'
              }}
            >
              <div className="w-full h-full bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold">
                TSHOP
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">
            {viewSide === 'front' ? 'Custom Design Area' : 'Company Branding Area'}
          </h4>
          
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Position:</span>
              <span>{Math.round(currentPlacement.x * 100)}%, {Math.round(currentPlacement.y * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Max Size:</span>
              <span>{Math.round(currentPlacement.width * 100)}% × {Math.round(currentPlacement.height * 100)}%</span>
            </div>
            {currentPlacement.curved && (
              <div className="flex justify-between">
                <span>Style:</span>
                <span>Curved</span>
              </div>
            )}
          </div>

          {viewSide === 'front' && !customDesignUrl && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              Upload a design to see placement preview
            </div>
          )}

          {viewSide === 'back' && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              TShop logo will be automatically placed here
            </div>
          )}
        </div>

        {/* Guidelines Legend */}
        {showGuidelines && (
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-blue-500 opacity-50 border-dashed border border-blue-500"></div>
                <span>Design Area</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-blue-300 opacity-50 border-dashed border border-blue-300"></div>
                <span>Center Guides</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Placement Specifications */}
      <div className="bg-gray-50 border-t p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Front Design Specs</h5>
            <div className="space-y-1 text-gray-600">
              <div>Position: Center chest area</div>
              <div>Max Size: {Math.round(placement.front.width * 100)}% × {Math.round(placement.front.height * 100)}%</div>
              <div>Best For: Main custom designs, artwork</div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Back Logo Specs</h5>
            <div className="space-y-1 text-gray-600">
              <div>Position: {productCategory === 'TSHIRT' ? 'Upper back' : productCategory === 'CAP' ? 'Back panel' : 'Bottom area'}</div>
              <div>Max Size: {Math.round(placement.back.width * 100)}% × {Math.round(placement.back.height * 100)}%</div>
              <div>Purpose: TShop branding, small & discrete</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}