import { Suspense } from 'react'
import Link from 'next/link'
import { ProductCategory } from '@prisma/client'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import Header from '@/components/navigation/header'

interface ProductsPageProps {
  searchParams: { category?: string }
}

async function getProducts(category?: ProductCategory) {
  return prisma.product.findMany({
    where: category ? { category } : {},
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      variants: {
        orderBy: { price: 'asc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6
                    sm:grid-cols-2
                    lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200"></div>
          <div className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

async function ProductGrid({ category }: { category?: ProductCategory }) {
  const products = await getProducts(category)

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.75 7.5h16.5-1.5V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v1.5z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding some products.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6
                    sm:grid-cols-2
                    lg:grid-cols-3">
      {products.map((product) => {
        const primaryImage = product.images[0]
        const lowestPrice = product.variants[0]?.price || product.basePrice
        
        return (
          <Link 
            key={product.id} 
            href={`/products/${product.id}`}
            className="card overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-square bg-gray-100">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={primaryImage.altText}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium text-gray-900">
                  From {formatPrice(Number(lowestPrice))}
                </p>
                <span className="text-sm text-primary-600 font-medium">
                  Customize →
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  const category = searchParams.category as ProductCategory | undefined

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-8
                        sm:px-6
                        lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900
                          sm:text-4xl">
              {category && PRODUCT_CATEGORIES[category] 
                ? PRODUCT_CATEGORIES[category]
                : 'All Products'
              }
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Create amazing custom apparel with our premium products and AI-powered design tools.
            </p>
          </div>

          {/* Category Navigation */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !category
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All Products
            </Link>
            {Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => (
              <Link
                key={key}
                href={`/products?category=${key}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {value}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-12
                      sm:px-6
                      lg:px-8">
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductGrid category={category} />
        </Suspense>
      </div>
    </div>
  )
}