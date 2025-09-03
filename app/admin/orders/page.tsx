import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin-auth'
import { getAllOrders } from '@/lib/db-direct'
import { 
  Search, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye,
  DollarSign,
  Calendar,
  User
} from 'lucide-react'

interface PageProps {
  searchParams: {
    status?: string
    page?: string
  }
}

const statusConfig = {
  all: { label: 'All Orders', icon: Package, color: 'gray' },
  pending: { label: 'Pending', icon: Clock, color: 'yellow' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'green' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'red' },
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin/orders')
  }
  
  const userIsAdmin = await isAdmin(session.user.id)
  if (!userIsAdmin) {
    redirect('/?error=access-denied')
  }

  const page = parseInt(searchParams.page || '1')
  const status = searchParams.status || 'all'
  const limit = 20
  const offset = (page - 1) * limit

  const { orders, total } = await getAllOrders(limit, offset, status)
  const totalPages = Math.ceil(total / limit)

  const getStatusColor = (orderStatus: string) => {
    switch (orderStatus) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className=\"min-h-screen bg-gray-50 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        {/* Header */}
        <div className=\"mb-8\">
          <div className=\"flex items-center justify-between\">
            <div>
              <h1 className=\"text-3xl font-bold text-gray-900\">Order Management</h1>
              <p className=\"mt-2 text-gray-600\">
                Monitor and manage customer orders
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

        {/* Status Filter */}
        <div className=\"bg-white shadow rounded-lg mb-6\">
          <div className=\"p-6\">
            <div className=\"flex flex-wrap gap-2\">
              {Object.entries(statusConfig).map(([key, config]) => (
                <a
                  key={key}
                  href={`?status=${key}`}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    status === key
                      ? `bg-${config.color}-100 text-${config.color}-800 border border-${config.color}-300`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  <config.icon className=\"h-4 w-4 mr-2\" />
                  {config.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className=\"bg-white shadow rounded-lg overflow-hidden\">
          <div className=\"px-6 py-4 border-b border-gray-200\">
            <h3 className=\"text-lg font-medium text-gray-900\">
              Orders ({total} total)
            </h3>
          </div>
          
          <div className=\"overflow-x-auto\">
            <table className=\"min-w-full divide-y divide-gray-200\">
              <thead className=\"bg-gray-50\">
                <tr>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Order ID
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Customer
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Status
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Items
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Total
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Date
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className=\"bg-white divide-y divide-gray-200\">
                {orders.map((order: any) => (
                  <tr key={order.id} className=\"hover:bg-gray-50\">
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div className=\"text-sm font-mono text-gray-900\">
                        {order.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div className=\"flex items-center\">
                        <User className=\"h-5 w-5 text-gray-400 mr-2\" />
                        <div>
                          <div className=\"text-sm font-medium text-gray-900\">
                            {order.customer_name || order.customer_name_user || 'Guest'}
                          </div>
                          <div className=\"text-sm text-gray-500\">
                            {order.customer_email || order.customer_email_user}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">
                      <div className=\"flex items-center\">
                        <Package className=\"h-4 w-4 text-gray-400 mr-1\" />
                        {order.item_count || 0} items ({order.total_items || 0} total)
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div className=\"flex items-center text-sm font-medium text-gray-900\">
                        <DollarSign className=\"h-4 w-4 text-green-500 mr-1\" />
                        ${parseFloat(order.total || 0).toFixed(2)}
                      </div>
                      <div className=\"text-xs text-gray-500\">
                        {order.currency?.toUpperCase() || 'USD'}
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div className=\"flex items-center text-sm text-gray-900\">
                        <Calendar className=\"h-4 w-4 text-gray-400 mr-1\" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className=\"text-xs text-gray-500\">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium\">
                      <a
                        href={`/admin/orders/${order.id}`}
                        className=\"inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors\"
                      >
                        <Eye className=\"h-4 w-4 mr-1\" />
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className=\"text-center py-12\">
              <Package className=\"mx-auto h-12 w-12 text-gray-400\" />
              <h3 className=\"mt-2 text-sm font-medium text-gray-900\">No orders found</h3>
              <p className=\"mt-1 text-sm text-gray-500\">
                {status === 'all' 
                  ? 'No orders have been placed yet.' 
                  : `No ${status} orders found.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className=\"bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow\">
            <div className=\"flex-1 flex justify-between sm:hidden\">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${status !== 'all' ? `&status=${status}` : ''}`}
                  className=\"relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50\"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?page=${page + 1}${status !== 'all' ? `&status=${status}` : ''}`}
                  className=\"ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50\"
                >
                  Next
                </a>
              )}
            </div>
            <div className=\"hidden sm:flex-1 sm:flex sm:items-center sm:justify-between\">
              <div>
                <p className=\"text-sm text-gray-700\">
                  Showing <span className=\"font-medium\">{offset + 1}</span> to{' '}
                  <span className=\"font-medium\">{Math.min(offset + limit, total)}</span> of{' '}
                  <span className=\"font-medium\">{total}</span> results
                </p>
              </div>
              <div>
                <nav className=\"relative z-0 inline-flex rounded-md shadow-sm -space-x-px\" aria-label=\"Pagination\">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <a
                      key={pageNum}
                      href={`?page=${pageNum}${status !== 'all' ? `&status=${status}` : ''}`}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === page
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}