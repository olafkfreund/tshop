# TShop Payment Integration Requirements

> Last Updated: 2025-08-30
> Version: 1.0.0
> Platform: AI-Powered Custom Apparel E-commerce

## Overview

This document provides comprehensive payment integration requirements for TShop, an AI-powered custom apparel platform serving international markets with premium AI features, gamification, and dual fulfillment providers.

## Core Payment Architecture

### 1. Payment Gateway Selection & Setup

#### Primary Payment Processor: Stripe
**Selection Rationale:**
- Excellent international market support (EN, ES, FR, DE regions)
- Robust subscription management for premium tiers
- Advanced fraud detection and PCI compliance
- Strong mobile payment optimization
- Comprehensive webhook system
- Multi-currency support with automatic conversion

**Configuration:**
```typescript
// src/lib/stripe/config.ts
export const STRIPE_CONFIG = {
  public_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  secret_key: process.env.STRIPE_SECRET_KEY,
  webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  supported_currencies: ['USD', 'EUR', 'GBP'],
  default_currency: 'USD',
  api_version: '2024-06-20',
  features: {
    payment_methods: ['card', 'paypal', 'sepa_debit', 'ideal', 'sofort'],
    subscriptions: true,
    marketplace: false, // Future: enable for creator commissions
    connect: false,     // Future: enable for social commerce
  }
}
```

#### Secondary Payment Processor: PayPal
**Integration Purpose:**
- Backup payment processor
- Higher conversion in EU markets
- PayPal Checkout experience
- Buy Now Pay Later options

**Regional Payment Methods:**
```typescript
export const REGIONAL_PAYMENT_METHODS = {
  'US': ['card', 'paypal', 'apple_pay', 'google_pay'],
  'UK': ['card', 'paypal', 'apple_pay', 'google_pay'],
  'ES': ['card', 'paypal', 'sepa_debit', 'sofort'],
  'FR': ['card', 'paypal', 'sepa_debit', 'sofort'],
  'DE': ['card', 'paypal', 'sepa_debit', 'sofort', 'ideal'],
}
```

### 2. Checkout Flow Design

#### Mobile-Optimized Checkout Experience

**Single Page Checkout Flow:**
```typescript
// src/components/checkout/CheckoutFlow.tsx
interface CheckoutStep {
  id: 'shipping' | 'payment' | 'review'
  title: string
  component: React.ComponentType
  validation: (data: any) => boolean
}

const CHECKOUT_STEPS: CheckoutStep[] = [
  {
    id: 'shipping',
    title: 'Shipping Information', 
    component: ShippingForm,
    validation: validateShipping
  },
  {
    id: 'payment',
    title: 'Payment Method',
    component: PaymentForm, 
    validation: validatePayment
  },
  {
    id: 'review',
    title: 'Order Review',
    component: OrderReview,
    validation: validateOrder
  }
]
```

**Conversion Optimization Features:**
- Guest checkout with optional account creation
- Auto-fill shipping from geolocation
- Real-time shipping cost calculation
- Tax calculation before payment
- Order summary always visible
- Progress indicator
- Exit-intent popup with discount

**Mobile-Specific Optimizations:**
```css
/* src/styles/checkout.css */
.checkout-container {
  /* Prevent zoom on iOS form fields */
  font-size: 16px;
  
  /* Touch-optimized spacing */
  padding: 1rem;
  
  /* Sticky order summary on mobile */
  @media (max-width: 768px) {
    .order-summary {
      position: sticky;
      top: 0;
      z-index: 10;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }
  }
}

/* Touch-friendly payment method buttons */
.payment-method-button {
  min-height: 48px;
  padding: 12px 16px;
  border-radius: 8px;
  touch-action: manipulation;
}
```

### 3. Payment Methods & International Support

#### Stripe Payment Methods Integration

**Card Payments:**
```typescript
// src/components/checkout/CardPaymentForm.tsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px', // Prevent iOS zoom
      color: '#424770',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
  },
  hidePostalCode: false, // Required for international AVS
}

export const CardPaymentForm = ({ onPaymentMethod }) => {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!stripe || !elements) return

    const cardElement = elements.getElement(CardElement)
    
    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: billingData.name,
        email: billingData.email,
        address: {
          line1: billingData.address.line1,
          line2: billingData.address.line2,
          city: billingData.address.city,
          state: billingData.address.state,
          postal_code: billingData.address.postal_code,
          country: billingData.address.country,
        },
      },
    })

    if (error) {
      handlePaymentError(error)
    } else {
      onPaymentMethod(paymentMethod)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-md">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      <button 
        type="submit" 
        disabled={!stripe}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium disabled:opacity-50"
      >
        Complete Payment
      </button>
    </form>
  )
}
```

**Digital Wallets:**
```typescript
// src/components/checkout/DigitalWallets.tsx
export const DigitalWallets = ({ paymentRequest }) => {
  const [canMakePayment, setCanMakePayment] = useState(false)
  
  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.canMakePayment().then(setCanMakePayment)
    }
  }, [paymentRequest])

  if (!canMakePayment) return null

  return (
    <div className="space-y-3 mb-4">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'buy',
              theme: 'dark',
              height: '48px',
            },
          },
        }}
      />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or pay with card</span>
        </div>
      </div>
    </div>
  )
}
```

#### Regional Payment Method Implementation

