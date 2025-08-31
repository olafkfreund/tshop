import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import Header from '@/components/navigation/header'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  ArrowLeft,
  MapPin,
  CreditCard,
  Receipt
} from 'lucide-react'

interface OrderPageProps {
  params: { id: string }
}

async function getOrder(orderId: string, userId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: true,
          design: true,
        },
      },
      fulfillment: true,
    },
  })

  if (!order) {
    return null
  }

  // Check access permissions
  if (order.userId !== userId) {
    return null
  }

  return order
}

async function fetchTrackingInfo(orderId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/orders/${orderId}/track`, {
      cache: 'no-store', // Always get fresh tracking data
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.success ? data.data : null
    }
  } catch (error) {
    console.error('Error fetching tracking info:', error)
  }
  
  return null
}

function OrderTrackingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

async function OrderTracking({ orderId }: { orderId: string }) {
  const trackingInfo = await fetchTrackingInfo(orderId)

  if (!trackingInfo) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Order Status</h3>
        <p className="text-gray-600">Order is being processed. Tracking information will be available soon.</p>
      </div>
    )
  }

  const getStatusIcon = (status: string, completed: boolean) => {
    if (completed) {
      return <CheckCircle className="h-6 w-6 text-green-600" />
    } else if (status === 'current') {
      return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
    } else {
      return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Order Status</h3>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {trackingInfo.status}
          </span>
        </div>

        {trackingInfo.trackingNumber && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tracking Number</p>
                <p className="font-mono font-semibold">{trackingInfo.trackingNumber}</p>
              </div>
              {trackingInfo.trackingUrl && (
                <Link
                  href={trackingInfo.trackingUrl}
                  target="_blank"
                  className="btn-secondary text-sm px-4 py-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Track Package
                </Link>
              )}
            </div>
          </div>
        )}

        {trackingInfo.estimatedDelivery && (
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Truck className="h-4 w-4 mr-2" />
            Estimated delivery: {formatDate(new Date(trackingInfo.estimatedDelivery))}
          </div>
        )}

        <div className="text-sm text-gray-600">
          Fulfilled by: <span className="font-medium">{trackingInfo.provider}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-6">
        <h4 className="font-semibold mb-6">Order Timeline</h4>
        
        <div className="space-y-6">
          {trackingInfo.timeline.map((event: any, index: number) => (
            <div key={index} className="flex items-start space-x-4">
              {getStatusIcon(event.status, event.completed)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${
                    event.completed ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {event.status}
                  </p>
                  {event.date && (
                    <p className="text-xs text-gray-500">
                      {formatDate(new Date(event.date))}
                    </p>
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  event.completed ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Items Status */}
      <div className="card p-6">
        <h4 className="font-semibold mb-4">Items in this Order</h4>
        
        <div className="space-y-4">
          {trackingInfo.items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">{item.variant}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function OrderPage({ params }: OrderPageProps) {
  const session = await auth()
  
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-12
                        sm:px-6
                        lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-8">Please sign in to view your order details.</p>
            <Link href="/auth/signin" className="btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const order = await getOrder(params.id, session.user.id)
  
  if (!order) {
    notFound()
  }

  const shippingAddress = typeof order.shippingAddress === 'object' ? order.shippingAddress : JSON.parse(order.shippingAddress as string)
  const billingAddress = typeof order.billingAddress === 'object' ? order.billingAddress : JSON.parse(order.billingAddress as string)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8
                      sm:px-6
                      lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.id.slice(-8)}
              </h1>
              <p className="text-gray-600 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(Number(order.total))}
              </p>
              <p className="text-sm text-gray-600">
                Total ({order.items.length} item{order.items.length > 1 ? 's' : ''})
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8
                        lg:grid-cols-3">
          
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Order Tracking */}
            <Suspense fallback={<OrderTrackingSkeleton />}>
              <OrderTracking orderId={order.id} />
            </Suspense>

            {/* Order Items */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-6">Order Items</h3>
              
              <div className="space-y-6">
                {order.items.map((item) => (
                  <div key={item.id} className="flex space-x-4">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product.images[0] ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.variant.colorName} • {item.variant.sizeName}
                      </p>
                      {item.design && (
                        <p className="text-sm text-gray-600 mt-1">
                          Custom design: {item.design.name}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-medium">{formatPrice(Number(item.totalPrice))}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6 mt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(Number(order.subtotal))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{formatPrice(Number(order.shipping))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatPrice(Number(order.tax))}</span>
                  </div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(Number(order.discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatPrice(Number(order.total))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Address & Payment */}
          <div className="space-y-6">
            
            {/* Shipping Address */}
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-semibold">Shipping Address</h3>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </p>
                {shippingAddress.company && <p>{shippingAddress.company}</p>}
                <p>{shippingAddress.address1}</p>
                {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                </p>
                <p>{shippingAddress.country}</p>
                {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
              </div>
            </div>

            {/* Payment Info */}
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-semibold">Payment</h3>
              </div>
              <div className="text-sm text-gray-600">
                <p>Payment processed successfully</p>
                <p className="text-xs text-gray-500 mt-1">
                  Order ID: {order.id}
                </p>
              </div>
            </div>

            {/* Need Help */}
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <Receipt className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-semibold">Need Help?</h3>
              </div>
              <div className="space-y-3">
                <Link
                  href="/support"
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Contact Support
                </Link>
                <Link
                  href="/returns"
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Return or Exchange
                </Link>
                <Link
                  href="/faq"
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}