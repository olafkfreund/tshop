'use client'

import { useState } from 'react'
import { 
  Users, 
  Settings, 
  Crown, 
  Shield, 
  UserPlus,
  Palette,
  TrendingUp,
  Calendar,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react'
import InviteMemberModal from './invite-member-modal'

interface TeamMember {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

interface TeamInvite {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  expiresAt: string
  inviter: {
    name?: string | null
    email: string
  }
}

interface Team {
  id: string
  name: string
  description?: string | null
  logo?: string | null
  plan: string
  size?: string | null
  industry?: string | null
  createdAt: string
  members: TeamMember[]
  invites: TeamInvite[]
}

interface TeamOverviewProps {
  team: Team
  userRole: string
  memberCount: number
  designCount: number
}

export default function TeamOverview({ team, userRole, memberCount, designCount }: TeamOverviewProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [members, setMembers] = useState(team.members)
  const [invites, setInvites] = useState(team.invites)
  const [activeTab, setActiveTab] = useState('members')

  const canManageMembers = ['OWNER', 'ADMIN'].includes(userRole)
  const canInviteMembers = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole)

  const handleMemberInvited = (newInvite: TeamInvite) => {
    setInvites(prev => [...prev, newInvite])
    setShowInviteModal(false)
  }

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${team.id}/members/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove member')
      }

      setMembers(prev => prev.filter(member => member.id !== memberId))
    } catch (error) {
      alert('Failed to remove member. Please try again.')
    }
  }

  const handleUpdateMemberRole = async (memberId: string, userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/teams/${team.id}/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('Failed to update member role')
      }

      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole }
          : member
      ))
    } catch (error) {
      alert('Failed to update member role. Please try again.')
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/teams/invite/${inviteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel invite')
      }

      setInvites(prev => prev.filter(invite => invite.id !== inviteId))
    } catch (error) {
      alert('Failed to cancel invite. Please try again.')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-100 text-yellow-800'
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4" />
      case 'ADMIN':
        return <Shield className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-8">
      {/* Team Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {team.logo ? (
              <img
                src={team.logo}
                alt={`${team.name} logo`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {team.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userRole)}`}>
                  {getRoleIcon(userRole)}
                  <span>{userRole.toLowerCase()}</span>
                </span>
                <span className="text-sm text-gray-600">
                  {team.plan.toLowerCase()} plan
                </span>
              </div>
            </div>
          </div>

          {canInviteMembers && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Members</span>
            </button>
          )}
        </div>

        {team.description && (
          <p className="text-gray-600 mt-4">{team.description}</p>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
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
              <p className="text-2xl font-bold text-gray-900">{designCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Mail className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Invites</p>
              <p className="text-2xl font-bold text-gray-900">{invites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Created</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(team.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members and Invites */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invites'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Invites ({invites.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'members' ? (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    {member.user.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.name || 'Unnamed User'}
                      </p>
                      <p className="text-sm text-gray-600">{member.user.email}</p>
                      <p className="text-xs text-gray-500">
                        Joined {formatDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role.toLowerCase()}
                    </span>
                    
                    {canManageMembers && member.role !== 'OWNER' && (
                      <div className="flex items-center space-x-1">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateMemberRole(member.id, member.user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {invites.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending invites</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All team invitations have been accepted or expired.
                  </p>
                </div>
              ) : (
                invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invite.email}</p>
                        <p className="text-sm text-gray-600">
                          Invited by {invite.inviter.name || invite.inviter.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Sent {formatDate(invite.createdAt)} • Expires {formatDate(invite.expiresAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(invite.role)}`}>
                        {invite.role.toLowerCase()}
                      </span>
                      
                      {canManageMembers && (
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Cancel invite"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onMemberInvited={handleMemberInvited}
          teamId={team.id}
          canManageRoles={canManageMembers}
        />
      )}
    </div>
  )
}