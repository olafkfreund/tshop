import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin-auth'
import { 
  getOrderAnalytics, 
  getAIUsageAnalytics, 
  getSystemHealth,
  getAllUsers,
  getAllOrders 
} from '@/lib/db-direct'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Zap, 
  ShoppingBag, 
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react'

export default async function AdminAnalyticsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin/analytics')
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

  // Calculate some derived metrics
  const conversionRate = orderAnalytics.overview.total_orders && orderAnalytics.overview.unique_customers 
    ? ((parseFloat(orderAnalytics.overview.completed_orders || '0') / parseFloat(orderAnalytics.overview.total_orders || '1')) * 100).toFixed(1)
    : '0'

  const avgDailyRevenue = orderAnalytics.dailyRevenue?.length > 0 
    ? (orderAnalytics.dailyRevenue.reduce((sum: number, day: any) => sum + parseFloat(day.revenue || '0'), 0) / orderAnalytics.dailyRevenue.length).toFixed(2)
    : '0'

  return (
    <div className=\"min-h-screen bg-gray-50 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        {/* Header */}
        <div className=\"mb-8\">
          <div className=\"flex items-center justify-between\">
            <div>
              <h1 className=\"text-3xl font-bold text-gray-900\">Advanced Analytics</h1>
              <p className=\"mt-2 text-gray-600\">
                Detailed insights and performance metrics
              </p>
            </div>
            <a
              href=\"/admin\"
              className=\"bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors\"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8\">
          <div className=\"bg-white rounded-lg shadow p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-gray-600\">Conversion Rate</p>
                <p className=\"text-2xl font-bold text-green-600\">{conversionRate}%</p>
              </div>
              <TrendingUp className=\"h-8 w-8 text-green-600\" />
            </div>
            <p className=\"text-sm text-gray-500 mt-2\">
              {orderAnalytics.overview.completed_orders || 0} of {orderAnalytics.overview.total_orders || 0} orders completed
            </p>
          </div>

          <div className=\"bg-white rounded-lg shadow p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-gray-600\">Avg Daily Revenue</p>
                <p className=\"text-2xl font-bold text-blue-600\">${avgDailyRevenue}</p>
              </div>
              <DollarSign className=\"h-8 w-8 text-blue-600\" />
            </div>
            <p className=\"text-sm text-gray-500 mt-2\">
              Last 30 days average
            </p>
          </div>

          <div className=\"bg-white rounded-lg shadow p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-gray-600\">AI Generations/User</p>
                <p className=\"text-2xl font-bold text-purple-600\">
                  {parseFloat(aiAnalytics.overview.avg_daily_per_user || '0').toFixed(1)}
                </p>
              </div>
              <Zap className=\"h-8 w-8 text-purple-600\" />
            </div>
            <p className=\"text-sm text-gray-500 mt-2\">
              Daily average per active user
            </p>
          </div>

          <div className=\"bg-white rounded-lg shadow p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-gray-600\">System Health</p>
                <p className=\"text-2xl font-bold text-green-600\">
                  {parseInt(systemHealth.pending_orders || '0') <= 5 ? 'Good' : 'Alert'}
                </p>
              </div>
              <Activity className=\"h-8 w-8 text-green-600\" />
            </div>
            <p className=\"text-sm text-gray-500 mt-2\">
              {systemHealth.pending_orders || 0} pending orders
            </p>
          </div>
        </div>

        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8\">
          {/* Revenue Trend */}
          <div className=\"bg-white rounded-lg shadow\">
            <div className=\"p-6 border-b border-gray-200\">
              <div className=\"flex items-center justify-between\">
                <h3 className=\"text-lg font-medium text-gray-900\">Revenue Trend</h3>
                <BarChart3 className=\"h-5 w-5 text-gray-400\" />
              </div>
            </div>
            <div className=\"p-6\">
              <div className=\"space-y-4\">
                {orderAnalytics.dailyRevenue?.slice(0, 10).map((day: any, index: number) => {
                  const revenue = parseFloat(day.revenue || '0')
                  const maxRevenue = Math.max(...orderAnalytics.dailyRevenue.map((d: any) => parseFloat(d.revenue || '0')))
                  const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0
                  
                  return (
                    <div key={index} className=\"flex items-center space-x-4\">
                      <div className=\"w-16 text-sm text-gray-600\">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className=\"flex-1 bg-gray-200 rounded-full h-2\">
                        <div 
                          className=\"bg-blue-600 h-2 rounded-full\" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className=\"w-20 text-right text-sm font-medium text-gray-900\">
                        ${revenue.toFixed(2)}
                      </div>
                      <div className=\"w-12 text-right text-xs text-gray-500\">
                        {day.orders}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* AI Usage Distribution */}
          <div className=\"bg-white rounded-lg shadow\">
            <div className=\"p-6 border-b border-gray-200\">
              <div className=\"flex items-center justify-between\">
                <h3 className=\"text-lg font-medium text-gray-900\">AI Usage by Tier</h3>
                <PieChart className=\"h-5 w-5 text-gray-400\" />
              </div>
            </div>
            <div className=\"p-6\">
              <div className=\"space-y-4\">
                <div className=\"flex items-center justify-between p-4 bg-gray-50 rounded-lg\">
                  <div className=\"flex items-center\">
                    <div className=\"w-3 h-3 bg-gray-400 rounded-full mr-3\"></div>
                    <span className=\"text-sm font-medium text-gray-900\">Free Tier</span>
                  </div>
                  <div className=\"text-right\">
                    <div className=\"text-lg font-bold text-gray-900\">
                      {aiAnalytics.overview.free_tier_users || '0'}
                    </div>
                    <div className=\"text-xs text-gray-500\">users</div>
                  </div>
                </div>
                
                <div className=\"flex items-center justify-between p-4 bg-green-50 rounded-lg\">
                  <div className=\"flex items-center\">
                    <div className=\"w-3 h-3 bg-green-500 rounded-full mr-3\"></div>
                    <span className=\"text-sm font-medium text-gray-900\">Registered</span>
                  </div>
                  <div className=\"text-right\">
                    <div className=\"text-lg font-bold text-green-600\">
                      {aiAnalytics.overview.registered_users || '0'}
                    </div>
                    <div className=\"text-xs text-gray-500\">users</div>
                  </div>
                </div>
                
                <div className=\"flex items-center justify-between p-4 bg-purple-50 rounded-lg\">
                  <div className=\"flex items-center\">
                    <div className=\"w-3 h-3 bg-purple-500 rounded-full mr-3\"></div>
                    <span className=\"text-sm font-medium text-gray-900\">Premium</span>
                  </div>
                  <div className=\"text-right\">
                    <div className=\"text-lg font-bold text-purple-600\">
                      {aiAnalytics.overview.premium_users || '0'}
                    </div>
                    <div className=\"text-xs text-gray-500\">users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className=\"bg-white rounded-lg shadow mb-8\">
          <div className=\"p-6 border-b border-gray-200\">
            <h3 className=\"text-lg font-medium text-gray-900\">Order Status Breakdown (30 days)</h3>
          </div>
          <div className=\"p-6\">
            <div className=\"grid grid-cols-1 sm:grid-cols-4 gap-6\">
              <div className=\"text-center p-4 bg-yellow-50 rounded-lg\">
                <Clock className=\"h-8 w-8 text-yellow-600 mx-auto mb-2\" />
                <div className=\"text-2xl font-bold text-yellow-600\">
                  {orderAnalytics.overview.pending_orders || '0'}
                </div>
                <div className=\"text-sm text-gray-600\">Pending Orders</div>
              </div>
              
              <div className=\"text-center p-4 bg-green-50 rounded-lg\">
                <ShoppingBag className=\"h-8 w-8 text-green-600 mx-auto mb-2\" />
                <div className=\"text-2xl font-bold text-green-600\">
                  {orderAnalytics.overview.completed_orders || '0'}
                </div>
                <div className=\"text-sm text-gray-600\">Completed Orders</div>
              </div>
              
              <div className=\"text-center p-4 bg-red-50 rounded-lg\">
                <div className=\"h-8 w-8 text-red-600 mx-auto mb-2 flex items-center justify-center text-lg font-bold\">×</div>
                <div className=\"text-2xl font-bold text-red-600\">
                  {orderAnalytics.overview.cancelled_orders || '0'}
                </div>
                <div className=\"text-sm text-gray-600\">Cancelled Orders</div>
              </div>
              
              <div className=\"text-center p-4 bg-blue-50 rounded-lg\">
                <Users className=\"h-8 w-8 text-blue-600 mx-auto mb-2\" />
                <div className=\"text-2xl font-bold text-blue-600\">
                  {orderAnalytics.overview.unique_customers || '0'}
                </div>
                <div className=\"text-sm text-gray-600\">Unique Customers</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Monitoring */}
        <div className=\"bg-white rounded-lg shadow\">
          <div className=\"p-6 border-b border-gray-200\">
            <div className=\"flex items-center justify-between\">
              <h3 className=\"text-lg font-medium text-gray-900\">System Monitoring</h3>
              <Calendar className=\"h-5 w-5 text-gray-400\" />
            </div>
          </div>
          <div className=\"p-6\">
            <div className=\"grid grid-cols-2 md:grid-cols-5 gap-6\">
              <div className=\"text-center\">
                <div className=\"text-lg font-bold text-gray-900\">
                  {systemHealth.total_users || '0'}
                </div>
                <div className=\"text-sm text-gray-600\">Total Users</div>
              </div>
              
              <div className=\"text-center\">
                <div className=\"text-lg font-bold text-gray-900\">
                  {systemHealth.total_products || '0'}
                </div>
                <div className=\"text-sm text-gray-600\">Total Products</div>
              </div>
              
              <div className=\"text-center\">
                <div className={`text-lg font-bold ${
                  parseInt(systemHealth.pending_orders || '0') > 10 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {systemHealth.pending_orders || '0'}
                </div>
                <div className=\"text-sm text-gray-600\">Pending Orders</div>
              </div>
              
              <div className=\"text-center\">
                <div className=\"text-lg font-bold text-green-600\">
                  {systemHealth.active_carts_today || '0'}
                </div>
                <div className=\"text-sm text-gray-600\">Active Carts Today</div>
              </div>
              
              <div className=\"text-center\">
                <div className=\"text-lg font-bold text-purple-600\">
                  {systemHealth.active_ai_users_hour || '0'}
                </div>
                <div className=\"text-sm text-gray-600\">AI Users (1h)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}