'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAnalytics } from '@/lib/analytics'
import {
  Star,
  Trophy,
  Target,
  Gift,
  Zap,
  Crown,
  Medal,
  TrendingUp,
  Users,
  Heart,
  Share2,
  Palette,
  ShoppingCart,
  Award,
  ChevronRight,
  Sparkles,
  Fire
} from 'lucide-react'

interface UserStats {
  totalPoints: number
  level: number
  levelProgress: number
  nextLevelPoints: number
  pointsToNextLevel: number
  designsCreated: number
  designsShared: number
  designsLiked: number
  ordersMade: number
  streak: number
  rank: number
  totalUsers: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  category: 'design' | 'social' | 'purchase' | 'community'
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
}

interface PointsHistoryItem {
  id: string
  points: number
  action: string
  description: string
  createdAt: Date
  category: 'earned' | 'redeemed'
}

export default function UserPoints() {
  const { data: session } = useSession()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  
  const { trackEvent } = useAnalytics()

  useEffect(() => {
    if (session?.user) {
      fetchUserStats()
      fetchAchievements()
      fetchPointsHistory()
    }
  }, [session])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/gamification/stats')
      if (response.ok) {
        const stats = await response.json()
        setUserStats(stats)
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/gamification/achievements')
      if (response.ok) {
        const data = await response.json()
        setAchievements(data)
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    }
  }

  const fetchPointsHistory = async () => {
    try {
      const response = await fetch('/api/gamification/history?limit=10')
      if (response.ok) {
        const data = await response.json()
        setPointsHistory(data)
      }
    } catch (error) {
      console.error('Failed to fetch points history:', error)
    }
  }

  const getLevelName = (level: number) => {
    const levels = [
      'Beginner',
      'Creator',
      'Designer',
      'Artist',
      'Expert',
      'Master',
      'Legend',
      'Champion'
    ]
    return levels[Math.min(level - 1, levels.length - 1)] || 'Grand Master'
  }

  const getLevelColor = (level: number) => {
    if (level >= 8) return 'text-purple-600'
    if (level >= 6) return 'text-yellow-600'
    if (level >= 4) return 'text-blue-600'
    if (level >= 2) return 'text-green-600'
    return 'text-gray-600'
  }

  const getAchievementIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      palette: Palette,
      heart: Heart,
      share: Share2,
      shopping: ShoppingCart,
      crown: Crown,
      trophy: Trophy,
      medal: Medal,
      star: Star,
      fire: Fire,
      zap: Zap,
      users: Users,
      target: Target
    }
    return icons[iconName] || Award
  }

  const formatPoints = (points: number) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`
    return points.toString()
  }

  if (!session?.user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Join the TShop Community
        </h3>
        <p className="text-gray-600 mb-4">
          Sign in to earn points, unlock achievements, and compete with other designers!
        </p>
        <button className="btn-primary">
          Sign In to Start Earning
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!userStats) return null

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl`}>
                {userStats.level}
              </div>
              {userStats.streak > 0 && (
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  <Fire className="h-2 w-2" />
                </div>
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${getLevelColor(userStats.level)}`}>
                {getLevelName(userStats.level)}
              </h2>
              <p className="text-primary-700 flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>{formatPoints(userStats.totalPoints)} points</span>
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-primary-700 mb-1">
              Rank #{userStats.rank} of {userStats.totalUsers.toLocaleString()}
            </div>
            {userStats.streak > 0 && (
              <div className="flex items-center text-orange-600 text-sm">
                <Fire className="h-3 w-3 mr-1" />
                <span>{userStats.streak} day streak!</span>
              </div>
            )}
          </div>
        </div>

        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-primary-700">Progress to next level</span>
            <span className="text-primary-700">
              {userStats.pointsToNextLevel} points to go
            </span>
          </div>
          <div className="w-full bg-primary-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${userStats.levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <Palette className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{userStats.designsCreated}</div>
          <div className="text-sm text-gray-600">Designs</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <Share2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{userStats.designsShared}</div>
          <div className="text-sm text-gray-600">Shares</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <Heart className="h-6 w-6 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{userStats.designsLiked}</div>
          <div className="text-sm text-gray-600">Likes</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <ShoppingCart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{userStats.ordersMade}</div>
          <div className="text-sm text-gray-600">Orders</div>
        </div>
      </div>

      {/* Achievements Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span>Recent Achievements</span>
          </h3>
          <button
            onClick={() => setShowAchievements(true)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {achievements.filter(a => a.unlockedAt).slice(0, 4).map((achievement) => {
            const IconComponent = getAchievementIcon(achievement.icon)
            return (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{achievement.name}</p>
                  <p className="text-sm text-gray-600 truncate">{achievement.description}</p>
                </div>
                <div className="text-xs text-primary-600 font-medium">
                  +{achievement.points}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Points History Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Recent Activity</span>
          </h3>
          <button
            onClick={() => setShowHistory(true)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-3">
          {pointsHistory.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.category === 'earned' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  item.category === 'earned' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.category === 'earned' ? '+' : '-'}{item.points}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white text-center">
        <Sparkles className="h-8 w-8 mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-2">Keep Creating!</h3>
        <p className="text-purple-100 mb-4">
          Create more designs, share with friends, and climb the leaderboard!
        </p>
        <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          Create New Design
        </button>
      </div>
    </div>
  )
}