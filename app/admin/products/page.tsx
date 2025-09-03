import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin-auth'
import { getProducts } from '@/lib/db-direct'
import { 
  Package, 
  Plus, 
  Edit, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react'

export default async function AdminProductsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin/products')
  }
  
  const userIsAdmin = await isAdmin(session.user.id)
  if (!userIsAdmin) {
    redirect('/?error=access-denied')
  }

  const products = await getProducts()

  return (
    <div className=\"min-h-screen bg-gray-50 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        {/* Header */}
        <div className=\"mb-8\">
          <div className=\"flex items-center justify-between\">
            <div>
              <h1 className=\"text-3xl font-bold text-gray-900\">Product Management</h1>
              <p className=\"mt-2 text-gray-600\">
                Manage your product catalog and inventory
              </p>
            </div>
            <div className=\"flex space-x-3\">
              <a
                href=\"/admin/products/new\"
                className=\"bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center\"
              >
                <Plus className=\"h-4 w-4 mr-2\" />
                Add Product
              </a>
              <a
                href=\"/admin\"
                className=\"bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors\"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8\">
          {products.map((product: any) => {
            const primaryImage = product.images?.find((img: any) => img.is_primary)
            const variantCount = product.variants?.length || 0
            
            return (
              <div key={product.id} className=\"bg-white rounded-lg shadow overflow-hidden\">
                <div className=\"h-48 bg-gray-100 relative\">
                  {primaryImage ? (
                    <img
                      src={primaryImage.url}
                      alt={primaryImage.alt_text || product.name}
                      className=\"w-full h-full object-contain\"
                    />
                  ) : (
                    <div className=\"w-full h-full flex items-center justify-center\">
                      <ImageIcon className=\"h-12 w-12 text-gray-400\" />
                    </div>
                  )}
                  <div className=\"absolute top-2 right-2\">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className=\"p-4\">
                  <div className=\"flex items-start justify-between mb-2\">
                    <h3 className=\"text-lg font-medium text-gray-900 flex-1 pr-2\">
                      {product.name}
                    </h3>
                    <span className=\"text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded\">
                      {product.category}
                    </span>
                  </div>
                  
                  <p className=\"text-sm text-gray-600 mb-3 line-clamp-2\">
                    {product.description}
                  </p>
                  
                  <div className=\"flex items-center justify-between mb-4\">
                    <div className=\"flex items-center text-sm text-green-600\">
                      <DollarSign className=\"h-4 w-4 mr-1\" />
                      ${parseFloat(product.base_price || 0).toFixed(2)}
                    </div>
                    <div className=\"text-sm text-gray-500\">
                      {variantCount} variant{variantCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className=\"flex space-x-2\">
                    <a
                      href={`/admin/products/${product.id}`}
                      className=\"flex-1 bg-indigo-600 text-white text-center py-2 px-3 rounded-md text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center\"
                    >
                      <Edit className=\"h-4 w-4 mr-1\" />
                      Edit
                    </a>
                    <a
                      href={`/products/${product.id}`}
                      target=\"_blank\"
                      className=\"flex-1 bg-gray-600 text-white text-center py-2 px-3 rounded-md text-sm hover:bg-gray-700 transition-colors flex items-center justify-center\"
                    >
                      <Eye className=\"h-4 w-4 mr-1\" />
                      View
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {products.length === 0 && (
          <div className=\"bg-white rounded-lg shadow p-12 text-center\">
            <Package className=\"mx-auto h-12 w-12 text-gray-400 mb-4\" />
            <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No products found</h3>
            <p className=\"text-gray-600 mb-6\">
              Get started by adding your first product to the catalog.
            </p>
            <a
              href=\"/admin/products/new\"
              className=\"inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors\"
            >
              <Plus className=\"h-5 w-5 mr-2\" />
              Add Your First Product
            </a>
          </div>
        )}

        {/* Product Categories Summary */}
        {products.length > 0 && (
          <div className=\"bg-white rounded-lg shadow p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">
              Product Summary
            </h3>
            <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-6\">
              {['TSHIRT', 'CAP', 'TOTE_BAG'].map((category) => {
                const categoryProducts = products.filter((p: any) => p.category === category)
                const activeProducts = categoryProducts.filter((p: any) => p.is_active)
                
                return (
                  <div key={category} className=\"text-center\">
                    <div className=\"text-2xl font-bold text-gray-900\">
                      {categoryProducts.length}
                    </div>
                    <div className=\"text-sm text-gray-600\">
                      {category.replace('_', ' ')}
                      {categoryProducts.length !== 1 ? 'S' : ''}
                    </div>
                    <div className=\"text-xs text-green-600 mt-1\">
                      {activeProducts.length} active
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}