**SEPA Direct Debit (EU):**
```typescript
// src/components/checkout/SepaPayment.tsx
export const SepaPayment = ({ onPaymentMethod }) => {
  const stripe = useStripe()
  const elements = useElements()

  const handleSepaPayment = async (formData) => {
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'sepa_debit',
      sepa_debit: elements.getElement(IbanElement),
      billing_details: {
        name: formData.accountHolder,
        email: formData.email,
      },
    })

    if (!error) {
      onPaymentMethod(paymentMethod)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Holder Name
        </label>
        <input
          type="text"
          required
          className="w-full p-3 border border-gray-300 rounded-md"
          placeholder="John Doe"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          IBAN
        </label>
        <div className="p-3 border border-gray-300 rounded-md">
          <IbanElement 
            options={{
              supportedCountries: ['SEPA'],
              placeholderCountry: 'DE',
            }}
          />
        </div>
      </div>

      <div className="text-xs text-gray-600">
        By providing your payment information, you authorize TShop to debit your account.
      </div>
    </div>
  )
}
```

### 4. Pricing Strategy Implementation

#### Dynamic Pricing Engine

**Multi-Currency Support:**
```typescript
// src/lib/pricing/currency.ts
export class CurrencyManager {
  private exchangeRates: Map<string, number> = new Map()
  private lastUpdate: Date = new Date(0)
  
  constructor(private baseCurrency: string = 'USD') {}

  async getExchangeRates(): Promise<void> {
    if (Date.now() - this.lastUpdate.getTime() < 3600000) return // 1 hour cache
    
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${this.baseCurrency}`)
      const data = await response.json()
      
      Object.entries(data.rates).forEach(([currency, rate]) => {
        this.exchangeRates.set(currency, rate as number)
      })
      
      this.lastUpdate = new Date()
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
    }
  }

  convertPrice(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount
    
    const fromRate = this.exchangeRates.get(fromCurrency) || 1
    const toRate = this.exchangeRates.get(toCurrency) || 1
    
    // Convert to base currency, then to target currency
    const baseAmount = amount / fromRate
    return Math.round(baseAmount * toRate * 100) / 100 // Round to 2 decimals
  }

  formatCurrency(amount: number, currency: string, locale: string): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }
}
```

**AI Usage Pricing Integration:**
```typescript
// src/lib/pricing/ai-usage.ts
export interface AIUsagePricing {
  tier: 'free' | 'basic' | 'premium' | 'enterprise'
  monthlyGenerations: number
  overageRate: number // per generation
  features: string[]
}

export const AI_PRICING_TIERS: Record<string, AIUsagePricing> = {
  free: {
    tier: 'free',
    monthlyGenerations: 5,
    overageRate: 0.50,
    features: ['Basic AI prompts', 'Standard quality']
  },
  basic: {
    tier: 'basic', 
    monthlyGenerations: 50,
    overageRate: 0.25,
    features: ['Advanced prompts', 'High quality', 'Style transfer']
  },
  premium: {
    tier: 'premium',
    monthlyGenerations: 200,
    overageRate: 0.10,
    features: ['All features', 'Priority generation', 'Commercial use']
  },
  enterprise: {
    tier: 'enterprise',
    monthlyGenerations: 1000,
    overageRate: 0.05,
    features: ['Unlimited features', 'API access', 'White label']
  }
}

export const calculateAIUsageCost = (
  currentUsage: number,
  tier: AIUsagePricing
): { includedCost: number; overageCost: number; totalCost: number } => {
  const overage = Math.max(0, currentUsage - tier.monthlyGenerations)
  const overageCost = overage * tier.overageRate
  
  return {
    includedCost: 0, // Included in subscription
    overageCost,
    totalCost: overageCost
  }
}
```

**Tax Calculation System:**
```typescript
// src/lib/pricing/tax.ts
export interface TaxCalculation {
  subtotal: number
  taxAmount: number
  taxRate: number
  taxType: 'VAT' | 'GST' | 'Sales Tax'
  total: number
}

export class TaxCalculator {
  private taxRates: Map<string, number> = new Map([
    // EU VAT rates
    ['DE', 0.19], // Germany 19%
    ['FR', 0.20], // France 20%
    ['ES', 0.21], // Spain 21%
    ['IT', 0.22], // Italy 22%
    
    // Other regions
    ['US', 0.00], // Handled by state-level calculation
    ['GB', 0.20], // UK VAT 20%
    ['CA', 0.13], // Canada average GST+PST
  ])

  async calculateTax(
    subtotal: number,
    shippingAddress: Address,
    billingAddress: Address
  ): Promise<TaxCalculation> {
    const taxCountry = shippingAddress.country || billingAddress.country
    const baseRate = this.taxRates.get(taxCountry) || 0
    
    let finalRate = baseRate
    let taxType: TaxCalculation['taxType'] = 'Sales Tax'
    
    // EU VAT logic
    if (this.isEUCountry(taxCountry)) {
      taxType = 'VAT'
      // Digital services VAT based on customer location
      finalRate = this.taxRates.get(taxCountry) || 0.20
    }
    
    // US state tax (if applicable)
    if (taxCountry === 'US') {
      finalRate = await this.getUSStateTax(shippingAddress.state)
    }
    
    const taxAmount = subtotal * finalRate
    
    return {
      subtotal,
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate: finalRate,
      taxType,
      total: subtotal + taxAmount
    }
  }

  private isEUCountry(country: string): boolean {
    const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
    return euCountries.includes(country)
  }

