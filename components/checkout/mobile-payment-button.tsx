'use client'

import { useState } from 'react'
import { Smartphone, CreditCard, Loader2 } from 'lucide-react'
import { useMobilePayments, PaymentRequest } from '@/lib/mobile-payments'

interface MobilePaymentButtonProps {
  amount: number
  currency?: string
  items: Array<{
    label: string
    amount: number
  }>
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export default function MobilePaymentButton({
  amount,
  currency = 'usd',
  items,
  onSuccess,
  onError,
  disabled = false,
  className = ''
}: MobilePaymentButtonProps) {
  const {
    isApplePaySupported,
    isGooglePaySupported,
    isWebPaymentsSupported,
    isLoading,
    processPayment,
    hasAnySupport
  } = useMobilePayments()

  const [isProcessing, setIsProcessing] = useState(false)

  const handleMobilePayment = async () => {
    if (isProcessing || disabled) return

    setIsProcessing(true)

    try {
      const paymentRequest: PaymentRequest = {
        amount,
        currency,
        countryCode: 'US',
        merchantName: 'TShop',
        items,
        requestPayerEmail: true,
        requestPayerName: true,
      }

      const result = await processPayment(paymentRequest)

      if (result.success) {
        onSuccess?.(result)
      } else {
        onError?.(result.error || 'Payment failed')
      }
    } catch (error: any) {
      onError?.(error.message || 'Payment processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3 px-4 bg-gray-100 rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Checking payment options...</span>
      </div>
    )
  }

  if (!hasAnySupport) {
    return null // Don't show if no mobile payments are supported
  }

  const getButtonText = () => {
    if (isProcessing) return 'Processing...'
    
    if (isApplePaySupported && isGooglePaySupported) {
      return 'Pay with Mobile Wallet'
    } else if (isApplePaySupported) {
      return 'Pay with Apple Pay'
    } else if (isGooglePaySupported) {
      return 'Pay with Google Pay'
    } else {
      return 'Quick Pay'
    }
  }

  const getButtonIcon = () => {
    if (isProcessing) {
      return <Loader2 className="h-5 w-5 animate-spin" />
    }
    
    return <Smartphone className="h-5 w-5" />
  }

  const getButtonStyle = () => {
    if (isApplePaySupported && !isGooglePaySupported) {
      // Apple Pay styling
      return 'bg-black hover:bg-gray-800 text-white'
    } else if (isGooglePaySupported && !isApplePaySupported) {
      // Google Pay styling
      return 'bg-blue-600 hover:bg-blue-700 text-white'
    } else {
      // Generic mobile payment styling
      return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
    }
  }

  return (
    <button
      onClick={handleMobilePayment}
      disabled={disabled || isProcessing}
      className={`
        w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg
        font-semibold text-lg transition-all duration-200 transform
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 active:scale-95
        ${getButtonStyle()}
        ${className}
      `}
    >
      {getButtonIcon()}
      <span>{getButtonText()}</span>
    </button>
  )
}

// Mobile payment options display component
export function MobilePaymentOptions() {
  const {
    isApplePaySupported,
    isGooglePaySupported,
    isWebPaymentsSupported,
    isLoading,
    hasAnySupport
  } = useMobilePayments()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking mobile payment options...</span>
      </div>
    )
  }

  if (!hasAnySupport) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <CreditCard className="h-4 w-4" />
        <span className="text-sm">Mobile payments not available</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-green-600">
        <Smartphone className="h-4 w-4" />
        <span className="text-sm font-medium">Mobile payments available:</span>
      </div>
      
      <div className="flex items-center space-x-3">
        {isApplePaySupported && (
          <div className="flex items-center space-x-1">
            <div className="w-8 h-5 bg-black rounded text-white text-xs flex items-center justify-center font-bold">
              PAY
            </div>
            <span className="text-xs text-gray-600">Apple Pay</span>
          </div>
        )}
        
        {isGooglePaySupported && (
          <div className="flex items-center space-x-1">
            <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
              G
            </div>
            <span className="text-xs text-gray-600">Google Pay</span>
          </div>
        )}
        
        {isWebPaymentsSupported && !isApplePaySupported && !isGooglePaySupported && (
          <div className="flex items-center space-x-1">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-gray-600">Web Payments</span>
          </div>
        )}
      </div>
    </div>
  )
}