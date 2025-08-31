import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { CartService } from '@/lib/cart'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import Header from '@/components/navigation/header'
import CartItemsList from '@/components/cart/cart-items-list'
import CartSummary from '@/components/cart/cart-summary'
import {
  ArrowLeft,
  ShoppingBag,
  Lock,
  Truck,
  Shield
} from 'lucide-react'

async function getCart(userId?: string, sessionId?: string) {
  try {
    if (userId) {
      return await CartService.getUserCart(userId)
    } else if (sessionId) {
      return await CartService.getGuestCart(sessionId)
    }
    return { items: [], totals: { subtotal: 0, estimatedShipping: 0, estimatedTax: 0, total: 0 } }
  } catch (error) {
    console.error('Failed to load cart:', error)
    return { items: [], totals: { subtotal: 0, estimatedShipping: 0, estimatedTax: 0, total: 0 } }
  }
}

export default async function CartPage() {
  const session = await auth()
  
  // For now, we'll handle guest sessions on the client side
  // In a real app, you might want to pass sessionId via cookies or URL params
  const cart = session?.user?.id 
    ? await getCart(session.user.id)
    : { items: [], totals: { subtotal: 0, estimatedShipping: 0, estimatedTax: 0, total: 0 } }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8
                      sm:px-6
                      lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Shopping Cart ({itemCount})
          </h1>
        </div>

        {cart.items.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. 
              Start exploring our products and create your first custom design!
            </p>
            <div className="space-y-4
                            sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link
                href="/products"
                className="btn-primary"
              >
                Browse Products
              </Link>
              <Link
                href="/designs"
                className="btn-secondary"
              >
                View Templates
              </Link>
            </div>
          </div>
        ) : (
          /* Cart Content */
          <div className="grid grid-cols-1 gap-8
                          lg:grid-cols-3">
            
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Items
                  </h2>
                  <p className="text-sm text-gray-600">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <CartItemsList 
                  items={cart.items} 
                  userId={session?.user?.id}
                />
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 gap-4 mt-6
                              sm:grid-cols-3">
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-shrink-0">
                    <Lock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Secure Checkout
                    </h3>
                    <p className="text-xs text-gray-600">
                      SSL encrypted
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-shrink-0">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Fast Shipping
                    </h3>
                    <p className="text-xs text-gray-600">
                      3-7 business days
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-shrink-0">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Quality Guarantee
                    </h3>
                    <p className="text-xs text-gray-600">
                      30-day returns
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <CartSummary 
                cart={cart}
                userId={session?.user?.id}
              />

              {/* Promo Code */}
              <div className="card p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Promo Code
                </h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="input flex-1"
                  />
                  <button className="btn-secondary px-4">
                    Apply
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Promo codes will be applied at checkout
                </p>
              </div>

              {/* Recently Viewed */}
              <div className="card p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  You Might Also Like
                </h3>
                <div className="space-y-3">
                  {/* Placeholder for recommended products */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Classic T-Shirt</p>
                      <p className="text-xs text-gray-600">From $19.99</p>
                    </div>
                    <Link href="/products/classic-tshirt" className="text-primary-600 hover:text-primary-700">
                      <ShoppingBag className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}