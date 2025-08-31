import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import Header from '@/components/navigation/header'
import TemplateGallery from '@/components/templates/template-gallery'
import TemplateFilters from '@/components/templates/template-filters'
import {
  Sparkles,
  Zap,
  Crown,
  Users,
  TrendingUp,
  Calendar,
  Layout
} from 'lucide-react'

interface SearchParams {
  category?: string
  style?: string
  color?: string
  sort?: string
  search?: string
  page?: string
  type?: 'free' | 'premium' | 'all'
}

interface TemplatesPageProps {
  searchParams: SearchParams
}

async function getTemplates(filters: SearchParams) {
  const page = parseInt(filters.page || '1')
  const limit = 16
  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
    isActive: true,
  }

  if (filters.category) {
    where.category = {
      slug: filters.category,
    }
  }

  if (filters.style) {
    where.tags = {
      hasSome: [filters.style],
    }
  }

  if (filters.type && filters.type !== 'all') {
    where.isPremium = filters.type === 'premium'
  }

  if (filters.search) {
    where.OR = [
      {
        name: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        tags: {
          hasSome: [filters.search],
        },
      },
    ]
  }

  // Build orderBy
  let orderBy: any = { createdAt: 'desc' }
  
  switch (filters.sort) {
    case 'popular':
      orderBy = { usageCount: 'desc' }
      break
    case 'trending':
      orderBy = { weeklyUsage: 'desc' }
      break
    case 'newest':
      orderBy = { createdAt: 'desc' }
      break
    case 'name':
      orderBy = { name: 'asc' }
      break
    default:
      orderBy = { createdAt: 'desc' }
  }

  const [templates, totalCount, categories] = await Promise.all([
    prisma.designTemplate.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            designs: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.designTemplate.count({ where }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    templates,
    totalCount,
    categories,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  }
}

async function getTemplateStats() {
  const [totalTemplates, freeTemplates, premiumTemplates, totalUsage] = await Promise.all([
    prisma.designTemplate.count({ where: { isActive: true } }),
    prisma.designTemplate.count({ where: { isActive: true, isPremium: false } }),
    prisma.designTemplate.count({ where: { isActive: true, isPremium: true } }),
    prisma.designTemplate.aggregate({
      where: { isActive: true },
      _sum: { usageCount: true },
    }),
  ])

  return {
    totalTemplates,
    freeTemplates,
    premiumTemplates,
    totalUsage: totalUsage._sum.usageCount || 0,
  }
}

function TemplatesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6
                    sm:grid-cols-2
                    lg:grid-cols-3
                    xl:grid-cols-4">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="flex items-center space-x-2">
              <div className="h-6 w-12 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

async function TemplatesContent({ 
  filters, 
  userId 
}: { 
  filters: SearchParams
  userId?: string 
}) {
  const [templateData, stats] = await Promise.all([
    getTemplates(filters),
    getTemplateStats(),
  ])

  const { templates, totalCount, categories, currentPage, totalPages } = templateData

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Design Templates
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start your design journey with professionally crafted templates. 
            Choose from our collection of free and premium designs, then customize them to make them your own.
          </p>
        </div>

        {/* Featured Categories */}
        <div className="grid grid-cols-2 gap-4 mb-8
                        sm:grid-cols-4
                        lg:grid-cols-6">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-colors cursor-pointer">
            <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-900">New & Trending</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-colors cursor-pointer">
            <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900">Quick Start</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-colors cursor-pointer">
            <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-900">Premium</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 transition-colors cursor-pointer">
            <Users className="h-8 w-8 text-pink-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-pink-900">Community</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 transition-colors cursor-pointer">
            <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-yellow-900">Most Popular</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 transition-colors cursor-pointer">
            <Calendar className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-indigo-900">Seasonal</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6 mb-8
                      sm:grid-cols-4">
        <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalTemplates.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Total Templates</p>
        </div>

        <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-green-600">{stats.freeTemplates.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Free Templates</p>
        </div>

        <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-purple-600">{stats.premiumTemplates.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Premium Templates</p>
        </div>

        <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-blue-600">{stats.totalUsage.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Times Used</p>
        </div>
      </div>

      {/* Filters and Gallery */}
      <div className="grid grid-cols-1 gap-6
                      lg:grid-cols-4">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Layout className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            
            <TemplateFilters
              categories={categories}
              currentFilters={filters}
            />
          </div>
        </div>

        {/* Templates Gallery */}
        <div className="lg:col-span-3">
          <TemplateGallery
            templates={templates}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            filters={filters}
            userId={userId}
          />
        </div>
      </div>
    </>
  )
}

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const session = await auth()
  
  const filters = {
    category: searchParams.category,
    style: searchParams.style,
    color: searchParams.color,
    sort: searchParams.sort || 'newest',
    search: searchParams.search,
    page: searchParams.page || '1',
    type: searchParams.type || 'all',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8
                      sm:px-6
                      lg:px-8">
        
        <Suspense fallback={<TemplatesSkeleton />}>
          <TemplatesContent filters={filters} userId={session?.user?.id} />
        </Suspense>
      </div>
    </div>
  )
}