  private async getUSStateTax(state: string): Promise<number> {
    // Integration with tax API service like TaxJar or Avalara
    // Simplified for example
    const stateTaxRates: Record<string, number> = {
      'CA': 0.0775, // California
      'NY': 0.08,   // New York
      'TX': 0.0625, // Texas
      'FL': 0.06,   // Florida
      // ... other states
    }
    
    return stateTaxRates[state] || 0
  }
}
```

### 5. Subscription & Tier Management

#### Premium Tier Subscription System

**Subscription Plans:**
```typescript
// src/lib/subscriptions/plans.ts
export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  aiGenerations: number
  features: string[]
  stripeProductId: string
  stripePriceId: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic Plan',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    aiGenerations: 50,
    features: [
      '50 AI generations per month',
      'High-quality designs',
      'Style transfer',
      'Email support'
    ],
    stripeProductId: 'prod_basic',
    stripePriceId: 'price_basic_monthly'
  },
  {
    id: 'premium-monthly',
    name: 'Premium Plan', 
    price: 24.99,
    currency: 'USD',
    interval: 'month',
    aiGenerations: 200,
    features: [
      '200 AI generations per month',
      'All design features',
      'Priority generation queue',
      'Commercial use license',
      'Priority support'
    ],
    stripeProductId: 'prod_premium',
    stripePriceId: 'price_premium_monthly'
  },
  {
    id: 'premium-yearly',
    name: 'Premium Plan (Annual)',
    price: 249.99, // 2 months free
    currency: 'USD', 
    interval: 'year',
    aiGenerations: 200,
    features: [
      '200 AI generations per month',
      'All premium features',
      '2 months free',
      'Annual billing discount'
    ],
    stripeProductId: 'prod_premium',
    stripePriceId: 'price_premium_yearly'
  }
]
```

**Subscription Management:**
```typescript
// src/lib/subscriptions/manager.ts
export class SubscriptionManager {
  constructor(private stripe: Stripe) {}

  async createSubscription(
    customerId: string,
    priceId: string,
    paymentMethodId: string
  ): Promise<Stripe.Subscription> {
    try {
      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      })

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      })

      return subscription
    } catch (error) {
      console.error('Subscription creation failed:', error)
      throw error
    }
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
    
    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    })
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    if (cancelAtPeriodEnd) {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    } else {
      return await this.stripe.subscriptions.cancel(subscriptionId)
    }
  }

  async getUsageBasedBilling(
    subscriptionItemId: string,
    usage: number
  ): Promise<void> {
    // For AI overage charges
    await this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity: usage,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'set', // Set to exact usage count
    })
  }
}
```

#### Points System Integration

**Gamification Points Economy:**
```typescript
// src/lib/gamification/points.ts
export interface PointsTransaction {
  id: string
  userId: string
  amount: number
  type: 'earn' | 'spend' | 'bonus'
  source: 'purchase' | 'referral' | 'social_share' | 'review' | 'daily_login'
  description: string
  metadata?: Record<string, any>
  createdAt: Date
}

export const POINTS_RULES = {
  // Earning points
  PURCHASE_MULTIPLIER: 1, // 1 point per $1 spent
  REFERRAL_BONUS: 500,    // 500 points for successful referral
  SOCIAL_SHARE: 50,       // 50 points per social share
  REVIEW_BONUS: 100,      // 100 points per product review
  DAILY_LOGIN: 10,        // 10 points per daily login
  
  // Spending points
  DISCOUNT_RATE: 100,     // 100 points = $1 discount
  MIN_REDEMPTION: 500,    // Minimum 500 points to redeem
  MAX_DISCOUNT_PERCENT: 50, // Max 50% discount with points
}

export class PointsManager {
  async earnPoints(
    userId: string,
    amount: number,
    source: PointsTransaction['source'],
    metadata?: Record<string, any>
  ): Promise<PointsTransaction> {
    const transaction: PointsTransaction = {
      id: generateId(),
      userId,
      amount,
      type: 'earn',
      source,
      description: this.getEarnDescription(source, amount),
      metadata,
      createdAt: new Date(),
    }

    // Store transaction
    await this.storeTransaction(transaction)
    
    // Update user total points
    await this.updateUserPoints(userId, amount)
    
    return transaction
  }

  async spendPoints(
    userId: string,
    amount: number,
    orderId: string
  ): Promise<{ success: boolean; discountAmount: number }> {
    const userPoints = await this.getUserPoints(userId)
    
    if (userPoints < amount) {
      return { success: false, discountAmount: 0 }
    }

    const discountAmount = amount / POINTS_RULES.DISCOUNT_RATE
    
    const transaction: PointsTransaction = {
      id: generateId(),
      userId,
      amount: -amount, // Negative for spending
      type: 'spend',
      source: 'purchase',
      description: `Redeemed ${amount} points for $${discountAmount} discount`,
      metadata: { orderId },
      createdAt: new Date(),
    }

    await this.storeTransaction(transaction)
    await this.updateUserPoints(userId, -amount)
    
    return { success: true, discountAmount }
  }

  calculatePointsDiscount(points: number, orderTotal: number): number {
    const maxDiscount = orderTotal * (POINTS_RULES.MAX_DISCOUNT_PERCENT / 100)
    const pointsValue = points / POINTS_RULES.DISCOUNT_RATE
    
    return Math.min(pointsValue, maxDiscount)
  }
}
```

### 6. Security & Compliance

#### PCI DSS Compliance Implementation

**Security Headers and Configuration:**
```typescript
// next.config.js - Security headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.stripe.com https://checkout.stripe.com;
      frame-src https://js.stripe.com https://checkout.stripe.com;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options', 
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]
```

**Data Protection and Encryption:**
```typescript
// src/lib/security/encryption.ts
import crypto from 'crypto'

