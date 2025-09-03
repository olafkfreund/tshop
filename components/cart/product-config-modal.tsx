'use client'

import { useState } from 'react'
import { ProductCategory } from '@prisma/client'
import { X } from 'lucide-react'
import AddToCartButton from './add-to-cart-button'
import RealisticMockup from '@/components/3d-preview/realistic-mockup'

interface ProductConfigModalProps {
  isOpen: boolean
  onClose: () => void
  design: {
    id: string
    imageUrl: string
    prompt?: string
  }
  productCategory: ProductCategory
}

const PRODUCT_CONFIGS = {
  TSHIRT: {
    name: 'T-Shirt',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'White', hex: '#FFFFFF', price: 2499 },
      { name: 'Black', hex: '#000000', price: 2499 },
      { name: 'Navy', hex: '#1F2937', price: 2499 },
      { name: 'Gray', hex: '#6B7280', price: 2499 },
      { name: 'Red', hex: '#DC2626', price: 2699 }
    ]
  },
  CAP: {
    name: 'Cap',
    sizes: ['One Size'],
    colors: [
      { name: 'Black', hex: '#000000', price: 1999 },
      { name: 'Navy', hex: '#1F2937', price: 1999 },
      { name: 'White', hex: '#FFFFFF', price: 1999 },
      { name: 'Red', hex: '#DC2626', price: 2199 },
      { name: 'Gray', hex: '#6B7280', price: 1999 }
    ]
  },
  TOTE_BAG: {
    name: 'Tote Bag',
    sizes: ['One Size'],
    colors: [
      { name: 'Natural', hex: '#F5F5DC', price: 1899 },
      { name: 'Black', hex: '#000000', price: 1899 },
      { name: 'Navy', hex: '#1F2937', price: 1899 },
      { name: 'White', hex: '#FFFFFF', price: 1899 }
    ]
  }
}

export default function ProductConfigModal({
  isOpen,
  onClose,
  design,
  productCategory
}: ProductConfigModalProps) {
  const config = PRODUCT_CONFIGS[productCategory]
  const [selectedSize, setSelectedSize] = useState(config.sizes[0])
  const [selectedColor, setSelectedColor] = useState(config.colors[0])
  const [quantity, setQuantity] = useState(1)

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price / 100)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Add {config.name} to Cart
              </h3>
              <p className="text-gray-600">Configure your custom {config.name.toLowerCase()}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Design Preview */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Your Design Preview</h4>
              <RealisticMockup
                productCategory={productCategory}
                designImageUrl={design.imageUrl}
                color={selectedColor.name.toLowerCase()}
                className="rounded-lg"
              />
              {design.prompt && (
                <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
                  <strong>Design Prompt:</strong> {design.prompt}
                </p>
              )}
            </div>

            {/* Configuration Options */}
            <div className="space-y-6">
              {/* Size Selection */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Size</h4>
                <div className="grid grid-cols-3 gap-2">
                  {config.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 px-3 border rounded-md text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Color</h4>
                <div className="grid grid-cols-2 gap-3">
                  {config.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`p-3 border rounded-md text-left transition-colors ${
                        selectedColor.name === color.name
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div>
                          <div className="font-medium text-sm">{color.name}</div>
                          <div className="text-xs text-gray-600">{formatPrice(color.price)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Quantity</h4>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Summary */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(selectedColor.price * quantity)}</span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <AddToCartButton
                product={{
                  id: `${productCategory.toLowerCase()}-${design.id}`,
                  name: `Custom ${config.name}`,
                  category: productCategory
                }}
                selectedVariant={{
                  size: selectedSize,
                  color: selectedColor.name,
                  colorHex: selectedColor.hex,
                  price: selectedColor.price
                }}
                design={{
                  id: design.id,
                  imageUrl: design.imageUrl,
                  prompt: design.prompt
                }}
                quantity={quantity}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}