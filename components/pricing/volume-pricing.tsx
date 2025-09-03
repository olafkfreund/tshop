'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingDown, 
  Users, 
  Package, 
  Calculator,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Percent,
  DollarSign
} from 'lucide-react'

interface PricingTier {
  id: string
  minQuantity: number
  maxQuantity?: number | null
  discountPercent: number
  pricePerUnit: number
  totalSavings: number
  isActive: boolean
}

interface PricingInfo {
  basePrice: number
  quantity: number
  currentTier: any
  pricePerUnit: number
  totalPrice: number
  totalSavings: number
  teamDiscount: number
}

interface Recommendation {
  type: string
  message: string
  quantity: number
  savings: number
}

interface VolumePricingProps {
  productId: string
  teamId?: string
  initialQuantity?: number
  onPricingChange?: (pricing: PricingInfo) => void
}

export default function VolumePricing({ 
  productId, 
  teamId,
  initialQuantity = 1,
  onPricingChange 
}: VolumePricingProps) {
  const [quantity, setQuantity] = useState(initialQuantity)
  const [pricing, setPricing] = useState<PricingInfo | null>(null)
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPricing()
  }, [productId, teamId, quantity])

  const fetchPricing = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        productId,
        quantity: quantity.toString(),
      })

      if (teamId) {
        params.append('teamId', teamId)
      }

      const response = await fetch(`/api/pricing/volume?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pricing')
      }

      setPricing(data.pricing)
      setTiers(data.tiers)
      setRecommendations(data.recommendations)
      
      // Notify parent component
      onPricingChange?.(data.pricing)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 1000) {
      setQuantity(newQuantity)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error || !pricing) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Failed to load pricing information'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Pricing */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Current Pricing</h3>
          </div>
          
          {pricing.totalSavings > 0 && (
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingDown className="h-4 w-4" />
              <span className="font-medium">
                Save {formatCurrency(pricing.totalSavings)}
              </span>
            </div>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="mb-6">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <input
              id="quantity"
              type="number"
              min="1"
              max="1000"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= 1000}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Per Unit</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(pricing.pricePerUnit)}
            </p>
            {pricing.basePrice !== pricing.pricePerUnit && (
              <p className="text-sm text-blue-700 line-through">
                {formatCurrency(pricing.basePrice)}
              </p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Total Price</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(pricing.totalPrice)}
            </p>
          </div>

          {pricing.totalSavings > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">You Save</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(pricing.totalSavings)}
              </p>
            </div>
          )}

          {pricing.teamDiscount > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Team Discount</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {formatPercent(pricing.teamDiscount)}
              </p>
            </div>
          )}
        </div>

        {/* Current Tier Info */}
        {pricing.currentTier && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-900">
                {pricing.currentTier.name || `Tier ${pricing.currentTier.minQuantity}+`}
              </h4>
            </div>
            <p className="text-sm text-gray-600">
              {formatPercent(pricing.currentTier.discountPercent)} discount for orders of{' '}
              {pricing.currentTier.minQuantity}
              {pricing.currentTier.maxQuantity ? `-${pricing.currentTier.maxQuantity}` : '+'} items
            </p>
          </div>
        )}
      </div>

      {/* Volume Pricing Tiers */}
      {tiers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Percent className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Volume Discounts</h3>
          </div>

          <div className="space-y-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`border rounded-lg p-4 transition-colors ${
                  tier.isActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {tier.isActive ? (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                    <div>
                      <h4 className={`font-medium ${
                        tier.isActive ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {tier.minQuantity}
                        {tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} items
                      </h4>
                      <p className={`text-sm ${
                        tier.isActive ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {formatPercent(tier.discountPercent)} discount
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-semibold ${
                      tier.isActive ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {formatCurrency(tier.pricePerUnit)}/unit
                    </p>
                    {tier.totalSavings > 0 && (
                      <p className={`text-sm ${
                        tier.isActive ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        Save {formatCurrency(tier.totalSavings)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingDown className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Savings Opportunities</h3>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{rec.message}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Suggested quantity: {rec.quantity} items
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(rec.savings)}
                    </p>
                    <p className="text-xs text-gray-500">additional savings</p>
                  </div>
                  <button
                    onClick={() => handleQuantityChange(rec.quantity)}
                    className="btn-primary btn-sm flex items-center space-x-1"
                  >
                    <span>Apply</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Order Benefits */}
      {quantity >= 25 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">Bulk Order Benefits</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">Priority processing</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">Dedicated account manager</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">Flexible delivery options</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">Extended return policy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}