export class PaymentDataEncryption {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32
  
  constructor(private encryptionKey: string) {
    if (!encryptionKey || encryptionKey.length < this.keyLength) {
      throw new Error('Invalid encryption key')
    }
  }

  encryptSensitiveData(data: string): { 
    encrypted: string; 
    iv: string; 
    tag: string 
  } {
    const iv = crypto.randomBytes(16)
    const key = crypto.scryptSync(this.encryptionKey, 'salt', this.keyLength)
    
    const cipher = crypto.createCipher(this.algorithm, key)
    cipher.setAAD(Buffer.from('payment-data'))
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  }

  decryptSensitiveData(
    encrypted: string, 
    iv: string, 
    tag: string
  ): string {
    const key = crypto.scryptSync(this.encryptionKey, 'salt', this.keyLength)
    
    const decipher = crypto.createDecipher(this.algorithm, key)
    decipher.setAuthTag(Buffer.from(tag, 'hex'))
    decipher.setAAD(Buffer.from('payment-data'))
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

// Never store card data - use Stripe tokens only
export const sanitizePaymentData = (paymentData: any) => {
  // Remove any sensitive fields that should not be stored
  const { 
    cardNumber, 
    cvv, 
    expiryDate, 
    ...safeToPersist 
  } = paymentData
  
  return {
    ...safeToPersist,
    // Only store last 4 digits for display
    lastFour: cardNumber ? cardNumber.slice(-4) : null,
    // Store payment method ID from Stripe instead
    paymentMethodId: paymentData.stripePaymentMethodId
  }
}
```

#### Fraud Prevention

**Risk Assessment System:**
```typescript
// src/lib/security/fraud-prevention.ts
export interface RiskAssessment {
  score: number // 0-100, higher = more risky
  factors: string[]
  action: 'approve' | 'review' | 'decline'
  details: Record<string, any>
}

export class FraudPrevention {
  async assessOrderRisk(orderData: {
    amount: number
    currency: string
    customerEmail: string
    ipAddress: string
    billingAddress: Address
    shippingAddress: Address
    paymentMethodId: string
    customerHistory?: any
  }): Promise<RiskAssessment> {
    let riskScore = 0
    const riskFactors: string[] = []
    const details: Record<string, any> = {}

    // Amount-based risk
    if (orderData.amount > 500) {
      riskScore += 20
      riskFactors.push('High order value')
    }

    // Geolocation risk
    const billingCountry = orderData.billingAddress.country
    const shippingCountry = orderData.shippingAddress.country
    
    if (billingCountry !== shippingCountry) {
      riskScore += 15
      riskFactors.push('Billing/shipping country mismatch')
    }

    // IP geolocation check
    const ipCountry = await this.getCountryFromIP(orderData.ipAddress)
    if (ipCountry !== billingCountry) {
      riskScore += 10
      riskFactors.push('IP/billing country mismatch')
    }

    // Velocity checks
    const recentOrders = await this.getRecentOrders(orderData.customerEmail)
    if (recentOrders.length > 3) {
      riskScore += 25
      riskFactors.push('High order velocity')
    }

    // Email domain analysis
    const emailDomain = orderData.customerEmail.split('@')[1]
    if (this.isDisposableEmail(emailDomain)) {
      riskScore += 30
      riskFactors.push('Disposable email domain')
    }

    // Stripe Radar integration
    const stripeRisk = await this.getStripeRiskAssessment(orderData.paymentMethodId)
    riskScore += stripeRisk.score
    riskFactors.push(...stripeRisk.factors)

    // Determine action
    let action: RiskAssessment['action'] = 'approve'
    if (riskScore > 70) {
      action = 'decline'
    } else if (riskScore > 40) {
      action = 'review'
    }

    return {
      score: Math.min(riskScore, 100),
      factors: riskFactors,
      action,
      details: {
        ipCountry,
        recentOrderCount: recentOrders.length,
        stripeRisk
      }
    }
  }

  private async getStripeRiskAssessment(paymentMethodId: string) {
    // Integration with Stripe Radar
    // This would use Stripe's fraud detection APIs
    return {
      score: 0, // Stripe provides risk scores
      factors: [] // Stripe provides risk indicators
    }
  }

  private isDisposableEmail(domain: string): boolean {
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      // ... more disposable domains
    ]
    
    return disposableDomains.includes(domain.toLowerCase())
  }
}
```

### 7. Order Processing Workflow

#### Payment Confirmation Flow

**Order State Management:**
```typescript
// src/lib/orders/state-machine.ts
export type OrderStatus = 
  | 'pending'           // Order created, payment not confirmed
  | 'payment_processing' // Payment being processed
  | 'payment_failed'    // Payment failed
  | 'paid'             // Payment confirmed
  | 'fulfillment_pending' // Sent to fulfillment provider
  | 'in_production'    // Being manufactured
  | 'shipped'          // Shipped to customer
  | 'delivered'        // Delivered to customer
  | 'cancelled'        // Order cancelled
  | 'refunded'         // Order refunded

export interface OrderStatusTransition {
  from: OrderStatus
  to: OrderStatus
  trigger: string
  handler: (order: Order) => Promise<void>
}

export const ORDER_STATUS_TRANSITIONS: OrderStatusTransition[] = [
  {
    from: 'pending',
    to: 'payment_processing',
    trigger: 'PAYMENT_INITIATED',
    handler: async (order) => {
      await notifyPaymentProcessing(order)
    }
  },
  {
    from: 'payment_processing',
    to: 'paid',
    trigger: 'PAYMENT_SUCCEEDED',
    handler: async (order) => {
      await triggerFulfillment(order)
      await updateUserPoints(order.userId, order.pointsEarned)
      await sendOrderConfirmation(order)
    }
  },
  {
    from: 'paid',
    to: 'fulfillment_pending',
    trigger: 'FULFILLMENT_REQUESTED',
    handler: async (order) => {
      await sendToPrintfulOrPrintify(order)
    }
  },
  // ... more transitions
]
```

**Fulfillment Integration:**
```typescript
// src/lib/fulfillment/provider-router.ts
export interface FulfillmentProvider {
  name: 'printful' | 'printify'
  createOrder(orderData: OrderData): Promise<FulfillmentResponse>
  getShippingRates(items: OrderItem[]): Promise<ShippingRate[]>
  trackOrder(fulfillmentOrderId: string): Promise<TrackingInfo>
}

export class FulfillmentRouter {
  constructor(
    private printful: PrintfulProvider,
    private printify: PrintifyProvider
  ) {}

