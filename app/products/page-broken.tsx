import { getProducts } from '@/lib/db-direct'
import { PRODUCT_PRICES } from '@/lib/stripe'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Grid3X3, 
  List,
  ChevronDown,
  X
} from 'lucide-react'

interface SearchParams {
  design?: string
  category?: string
  search?: string
  sort?: string
  priceMin?: string
  priceMax?: string
  colors?: string
  view?: 'grid' | 'list'
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const products = await getProducts()
  const { 
    design, 
    category, 
    search, 
    sort = 'name', 
    priceMin, 
    priceMax, 
    colors,
    view = 'grid'
  } = searchParams

  // Advanced filtering logic
  let filteredProducts = products

  // Filter by category
  if (category) {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toUpperCase() === category.toUpperCase()
    )
  }

  // Filter by search term
  if (search) {
    const searchTerm = search.toLowerCase()
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm)
    )
  }

  // Filter by price range
  if (priceMin || priceMax) {
    filteredProducts = filteredProducts.filter(p => {
      let pricing = { base: 2499, premium: 3499 }
      if (p.category === 'CAP') pricing = PRODUCT_PRICES.CAP
      else if (p.category === 'TOTE_BAG') pricing = PRODUCT_PRICES.TOTE_BAG
      
      const basePrice = pricing.base / 100
      const min = priceMin ? parseFloat(priceMin) : 0
      const max = priceMax ? parseFloat(priceMax) : Infinity
      
      return basePrice >= min && basePrice <= max
    })
  }

  // Filter by colors if color variants exist
  if (colors) {
    const selectedColors = colors.split(',')
    filteredProducts = filteredProducts.filter(p =>
      p.variants && p.variants.some(v =>
        selectedColors.some(color => v.color_name.toLowerCase().includes(color.toLowerCase()))
      )
    )
  }

  // Sorting logic
  switch (sort) {
    case 'price-low':
      filteredProducts = filteredProducts.sort((a, b) => {
        const priceA = a.category === 'CAP' ? PRODUCT_PRICES.CAP.base : 
                      a.category === 'TOTE_BAG' ? PRODUCT_PRICES.TOTE_BAG.base : 2499
        const priceB = b.category === 'CAP' ? PRODUCT_PRICES.CAP.base : 
                      b.category === 'TOTE_BAG' ? PRODUCT_PRICES.TOTE_BAG.base : 2499
        return priceA - priceB
      })
      break
    case 'price-high':
      filteredProducts = filteredProducts.sort((a, b) => {
        const priceA = a.category === 'CAP' ? PRODUCT_PRICES.CAP.base : 
                      a.category === 'TOTE_BAG' ? PRODUCT_PRICES.TOTE_BAG.base : 2499
        const priceB = b.category === 'CAP' ? PRODUCT_PRICES.CAP.base : 
                      b.category === 'TOTE_BAG' ? PRODUCT_PRICES.TOTE_BAG.base : 2499
        return priceB - priceA
      })
      break
    case 'name':
    default:
      filteredProducts = filteredProducts.sort((a, b) => a.name.localeCompare(b.name))
      break
  }

  // Get unique categories for filter options
  const availableCategories = [...new Set(products.map(p => p.category))]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-600">
            High-quality apparel ready for your custom designs
          </p>
        </div>

        {/* Search and Filter Bar */}
        <form method="GET" className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                name="category"
                defaultValue={category || ''}
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm leading-5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                onChange="this.form.submit()"
              >
                <option value="">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Sort Options */}
            <div className="relative">
              <select
                name="sort"
                defaultValue={sort}
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm leading-5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                onChange="this.form.submit()"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Hidden inputs to preserve other parameters */}
            {design && <input type="hidden" name="design" value={design} />}
            {view && <input type="hidden" name="view" value={view} />}

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <Link
                href={`?${new URLSearchParams({...searchParams, view: 'grid'}).toString()}`}
                className={`p-2 ${view === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-l-md transition-colors`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Link>
              <Link
                href={`?${new URLSearchParams({...searchParams, view: 'list'}).toString()}`}
                className={`p-2 ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-r-md transition-colors border-l border-gray-300`}
              >
                <List className="h-4 w-4" />
              </Link>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Search
            </button>
          </div>

          {/* Active Filters Display */}
          {(category || search || colors || priceMin || priceMax) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                
                {category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Category: {category.replace('_', ' ')}
                    <Link
                      href={`?${new URLSearchParams({...searchParams, category: undefined}).toString()}`}
                      className="ml-2 text-indigo-600 hover:text-indigo-500"
                    >
                      <X className="h-3 w-3" />
                    </Link>
                  </span>
                )}
                
                {search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Search: {search}
                    <Link
                      href={`?${new URLSearchParams({...searchParams, search: undefined}).toString()}`}
                      className="ml-2 text-indigo-600 hover:text-indigo-500"
                    >
                      <X className="h-3 w-3" />
                    </Link>
                  </span>
                )}
                
                <Link
                  href="/products"
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Clear all filters
                </Link>
              </div>
            </div>
          )}
        </form>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-700">
            Showing {filteredProducts.length} of {products.length} products
            {category && ` in ${category.replace('_', ' ')}`}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {design && (
          <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  src={design}
                  alt="Your design"
                  className="h-16 w-16 rounded-lg object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-indigo-900">
                  Ready to add your design to a product?
                </h3>
                <p className="text-indigo-700">
                  Select a product below to see your design applied
                </p>
              </div>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Check back later for new products.
            </p>
          </div>
        ) : (
          <div className={view === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-6"
          }>
            {filteredProducts.map((product) => {
              // Get pricing from Stripe configuration
              let pricing = { base: 2499, premium: 3499 } // Default T-shirt pricing
              
              if (product.category === 'CAP') {
                pricing = PRODUCT_PRICES.CAP
              } else if (product.category === 'TOTE_BAG') {
                pricing = PRODUCT_PRICES.TOTE_BAG
              }

              const basePrice = pricing.base / 100
              const primaryImage = product.images?.find(img => img.is_primary)

              return view === 'grid' ? (
                <div
                  key={product.id}
                  className="group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage.url}
                        alt={primaryImage.alt_text || product.name}
                        className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {design && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="text-white text-center">
                          <p className="text-sm">Preview with your design</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-semibold text-gray-900">
                          ${basePrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          +
                        </span>
                      </div>
                      
                      {product.variants && product.variants.length > 0 && (
                        <div className="text-sm text-gray-500">
                          {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/products/${product.id}${design ? `?design=${encodeURIComponent(design)}` : ''}`}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
                      >
                        {design ? 'Customize & Order' : 'View Product'}
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                {/* List View */}
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Product Image */}
                    <div className="w-full md:w-48 aspect-square bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={primaryImage.alt_text || product.name}
                          className="w-full h-full object-center object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {product.name}
                          </h3>
                          <span className="text-2xl font-bold text-gray-900">
                            ${basePrice.toFixed(2)}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {product.description}
                        </p>

                        <div className="flex items-center gap-4 mb-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {product.category.replace('_', ' ')}
                          </span>
                          
                          {product.variants && product.variants.length > 0 && (
                            <span className="text-sm text-gray-500">
                              {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Color Variants Preview */}
                        {product.variants && product.variants.length > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm font-medium text-gray-700">Colors:</span>
                            <div className="flex gap-1">
                              {product.variants.slice(0, 5).map((variant, idx) => (
                                <div
                                  key={idx}
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: variant.color_hex }}
                                  title={variant.color_name}
                                />
                              ))}
                              {product.variants.length > 5 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  +{product.variants.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {design && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Preview with your design
                            </span>
                          )}
                        </div>
                        
                        <Link
                          href={`/products/${product.id}${design ? `?design=${encodeURIComponent(design)}` : ''}`}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors duration-200"
                        >
                          {design ? 'Customize & Order' : 'View Product'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">
            Don't see what you're looking for?
          </h2>
          <p className="text-indigo-100 mb-4">
            Use our AI design generator to create the perfect design for any product
          </p>
          <Link
            href="/ai-design"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition-colors duration-200"
          >
            Generate AI Design
          </Link>
        </div>
      </div>
    </div>
  )
}