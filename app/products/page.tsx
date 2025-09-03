import { getProducts } from '@/lib/db-direct'
import { PRODUCT_PRICES } from '@/lib/stripe'
import Link from 'next/link'
import { Search, Grid3X3, List } from 'lucide-react'
import { CompactSocialShare } from '@/components/social/social-share'
import Header from '@/components/navigation/header'

interface SearchParams {
  design?: string
  category?: string
  search?: string
  sort?: string
  view?: 'grid' | 'list'
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const products = await getProducts()
  const { design, category, search, sort = 'name', view = 'grid' } = searchParams

  // Simple filtering
  let filteredProducts = products

  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category.toUpperCase() === category.toUpperCase())
  }

  if (search) {
    const searchTerm = search.toLowerCase()
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm)
    )
  }

  // Simple sorting
  if (sort === 'price-low') {
    filteredProducts = filteredProducts.sort((a, b) => {
      const priceA = a.category === 'CAP' ? PRODUCT_PRICES.CAP.base : 
                    a.category === 'TOTE_BAG' ? PRODUCT_PRICES.TOTE_BAG.base : 2499
      const priceB = b.category === 'CAP' ? PRODUCT_PRICES.CAP.base : 
                    b.category === 'TOTE_BAG' ? PRODUCT_PRICES.TOTE_BAG.base : 2499
      return priceA - priceB
    })
  }

  const availableCategories = ['TSHIRT', 'CAP', 'TOTE_BAG']

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-600">
            High-quality apparel ready for your custom designs
          </p>
        </div>

        {/* Simple Search Bar */}
        <form method="GET" className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <select name="category" defaultValue={category || ''} className="border border-gray-300 rounded-md py-2 px-3">
              <option value="">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
              ))}
            </select>

            <select name="sort" defaultValue={sort} className="border border-gray-300 rounded-md py-2 px-3">
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
            </select>

            {design && <input type="hidden" name="design" value={design} />}
            
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Search
            </button>
          </div>
        </form>

        {/* Results */}
        <div className="mb-6">
          <p className="text-sm text-gray-700">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              let pricing = { base: 2499, premium: 3499 }
              if (product.category === 'CAP') pricing = PRODUCT_PRICES.CAP
              else if (product.category === 'TOTE_BAG') pricing = PRODUCT_PRICES.TOTE_BAG

              const basePrice = pricing.base / 100
              const primaryImage = product.images?.find(img => img.is_primary)

              return (
                <div key={product.id} className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage.url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-gray-400">No Image</div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-semibold text-gray-900">
                        ${basePrice.toFixed(2)}
                      </span>
                      {product.variants && (
                        <span className="text-sm text-gray-500">
                          {product.variants.length} variants
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/products/${product.id}${design ? `?design=${encodeURIComponent(design)}` : ''}`}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
                      >
                        {design ? 'Customize & Order' : 'View Product'}
                      </Link>
                      <CompactSocialShare
                        type="product"
                        item={{
                          id: product.id,
                          name: product.name,
                          imageUrl: primaryImage?.url || '/images/placeholder.png',
                          description: product.description,
                          product: {
                            name: product.name,
                            type: product.category
                          }
                        }}
                        showCount={false}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}