  selectProvider(order: Order): FulfillmentProvider {
    // Route based on product type, cost, or customer preference
    const hasPremiumItems = order.items.some(item => item.tier === 'premium')
    
    if (hasPremiumItems || order.customer.tier === 'premium') {
      return this.printful // Higher quality for premium
    }
    
    return this.printify // Cost-effective for standard orders
  }

  async processOrder(order: Order): Promise<FulfillmentResponse> {
    const provider = this.selectProvider(order)
    
    try {
      const fulfillmentOrder = await provider.createOrder({
        externalId: order.id,
        recipient: order.shippingAddress,
        items: order.items.map(item => ({
          variantId: item.fulfillmentVariantId,
          quantity: item.quantity,
          files: item.designFiles,
        }))
      })

      // Update order with fulfillment details
      await updateOrder(order.id, {
        fulfillmentProvider: provider.name,
        fulfillmentOrderId: fulfillmentOrder.id,
        status: 'fulfillment_pending'
      })

      return fulfillmentOrder
    } catch (error) {
      console.error(`Fulfillment failed for order ${order.id}:`, error)
      
      // Try fallback provider
      const fallbackProvider = provider === this.printful ? this.printify : this.printful
      return await fallbackProvider.createOrder(order)
    }
  }
}
```

### 8. Webhook Management

#### Comprehensive Webhook Handler

**Stripe Webhook Processing:**
```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Webhook handler failed for ${event.type}:`, error)
    return NextResponse.json(
      { error: 'Webhook handler failed' }, 
      { status: 500 }
    )
  }
}

// Webhook handlers
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId
  if (!orderId) return

  // Update order status
  await updateOrder(orderId, {
    status: 'paid',
    paymentIntentId: paymentIntent.id,
    paidAt: new Date(),
  })

  // Trigger fulfillment
  const order = await getOrder(orderId)
  await triggerFulfillment(order)
  
  // Award points for purchase
  const pointsEarned = Math.floor(order.total * POINTS_RULES.PURCHASE_MULTIPLIER)
  await earnPoints(order.userId, pointsEarned, 'purchase', { orderId })
  
  // Send confirmation email
  await sendOrderConfirmationEmail(order)
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const user = await getUserByStripeCustomerId(customerId)
  
  if (user) {
    await updateUser(user.id, {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPlan: subscription.items.data[0].price.id,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    })

    // Reset AI generation count for new billing period
    await resetAIGenerationCount(user.id)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  const user = await getUserBySubscriptionId(subscriptionId)
  
  if (user) {
    // Notify user of payment failure
    await sendPaymentFailureEmail(user, invoice)
    
    // Implement grace period or immediate restriction
    const daysSinceFailure = Math.floor(
      (Date.now() - invoice.created * 1000) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceFailure >= 3) {
      // Restrict access after 3-day grace period
      await updateUser(user.id, {
        subscriptionStatus: 'past_due',
        accessRestricted: true,
      })
    }
  }
}
```

#### Fulfillment Webhook Handling

**Printful/Printify Webhook Integration:**
```typescript
// src/app/api/webhooks/fulfillment/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const provider = request.nextUrl.searchParams.get('provider') as 'printful' | 'printify'
  
  if (!provider) {
    return NextResponse.json({ error: 'Provider not specified' }, { status: 400 })
  }

  try {
    switch (body.type) {
      case 'order_created':
        await handleFulfillmentOrderCreated(body, provider)
        break
        
      case 'order_shipped':
        await handleFulfillmentOrderShipped(body, provider)
        break
        
      case 'order_delivered':
        await handleFulfillmentOrderDelivered(body, provider)
        break
        
      case 'order_failed':
        await handleFulfillmentOrderFailed(body, provider)
        break

      default:
        console.log(`Unhandled fulfillment event: ${body.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Fulfillment webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    )
  }
}

