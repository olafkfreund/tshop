'use client'

import { useState } from 'react'
import { ProductCategory } from '@prisma/client'

interface RealisticMockupProps {
  productCategory: ProductCategory
  designImageUrl?: string
  color?: string
  className?: string
}

// Professional mockup configurations
const MOCKUP_CONFIGS = {
  TSHIRT: {
    name: 'T-Shirt',
    colors: {
      white: {
        mockupBg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        productColor: '#ffffff',
        shadowColor: 'rgba(0,0,0,0.1)'
      },
      black: {
        mockupBg: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        productColor: '#1f2937',
        shadowColor: 'rgba(255,255,255,0.1)'
      },
      navy: {
        mockupBg: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        productColor: '#1e40af',
        shadowColor: 'rgba(0,0,0,0.2)'
      },
      gray: {
        mockupBg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        productColor: '#6b7280',
        shadowColor: 'rgba(0,0,0,0.2)'
      }
    },
    designArea: {
      top: '28%',
      left: '50%',
      width: '35%',
      height: '35%'
    }
  },
  CAP: {
    name: 'Cap',
    colors: {
      white: {
        mockupBg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        productColor: '#ffffff',
        shadowColor: 'rgba(0,0,0,0.1)'
      },
      black: {
        mockupBg: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        productColor: '#1f2937',
        shadowColor: 'rgba(255,255,255,0.1)'
      },
      navy: {
        mockupBg: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        productColor: '#1e40af',
        shadowColor: 'rgba(0,0,0,0.2)'
      },
      red: {
        mockupBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        productColor: '#dc2626',
        shadowColor: 'rgba(0,0,0,0.2)'
      }
    },
    designArea: {
      top: '35%',
      left: '50%',
      width: '28%',
      height: '25%'
    }
  },
  TOTE_BAG: {
    name: 'Tote Bag',
    colors: {
      natural: {
        mockupBg: 'linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%)',
        productColor: '#f5f5dc',
        shadowColor: 'rgba(0,0,0,0.1)'
      },
      black: {
        mockupBg: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        productColor: '#1f2937',
        shadowColor: 'rgba(255,255,255,0.1)'
      },
      white: {
        mockupBg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        productColor: '#ffffff',
        shadowColor: 'rgba(0,0,0,0.1)'
      },
      navy: {
        mockupBg: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        productColor: '#1e40af',
        shadowColor: 'rgba(0,0,0,0.2)'
      }
    },
    designArea: {
      top: '40%',
      left: '50%',
      width: '32%',
      height: '32%'
    }
  }
}

const TShirtSVG = ({ color, shadowColor }: { color: string; shadowColor: string }) => (
  <svg viewBox="0 0 400 400" className="w-full h-full">
    {/* Shadow */}
    <ellipse cx="200" cy="380" rx="80" ry="15" fill={shadowColor} opacity="0.3"/>
    
    {/* T-shirt body */}
    <path
      d="M140 120 L140 100 Q140 80 160 80 L180 80 Q190 70 210 70 L240 70 Q250 80 260 80 L280 80 Q300 80 300 100 L300 120 L320 130 L320 180 Q320 190 310 190 L300 190 L300 350 Q300 370 280 370 L160 370 Q140 370 140 350 L140 190 L130 190 Q120 190 120 180 L120 130 Z"
      fill={color}
      stroke="rgba(0,0,0,0.1)"
      strokeWidth="2"
    />
    
    {/* Sleeves */}
    <path
      d="M120 130 Q100 140 100 160 L100 180 Q100 190 110 190 L120 190"
      fill={color}
      stroke="rgba(0,0,0,0.1)"
      strokeWidth="2"
    />
    <path
      d="M320 130 Q340 140 340 160 L340 180 Q340 190 330 190 L320 190"
      fill={color}
      stroke="rgba(0,0,0,0.1)"
      strokeWidth="2"
    />
    
    {/* Neckline */}
    <path
      d="M180 80 Q190 90 200 90 Q210 90 220 80"
      fill="none"
      stroke="rgba(0,0,0,0.1)"
      strokeWidth="2"
    />
  </svg>
)

const CapSVG = ({ color, shadowColor }: { color: string; shadowColor: string }) => (
  <svg viewBox="0 0 400 300" className="w-full h-full">
    {/* Shadow */}
    <ellipse cx="200" cy="280" rx="100" ry="12" fill={shadowColor} opacity="0.3"/>
    
    {/* Cap crown */}
    <ellipse cx="200" cy="120" rx="120" ry="80" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="2"/>
    
    {/* Bill/Visor */}
    <ellipse cx="200" cy="180" rx="140" ry="25" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="2"/>
    
    {/* Crown panels (decorative lines) */}
    <path d="M120 100 Q200 80 280 100" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none"/>
    <path d="M130 130 Q200 110 270 130" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none"/>
    
    {/* Adjustment strap hint */}
    <rect x="185" y="190" width="30" height="8" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="1" rx="4"/>
  </svg>
)

