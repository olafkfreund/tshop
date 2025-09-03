import { ProductCategory } from '@prisma/client'

// Design placement configuration for each product type
export interface DesignPlacement {
  // Front design (customer's custom design)
  front: {
    x: number        // X position (0-1, relative to product width)
    y: number        // Y position (0-1, relative to product height)
    width: number    // Maximum width (0-1, relative to product width)
    height: number   // Maximum height (0-1, relative to product height)
    rotation?: number // Rotation in degrees
    curved?: boolean // Whether to apply curvature (for caps)
  }
  // Back design (company logo/branding)
  back: {
    x: number
    y: number
    width: number
    height: number
    rotation?: number
    curved?: boolean
  }
}

// Product-specific placement configurations
export const PLACEMENT_CONFIGS: Record<ProductCategory, DesignPlacement> = {
  TSHIRT: {
    front: {
      x: 0.5,      // Center horizontally
      y: 0.35,     // Chest area
      width: 0.35, // 35% of shirt width
      height: 0.35, // 35% of shirt height
      rotation: 0
    },
    back: {
      x: 0.5,      // Center horizontally
      y: 0.15,     // Upper back, near neckline
      width: 0.12, // Small logo, 12% of shirt width
      height: 0.12, // Square aspect ratio
      rotation: 0
    }
  },
  CAP: {
    front: {
      x: 0.5,      // Center of front panel
      y: 0.4,      // Middle of front panel
      width: 0.28, // 28% of cap width
      height: 0.25, // 25% of cap height
      rotation: 0,
      curved: true // Follow cap curvature
    },
    back: {
      x: 0.5,      // Center of back panel
      y: 0.5,      // Middle of back panel
      width: 0.15, // Small logo
      height: 0.15,
      rotation: 0,
      curved: true
    }
  },
  TOTE_BAG: {
    front: {
      x: 0.5,      // Center of bag
      y: 0.45,     // Middle area
      width: 0.32, // 32% of bag width
      height: 0.32, // Square-ish design area
      rotation: 0
    },
    back: {
      x: 0.5,      // Center back
      y: 0.85,     // Bottom area
      width: 0.08, // Very small logo
      height: 0.08,
      rotation: 0
    }
  }
}

// Design sizing and positioning utilities
export class LogoPlacement {
  static getPlacement(productCategory: ProductCategory): DesignPlacement {
    return PLACEMENT_CONFIGS[productCategory]
  }

