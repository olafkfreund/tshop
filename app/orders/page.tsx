import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Header from '@/components/navigation/header'
import { Suspense } from 'react'
import {
  Package,
  Truck,
  Clock,
  Eye,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  ArrowLeft
} from 'lucide-react'

interface SearchParams {
  status?: string
  search?: string
  page?: string
}

interface OrdersPageProps {
  searchParams: SearchParams
}

async function getUserOrders(userId: string, filters: SearchParams) {
  const page = parseInt(filters.page || '1')
  const limit = 10
  const skip = (page - 1) * limit

  const where: any = {
    userId,
  }

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }

  if (filters.search) {
    where.OR = [
      {
        id: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        items: {
          some: {
            product: {
              name: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          },
        },
      },
    ]
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'processing':
      return 'bg-blue-100 text-blue-800'
    case 'shipped':
      return 'bg-purple-100 text-purple-800'
    case 'delivered':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <Package className="h-4 w-4" />
    case 'processing':
      return <Clock className="h-4 w-4" />
    case 'shipped':
      return <Truck className="h-4 w-4" />
    case 'delivered':
      return <Package className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

function OrdersTableSkeleton() {
  return (
    <div className="card p-6">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-40"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

async function OrdersTable({ userId, filters }: { userId: string; filters: SearchParams }) {
  const { orders, totalCount, currentPage, totalPages } = await getUserOrders(userId, filters)

  if (orders.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            {filters.search || filters.status 
              ? "Try adjusting your filters or search terms" 
              : "You haven't placed any orders yet"}
          </p>
          <Link href="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Orders List */}
      <div className="card p-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  {order.items[0]?.product.images[0] ? (
                    <img
                      src={order.items[0].product.images[0].url}
                      alt={order.items[0].product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900">
                      Order #{order.id.slice(-8)}
                    </h3>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Ordered {formatDate(order.createdAt)}</span>
                    </span>
                    {order.fulfillment?.trackingNumber && (
                      <span className="flex items-center space-x-1">
                        <Truck className="h-3 w-3" />
                        <span>Tracking: {order.fulfillment.trackingNumber}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatPrice(Number(order.total))}</p>
                  {order.fulfillment?.provider && (
                    <p className="text-xs text-gray-500 capitalize">
                      via {order.fulfillment.provider}
                    </p>
                  )}
                </div>
                <Link
                  href={`/orders/${order.id}`}
                  className="btn-secondary px-3 py-2 text-sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} orders
            </p>
            
            <div className="flex items-center space-x-2">
              {currentPage > 1 && (
                <Link
                  href={`/orders?${new URLSearchParams({ ...filters, page: (currentPage - 1).toString() }).toString()}`}
                  className="btn-secondary px-3 py-2 text-sm"
                >
                  Previous
                </Link>
              )}
              
              <span className="px-3 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              {currentPage < totalPages && (
                <Link
                  href={`/orders?${new URLSearchParams({ ...filters, page: (currentPage + 1).toString() }).toString()}`}
                  className="btn-secondary px-3 py-2 text-sm"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const filters = {
    status: searchParams.status || 'all',
    search: searchParams.search || '',
    page: searchParams.page || '1',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8
                      sm:px-6
                      lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600 mt-2">
            Track and manage all your orders
          </p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <form className="flex flex-col space-y-4
                           sm:flex-row sm:space-y-0 sm:space-x-4">
            
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search orders or products..."
                  defaultValue={filters.search}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                name="status"
                defaultValue={filters.status}
                className="input pr-10 appearance-none"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter Button */}
            <button type="submit" className="btn-primary px-6">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </form>

          {/* Active Filters */}
          {(filters.search || filters.status !== 'all') && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs">
                  Search: {filters.search}
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs">
                  Status: {filters.status}
                </span>
              )}
              <Link
                href="/orders"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Link>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <Suspense fallback={<OrdersTableSkeleton />}>
          <OrdersTable userId={session.user.id!} filters={filters} />
        </Suspense>
      </div>
    </div>
  )
}