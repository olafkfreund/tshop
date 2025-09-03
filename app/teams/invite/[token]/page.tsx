import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Header from '@/components/navigation/header'
import TeamInviteHandler from '@/components/teams/team-invite-handler'

interface InvitePageProps {
  params: {
    token: string
  }
}

export default async function TeamInvitePage({ params }: InvitePageProps) {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect(`/auth/signin?callbackUrl=/teams/invite/${params.token}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-2xl">
        <Suspense fallback={<InvitePageSkeleton />}>
          <TeamInviteHandler token={params.token} userEmail={session.user.email} />
        </Suspense>
      </div>
    </div>
  )
}

function InvitePageSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 animate-pulse">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-8"></div>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
        </div>
        
        <div className="flex space-x-3 justify-center">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}