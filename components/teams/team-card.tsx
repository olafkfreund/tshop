'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Settings, 
  MoreVertical, 
  Crown, 
  Shield, 
  Palette,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react'

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

interface TeamCardProps {
  team: Team
  onEdit?: (team: Team) => void
  onDelete?: (teamId: string) => void
  onInvite?: (teamId: string) => void
}

export default function TeamCard({ team, onEdit, onDelete, onInvite }: TeamCardProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'BUSINESS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE':
        return <Crown className="h-4 w-4" />
      case 'BUSINESS':
        return <Shield className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-gold-100 text-gold-800'
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors p-6 group">
      {/* Team Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {team.logo ? (
            <img
              src={team.logo}
              alt={`${team.name} logo`}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {team.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {team.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getPlanColor(team.plan)}`}>
                {getPlanIcon(team.plan)}
                <span>{team.plan.toLowerCase()}</span>
              </span>
              
              {team.role && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(team.role)}`}>
                  {team.role.toLowerCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10">
              <div className="py-1">
                <Link
                  href={`/teams/${team.slug}`}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowDropdown(false)}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Team</span>
                </Link>
                
                {team.role === 'OWNER' && onEdit && (
                  <button
                    onClick={() => {
                      onEdit(team)
                      setShowDropdown(false)
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Team</span>
                  </button>
                )}
                
                {(['OWNER', 'ADMIN'].includes(team.role || '')) && onInvite && (
                  <button
                    onClick={() => {
                      onInvite(team.id)
                      setShowDropdown(false)
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Invite Members</span>
                  </button>
                )}
                
                <Link
                  href={`/teams/${team.slug}/settings`}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                
                {team.role === 'OWNER' && onDelete && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
                          onDelete(team.id)
                        }
                        setShowDropdown(false)
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Team</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Description */}
      {team.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {team.description}
        </p>
      )}

      {/* Team Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {team.memberCount || 0} members
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Palette className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {team.designCount || 0} designs
          </span>
        </div>
      </div>

      {/* Team Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>Created {formatDate(team.createdAt)}</span>
        </div>

        <Link
          href={`/teams/${team.slug}`}
          className="btn-ghost btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Open Team
        </Link>
      </div>

      {/* Overlay click handler to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}