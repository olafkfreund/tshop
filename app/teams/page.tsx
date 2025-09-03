import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Header from '@/components/navigation/header'
import TeamDashboard from '@/components/teams/team-dashboard'
import { Users, Plus, Building2 } from 'lucide-react'

export default async function TeamsPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/teams')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6">
              <Users className="h-8 w-8" />
            </div>
            
            <h1 className="text-4xl font-bold mb-4 sm:text-5xl">
              Team Collaboration
            </h1>
            
            <p className="text-xl opacity-90 mb-8">
              Create, collaborate, and manage custom designs with your team. 
              Perfect for businesses, agencies, and design teams.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="btn-primary btn-lg flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New Team</span>
              </button>
              
              <button className="btn-ghost btn-lg text-white border-white/20 hover:bg-white/10 flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Enterprise Solutions</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Suspense fallback={<TeamDashboardSkeleton />}>
          <TeamDashboard />
        </Suspense>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Teams Choose TShop
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything your team needs to create amazing custom apparel together
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Team Collaboration
              </h3>
              <p className="text-gray-600">
                Real-time design collaboration with comments, approvals, and version control
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Brand Management
              </h3>
              <p className="text-gray-600">
                Maintain brand consistency with templates, guidelines, and approval workflows
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <Plus className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Volume Discounts
              </h3>
              <p className="text-gray-600">
                Automatic bulk pricing and team purchasing power for better rates
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Teams Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}