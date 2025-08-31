'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { CartService } from '@/lib/cart'
import { useAnalytics } from '@/lib/analytics'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Minus,
  Trash2,
  Package,
  Edit3,
  ExternalLink
} from 'lucide-react'

interface CartItem {
  id: string
  productId: string
  variantId: string
  quantity: number
  customization?: any
  product: {
    id: string
    name: string
    slug: string
    images: Array<{ url: string; alt?: string }>
  }
  variant: {
    id: string
    colorName: string
    sizeName: string
    price: string
  }
  design?: {
    id: string
    name: string
    previewUrl: string
  }
}

interface CartItemsListProps {
  items: CartItem[]
  userId?: string
}

export default function CartItemsList({ items: initialItems, userId }: CartItemsListProps) {
  const [items, setItems] = useState(initialItems)
  const [updating, setUpdating] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  
  const { trackEvent } = useAnalytics()
  const router = useRouter()

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(itemId)
      return
    }

    const previousQuantity = items.find(item => item.id === itemId)?.quantity || 0

    try {
      setUpdating(itemId)
      
      // Optimistic update
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )

      await CartService.updateCartItem(itemId, newQuantity, userId)
      
      trackEvent({
        action: 'cart_quantity_updated',
        category: 'ecommerce',
        value: newQuantity - previousQuantity,
        custom_parameters: {
          item_id: itemId,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
        },
      })

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error('Failed to update cart item:', error)
      
      // Revert optimistic update on error
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: previousQuantity } : item
        )
      )
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    const item = items.find(item => item.id === itemId)
    
    try {
      setRemoving(itemId)
      
      // Optimistic update
      setItems(prevItems => prevItems.filter(item => item.id !== itemId))

      await CartService.removeFromCart(itemId, userId)
      
      trackEvent({
        action: 'remove_from_cart',
        category: 'ecommerce',
        custom_parameters: {
          item_id: itemId,
          product_id: item?.productId,
          product_name: item?.product.name,
          quantity_removed: item?.quantity,
        },
      })

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error('Failed to remove cart item:', error)
      
      // Revert optimistic update on error
      if (item) {
        setItems(prevItems => [...prevItems, item])
      }
    } finally {
      setRemoving(null)
    }
  }

  const saveForLater = async (itemId: string) => {
    // Placeholder for save for later functionality
    trackEvent({
      action: 'save_for_later',
      category: 'ecommerce',
      custom_parameters: {
        item_id: itemId,
      },
    })
  }

  return (
    <div className="space-y-6">
      {items.map((item) => {
        const itemTotal = Number(item.variant.price) * item.quantity
        const isUpdatingThis = updating === item.id
        const isRemovingThis = removing === item.id

        return (
          <div
            key={item.id}
            className={`flex items-start space-x-4 p-4 border border-gray-200 rounded-lg transition-opacity ${
              isRemovingThis ? 'opacity-50' : ''
            }`}
          >
            {/* Product Image */}
            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden
                            sm:w-24 sm:h-24">
              {item.product.images[0] ? (
                <img
                  src={item.product.images[0].url}
                  alt={item.product.images[0].alt || item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="hover:text-primary-600 transition-colors"
                    >
                      {item.product.name}
                      <ExternalLink className="h-4 w-4 inline ml-1" />
                    </Link>
                  </h3>
                  
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-600">
                      Color: <span className="font-medium">{item.variant.colorName}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Size: <span className="font-medium">{item.variant.sizeName}</span>
                    </p>
                    {item.design && (
                      <p className="text-sm text-gray-600">
                        Design: <span className="font-medium">{item.design.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Customization Details */}
                  {item.customization && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <strong>Customization:</strong> {JSON.stringify(item.customization)}
                    </div>
                  )}

                  {/* Mobile Actions */}
                  <div className="flex items-center space-x-4 mt-3
                                  sm:hidden">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdatingThis || isRemovingThis}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 text-sm font-medium min-w-12 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdatingThis || isRemovingThis}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Item Price */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(itemTotal)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(Number(item.variant.price))} each
                      </p>
                    </div>
                  </div>
                </div>

                {/* Desktop Price */}
                <div className="hidden text-right
                                sm:block">
                  <p className="text-xl font-semibold text-gray-900">
                    {formatPrice(itemTotal)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatPrice(Number(item.variant.price))} each
                  </p>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden items-center justify-between mt-4
                              sm:flex">
                <div className="flex items-center space-x-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={isUpdatingThis || isRemovingThis}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium min-w-12 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={isUpdatingThis || isRemovingThis}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Edit Design */}
                  {item.design && (
                    <Link
                      href={`/design/${item.design.id}/edit`}
                      className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Design</span>
                    </Link>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {/* Save for Later */}
                  <button
                    onClick={() => saveForLater(item.id)}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Save for later
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={isUpdatingThis || isRemovingThis}
                    className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Mobile Remove Button */}
              <div className="flex items-center justify-between mt-3
                              sm:hidden">
                <button
                  onClick={() => saveForLater(item.id)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Save for later
                </button>
                
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={isUpdatingThis || isRemovingThis}
                  className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}