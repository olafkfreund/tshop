import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/navigation/header'
import TeamOverview from '@/components/teams/team-overview'
import { prisma } from '@/lib/db'

interface TeamPageProps {
  params: {
    slug: string
  }
}

async function getTeamData(slug: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      invites: {
        where: {
          status: 'PENDING',
        },
        include: {
          inviter: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          designs: true,
        },
      },
    },
  })

  if (!team) {
    return null
  }

  const userMembership = team.members.find(member => member.userId === userId)
  if (!userMembership) {
    return null
  }

  return {
    team,
    userRole: userMembership.role,
    memberCount: team._count.members,
    designCount: team._count.designs,
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/teams')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  const teamData = await getTeamData(params.slug, user.id)

  if (!teamData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<TeamOverviewSkeleton />}>
          <TeamOverview 
            team={teamData.team}
            userRole={teamData.userRole}
            memberCount={teamData.memberCount}
            designCount={teamData.designCount}
          />
        </Suspense>
      </div>
    </div>
  )
}

function TeamOverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="ml-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Members Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}