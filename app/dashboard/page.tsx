import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AIUsageLimiter } from '@/lib/ai/usage-limiter'
import { getOrdersByUserId, getUserDesigns } from '@/lib/db-direct'
import Link from 'next/link'
import { 
  ShoppingBag, 
  Palette, 
  TrendingUp, 
  Clock,
  Star,
  Package,
  CreditCard,
  Settings,
  Calendar
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get user's data
  const usageStats = await AIUsageLimiter.getUserUsageStats(session.user.id)
  const usageCheck = await AIUsageLimiter.checkUsage(session.user.id)
  const userOrders = await getOrdersByUserId(session.user.id)
  const userDesigns = await getUserDesigns(session.user.id, 5) // Get latest 5 designs
  
  // Calculate user statistics
  const totalSpent = userOrders.reduce((sum, order) => sum + Number(order.total), 0)
  const completedOrders = userOrders.filter(order => order.status === 'completed' || order.status === 'delivered')
  const pendingOrders = userOrders.filter(order => order.status === 'pending' || order.status === 'processing')
  const recentOrders = userOrders.slice(0, 3) // Most recent 3 orders

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {session.user.name || session.user.email}!
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your designs, orders, and account settings.
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/ai-design"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Create Design
                </Link>
                
                <form action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/' })
                }}>
                  <button
                    type="submit"
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {userOrders.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Spent
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${totalSpent.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* AI Designs Created */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      AI Designs Created
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {usageStats?.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingOrders.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                <Link
                  href="/orders"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Start creating your custom designs!</p>
                  <div className="mt-6">
                    <Link
                      href="/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Browse Products
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${Number(order.total).toFixed(2)}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Usage & Quick Actions */}
          <div className="space-y-8">
            {/* AI Usage Stats */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">AI Usage</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Daily Generations</span>
                  <span className="text-sm text-gray-900">
                    {usageStats?.daily || 0} / {usageCheck.remainingDaily + (usageStats?.daily || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, ((usageStats?.daily || 0) / (usageCheck.remainingDaily + (usageStats?.daily || 0))) * 100)}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Monthly Generations</span>
                  <span className="text-sm text-gray-900">
                    {usageStats?.monthly || 0} / {usageCheck.remainingMonthly + (usageStats?.monthly || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, ((usageStats?.monthly || 0) / (usageCheck.remainingMonthly + (usageStats?.monthly || 0))) * 100)}%` 
                    }}
                  ></div>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-600">{usageCheck.tier} Plan</span>
                    <span className="text-xs text-gray-500">Resets daily</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <Link
                  href="/ai-design"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Palette className="h-8 w-8 text-indigo-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">AI Design</span>
                </Link>
                
                <Link
                  href="/products"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ShoppingBag className="h-8 w-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Browse</span>
                </Link>
                
                <Link
                  href="/editor"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-8 w-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Editor</span>
                </Link>
                
                <Link
                  href="/orders"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Orders</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}