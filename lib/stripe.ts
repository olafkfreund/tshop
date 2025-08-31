import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export interface PaymentIntentData {
  amount: number // in cents
  currency: string
  orderId: string
  customerId?: string
  customerEmail: string
  shippingAddress: {
    name: string
    address: {
      line1: string
      line2?: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
  }>
}

export async function createPaymentIntent(data: PaymentIntentData): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: data.amount,
    currency: data.currency,
    customer: data.customerId,
    receipt_email: data.customerEmail,
    shipping: {
      name: data.shippingAddress.name,
      address: data.shippingAddress.address,
    },
    metadata: {
      orderId: data.orderId,
      itemsCount: data.items.length.toString(),
      customerEmail: data.customerEmail,
    },
    automatic_payment_methods: {
      enabled: true,
    },
    description: `TShop Order #${data.orderId.slice(-8)} - ${data.items.length} item(s)`,
  })

  return paymentIntent
}

export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

export async function confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.confirm(paymentIntentId)
}

export async function createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
  })
}

export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  return await stripe.customers.retrieve(customerId) as Stripe.Customer
}

export async function updateCustomer(
  customerId: string, 
  updates: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  return await stripe.customers.update(customerId, updates)
}

export async function createInvoice(
  customerId: string,
  items: Array<{
    description: string
    quantity: number
    unit_amount: number
  }>,
  metadata?: { [key: string]: string }
): Promise<Stripe.Invoice> {
  // Create invoice items
  for (const item of items) {
    await stripe.invoiceItems.create({
      customer: customerId,
      description: item.description,
      quantity: item.quantity,
      unit_amount: item.unit_amount,
    })
  }

  // Create and finalize invoice
  const invoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true,
    metadata: metadata || {},
  })

  return await stripe.invoices.finalizeInvoice(invoice.id)
}

export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  })
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

// Price formatting utilities
export function formatStripeAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100) // Stripe amounts are in cents
}

export function convertToStripeAmount(amount: number): number {
  return Math.round(amount * 100) // Convert dollars to cents
}

// Webhook event type guards
export function isPaymentIntentSucceeded(event: Stripe.Event): event is Stripe.Event & { data: { object: Stripe.PaymentIntent } } {
  return event.type === 'payment_intent.succeeded'
}

export function isPaymentIntentFailed(event: Stripe.Event): event is Stripe.Event & { data: { object: Stripe.PaymentIntent } } {
  return event.type === 'payment_intent.payment_failed'
}

export function isChargeDispute(event: Stripe.Event): event is Stripe.Event & { data: { object: Stripe.Charge } } {
  return event.type === 'charge.dispute.created'
}

// Address validation
export function validateShippingAddress(address: any): boolean {
  const required = ['line1', 'city', 'state', 'postal_code', 'country']
  return required.every(field => address[field] && address[field].trim().length > 0)
}

// Calculate tax (simplified - in production you'd use Stripe Tax or a tax service)
export async function calculateTax(
  amount: number,
  shippingAddress: any
): Promise<number> {
  // Simplified tax calculation - 8.5% for US addresses
  if (shippingAddress.country === 'US') {
    return Math.round(amount * 0.085)
  }
  
  return 0
}