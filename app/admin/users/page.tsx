import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin-auth'
import { getAllUsers } from '@/lib/db-direct'
import { Search, UserCheck, UserX, Crown, User } from 'lucide-react'
import UserRoleButton from '@/components/admin/user-role-button'

interface PageProps {
  searchParams: {
    search?: string
    page?: string
  }
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin/users')
  }
  
  const userIsAdmin = await isAdmin(session.user.id)
  if (!userIsAdmin) {
    redirect('/?error=access-denied')
  }

  const page = parseInt(searchParams.page || '1')
  const search = searchParams.search || ''
  const limit = 20
  const offset = (page - 1) * limit

  const { users, total } = await getAllUsers(limit, offset, search)
  const totalPages = Math.ceil(total / limit)

  return (
    <div className=\"min-h-screen bg-gray-50 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        {/* Header */}
        <div className=\"mb-8\">
          <div className=\"flex items-center justify-between\">
            <div>
              <h1 className=\"text-3xl font-bold text-gray-900\">User Management</h1>
              <p className=\"mt-2 text-gray-600\">
                Manage user accounts, roles, and permissions
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

        {/* Search */}
        <div className=\"bg-white shadow rounded-lg mb-6\">
          <div className=\"p-6\">
            <form method=\"GET\" className=\"flex gap-4\">
              <div className=\"flex-1 relative\">
                <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5\" />
                <input
                  type=\"text\"
                  name=\"search\"
                  defaultValue={search}
                  placeholder=\"Search by email or name...\"
                  className=\"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500\"
                />
              </div>
              <button
                type=\"submit\"
                className=\"bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors\"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Users Table */}
        <div className=\"bg-white shadow rounded-lg overflow-hidden\">
          <div className=\"px-6 py-4 border-b border-gray-200\">
            <h3 className=\"text-lg font-medium text-gray-900\">
              Users ({total} total)
            </h3>
          </div>
          
          <div className=\"overflow-x-auto\">
            <table className=\"min-w-full divide-y divide-gray-200\">
              <thead className=\"bg-gray-50\">
                <tr>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    User
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Role
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Activity
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Joined
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className=\"bg-white divide-y divide-gray-200\">
                {users.map((user: any) => (
                  <tr key={user.id} className=\"hover:bg-gray-50\">
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div className=\"flex items-center\">
                        <div className=\"flex-shrink-0 h-10 w-10\">
                          {user.image ? (
                            <img
                              className=\"h-10 w-10 rounded-full\"
                              src={user.image}
                              alt={user.name || user.email}
                            />
                          ) : (
                            <div className=\"h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center\">
                              <User className=\"h-6 w-6 text-gray-600\" />
                            </div>
                          )}
                        </div>
                        <div className=\"ml-4\">
                          <div className=\"text-sm font-medium text-gray-900\">
                            {user.name || 'No name'}
                          </div>
                          <div className=\"text-sm text-gray-500\">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div className=\"flex items-center\">
                        {user.role === 'admin' ? (
                          <div className=\"flex items-center text-purple-600\">
                            <Crown className=\"h-4 w-4 mr-1\" />
                            <span className=\"text-sm font-medium\">Admin</span>
                          </div>
                        ) : (
                          <div className=\"flex items-center text-gray-600\">
                            <User className=\"h-4 w-4 mr-1\" />
                            <span className=\"text-sm\">User</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">
                      <div className=\"space-y-1\">
                        <div className=\"flex items-center text-blue-600\">
                          <span className=\"text-xs\">{user.order_count || 0} orders</span>
                        </div>
                        <div className=\"flex items-center text-green-600\">
                          <span className=\"text-xs\">{user.ai_usage_count || 0} AI generations</span>
                        </div>
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium\">
                      <UserRoleButton
                        userId={user.id}
                        currentRole={user.role}
                        disabled={user.id === session.user.id} // Can't change own role
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className=\"text-center py-12\">
              <UserX className=\"mx-auto h-12 w-12 text-gray-400\" />
              <h3 className=\"mt-2 text-sm font-medium text-gray-900\">No users found</h3>
              <p className=\"mt-1 text-sm text-gray-500\">
                {search ? 'Try adjusting your search terms.' : 'No users have registered yet.'}
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
                  href={`?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                  className=\"relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50\"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
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
                      href={`?page=${pageNum}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
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