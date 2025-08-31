import { Suspense } from 'react'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import Header from '@/components/navigation/header'
import DesignGallery from '@/components/designs/design-gallery'
import DesignFilters from '@/components/designs/design-filters'
import {
  Palette,
  Sparkles,
  Users,
  TrendingUp,
  Plus,
  Grid3x3
} from 'lucide-react'
import Link from 'next/link'

interface SearchParams {
  category?: string
  style?: string
  color?: string
  sort?: string
  search?: string
  page?: string
}

interface DesignsPageProps {
  searchParams: SearchParams
}

async function getDesigns(filters: SearchParams, userId?: string) {
  const page = parseInt(filters.page || '1')
  const limit = 16
  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
    isPublic: true,
  }

  if (filters.category) {
    where.product = {
      category: {
        slug: filters.category,
      },
    }
  }

  if (filters.style) {
    where.tags = {
      hasSome: [filters.style],
    }
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
    case 'likes':
      orderBy = { likesCount: 'desc' }
      break
    case 'newest':
      orderBy = { createdAt: 'desc' }
      break
    case 'oldest':
      orderBy = { createdAt: 'asc' }
      break
    default:
      orderBy = { createdAt: 'desc' }
  }

  const [designs, totalCount, categories, userDesignCount] = await Promise.all([
    prisma.design.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        product: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        variant: {
          select: {
            colorName: true,
          },
        },
        _count: {
          select: {
            likes: true,
            orderItems: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.design.count({ where }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    userId ? prisma.design.count({
      where: { userId, isPublic: true },
    }) : Promise.resolve(0),
  ])

  return {
    designs,
    totalCount,
    categories,
    userDesignCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  }
}

async function getGalleryStats() {
  const [totalDesigns, totalUsers, totalLikes] = await Promise.all([
    prisma.design.count({ where: { isPublic: true } }),
    prisma.user.count({
      where: {
        designs: {
          some: { isPublic: true },
        },
      },
    }),
    prisma.designLike.count(),
  ])

  return { totalDesigns, totalUsers, totalLikes }
}

function DesignsSkeleton() {
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
              <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

async function DesignsContent({ filters, userId }: { 
  filters: SearchParams; 
  userId?: string 
}) {
  const [galleryData, stats] = await Promise.all([
    getDesigns(filters, userId),
    getGalleryStats(),
  ])

  const { designs, totalCount, categories, userDesignCount, currentPage, totalPages } = galleryData

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col space-y-6
                        lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Design Gallery
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Discover amazing designs created by our community. Get inspired, customize existing designs, 
              or share your own creations with the world.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {userId && (
              <Link
                href="/design/create"
                className="btn-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Design
              </Link>
            )}
            
            <Link
              href={userId ? "/designs/my-designs" : "/auth/signin?callbackUrl=/designs/my-designs"}
              className="btn-primary"
            >
              <Palette className="h-4 w-4 mr-2" />
              {userId ? 'My Designs' : 'Share Designs'}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 mb-8
                      sm:grid-cols-2
                      lg:grid-cols-4">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Palette className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalDesigns.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Total Designs</p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Creators</p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalLikes.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Total Likes</p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {userId ? userDesignCount : '—'}
          </h3>
          <p className="text-sm text-gray-600">Your Designs</p>
        </div>
      </div>

      {/* Filters and Gallery */}
      <div className="grid grid-cols-1 gap-6
                      lg:grid-cols-4">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Grid3x3 className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            
            <DesignFilters
              categories={categories}
              currentFilters={filters}
            />
          </div>
        </div>

        {/* Gallery */}
        <div className="lg:col-span-3">
          <DesignGallery
            designs={designs}
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

export default async function DesignsPage({ searchParams }: DesignsPageProps) {
  const session = await auth()
  
  const filters = {
    category: searchParams.category,
    style: searchParams.style,
    color: searchParams.color,
    sort: searchParams.sort || 'newest',
    search: searchParams.search,
    page: searchParams.page || '1',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8
                      sm:px-6
                      lg:px-8">
        
        <Suspense fallback={<DesignsSkeleton />}>
          <DesignsContent filters={filters} userId={session?.user?.id} />
        </Suspense>
      </div>
    </div>
  )
}