  /**
   * Calculate absolute positioning for a design on a product
   */
  static calculateAbsolutePosition(
    productCategory: ProductCategory,
    designType: 'front' | 'back',
    productDimensions: { width: number; height: number },
    designDimensions: { width: number; height: number }
  ) {
    const placement = this.getPlacement(productCategory)[designType]
    
    // Calculate maximum allowed dimensions
    const maxWidth = productDimensions.width * placement.width
    const maxHeight = productDimensions.height * placement.height
    
    // Calculate scale factor to fit design within allowed area
    const scaleX = maxWidth / designDimensions.width
    const scaleY = maxHeight / designDimensions.height
    const scale = Math.min(scaleX, scaleY, 1) // Don't scale up
    
    // Calculate final dimensions
    const finalWidth = designDimensions.width * scale
    const finalHeight = designDimensions.height * scale
    
    // Calculate position (centered within the allowed area)
    const x = (productDimensions.width * placement.x) - (finalWidth / 2)
    const y = (productDimensions.height * placement.y) - (finalHeight / 2)
    
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(finalWidth),
      height: Math.round(finalHeight),
      scale,
      rotation: placement.rotation || 0,
      curved: placement.curved || false
    }
  }

  /**
   * Generate CSS transform for positioning
   */
  static getCSSTransform(
    productCategory: ProductCategory,
    designType: 'front' | 'back',
    containerDimensions: { width: number; height: number }
  ): string {
    const placement = this.getPlacement(productCategory)[designType]
    
    const translateX = `${(placement.x * 100)}%`
    const translateY = `${(placement.y * 100)}%`
    const rotation = placement.rotation ? `rotate(${placement.rotation}deg)` : ''
    
    return `translate(${translateX}, ${translateY}) translate(-50%, -50%) ${rotation}`.trim()
  }

  /**
   * Get design area bounds as CSS properties
   */
  static getDesignAreaCSS(
    productCategory: ProductCategory,
    designType: 'front' | 'back'
  ): React.CSSProperties {
    const placement = this.getPlacement(productCategory)[designType]
    
    return {
      position: 'absolute',
      left: `${placement.x * 100}%`,
      top: `${placement.y * 100}%`,
      width: `${placement.width * 100}%`,
      height: `${placement.height * 100}%`,
      transform: 'translate(-50%, -50%)',
      transformOrigin: 'center center',
      ...(placement.rotation && { 
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)` 
      })
    }
  }

  /**
   * Validate if a design fits within the allowed area
   */
  static validateDesignSize(
    productCategory: ProductCategory,
    designType: 'front' | 'back',
    designDimensions: { width: number; height: number },
    productDimensions: { width: number; height: number }
  ): { isValid: boolean; reason?: string; suggestedScale?: number } {
    const placement = this.getPlacement(productCategory)[designType]
    
    const maxWidth = productDimensions.width * placement.width
    const maxHeight = productDimensions.height * placement.height
    
    if (designDimensions.width <= maxWidth && designDimensions.height <= maxHeight) {
      return { isValid: true }
    }
    
    const scaleNeeded = Math.min(
      maxWidth / designDimensions.width,
      maxHeight / designDimensions.height
    )
    
    return {
      isValid: false,
      reason: `Design is too large for ${productCategory.toLowerCase()} ${designType}`,
      suggestedScale: scaleNeeded
    }
  }

  /**
   * Get print-ready positioning data for fulfillment APIs
   */
  static getPrintReadyData(
    productCategory: ProductCategory,
    customDesignUrl: string,
    companyLogoUrl: string,
    productDimensions: { width: number; height: number } = { width: 1000, height: 1000 }
  ) {
    const frontPlacement = this.calculateAbsolutePosition(
      productCategory,
      'front',
      productDimensions,
      { width: 400, height: 400 } // Assume 400x400 for custom designs
    )
    
    const backPlacement = this.calculateAbsolutePosition(
      productCategory,
      'back',
      productDimensions,
      { width: 100, height: 100 } // Assume 100x100 for company logo
    )
    
    return {
      front: {
        imageUrl: customDesignUrl,
        ...frontPlacement,
        layer: 1
      },
      back: {
        imageUrl: companyLogoUrl,
        ...backPlacement,
        layer: 1
      }
    }
  }
}

// Company branding configuration
export const COMPANY_BRANDING = {
  logoUrl: '/images/branding/tshop-logo-small.png', // Company logo
  watermarkUrl: '/images/branding/tshop-watermark.png', // Watermark version
  brandName: 'TShop',
  tagline: 'AI-Powered Custom Apparel'
}

// Quality presets for different use cases
export const PLACEMENT_PRESETS = {
  PRINT_QUALITY: {
    dpi: 300,
    colorSpace: 'CMYK',
    format: 'PNG',
    maxFileSize: '10MB'
  },
  WEB_PREVIEW: {
    dpi: 72,
    colorSpace: 'RGB', 
    format: 'WEBP',
    maxFileSize: '500KB'
  },
  THUMBNAIL: {
    dpi: 72,
    colorSpace: 'RGB',
    format: 'WEBP', 
    maxFileSize: '100KB'
  }
}

// Utility functions for design processing
export const DesignUtils = {
  /**
   * Generate a preview image with both front and back designs
   */
  async generatePreviewImage(
    productCategory: ProductCategory,
    frontDesignUrl: string,
    backDesignUrl?: string
  ): Promise<string> {
    // This would integrate with a canvas/image processing library
    // For now, return the front design URL
    return frontDesignUrl
  },

  /**
   * Validate design file format and size
   */
  validateDesignFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      errors.push('File must be PNG, JPEG, SVG, or WEBP')
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File must be smaller than 10MB')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Generate fulfillment-ready file names
   */
  generateFileName(
    orderId: string,
    productCategory: ProductCategory,
    designType: 'front' | 'back',
    format: string = 'png'
  ): string {
    const timestamp = Date.now()
    return `${orderId}_${productCategory.toLowerCase()}_${designType}_${timestamp}.${format}`
  }
}