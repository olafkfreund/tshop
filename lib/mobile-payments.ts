'use client'

/**
 * Mobile payment service for Apple Pay, Google Pay, and other mobile wallets
 * Integrates with Stripe for payment processing
 */

export interface PaymentRequest {
  amount: number
  currency: string
  countryCode: string
  merchantName: string
  items: Array<{
    label: string
    amount: number
  }>
  shippingOptions?: Array<{
    id: string
    label: string
    amount: number
    detail?: string
  }>
  requestShipping?: boolean
  requestPayerName?: boolean
  requestPayerEmail?: boolean
  requestPayerPhone?: boolean
}

export interface PaymentResult {
  success: boolean
  paymentMethod?: any
  error?: string
  billingDetails?: any
  shippingAddress?: any
}

class MobilePaymentService {
  private stripe: any = null
  private paymentRequest: any = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeStripe()
    }
  }

  private async initializeStripe() {
    try {
      // Load Stripe.js
      if (!window.Stripe) {
        const script = document.createElement('script')
        script.src = 'https://js.stripe.com/v3/'
        script.async = true
        document.head.appendChild(script)
        
        await new Promise((resolve) => {
          script.onload = resolve
        })
      }

      this.stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    } catch (error) {
      console.error('Failed to initialize Stripe:', error)
    }
  }

  async isApplePaySupported(): Promise<boolean> {
    if (!this.stripe) return false
    
    try {
      return await this.stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: { label: 'Test', amount: 100 },
      }).canMakePayment()?.applePay || false
    } catch {
      return false
    }
  }

  async isGooglePaySupported(): Promise<boolean> {
    if (!this.stripe) return false
    
    try {
      return await this.stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: { label: 'Test', amount: 100 },
      }).canMakePayment()?.googlePay || false
    } catch {
      return false
    }
  }

  async isPaymentRequestSupported(): Promise<boolean> {
    if (!this.stripe) return false
    
    try {
      const paymentRequest = this.stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: { label: 'Test', amount: 100 },
      })
      
      const result = await paymentRequest.canMakePayment()
      return !!result
    } catch {
      return false
    }
  }

  async createPaymentRequest(request: PaymentRequest): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized')
    }

    // Convert amounts from dollars to cents
    const total = {
      label: request.merchantName,
      amount: Math.round(request.amount * 100),
    }

    const displayItems = request.items.map(item => ({
      label: item.label,
      amount: Math.round(item.amount * 100),
    }))

    this.paymentRequest = this.stripe.paymentRequest({
      country: request.countryCode.toUpperCase(),
      currency: request.currency.toLowerCase(),
      total,
      displayItems,
      requestPayerName: request.requestPayerName || false,
      requestPayerEmail: request.requestPayerEmail || false,
      requestPayerPhone: request.requestPayerPhone || false,
      requestShipping: request.requestShipping || false,
      shippingOptions: request.shippingOptions?.map(option => ({
        id: option.id,
        label: option.label,
        amount: Math.round(option.amount * 100),
        detail: option.detail,
      })) || [],
    })

    return this.paymentRequest
  }

  async showPaymentSheet(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const paymentRequest = await this.createPaymentRequest(request)
      
      // Check if payment methods are available
      const canMakePayment = await paymentRequest.canMakePayment()
      if (!canMakePayment) {
        return {
          success: false,
          error: 'No supported payment methods available'
        }
      }

      return new Promise((resolve) => {
        paymentRequest.on('paymentmethod', async (event: any) => {
          try {
            // Here you would typically create a payment intent on your server
            // For now, we'll simulate the process
            const { paymentMethod } = event

            // Simulate server-side payment processing
            const paymentResult = await this.processPayment(paymentMethod, request.amount)

            if (paymentResult.success) {
              event.complete('success')
              resolve({
                success: true,
                paymentMethod,
                billingDetails: paymentMethod.billing_details,
              })
            } else {
              event.complete('fail')
              resolve({
                success: false,
                error: paymentResult.error || 'Payment failed'
              })
            }
          } catch (error: any) {
            event.complete('fail')
            resolve({
              success: false,
              error: error.message || 'Payment processing failed'
            })
          }
        })

        paymentRequest.on('shippingaddresschange', (event: any) => {
          // Handle shipping address changes
          event.updateWith({
            status: 'success',
            // Update shipping options based on address
          })
        })

        paymentRequest.on('cancel', () => {
          resolve({
            success: false,
            error: 'Payment cancelled by user'
          })
        })

        // Show the payment sheet
        paymentRequest.show()
      })
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to show payment sheet'
      }
    }
  }

  private async processPayment(paymentMethod: any, amount: number): Promise<PaymentResult> {
    try {
      // In a real implementation, you would:
      // 1. Send payment method to your server
      // 2. Create payment intent with Stripe
      // 3. Confirm payment
      // 4. Handle 3D Secure if needed

      const response = await fetch('/api/payments/process-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
        }),
      })

      const result = await response.json()
      
      return {
        success: result.success,
        error: result.error,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment processing failed'
      }
    }
  }

  // Web Payments API (for browsers that support it)
  async isWebPaymentsSupported(): Promise<boolean> {
    return 'PaymentRequest' in window
  }

  async showWebPaymentSheet(request: PaymentRequest): Promise<PaymentResult> {
    if (!('PaymentRequest' in window)) {
      return {
        success: false,
        error: 'Web Payments API not supported'
      }
    }

    try {
      const supportedInstruments = [
        {
          supportedMethods: 'basic-card',
          data: {
            supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'],
          },
        },
      ]

      const details = {
        total: {
          label: request.merchantName,
          amount: {
            currency: request.currency.toUpperCase(),
            value: request.amount.toFixed(2),
          },
        },
        displayItems: request.items.map(item => ({
          label: item.label,
          amount: {
            currency: request.currency.toUpperCase(),
            value: item.amount.toFixed(2),
          },
        })),
      }

      const options = {
        requestPayerName: request.requestPayerName || false,
        requestPayerEmail: request.requestPayerEmail || false,
        requestPayerPhone: request.requestPayerPhone || false,
        requestShipping: request.requestShipping || false,
      }

      const paymentRequest = new PaymentRequest(supportedInstruments, details, options)

      // Check if can make payment
      const canMakePayment = await paymentRequest.canMakePayment()
      if (!canMakePayment) {
        return {
          success: false,
          error: 'No supported payment methods available'
        }
      }

      const paymentResponse = await paymentRequest.show()
      
      // Process the payment with your server
      const result = await this.processWebPayment(paymentResponse, request.amount)
      
      if (result.success) {
        await paymentResponse.complete('success')
      } else {
        await paymentResponse.complete('fail')
      }

      return result
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Payment cancelled by user'
        }
      }
      
      return {
        success: false,
        error: error.message || 'Payment failed'
      }
    }
  }

  private async processWebPayment(paymentResponse: any, amount: number): Promise<PaymentResult> {
    try {
      // Process the payment with your backend
      const response = await fetch('/api/payments/process-web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentDetails: paymentResponse.details,
          amount: Math.round(amount * 100),
          currency: 'usd',
        }),
      })

      const result = await response.json()
      
      return {
        success: result.success,
        error: result.error,
        billingDetails: paymentResponse.payerName ? {
          name: paymentResponse.payerName,
          email: paymentResponse.payerEmail,
          phone: paymentResponse.payerPhone,
        } : undefined,
        shippingAddress: paymentResponse.shippingAddress,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment processing failed'
      }
    }
  }
}