const ToteBagSVG = ({ color, shadowColor }: { color: string; shadowColor: string }) => (
  <svg viewBox="0 0 400 400" className="w-full h-full">
    {/* Shadow */}
    <ellipse cx="200" cy="385" rx="90" ry="12" fill={shadowColor} opacity="0.3"/>
    
    {/* Bag body */}
    <rect x="120" y="140" width="160" height="220" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="2" rx="8"/>
    
    {/* Side gussets */}
    <polygon points="120,140 110,150 110,350 120,360" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="2"/>
    <polygon points="280,140 290,150 290,350 280,360" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="2"/>
    
    {/* Handles */}
    <path 
      d="M150 140 Q150 100 150 80 Q150 60 170 60 L180 60 Q190 60 190 80 L190 100 Q190 140 190 140"
      fill="none" 
      stroke={color} 
      strokeWidth="12" 
      strokeLinecap="round"
    />
    <path 
      d="M210 140 Q210 100 210 80 Q210 60 230 60 L240 60 Q250 60 250 80 L250 100 Q250 140 250 140"
      fill="none" 
      stroke={color} 
      strokeWidth="12" 
      strokeLinecap="round"
    />
    
    {/* Handle shadows */}
    <path 
      d="M152 142 Q152 102 152 82 Q152 62 172 62 L182 62 Q192 62 192 82 L192 102 Q192 142 192 142"
      fill="none" 
      stroke="rgba(0,0,0,0.1)" 
      strokeWidth="2"
    />
    <path 
      d="M212 142 Q212 102 212 82 Q212 62 232 62 L242 62 Q252 62 252 82 L252 102 Q252 142 252 142"
      fill="none" 
      stroke="rgba(0,0,0,0.1)" 
      strokeWidth="2"
    />
    
    {/* Fabric texture lines */}
    <line x1="125" y1="160" x2="275" y2="160" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
    <line x1="125" y1="200" x2="275" y2="200" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
    <line x1="125" y1="240" x2="275" y2="240" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
    <line x1="125" y1="280" x2="275" y2="280" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
    <line x1="125" y1="320" x2="275" y2="320" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
  </svg>
)

export default function RealisticMockup({ 
  productCategory, 
  designImageUrl, 
  color = 'white',
  className = '' 
}: RealisticMockupProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const config = MOCKUP_CONFIGS[productCategory]
  const colorConfig = config.colors[color as keyof typeof config.colors] || config.colors.white

  const ProductSVG = () => {
    console.log('RealisticMockup productCategory:', productCategory, 'color:', color)
    switch (productCategory) {
      case 'TSHIRT':
        return <TShirtSVG color={colorConfig.productColor} shadowColor={colorConfig.shadowColor} />
      case 'CAP':
        return <CapSVG color={colorConfig.productColor} shadowColor={colorConfig.shadowColor} />
      case 'TOTE_BAG':
        return <ToteBagSVG color={colorConfig.productColor} shadowColor={colorConfig.shadowColor} />
      default:
        console.log('Unknown product category, defaulting to T-Shirt')
        return <TShirtSVG color={colorConfig.productColor} shadowColor={colorConfig.shadowColor} />
    }
  }

  return (
    <div 
      className={`relative w-full rounded-xl overflow-hidden ${className}`}
      style={{ 
        background: colorConfig.mockupBg,
        aspectRatio: '1/1'
      }}
    >
      {/* Product Mockup */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="w-full h-full max-w-sm max-h-sm relative">
          <ProductSVG />
          
          {/* Design Overlay */}
          {designImageUrl && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
              style={{
                top: config.designArea.top,
                left: config.designArea.left,
                width: config.designArea.width,
                height: config.designArea.height,
                opacity: imageError ? 0 : (imageLoaded ? 1 : 0.5)
              }}
            >
              <img
                src={designImageUrl}
                alt="Custom design"
                className="w-full h-full object-contain"
                style={{ 
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
                  maxWidth: 'none'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.error('Failed to load design image:', designImageUrl)
                  setImageError(true)
                }}
              />
              
              {/* Loading state */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}
          
          {/* Product label */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-lg">
            {config.name} • {color.charAt(0).toUpperCase() + color.slice(1)}
          </div>
          
          {/* Quality badge */}
          <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
            Print Ready
          </div>
        </div>
      </div>
      
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
    </div>
  )
}