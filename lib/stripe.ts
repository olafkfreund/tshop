import Stripe from 'stripe'

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Stripe configuration
export const STRIPE_CONFIG = {
  // Payment method types to accept
  paymentMethodTypes: ['card'],
  
  // Billing address collection
  billingAddressCollection: 'required' as const,
  
  // Shipping address collection for physical products
  shippingAddressCollection: {
    allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL'],
  },
  
  // Default currency
  currency: 'usd',
  
  // Webhook endpoint secret (will be set in environment)
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
} as const

// Product pricing (in cents)
export const PRODUCT_PRICES = {
  TSHIRT: {
    base: 2499, // $24.99
    premium: 3499, // $34.99 (premium fulfillment)
  },
  CAP: {
    base: 1999, // $19.99
    premium: 2999, // $29.99 (premium fulfillment)
  },
  TOTE_BAG: {
    base: 1499, // $14.99
    premium: 2499, // $24.99 (premium fulfillment)
  },
} as const

// Shipping rates (in cents)
export const SHIPPING_RATES = {
  standard: {
    domestic: 499, // $4.99
    international: 1499, // $14.99
  },
  express: {
    domestic: 999, // $9.99
    international: 2499, // $24.99
  },
} as const

// Calculate order total
export function calculateOrderTotal(
  items: Array<{
    productType: keyof typeof PRODUCT_PRICES
    quantity: number
    isPremium?: boolean
  }>,
  shippingRate: keyof typeof SHIPPING_RATES = 'standard',
  isInternational: boolean = false
): number {
  // Calculate subtotal
  const subtotal = items.reduce((total, item) => {
    const priceType = item.isPremium ? 'premium' : 'base'
    const itemPrice = PRODUCT_PRICES[item.productType][priceType]
    return total + (itemPrice * item.quantity)
  }, 0)
  
  // Add shipping
  const shippingType = isInternational ? 'international' : 'domestic'
  const shipping = SHIPPING_RATES[shippingRate][shippingType]
  
  return subtotal + shipping
}

// Create Stripe checkout session
export async function createCheckoutSession({
  userId,
  items,
  successUrl,
  cancelUrl,
  customerEmail,
  metadata = {},
}: {
  userId?: string
  items: Array<{
    name: string
    description?: string
    price: number
    quantity: number
    images?: string[]
  }>
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  metadata?: Record<string, string>
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: STRIPE_CONFIG.paymentMethodTypes,
      billing_address_collection: STRIPE_CONFIG.billingAddressCollection,
      shipping_address_collection: STRIPE_CONFIG.shippingAddressCollection,
      line_items: items.map(item => ({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: item.name,
            description: item.description,
            images: item.images,
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        userId: userId || '',
        ...metadata,
      },
    })
    
    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Retrieve checkout session
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    })
    return session
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    throw error
  }
}

// Create customer
export async function createStripeCustomer({
  email,
  name,
  userId,
}: {
  email: string
  name?: string
  userId: string
}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    })
    return customer
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw error
  }
}

// Get customer by user ID
export async function getStripeCustomerByUserId(userId: string) {
  try {
    const customers = await stripe.customers.list({
      limit: 1,
      email: undefined, // We'll search by metadata
    })
    
    // Filter by metadata (this is not ideal for production, consider storing stripe_customer_id in database)
    const customer = customers.data.find(c => c.metadata?.userId === userId)
    return customer
  } catch (error) {
    console.error('Error fetching Stripe customer:', error)
    return null
  }
}

// Validate webhook signature
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_CONFIG.webhookSecret
    )
  } catch (error) {
    console.error('Webhook signature validation failed:', error)
    throw new Error('Invalid webhook signature')
  }
}