// Singleton instance
export const mobilePayments = new MobilePaymentService()

// React hook for mobile payments
import { useState, useEffect } from 'react'

export function useMobilePayments() {
  const [isApplePaySupported, setIsApplePaySupported] = useState(false)
  const [isGooglePaySupported, setIsGooglePaySupported] = useState(false)
  const [isWebPaymentsSupported, setIsWebPaymentsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSupport = async () => {
      try {
        const [applePay, googlePay, webPayments] = await Promise.all([
          mobilePayments.isApplePaySupported(),
          mobilePayments.isGooglePaySupported(),
          mobilePayments.isWebPaymentsSupported(),
        ])

        setIsApplePaySupported(applePay)
        setIsGooglePaySupported(googlePay)
        setIsWebPaymentsSupported(webPayments)
      } catch (error) {
        console.error('Error checking payment support:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSupport()
  }, [])

  const processPayment = async (request: PaymentRequest): Promise<PaymentResult> => {
    // Try Stripe Payment Request API first (supports Apple Pay & Google Pay)
    try {
      const result = await mobilePayments.showPaymentSheet(request)
      if (result.success) return result
    } catch (error) {
      console.log('Stripe Payment Request failed, trying Web Payments API')
    }

    // Fallback to Web Payments API
    if (isWebPaymentsSupported) {
      return await mobilePayments.showWebPaymentSheet(request)
    }

    return {
      success: false,
      error: 'No supported mobile payment methods available'
    }
  }

  return {
    isApplePaySupported,
    isGooglePaySupported,
    isWebPaymentsSupported,
    isLoading,
    processPayment,
    hasAnySupport: isApplePaySupported || isGooglePaySupported || isWebPaymentsSupported,
  }
}