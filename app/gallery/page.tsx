import { Suspense } from 'react'
import Header from '@/components/navigation/header'
import GalleryGrid from '@/components/gallery/gallery-grid'
import GalleryFilters from '@/components/gallery/gallery-filters'
import { 
  Palette, 
  Users, 
  TrendingUp, 
  Sparkles,
  Star,
  Award,
  Eye
} from 'lucide-react'

interface SearchParams {
  category?: string
  style?: string
  sort?: string
  search?: string
}

export default function GalleryPage({ searchParams }: { searchParams: SearchParams }) {

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4
                        sm:px-6
                        lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4
                          sm:text-5xl">
              Design Gallery
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Discover amazing AI-generated designs from our community. Get inspired, 
              share your creations, and find the perfect design for your custom apparel.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 mt-12
                            sm:grid-cols-3">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-4">
                  <Palette className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">1,200+ Designs</h3>
                <p className="text-sm opacity-80">AI-generated custom designs ready to use</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">850+ Creators</h3>
                <p className="text-sm opacity-80">Talented designers sharing their work</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">25K+ Likes</h3>
                <p className="text-sm opacity-80">Community appreciation and engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12
                      sm:px-6
                      lg:px-8">
        
        {/* Section Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-4
                          sm:justify-start">
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg">
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Sparkles className="h-4 w-4" />
              <span>Recent</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Star className="h-4 w-4" />
              <span>Most Liked</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Award className="h-4 w-4" />
              <span>Featured</span>
            </button>
          </div>
        </div>

        {/* Filters and Grid */}
        <div className="grid grid-cols-1 gap-8
                        lg:grid-cols-4">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>}>
              <GalleryFilters searchParams={searchParams} />
            </Suspense>
          </div>

          {/* Gallery Grid */}
          <div className="lg:col-span-3">
            <Suspense fallback={<GalleryLoadingSkeleton />}>
              <GalleryGrid searchParams={searchParams} />
            </Suspense>
          </div>
        </div>

        {/* Community Features */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join the Community</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Share your designs, discover trending styles, and connect with fellow creators. 
              Every design tells a story – what's yours?
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6
                          md:grid-cols-3">
            <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">Share Your Designs</h3>
              <p className="text-sm text-gray-600 mb-4">
                Submit your AI-generated designs to inspire others and showcase your creativity
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Upload Design →
              </button>
            </div>

            <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">Follow Creators</h3>
              <p className="text-sm text-gray-600 mb-4">
                Connect with talented designers and stay updated with their latest creations
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Discover Creators →
              </button>
            </div>

            <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">Earn Recognition</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get likes, followers, and featured placement for your most popular designs
              </p>
              <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                Learn More →
              </button>
            </div>
          </div>
        </div>

        {/* Design Challenges */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Design Challenges</h2>
            <p className="text-gray-600">
              Weekly themed challenges to inspire creativity and win amazing prizes
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6
                          md:grid-cols-2">
            <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">🎃 Halloween Vibes</h3>
                  <p className="text-white/90 text-sm mb-4">
                    Create spooky, fun, or themed designs perfect for Halloween season
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>🏆 Winner gets $100</span>
                    <span>⏰ 5 days left</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">127</div>
                  <div className="text-white/80 text-xs">submissions</div>
                </div>
              </div>
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Join Challenge
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">🌟 Minimalist Magic</h3>
                  <p className="text-white/90 text-sm mb-4">
                    Less is more – create stunning designs with minimal elements
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>🎁 Feature placement</span>
                    <span>⏰ 12 days left</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">89</div>
                  <div className="text-white/80 text-xs">submissions</div>
                </div>
              </div>
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Join Challenge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GalleryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Sort bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-6
                      sm:grid-cols-2
                      lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg aspect-square mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex items-center space-x-4">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}