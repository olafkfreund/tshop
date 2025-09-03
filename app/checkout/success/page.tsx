import { getCheckoutSession } from '@/lib/stripe'
import { getOrderByStripeSessionId } from '@/lib/db-direct'
import Link from 'next/link'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams.session_id
  
  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid session</h1>
          <p className="mt-2 text-gray-600">No checkout session found.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
            Return to home
          </Link>
        </div>
      </div>
    )
  }
  
  // Get checkout session from Stripe
  const checkoutSession = await getCheckoutSession(sessionId)
  
  if (!checkoutSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Session not found</h1>
          <p className="mt-2 text-gray-600">We couldn't find your checkout session.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
            Return to home
          </Link>
        </div>
      </div>
    )
  }
  
  // Get order from database
  const order = await getOrderByStripeSessionId(sessionId)
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" className="w-12 h-12">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">
              Order Confirmed!
            </h1>
            
            <p className="mt-2 text-lg text-gray-600">
              Thank you for your purchase!
            </p>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {order?.id || sessionId.slice(-8).toUpperCase()}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {checkoutSession.customer_email}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    ${((checkoutSession.amount_total || 0) / 100).toFixed(2)} {checkoutSession.currency?.toUpperCase()}
                  </dd>
                </div>
                
                {checkoutSession.shipping_details?.address && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Shipping Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div>{checkoutSession.shipping_details.name}</div>
                      <div>{checkoutSession.shipping_details.address.line1}</div>
                      {checkoutSession.shipping_details.address.line2 && (
                        <div>{checkoutSession.shipping_details.address.line2}</div>
                      )}
                      <div>
                        {checkoutSession.shipping_details.address.city}, {checkoutSession.shipping_details.address.state} {checkoutSession.shipping_details.address.postal_code}
                      </div>
                      <div>{checkoutSession.shipping_details.address.country}</div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            
            <div className="mt-8 space-y-3">
              <p className="text-sm text-gray-600">
                A confirmation email has been sent to {checkoutSession.customer_email}
              </p>
              
              <p className="text-sm text-gray-600">
                Your custom apparel will be produced and shipped within 5-7 business days.
              </p>
            </div>
            
            <div className="mt-8 space-x-4">
              {order && (
                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  View Order Details
                </Link>
              )}
              
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}