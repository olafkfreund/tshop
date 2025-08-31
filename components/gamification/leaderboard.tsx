'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAnalytics } from '@/lib/analytics'
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  User,
  Flame,
  Award,
  Target
} from 'lucide-react'

interface LeaderboardUser {
  id: string
  name?: string
  image?: string
  totalPoints: number
  level: number
  rank: number
  rankChange: number
  designsCreated: number
  designsShared: number
  streak: number
  isCurrentUser?: boolean
}

interface LeaderboardProps {
  timeframe?: 'weekly' | 'monthly' | 'all-time'
  category?: 'all' | 'designers' | 'sharers' | 'active'
  limit?: number
  showCurrentUser?: boolean
}

const TIMEFRAMES = [
  { key: 'weekly', label: 'This Week', icon: Calendar },
  { key: 'monthly', label: 'This Month', icon: TrendingUp },
  { key: 'all-time', label: 'All Time', icon: Trophy }
] as const

const CATEGORIES = [
  { key: 'all', label: 'Overall', icon: Trophy },
  { key: 'designers', label: 'Top Designers', icon: Star },
  { key: 'sharers', label: 'Social Stars', icon: Users },
  { key: 'active', label: 'Most Active', icon: Flame }
] as const

export default function Leaderboard({
  timeframe = 'weekly',
  category = 'all',
  limit = 50,
  showCurrentUser = true
}: LeaderboardProps) {
  const { data: session } = useSession()
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
  const [selectedCategory, setSelectedCategory] = useState(category)
  
  const { trackEvent } = useAnalytics()

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedTimeframe, selectedCategory])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/gamification/leaderboard?timeframe=${selectedTimeframe}&category=${selectedCategory}&limit=${limit}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setCurrentUser(data.currentUser)

        trackEvent({
          action: 'leaderboard_viewed',
          category: 'gamification',
          custom_parameters: {
            timeframe: selectedTimeframe,
            category: selectedCategory,
          },
        })
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">{rank}</span>
          </div>
        )
    }
  }

  const getRankChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600 text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span>+{change}</span>
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600 text-xs">
          <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
          <span>{change}</span>
        </div>
      )
    }
    return (
      <div className="text-xs text-gray-500">
        <span>—</span>
      </div>
    )
  }

  const formatPoints = (points: number) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`
    return points.toString()
  }

  const getLevelColor = (level: number) => {
    if (level >= 8) return 'text-purple-600 bg-purple-100'
    if (level >= 6) return 'text-yellow-600 bg-yellow-100'
    if (level >= 4) return 'text-blue-600 bg-blue-100'
    if (level >= 2) return 'text-green-600 bg-green-100'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <span>Leaderboard</span>
          </h2>
          
          <div className="text-sm text-gray-500">
            Updated every hour
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Timeframe */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Timeframe
            </label>
            <div className="flex space-x-2">
              {TIMEFRAMES.map((tf) => {
                const Icon = tf.icon
                return (
                  <button
                    key={tf.key}
                    onClick={() => setSelectedTimeframe(tf.key)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTimeframe === tf.key
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tf.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat.key
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Current User (if not in top positions) */}
            {showCurrentUser && currentUser && currentUser.rank > 10 && (
              <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="text-sm font-medium text-primary-700 mb-2">
                  Your Position
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(currentUser.rank)}
                      <span className="font-bold text-primary-900">#{currentUser.rank}</span>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-200">
                      {currentUser.image ? (
                        <img
                          src={currentUser.image}
                          alt={currentUser.name || 'You'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium text-primary-900">
                        {currentUser.name || 'You'}
                      </p>
                      <p className="text-sm text-primary-700">
                        Level {currentUser.level} • {formatPoints(currentUser.totalPoints)} points
                      </p>
                    </div>
                  </div>
                  
                  {getRankChangeIndicator(currentUser.rankChange)}
                </div>
              </div>
            )}

            {/* Top Users */}
            <div className="space-y-2">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    user.isCurrentUser 
                      ? 'bg-primary-50 border border-primary-200' 
                      : index < 3
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex items-center space-x-2">
                      {getRankIcon(user.rank)}
                      <span className={`font-bold ${
                        index < 3 ? 'text-yellow-900' : 'text-gray-900'
                      }`}>
                        #{user.rank}
                      </span>
                    </div>

                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Streak indicator */}
                      {user.streak > 7 && (
                        <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          <Flame className="h-2 w-2" />
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {user.name || 'Anonymous Designer'}
                        </p>
                        {user.isCurrentUser && (
                          <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(user.level)}`}>
                          Level {user.level}
                        </div>
                        <span>{user.designsCreated} designs</span>
                        <span>{user.designsShared} shares</span>
                      </div>
                    </div>
                  </div>

                  {/* Points & Change */}
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      user.isCurrentUser ? 'text-primary-900' : 'text-gray-900'
                    }`}>
                      {formatPoints(user.totalPoints)}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">points</div>
                    {getRankChangeIndicator(user.rankChange)}
                  </div>
                </div>
              ))}
            </div>

            {/* View More */}
            {users.length === limit && (
              <div className="text-center mt-6">
                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                  View More Rankings
                </button>
              </div>
            )}

            {/* Empty State */}
            {users.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Rankings Yet
                </h3>
                <p className="text-gray-600">
                  Be the first to start creating and earning points!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}