async function handleFulfillmentOrderShipped(webhookData: any, provider: string) {
  const externalOrderId = webhookData.order?.external_id
  if (!externalOrderId) return

  const trackingInfo = {
    carrier: webhookData.shipment?.carrier,
    trackingNumber: webhookData.shipment?.tracking_number,
    trackingUrl: webhookData.shipment?.tracking_url,
  }

  // Update order status
  await updateOrder(externalOrderId, {
    status: 'shipped',
    shippedAt: new Date(),
    trackingInfo,
  })

  // Notify customer
  const order = await getOrder(externalOrderId)
  await sendShippingNotificationEmail(order, trackingInfo)
  
  // Award bonus points for successful order completion
  await earnPoints(order.userId, 50, 'purchase', { 
    orderId: externalOrderId,
    milestone: 'shipped' 
  })
}
```

### 9. Refunds & Disputes

#### Automated Refund Processing

**Refund Management System:**
```typescript
// src/lib/refunds/manager.ts
export interface RefundRequest {
  id: string
  orderId: string
  userId: string
  amount: number
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'customer_request' | 'duplicate_order'
  status: 'pending' | 'approved' | 'processed' | 'rejected'
  requestedAt: Date
  processedAt?: Date
  notes?: string
}

export class RefundManager {
  async processRefundRequest(
    refundRequest: RefundRequest
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    const order = await getOrder(refundRequest.orderId)
    
    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Check refund eligibility
    const eligibility = await this.checkRefundEligibility(order, refundRequest)
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason }
    }

    try {
      // Process Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        amount: Math.round(refundRequest.amount * 100), // Convert to cents
        reason: this.mapRefundReason(refundRequest.reason),
        metadata: {
          orderId: order.id,
          userId: refundRequest.userId,
          refundRequestId: refundRequest.id,
        }
      })

      // Update order status
      await updateOrder(order.id, {
        status: 'refunded',
        refundAmount: refundRequest.amount,
        refundedAt: new Date(),
        refundId: refund.id,
      })

      // Reverse points if applicable
      await this.reversePointsEarned(order)

      // Cancel fulfillment if not shipped
      if (order.status !== 'shipped' && order.status !== 'delivered') {
        await this.cancelFulfillment(order)
      }

      // Send confirmation email
      await sendRefundConfirmationEmail(order, refund)

      return { success: true, refundId: refund.id }
    } catch (error) {
      console.error('Refund processing failed:', error)
      return { success: false, error: 'Refund processing failed' }
    }
  }

  private async checkRefundEligibility(
    order: Order, 
    refundRequest: RefundRequest
  ): Promise<{ eligible: boolean; reason?: string }> {
    // Check if order is too old (30-day policy)
    const daysSinceOrder = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceOrder > 30) {
      return { eligible: false, reason: 'Order is older than 30 days' }
    }

    // Check if already refunded
    if (order.status === 'refunded') {
      return { eligible: false, reason: 'Order already refunded' }
    }

    // Check custom design restrictions
    if (order.items.some(item => item.isCustomDesign) && 
        refundRequest.reason === 'customer_request') {
      return { eligible: false, reason: 'Custom designs not eligible for customer-requested refunds' }
    }

    // Check if fulfillment allows cancellation
    if (order.status === 'in_production') {
      const canCancel = await this.checkFulfillmentCancellation(order)
      if (!canCancel) {
        return { eligible: false, reason: 'Order is in production and cannot be cancelled' }
      }
    }

    return { eligible: true }
  }

  private async reversePointsEarned(order: Order): Promise<void> {
    const pointsToReverse = Math.floor(order.total * POINTS_RULES.PURCHASE_MULTIPLIER)
    
    await spendPoints(order.userId, pointsToReverse, order.id)
    
    // Create reverse transaction record
    await createPointsTransaction({
      userId: order.userId,
      amount: -pointsToReverse,
      type: 'spend',
      source: 'purchase',
      description: `Points reversed due to refund for order ${order.id}`,
      metadata: { orderId: order.id, isReversal: true }
    })
  }
}
```

#### Chargeback Management

**Dispute Handling System:**
```typescript
// src/lib/disputes/manager.ts
export interface DisputeData {
  id: string
  chargeId: string
  orderId: string
  amount: number
  currency: string
  reason: string
  status: 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'needs_response' | 'under_review' | 'charge_refunded' | 'won' | 'lost'
  evidenceSubmissionDue?: Date
  createdAt: Date
}

export class DisputeManager {
  async handleDisputeCreated(stripeDispute: Stripe.Dispute): Promise<void> {
    const orderId = stripeDispute.charge?.metadata?.orderId
    if (!orderId) return

    const dispute: DisputeData = {
      id: stripeDispute.id,
      chargeId: stripeDispute.charge as string,
      orderId,
      amount: stripeDispute.amount / 100, // Convert from cents
      currency: stripeDispute.currency,
      reason: stripeDispute.reason,
      status: stripeDispute.status as DisputeData['status'],
      evidenceSubmissionDue: stripeDispute.evidence_details?.due_by ? 
        new Date(stripeDispute.evidence_details.due_by * 1000) : undefined,
      createdAt: new Date(stripeDispute.created * 1000),
    }

    // Store dispute record
    await storeDispute(dispute)

    // Automatically gather evidence
    const evidence = await this.gatherDisputeEvidence(orderId)
    
    // Submit evidence to Stripe
    if (evidence) {
      await this.submitDisputeEvidence(stripeDispute.id, evidence)
    }

    // Notify admin team
    await notifyDisputeCreated(dispute, evidence)
  }

