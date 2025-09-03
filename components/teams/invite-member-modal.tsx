'use client'

import { useState } from 'react'
import { X, UserPlus, Mail, Users, Shield, Crown } from 'lucide-react'

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

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onMemberInvited: (invite: TeamInvite) => void
  teamId: string
  canManageRoles?: boolean
}

const MEMBER_ROLES = [
  {
    value: 'MEMBER',
    name: 'Member',
    description: 'Can create and edit own designs, comment on designs',
    icon: Users,
  },
  {
    value: 'MANAGER',
    name: 'Manager',
    description: 'Member permissions + can approve designs and invite members',
    icon: Shield,
  },
  {
    value: 'ADMIN',
    name: 'Admin',
    description: 'Manager permissions + can manage all team settings and members',
    icon: Crown,
  },
]

export default function InviteMemberModal({ 
  isOpen, 
  onClose, 
  onMemberInvited, 
  teamId,
  canManageRoles = false 
}: InviteMemberModalProps) {
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailList = emails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (emailList.length === 0) {
      setError('Please enter at least one email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emailList.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      setError(`Invalid email addresses: ${invalidEmails.join(', ')}`)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const results = await Promise.allSettled(
        emailList.map(async (email) => {
          const response = await fetch(`/api/teams/${teamId}/members`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              role,
              message: message || undefined,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to invite member')
          }

          return { email, invite: data.invite }
        })
      )

      const successful = results
        .filter((result): result is PromiseFulfilledResult<{ email: string; invite: TeamInvite }> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)

      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason.message)

      if (successful.length > 0) {
        successful.forEach(({ invite }) => onMemberInvited(invite))
        
        if (successful.length === emailList.length) {
          setSuccess(`Successfully invited ${successful.length} member(s)`)
          setEmails('')
          setMessage('')
          setTimeout(() => {
            onClose()
            setSuccess(null)
          }, 1500)
        } else {
          setSuccess(`Invited ${successful.length} of ${emailList.length} members`)
        }
      }

      if (failed.length > 0) {
        setError(`Some invitations failed: ${failed.join(', ')}`)
      }

    } catch (error: any) {
      setError(error.message || 'Failed to send invitations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailsChange = (value: string) => {
    setEmails(value)
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const getRoleIcon = (roleValue: string) => {
    const role = MEMBER_ROLES.find(r => r.value === roleValue)
    if (!role) return Users
    return role.icon
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Invite Team Members</h2>
            <p className="text-sm text-gray-600 mt-1">
              Send invitations to join your team and start collaborating
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-2">
              Email Addresses *
            </label>
            <textarea
              id="emails"
              value={emails}
              onChange={(e) => handleEmailsChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email addresses (one per line)&#10;john@company.com&#10;jane@company.com&#10;team@company.com"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter one email address per line. You can invite multiple people at once.
            </p>
          </div>

          {canManageRoles && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Role & Permissions
              </label>
              <div className="space-y-3">
                {MEMBER_ROLES.map((memberRole) => {
                  const Icon = memberRole.icon
                  return (
                    <div
                      key={memberRole.value}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        role === memberRole.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setRole(memberRole.value)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="role"
                          value={memberRole.value}
                          checked={role === memberRole.value}
                          onChange={() => setRole(memberRole.value)}
                          className="text-blue-600 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <Icon className={`h-5 w-5 ${
                          role === memberRole.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{memberRole.name}</h4>
                          <p className="text-sm text-gray-600">{memberRole.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a personal message to your invitation..."
              disabled={isLoading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Invitees will receive an email with a secure invitation link</li>
                  <li>• They can accept or decline the invitation within 7 days</li>
                  <li>• You'll be notified when they join the team</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>
                {isLoading ? 'Sending Invitations...' : 'Send Invitations'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}