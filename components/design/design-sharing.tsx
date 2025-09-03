'use client'

import { useState, useEffect } from 'react'
import { 
  Share2, 
  Link2, 
  Mail, 
  Users,
  Eye,
  Edit,
  MessageCircle,
  Copy,
  Check,
  X,
  Globe,
  Lock,
  UserPlus,
  Trash2
} from 'lucide-react'

interface ShareUser {
  id: string
  name?: string | null
  email: string
}

interface DesignShare {
  id: string
  permission: string
  createdAt: string
  sharedWith: ShareUser
  sharedBy: ShareUser
}

interface SharingInfo {
  isPublic: boolean
  shareToken?: string | null
  shares: DesignShare[]
}

interface DesignSharingProps {
  designId: string
  canShare?: boolean
  onSharingChange?: (isPublic: boolean, shareCount: number) => void
}

const PERMISSION_LEVELS = [
  {
    value: 'VIEW',
    name: 'View Only',
    description: 'Can view the design but cannot make changes or comments',
    icon: Eye,
  },
  {
    value: 'COMMENT',
    name: 'Comment',
    description: 'Can view and add comments, but cannot edit',
    icon: MessageCircle,
  },
  {
    value: 'EDIT',
    name: 'Edit',
    description: 'Can view, comment, and make changes to the design',
    icon: Edit,
  },
]

export default function DesignSharing({ 
  designId, 
  canShare = false,
  onSharingChange 
}: DesignSharingProps) {
  const [sharing, setSharing] = useState<SharingInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showShareForm, setShowShareForm] = useState(false)
  const [emails, setEmails] = useState('')
  const [permission, setPermission] = useState('VIEW')
  const [message, setMessage] = useState('')
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (canShare) {
      fetchSharingInfo()
    }
  }, [designId, canShare])

  const fetchSharingInfo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/designs/${designId}/share`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sharing info')
      }

      setSharing(data.sharing)
      onSharingChange?.(data.sharing.isPublic, data.sharing.shares.length)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePublic = async () => {
    if (!sharing) return

    try {
      setIsProcessing(true)
      setError(null)

      const response = await fetch(`/api/designs/${designId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          makePublic: !sharing.isPublic,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update sharing settings')
      }

      setSharing(prev => prev ? {
        ...prev,
        isPublic: !sharing.isPublic,
        shareToken: data.results.publicLink ? data.results.publicLink.split('/').pop() : null,
      } : null)

      onSharingChange?.(!sharing.isPublic, sharing.shares.length)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleShareWithUsers = async () => {
    if (!emails.trim()) return

    const emailList = emails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (emailList.length === 0) {
      setError('Please enter at least one email address')
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      const response = await fetch(`/api/designs/${designId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: emailList,
          permission,
          message: message.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share design')
      }

      // Update sharing info
      await fetchSharingInfo()
      
      // Reset form
      setEmails('')
      setMessage('')
      setShowShareForm(false)

      if (data.results.failed.length > 0) {
        setError(`Some invitations failed: ${data.results.failed.join(', ')}`)
      }

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to remove sharing access for this user?')) {
      return
    }

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/designs/${designId}/share?shareId=${shareId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove sharing access')
      }

      await fetchSharingInfo()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(type)
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      setError('Failed to copy to clipboard')
    }
  }

  const getPublicShareUrl = () => {
    if (!sharing?.shareToken) return ''
    return `${window.location.origin}/designs/shared/${sharing.shareToken}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPermissionIcon = (permission: string) => {
    const level = PERMISSION_LEVELS.find(p => p.value === permission)
    return level?.icon || Eye
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'EDIT':
        return 'bg-purple-100 text-purple-800'
      case 'COMMENT':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  if (!canShare) {
    return null
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!sharing) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Share Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Share2 className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Share Design</h3>
        </div>
        
        {!showShareForm && (
          <button
            onClick={() => setShowShareForm(true)}
            className="btn-primary btn-sm flex items-center space-x-1"
          >
            <UserPlus className="h-4 w-4" />
            <span>Share with People</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Public Sharing */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {sharing.isPublic ? (
              <Globe className="h-5 w-5 text-green-600" />
            ) : (
              <Lock className="h-5 w-5 text-gray-400" />
            )}
            <h4 className="font-medium text-gray-900">
              {sharing.isPublic ? 'Public Link' : 'Private Design'}
            </h4>
          </div>

          <button
            onClick={handleTogglePublic}
            disabled={isProcessing}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              sharing.isPublic ? 'bg-green-600' : 'bg-gray-200'
            } ${isProcessing ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                sharing.isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          {sharing.isPublic 
            ? 'Anyone with the link can view this design'
            : 'Only you and people you share with can access this design'
          }
        </p>

        {sharing.isPublic && sharing.shareToken && (
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
            <Link2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={getPublicShareUrl()}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(getPublicShareUrl(), 'public')}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {copySuccess === 'public' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Share Form */}
      {showShareForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Share with People</h4>
            <button
              onClick={() => {
                setShowShareForm(false)
                setEmails('')
                setMessage('')
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-2">
                Email Addresses *
              </label>
              <textarea
                id="emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="Enter email addresses (one per line)&#10;john@company.com&#10;jane@company.com"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isProcessing}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permission Level
              </label>
              <div className="space-y-2">
                {PERMISSION_LEVELS.map((level) => {
                  const Icon = level.icon
                  return (
                    <div
                      key={level.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        permission === level.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPermission(level.value)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="permission"
                          value={level.value}
                          checked={permission === level.value}
                          onChange={() => setPermission(level.value)}
                          className="text-blue-600 focus:ring-blue-500"
                          disabled={isProcessing}
                        />
                        <Icon className={`h-4 w-4 ${
                          permission === level.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{level.name}</h5>
                          <p className="text-sm text-gray-600">{level.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isProcessing}
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowShareForm(false)
                  setEmails('')
                  setMessage('')
                }}
                className="btn-ghost"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleShareWithUsers}
                disabled={!emails.trim() || isProcessing}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                <span>Send Invitations</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared With */}
      {sharing.shares.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">
              Shared with {sharing.shares.length} {sharing.shares.length === 1 ? 'person' : 'people'}
            </h4>
          </div>

          <div className="space-y-3">
            {sharing.shares.map((share) => {
              const PermissionIcon = getPermissionIcon(share.permission)
              return (
                <div key={share.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {(share.sharedWith.name || share.sharedWith.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {share.sharedWith.name || 'Unnamed User'}
                      </p>
                      <p className="text-sm text-gray-600">{share.sharedWith.email}</p>
                      <p className="text-xs text-gray-500">
                        Shared {formatDate(share.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(share.permission)}`}>
                      <PermissionIcon className="h-3 w-3" />
                      <span>{share.permission.toLowerCase()}</span>
                    </span>
                    
                    <button
                      onClick={() => handleRemoveShare(share.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}