  private async gatherDisputeEvidence(orderId: string): Promise<Stripe.DisputeEvidence | null> {
    const order = await getOrder(orderId)
    if (!order) return null

    const evidence: Partial<Stripe.DisputeEvidence> = {}

    // Customer communication
    const emails = await getCustomerEmails(order.userId)
    if (emails.length > 0) {
      evidence.customer_communication = emails.map(email => 
        `${email.subject}: ${email.body}`
      ).join('\n\n')
    }

    // Shipping documentation
    if (order.trackingInfo?.trackingNumber) {
      evidence.shipping_carrier = order.trackingInfo.carrier
      evidence.shipping_tracking_number = order.trackingInfo.trackingNumber
      
      // Get delivery confirmation if available
      const deliveryInfo = await getDeliveryConfirmation(order.trackingInfo.trackingNumber)
      if (deliveryInfo?.delivered) {
        evidence.shipping_date = deliveryInfo.deliveredDate.toISOString()
        evidence.shipping_address = formatAddress(order.shippingAddress)
      }
    }

    // Service documentation for digital/custom designs
    if (order.items.some(item => item.isCustomDesign)) {
      evidence.service_documentation = `Custom design service provided. Design files created and approved by customer on ${order.createdAt.toISOString()}.`
      
      // Include design approval records
      const approvals = await getDesignApprovals(orderId)
      if (approvals.length > 0) {
        evidence.service_date = approvals[0].approvedAt.toISOString()
      }
    }

    // Receipt and order documentation
    evidence.receipt = await generateOrderReceiptPDF(order)
    
    return evidence as Stripe.DisputeEvidence
  }

  private async submitDisputeEvidence(
    disputeId: string, 
    evidence: Stripe.DisputeEvidence
  ): Promise<void> {
    try {
      await stripe.disputes.update(disputeId, {
        evidence,
        submit: true, // Automatically submit the evidence
      })

      console.log(`Evidence submitted for dispute ${disputeId}`)
    } catch (error) {
      console.error(`Failed to submit evidence for dispute ${disputeId}:`, error)
    }
  }
}
```

### 10. Analytics & Reporting

#### Revenue Analytics Dashboard

**Payment Metrics Collection:**
```typescript
// src/lib/analytics/payment-metrics.ts
export interface PaymentMetrics {
  totalRevenue: number
  orderCount: number
  averageOrderValue: number
  conversionRate: number
  abandonmentRate: number
  refundRate: number
  chargebackRate: number
  subscriptionRevenue: number
  subscriptionChurn: number
  paymentMethodBreakdown: Record<string, number>
  regionalBreakdown: Record<string, number>
  dateRange: { start: Date; end: Date }
}

export class PaymentAnalytics {
  async generatePaymentMetrics(
    startDate: Date, 
    endDate: Date
  ): Promise<PaymentMetrics> {
    const [
      revenue,
      orders,
      conversions,
      refunds,
      chargebacks,
      subscriptions
    ] = await Promise.all([
      this.getRevenueData(startDate, endDate),
      this.getOrderData(startDate, endDate), 
      this.getConversionData(startDate, endDate),
      this.getRefundData(startDate, endDate),
      this.getChargebackData(startDate, endDate),
      this.getSubscriptionData(startDate, endDate)
    ])

    return {
      totalRevenue: revenue.total,
      orderCount: orders.count,
      averageOrderValue: revenue.total / orders.count,
      conversionRate: conversions.rate,
      abandonmentRate: conversions.abandonmentRate,
      refundRate: refunds.rate,
      chargebackRate: chargebacks.rate,
      subscriptionRevenue: subscriptions.revenue,
      subscriptionChurn: subscriptions.churnRate,
      paymentMethodBreakdown: revenue.byPaymentMethod,
      regionalBreakdown: revenue.byRegion,
      dateRange: { start: startDate, end: endDate }
    }
  }

  async trackCheckoutStep(
    sessionId: string,
    step: 'initiated' | 'shipping' | 'payment' | 'review' | 'completed' | 'abandoned',
    metadata?: Record<string, any>
  ): Promise<void> {
    const event = {
      sessionId,
      step,
      timestamp: new Date(),
      metadata
    }

    // Store in analytics database
    await storeCheckoutEvent(event)
    
    // Send to external analytics if configured
    if (process.env.GOOGLE_ANALYTICS_ID) {
      await this.sendToGoogleAnalytics(event)
    }
  }

