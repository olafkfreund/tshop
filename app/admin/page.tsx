import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin-auth'
import { 
  getOrderAnalytics, 
  getAIUsageAnalytics, 
  getSystemHealth 
} from '@/lib/db-direct'
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  Activity,
  Package
} from 'lucide-react'

export default async function AdminDashboard() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin')
  }
  
  const userIsAdmin = await isAdmin(session.user.id)
  if (!userIsAdmin) {
    redirect('/?error=access-denied')
  }

  // Fetch all analytics data
  const [orderAnalytics, aiAnalytics, systemHealth] = await Promise.all([
    getOrderAnalytics(),
    getAIUsageAnalytics(), 
    getSystemHealth()
  ])

  const stats = [
    {
      name: 'Total Revenue (30d)',
      value: `$${(parseFloat(orderAnalytics.overview.total_revenue || '0')).toFixed(2)}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: 'Orders This Month',
      value: orderAnalytics.overview.total_orders || '0',
      change: `${orderAnalytics.overview.completed_orders || '0'} completed`,
      changeType: 'neutral',
      icon: ShoppingBag,
    },
    {
      name: 'AI Generations Today',
      value: aiAnalytics.overview.total_generations_today || '0',
      change: `${aiAnalytics.overview.total_users || '0'} active users`,
      changeType: 'positive',
      icon: Zap,
    },
    {
      name: 'Average Order Value',
      value: `$${(parseFloat(orderAnalytics.overview.avg_order_value || '0')).toFixed(2)}`,
      change: '+4.2%',
      changeType: 'positive',
      icon: TrendingUp,
    }
  ]

  const systemStats = [
    {
      label: 'Total Users',
      value: systemHealth.total_users || '0',
      icon: Users
    },
    {
      label: 'Total Products',
      value: systemHealth.total_products || '0',
      icon: Package
    },
    {
      label: 'Pending Orders',
      value: systemHealth.pending_orders || '0',
      icon: AlertCircle,
      alert: parseInt(systemHealth.pending_orders || '0') > 10
    },
    {
      label: 'Active Carts Today',
      value: systemHealth.active_carts_today || '0',
      icon: Activity
    }
  ]

  return (
    <div className=\"min-h-screen bg-gray-50 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        {/* Header */}
        <div className=\"mb-8\">
          <h1 className=\"text-3xl font-bold text-gray-900\">Admin Dashboard</h1>
          <p className=\"mt-2 text-gray-600\">
            Monitor your TShop platform performance and manage operations
          </p>
          <div className=\"mt-4 flex space-x-4\">
            <a
              href=\"/admin/users\"
              className=\"bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors\"
            >
              Manage Users
            </a>
            <a
              href=\"/admin/orders\"
              className=\"bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors\"
            >
              View Orders
            </a>
            <a
              href=\"/admin/products\"
              className=\"bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors\"
            >
              Manage Products
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className=\"grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8\">
          {stats.map((item) => (
            <div key={item.name} className=\"bg-white overflow-hidden shadow rounded-lg\">
              <div className=\"p-5\">
                <div className=\"flex items-center\">
                  <div className=\"flex-shrink-0\">
                    <item.icon className=\"h-6 w-6 text-gray-400\" aria-hidden=\"true\" />
                  </div>
                  <div className=\"ml-5 w-0 flex-1\">
                    <dl>
                      <dt className=\"text-sm font-medium text-gray-500 truncate\">
                        {item.name}
                      </dt>
                      <dd className=\"text-lg font-medium text-gray-900\">
                        {item.value}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className=\"mt-3\">
                  <div className={`text-sm ${
                    item.changeType === 'positive' ? 'text-green-600' : 
                    item.changeType === 'negative' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {item.change}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8\">
          {/* Recent Orders */}
          <div className=\"bg-white shadow rounded-lg\">
            <div className=\"px-6 py-4 border-b border-gray-200\">
              <h3 className=\"text-lg font-medium text-gray-900\">Revenue Trend (Last 7 Days)</h3>
            </div>
            <div className=\"p-6\">
              <div className=\"space-y-4\">
                {orderAnalytics.dailyRevenue?.slice(0, 7).map((day: any, index: number) => (
                  <div key={index} className=\"flex justify-between items-center\">
                    <div className=\"text-sm text-gray-600\">
                      {new Date(day.date).toLocaleDateString()}
                    </div>
                    <div className=\"flex items-center space-x-4\">
                      <span className=\"text-sm text-gray-500\">
                        {day.orders} orders
                      </span>
                      <span className=\"text-sm font-medium text-gray-900\">
                        ${parseFloat(day.revenue || '0').toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className=\"bg-white shadow rounded-lg\">
            <div className=\"px-6 py-4 border-b border-gray-200\">
              <h3 className=\"text-lg font-medium text-gray-900\">System Status</h3>
            </div>
            <div className=\"p-6\">
              <div className=\"grid grid-cols-2 gap-4\">
                {systemStats.map((stat, index) => (
                  <div key={index} className=\"flex items-center space-x-3\">
                    <div className={`flex-shrink-0 ${stat.alert ? 'text-red-500' : 'text-gray-400'}`}>
                      <stat.icon className=\"h-5 w-5\" />
                    </div>
                    <div>
                      <div className=\"text-sm font-medium text-gray-900\">
                        {stat.value}
                      </div>
                      <div className=\"text-xs text-gray-500\">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Usage Analytics */}
        <div className=\"bg-white shadow rounded-lg mb-8\">
          <div className=\"px-6 py-4 border-b border-gray-200\">
            <h3 className=\"text-lg font-medium text-gray-900\">AI Usage Analytics</h3>
          </div>
          <div className=\"p-6\">
            <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-6\">
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-indigo-600\">
                  {aiAnalytics.overview.free_tier_users || '0'}
                </div>
                <div className=\"text-sm text-gray-500\">Free Tier Users</div>
              </div>
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-green-600\">
                  {aiAnalytics.overview.registered_users || '0'}
                </div>
                <div className=\"text-sm text-gray-500\">Registered Users</div>
              </div>
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-purple-600\">
                  {aiAnalytics.overview.premium_users || '0'}
                </div>
                <div className=\"text-sm text-gray-500\">Premium Users</div>
              </div>
            </div>
            <div className=\"mt-6\">
              <div className=\"text-sm text-gray-600\">
                Average daily generations per user: {parseFloat(aiAnalytics.overview.avg_daily_per_user || '0').toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className=\"bg-white shadow rounded-lg\">
          <div className=\"px-6 py-4 border-b border-gray-200\">
            <h3 className=\"text-lg font-medium text-gray-900\">Quick Actions</h3>
          </div>
          <div className=\"p-6\">
            <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4\">
              <a
                href=\"/admin/users\"
                className=\"text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors\"
              >
                <Users className=\"h-8 w-8 text-indigo-600 mx-auto mb-2\" />
                <div className=\"text-sm font-medium text-gray-900\">User Management</div>
                <div className=\"text-xs text-gray-500\">Manage user roles & accounts</div>
              </a>
              <a
                href=\"/admin/orders\"
                className=\"text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors\"
              >
                <ShoppingBag className=\"h-8 w-8 text-green-600 mx-auto mb-2\" />
                <div className=\"text-sm font-medium text-gray-900\">Order Management</div>
                <div className=\"text-xs text-gray-500\">View & manage orders</div>
              </a>
              <a
                href=\"/admin/products\"
                className=\"text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors\"
              >
                <Package className=\"h-8 w-8 text-purple-600 mx-auto mb-2\" />
                <div className=\"text-sm font-medium text-gray-900\">Product Catalog</div>
                <div className=\"text-xs text-gray-500\">Manage products & inventory</div>
              </a>
              <a
                href=\"/admin/analytics\"
                className=\"text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors\"
              >
                <Activity className=\"h-8 w-8 text-orange-600 mx-auto mb-2\" />
                <div className=\"text-sm font-medium text-gray-900\">Advanced Analytics</div>
                <div className=\"text-xs text-gray-500\">Detailed reports & metrics</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}