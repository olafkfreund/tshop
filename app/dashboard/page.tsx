import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Header from '@/components/navigation/header'
import {
  User,
  Package,
  CreditCard,
  Settings,
  Truck,
  Eye,
  Calendar,
  DollarSign,
  ShoppingBag,
  Star,
  Clock
} from 'lucide-react'

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
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
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      aiUsage: {
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      _count: {
        select: {
          orders: true,
          designs: true,
        },
      },
    },
  })

  return user
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

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const userData = await getUserData(session.user.id!)
  
  if (!userData) {
    redirect('/auth/signin')
  }

  const currentMonthUsage = userData.aiUsage.length
  const totalSpent = userData.orders.reduce((sum, order) => sum + Number(order.total), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8
                      sm:px-6
                      lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userData.name || userData.email}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6
                        lg:grid-cols-4">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {userData.name || 'User'}
                  </h3>
                  <p className="text-sm text-gray-600">{userData.email}</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-700"
                >
                  <User className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Package className="h-5 w-5" />
                  <span>Orders</span>
                </Link>
                <Link
                  href="/designs"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Star className="h-5 w-5" />
                  <span>My Designs</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6
                            sm:grid-cols-2
                            lg:grid-cols-3">
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{userData._count.orders}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-3xl font-bold text-gray-900">{formatPrice(totalSpent)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">AI Designs Created</p>
                    <p className="text-3xl font-bold text-gray-900">{userData._count.designs}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Usage This Month */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Usage This Month</h3>
                <Link
                  href="/dashboard/usage"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View Details
                </Link>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Generations Used</span>
                <span className="text-sm font-medium">{currentMonthUsage} / 50</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((currentMonthUsage / 50) * 100, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                {50 - currentMonthUsage} generations remaining this month
              </p>
            </div>

            {/* Recent Orders */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <Link
                  href="/orders"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View All Orders
                </Link>
              </div>

              {userData.orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start creating your first design!</p>
                  <Link
                    href="/products"
                    className="btn-primary mt-4 inline-block"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userData.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {order.items[0]?.product.images[0] ? (
                            <img
                              src={order.items[0].product.images[0].url}
                              alt={order.items[0].product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">
                              Order #{order.id.slice(-8)}
                            </p>
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatPrice(Number(order.total))}</p>
                        </div>
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-1 gap-4
                              sm:grid-cols-3">
                <Link
                  href="/products"
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <ShoppingBag className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Create New Design</span>
                </Link>
                
                <Link
                  href="/designs"
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Star className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">View My Designs</span>
                </Link>
                
                <Link
                  href="/orders"
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Package className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Track Orders</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}