  private async sendToGoogleAnalytics(event: any): Promise<void> {
    // Google Analytics 4 Enhanced Ecommerce tracking
    const gaEvent = {
      client_id: event.sessionId,
      events: [{
        name: 'checkout_progress',
        params: {
          checkout_step: event.step,
          checkout_option: event.metadata?.paymentMethod,
          value: event.metadata?.amount,
          currency: event.metadata?.currency,
          items: event.metadata?.items?.map((item: any) => ({
            item_id: item.id,
            item_name: item.name,
            category: item.category,
            quantity: item.quantity,
            price: item.price,
          }))
        }
      }]
    }

    try {
      await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GOOGLE_ANALYTICS_ID}&api_secret=${process.env.GOOGLE_ANALYTICS_SECRET}`, {
        method: 'POST',
        body: JSON.stringify(gaEvent)
      })
    } catch (error) {
      console.error('Failed to send GA event:', error)
    }
  }
}
```

**Revenue Reporting API:**
```typescript
// src/app/api/admin/analytics/revenue/route.ts
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const session = await getAdminSession(request)
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = new Date(searchParams.get('startDate') || '')
  const endDate = new Date(searchParams.get('endDate') || '')
  const groupBy = searchParams.get('groupBy') || 'day' // day, week, month

  try {
    const analytics = new PaymentAnalytics()
    const metrics = await analytics.generatePaymentMetrics(startDate, endDate)
    
    // Additional breakdowns
    const timeSeriesData = await analytics.getTimeSeriesRevenue(startDate, endDate, groupBy)
    const cohortAnalysis = await analytics.getSubscriptionCohorts(startDate, endDate)
    const customerSegments = await analytics.getRevenueBySegment(startDate, endDate)

    return NextResponse.json({
      summary: metrics,
      timeSeries: timeSeriesData,
      cohorts: cohortAnalysis,
      segments: customerSegments,
    })
  } catch (error) {
    console.error('Analytics generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' }, 
      { status: 500 }
    )
  }
}
```

## Implementation Roadmap

### Phase 1: Core Payment Infrastructure (Weeks 1-3)
1. **Stripe Integration Setup**
   - Payment processing for one-time purchases
   - Basic webhook handling
   - Currency conversion
   - Tax calculation

2. **Checkout Flow Implementation**
   - Mobile-optimized checkout UI
   - Guest checkout option
   - Payment method selection
   - Order confirmation

3. **Security Foundation**
   - PCI compliance setup
   - Data encryption
   - Security headers
   - Basic fraud prevention

### Phase 2: Subscription & Advanced Features (Weeks 4-6)
1. **Subscription Management**
   - Premium tier subscriptions
   - AI usage tracking and billing
   - Subscription upgrades/downgrades
   - Prorated billing

2. **Points System Integration**
   - Points earning on purchases
   - Points redemption at checkout
   - Gamification features
   - Social sharing rewards

3. **International Expansion**
   - Regional payment methods
   - Multi-currency support
   - EU VAT compliance
   - Localized checkout experience

### Phase 3: Fulfillment & Order Management (Weeks 7-9)
1. **Fulfillment Integration**
   - Printful/Printify API integration
   - Provider routing logic
   - Order status tracking
   - Shipping notifications

2. **Order Processing Automation**
   - Webhook-driven state machine
   - Automated fulfillment triggers
   - Customer communication
   - Inventory management

3. **Refund & Dispute Management**
   - Automated refund processing
   - Return policy enforcement
   - Chargeback evidence collection
   - Customer service integration

### Phase 4: Analytics & Optimization (Weeks 10-12)
1. **Payment Analytics**
   - Revenue tracking and reporting
   - Conversion rate optimization
   - Payment method analysis
   - Regional performance metrics

2. **Advanced Security**
   - Enhanced fraud detection
   - Risk scoring improvements
   - Machine learning integration
   - Compliance auditing

3. **Performance Optimization**
   - Checkout speed optimization
   - Mobile payment enhancements
   - A/B testing framework
   - Monitoring and alerting

## Testing Strategy

### Payment Testing Framework
```typescript
// tests/payments/checkout.test.ts
describe('Checkout Flow', () => {
  beforeEach(async () => {
    // Setup test Stripe account
    await setupTestStripeAccount()
    await seedTestProducts()
  })

  describe('Card Payments', () => {
    test('successful payment with valid card', async () => {
      const { page } = await createTestBrowser()
      
      // Add item to cart
      await page.goto('/products/test-tshirt')
      await page.click('[data-testid="add-to-cart"]')
      
      // Go to checkout
      await page.click('[data-testid="checkout-button"]')
      
      // Fill shipping information
      await fillShippingForm(page, validShippingData)
      
      // Fill payment information
      await fillCardDetails(page, testCards.visa)
      
      // Complete payment
      await page.click('[data-testid="complete-payment"]')
      
      // Verify success
      await expect(page.locator('[data-testid="order-success"]')).toBeVisible()
      
      // Verify order in database
      const order = await getOrderByTestId(page.testId)
      expect(order.status).toBe('paid')
    })

    test('failed payment with declined card', async () => {
      // Similar test with declined card
      await fillCardDetails(page, testCards.declined)
      await page.click('[data-testid="complete-payment"]')
      
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible()
    })
  })

  describe('Subscription Payments', () => {
    test('successful subscription creation', async () => {
      // Test subscription flow
    })

    test('subscription upgrade flow', async () => {
      // Test tier upgrades
    })
  })

  describe('International Payments', () => {
    test('SEPA payment in EU', async () => {
      // Test European payment methods
    })

    test('currency conversion', async () => {
      // Test multi-currency checkout
    })
  })
})
```

## Security Checklist

- [ ] PCI DSS compliance configured
- [ ] All payment data encrypted in transit and at rest
- [ ] Security headers implemented
- [ ] CSRF protection enabled
- [ ] Rate limiting on payment endpoints
- [ ] Fraud detection rules configured
- [ ] Webhook signature verification
- [ ] Admin access controls
- [ ] Payment method validation
- [ ] Address verification (AVS) enabled
- [ ] CVV verification required
- [ ] 3D Secure for EU cards
- [ ] Regular security audits scheduled

## Monitoring & Alerting

### Key Metrics to Monitor
- Payment success/failure rates
- Checkout abandonment rates
- Average response times
- Fraud detection alerts
- Subscription churn rates
- Refund/chargeback rates
- Revenue targets vs actuals
- System uptime and availability

### Alert Thresholds
- Payment failure rate > 5%
- Checkout abandonment > 70%
- Response time > 3 seconds
- Fraud score > threshold
- Subscription cancellations spike
- Revenue drop > 20%
- System errors > 1% of requests

This comprehensive payment integration specification provides TShop with a robust, secure, and scalable payment system that supports international growth, AI features, gamification, and complex fulfillment requirements while maintaining excellent user experience and conversion rates.

Key files created:
- `/home/olafkfreund/Source/tshop/PAYMENT_INTEGRATION_REQUIREMENTS.md` - Complete payment integration specification

The specification covers all aspects of payment processing for TShop's unique business model and provides a clear roadmap for implementation with security, performance, and user experience as top priorities.