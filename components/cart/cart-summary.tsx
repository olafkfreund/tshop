'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { useAnalytics } from '@/lib/analytics'
import {
  ArrowRight,
  CreditCard,
  Truck,
  Calculator,
  Info,
  MapPin
} from 'lucide-react'

interface CartSummaryProps {
  cart: {
    items: Array<{
      id: string
      quantity: number
      product: { name: string }
      variant: { price: string }
    }>
    totals: {
      subtotal: number
      estimatedShipping: number
      estimatedTax: number
      total: number
    }
  }
  userId?: string
}

export default function CartSummary({ cart, userId }: CartSummaryProps) {
  const [shippingEstimate, setShippingEstimate] = useState<{
    country: string
    state?: string
    zipCode?: string
  } | null>(null)
  const [showShippingCalculator, setShowShippingCalculator] = useState(false)
  
  const { data: session } = useSession()
  const { trackPurchaseStarted } = useAnalytics()

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  
  const handleCheckout = () => {
    trackPurchaseStarted(cart.totals.total, itemCount)
  }

  const calculateShipping = async (address: { country: string; state?: string; zipCode?: string }) => {
    // This would typically call an API to get real shipping rates
    // For now, we'll simulate the calculation
    setShippingEstimate(address)
    
    // Simulate different shipping costs based on location
    let estimatedCost = 9.99
    if (address.country === 'US') {
      estimatedCost = 6.99
    } else if (address.country === 'CA') {
      estimatedCost = 12.99
    } else {
      estimatedCost = 19.99
    }

    // Update the cart totals (this would typically be handled by the cart service)
    console.log(`Estimated shipping to ${address.country}: ${formatPrice(estimatedCost)}`)
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Order Summary
        </h3>
        
        <div className="space-y-3">
          {/* Items */}
          <div className="flex justify-between text-sm">
            <span>Items ({itemCount})</span>
            <span>{formatPrice(cart.totals.subtotal)}</span>
          </div>

          {/* Shipping */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-gray-400" />
              <span>Shipping</span>
              <button
                onClick={() => setShowShippingCalculator(!showShippingCalculator)}
                className="text-primary-600 hover:text-primary-700"
              >
                <Calculator className="h-3 w-3" />
              </button>
            </div>
            <span>
              {cart.totals.estimatedShipping > 0 
                ? formatPrice(cart.totals.estimatedShipping)
                : 'Calculated at checkout'
              }
            </span>
          </div>

          {/* Shipping Calculator */}
          {showShippingCalculator && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-gray-900">
                Calculate Shipping
              </h4>
              <div className="space-y-2">
                <select className="input text-sm">
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="State/Province"
                    className="input text-sm"
                  />
                  <input
                    type="text"
                    placeholder="ZIP/Postal Code"
                    className="input text-sm"
                  />
                </div>
                <button
                  onClick={() => calculateShipping({ country: 'US', state: 'CA', zipCode: '90210' })}
                  className="btn-secondary text-sm w-full"
                >
                  Calculate
                </button>
              </div>
            </div>
          )}

          {/* Tax */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span>Tax</span>
              <div className="group relative">
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  Tax calculated at checkout based on shipping address
                </div>
              </div>
            </div>
            <span>
              {cart.totals.estimatedTax > 0 
                ? formatPrice(cart.totals.estimatedTax)
                : 'Calculated at checkout'
              }
            </span>
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatPrice(cart.totals.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="mt-6">
          {session?.user ? (
            <Link
              href="/checkout"
              onClick={handleCheckout}
              className="w-full btn-primary text-center block"
            >
              <CreditCard className="h-5 w-5 mr-2 inline" />
              Proceed to Checkout
              <ArrowRight className="h-4 w-4 ml-2 inline" />
            </Link>
          ) : (
            <div className="space-y-3">
              <Link
                href="/auth/signin?callbackUrl=/checkout"
                className="w-full btn-primary text-center block"
              >
                Sign in to Checkout
              </Link>
              <p className="text-xs text-center text-gray-600">
                Or continue as guest at checkout
              </p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm text-green-800 font-medium">
                Secure Checkout
              </p>
              <p className="text-xs text-green-700">
                Your payment information is encrypted and secure
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          We Accept
        </h3>
        
        <div className="grid grid-cols-4 gap-2">
          {/* Payment method logos - using placeholder divs */}
          <div className="h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">VISA</span>
          </div>
          <div className="h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">MC</span>
          </div>
          <div className="h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">AMEX</span>
          </div>
          <div className="h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">PayPal</span>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-3">
          All payments are processed securely through Stripe
        </p>
      </div>

      {/* Shipping Info */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Shipping Information
        </h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <Truck className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Standard Shipping</p>
              <p>3-7 business days • Free on orders over $50</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Worldwide Delivery</p>
              <p>We ship to most countries worldwide</p>
            </div>
          </div>
        </div>

        <Link
          href="/shipping"
          className="text-sm text-primary-600 hover:text-primary-700 inline-block mt-3"
        >
          View full shipping policy →
        </Link>
      </div>

      {/* Help */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Need Help?
        </h3>
        
        <div className="space-y-2">
          <Link
            href="/support"
            className="block text-sm text-primary-600 hover:text-primary-700"
          >
            Contact Support
          </Link>
          <Link
            href="/faq"
            className="block text-sm text-primary-600 hover:text-primary-700"
          >
            Frequently Asked Questions
          </Link>
          <Link
            href="/size-guide"
            className="block text-sm text-primary-600 hover:text-primary-700"
          >
            Size Guide
          </Link>
        </div>
      </div>
    </div>
  )
}