'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Check, X, AlertCircle, Clock, Crown, Shield } from 'lucide-react'

interface TeamInvite {
  id: string
  email: string
  role: string
  expiresAt: string
  createdAt: string
  team: {
    id: string
    name: string
    description?: string
    logo?: string
  }
  inviter: {
    id: string
    name?: string
    email: string
  }
}

interface TeamInviteHandlerProps {
  token: string
  userEmail: string
}

export default function TeamInviteHandler({ token, userEmail }: TeamInviteHandlerProps) {
  const [invite, setInvite] = useState<TeamInvite | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchInviteDetails()
  }, [token])

  const fetchInviteDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/teams/invite/${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid or expired invitation')
        return
      }

      if (data.invite.email !== userEmail) {
        setError('This invitation was sent to a different email address')
        return
      }

      setInvite(data.invite)
    } catch (error) {
      setError('Failed to load invitation details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!invite) return

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/teams/invite/${token}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation')
        return
      }

      setSuccess('Successfully joined the team!')
      
      setTimeout(() => {
        router.push(`/teams/${invite.team.id}`)
      }, 2000)

    } catch (error) {
      setError('Failed to accept invitation. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectInvite = async () => {
    if (!invite) return

    if (!confirm('Are you sure you want to decline this team invitation?')) {
      return
    }

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/teams/invite/${token}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to decline invitation')
        return
      }

      setSuccess('Invitation declined')
      
      setTimeout(() => {
        router.push('/teams')
      }, 2000)

    } catch (error) {
      setError('Failed to decline invitation. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-5 w-5 text-purple-600" />
      case 'MANAGER':
        return <Shield className="h-5 w-5 text-blue-600" />
      default:
        return <Users className="h-5 w-5 text-green-600" />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Full team management access including member management and settings'
      case 'MANAGER':
        return 'Can approve designs, invite members, and manage team projects'
      default:
        return 'Can create designs, comment, and collaborate with the team'
    }
  }

  const isExpired = invite && new Date(invite.expiresAt) < new Date()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Invitation
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'This invitation link is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/teams')}
            className="btn-primary"
          >
            Go to Teams
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {success}
          </h2>
          <p className="text-gray-600">
            Redirecting to your team...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Team Invitation
        </h1>
        <p className="text-gray-600">
          You've been invited to join a team on TShop
        </p>
      </div>

      {/* Team Information */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Team Details
        </h3>
        
        <div className="flex items-center justify-center space-x-4 mb-4">
          {invite.team.logo ? (
            <img
              src={invite.team.logo}
              alt={`${invite.team.name} logo`}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {invite.team.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-center">
            <h4 className="font-semibold text-gray-900">{invite.team.name}</h4>
            {invite.team.description && (
              <p className="text-sm text-gray-600">{invite.team.description}</p>
            )}
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border">
            {getRoleIcon(invite.role)}
            <span className="font-medium text-gray-900">
              {invite.role.charAt(0) + invite.role.slice(1).toLowerCase()} Role
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            {getRoleDescription(invite.role)}
          </p>
        </div>
      </div>

      {/* Invitation Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-2">
          <Users className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="mb-2">
              <strong>{invite.inviter.name || invite.inviter.email}</strong> invited you to join this team.
            </p>
            <div className="text-blue-700 space-y-1">
              <p>• Invited on: {formatDate(invite.createdAt)}</p>
              <p>• Expires: {formatDate(invite.expiresAt)}</p>
              <p>• Role: {invite.role.charAt(0) + invite.role.slice(1).toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expiration Warning */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">
              This invitation has expired
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
        <button
          onClick={handleAcceptInvite}
          disabled={isProcessing || isExpired}
          className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span>Accept Invitation</span>
        </button>
        
        <button
          onClick={handleRejectInvite}
          disabled={isProcessing || isExpired}
          className="btn-ghost flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4" />
          <span>Decline</span>
        </button>
      </div>

      {isExpired && (
        <div className="text-center mt-6">
          <p className="text-gray-600 mb-4">
            This invitation has expired. Contact the team owner to send a new invitation.
          </p>
          <button
            onClick={() => router.push('/teams')}
            className="btn-primary"
          >
            Go to Teams
          </button>
        </div>
      )}
    </div>
  )
}