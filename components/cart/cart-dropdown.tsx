'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { CartService } from '@/lib/cart'
import { useSession } from 'next-auth/react'
import { useAnalytics } from '@/lib/analytics'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Package,
  ArrowRight,
  Trash2
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
    images: Array<{ url: string }>
  }
  variant: {
    id: string
    colorName: string
    sizeName: string
    price: string
  }
}

interface Cart {
  items: CartItem[]
  totals: {
    subtotal: number
    estimatedShipping: number
    estimatedTax: number
    total: number
  }
}

export default function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  
  const { data: session } = useSession()
  const { trackAddToCart, trackEvent } = useAnalytics()

  useEffect(() => {
    loadCart()
  }, [session])

  const loadCart = async () => {
    try {
      setLoading(true)
      
      let cartData
      if (session?.user?.id) {
        cartData = await CartService.getUserCart(session.user.id)
      } else {
        const sessionId = localStorage.getItem('guest_session_id') || generateGuestSessionId()
        cartData = await CartService.getGuestCart(sessionId)
      }
      
      setCart(cartData)
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateGuestSessionId = (): string => {
    const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('guest_session_id', sessionId)
    return sessionId
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(itemId)
      return
    }

    try {
      setUpdating(itemId)
      
      await CartService.updateCartItem(
        itemId, 
        newQuantity, 
        session?.user?.id
      )
      
      await loadCart()
      
      trackEvent({
        action: 'cart_item_updated',
        category: 'ecommerce',
        custom_parameters: {
          item_id: itemId,
          new_quantity: newQuantity,
        },
      })
    } catch (error) {
      console.error('Failed to update cart item:', error)
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId)
      
      await CartService.removeFromCart(itemId, session?.user?.id)
      await loadCart()
      
      trackEvent({
        action: 'remove_from_cart',
        category: 'ecommerce',
        custom_parameters: {
          item_id: itemId,
        },
      })
    } catch (error) {
      console.error('Failed to remove cart item:', error)
    } finally {
      setUpdating(null)
    }
  }

  const clearCart = async () => {
    try {
      setLoading(true)
      
      const sessionId = session?.user?.id ? null : localStorage.getItem('guest_session_id')
      await CartService.clearCart(session?.user?.id || null, sessionId)
      await loadCart()
      
      trackEvent({
        action: 'cart_cleared',
        category: 'ecommerce',
      })
    } catch (error) {
      console.error('Failed to clear cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div className="relative">
      {/* Cart Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label={`Shopping cart with ${itemCount} items`}
      >
        <ShoppingCart className="h-6 w-6" />
        
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {/* Cart Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50
                          sm:w-80">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Shopping Cart ({itemCount})
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading cart...</p>
                </div>
              ) : !cart || cart.items.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                  <Link
                    href="/products"
                    onClick={() => setIsOpen(false)}
                    className="btn-primary text-sm"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-md overflow-hidden">
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {item.variant.colorName} • {item.variant.sizeName}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(Number(item.variant.price))}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updating === item.id}
                            className="p-1 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 py-1 text-sm font-medium min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updating === item.id}
                            className="p-1 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updating === item.id}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart && cart.items.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                {/* Totals */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(cart.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Est. Shipping</span>
                    <span>{formatPrice(cart.totals.estimatedShipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Est. Tax</span>
                    <span>{formatPrice(cart.totals.estimatedTax)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatPrice(cart.totals.total)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="w-full btn-secondary text-center block"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="w-full btn-primary text-center block"
                  >
                    Checkout
                    <ArrowRight className="h-4 w-4 ml-2 inline" />
                  </Link>
                  
                  {cart.items.length > 1 && (
                    <button
                      onClick={clearCart}
                      className="w-full text-sm text-gray-500 hover:text-red-600 py-2"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}