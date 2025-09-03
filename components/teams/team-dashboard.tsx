'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Plus, 
  Users, 
  Settings, 
  Crown, 
  Shield, 
  Palette,
  ShoppingBag,
  TrendingUp,
  Calendar,
  MoreVertical
} from 'lucide-react'
import CreateTeamModal from './create-team-modal'
import TeamCard from './team-card'

interface Team {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  size?: string
  plan: string
  memberCount?: number
  designCount?: number
  createdAt: string
  role?: string
}

export default function TeamDashboard() {
  const { data: session } = useSession()
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMembers: 0,
    totalDesigns: 0,
    thisMonth: 0,
  })

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/teams')
      const data = await response.json()

      if (data.success) {
        setTeams(data.teams)
        calculateStats(data.teams)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (teamsData: Team[]) => {
    const totalMembers = teamsData.reduce((sum, team) => sum + (team.memberCount || 0), 0)
    const totalDesigns = teamsData.reduce((sum, team) => sum + (team.designCount || 0), 0)
    
    // Calculate this month's activity (simplified)
    const thisMonth = teamsData.filter(team => {
      const createdDate = new Date(team.createdAt)
      const now = new Date()
      return createdDate.getMonth() === now.getMonth() && 
             createdDate.getFullYear() === now.getFullYear()
    }).length

    setStats({
      totalTeams: teamsData.length,
      totalMembers,
      totalDesigns,
      thisMonth,
    })
  }

  const handleTeamCreated = (newTeam: Team) => {
    setTeams(prev => [...prev, newTeam])
    calculateStats([...teams, newTeam])
    setShowCreateModal(false)
  }

  if (isLoading) {
    return <TeamDashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Teams
          </h1>
          <p className="text-gray-600">
            Manage your team collaborations and design projects
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2 mt-4 lg:mt-0"
        >
          <Plus className="h-5 w-5" />
          <span>Create Team</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Teams</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Palette className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Designs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDesigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <EmptyTeamsState onCreateTeam={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {teams.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-gray-600" />
            Recent Activity
          </h3>
          
          <div className="space-y-4">
            {teams.slice(0, 3).map((team) => (
              <div key={team.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{team.name}</p>
                    <p className="text-sm text-gray-600">
                      {team.memberCount} members • {team.designCount} designs
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    team.plan === 'ENTERPRISE' 
                      ? 'bg-purple-100 text-purple-800'
                      : team.plan === 'BUSINESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {team.plan.toLowerCase()}
                  </span>
                  
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </div>
  )
}

function EmptyTeamsState({ onCreateTeam }: { onCreateTeam: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Users className="h-12 w-12 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No teams yet
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Create your first team to start collaborating on custom designs with your colleagues.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onCreateTeam}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Your First Team</span>
        </button>
        
        <button className="btn-ghost flex items-center space-x-2">
          <ShoppingBag className="h-5 w-5" />
          <span>Continue as Individual</span>
        </button>
      </div>
    </div>
  )
}

function TeamDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
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

      {/* Teams Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
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