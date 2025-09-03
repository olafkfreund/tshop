'use client'

import { useState } from 'react'
import { useCart, CartItem } from '@/lib/contexts/cart-context'
import { ShoppingCart, Plus, Check } from 'lucide-react'
import { ProductCategory } from '@prisma/client'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    category: ProductCategory
  }
  selectedVariant: {
    size: string
    color: string
    colorHex: string
    price: number
  }
  design?: {
    id: string
    imageUrl: string
    prompt?: string
  }
  fulfillmentPartner?: 'printful' | 'printify'
  quantity?: number
  className?: string
  children?: React.ReactNode
}

export default function AddToCartButton({
  product,
  selectedVariant,
  design,
  fulfillmentPartner = 'printful',
  quantity = 1,
  className = '',
  children
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const { addItem, openCart } = useCart()

  const handleAddToCart = async () => {
    setIsAdding(true)
    
    try {
      const cartItem: Omit<CartItem, 'id'> = {
        productId: product.id,
        productCategory: product.category,
        productName: product.name,
        designImageUrl: design?.imageUrl,
        designId: design?.id,
        prompt: design?.prompt,
        size: selectedVariant.size,
        color: selectedVariant.color,
        colorHex: selectedVariant.colorHex,
        quantity,
        price: selectedVariant.price,
        fulfillmentPartner,
        customization: design ? {
          frontDesign: design.imageUrl,
          designMetadata: {
            prompt: design.prompt,
            designId: design.id
          }
        } : undefined
      }

      addItem(cartItem)
      
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
      
      // Open cart after adding
      setTimeout(() => openCart(), 300)
    } catch (error) {
      console.error('Failed to add item to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const defaultClassName = "inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className={className || defaultClassName}
    >
      {isAdding ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          Adding...
        </>
      ) : justAdded ? (
        <>
          <Check className="h-5 w-5 mr-2" />
          Added to Cart!
        </>
      ) : (
        <>
          {children || (
            <>
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </>
          )}
        </>
      )}
    </button>
  )
}