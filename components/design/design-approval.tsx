'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  MessageCircle,
  User,
  RefreshCw
} from 'lucide-react'

interface ApprovalUser {
  id: string
  name?: string | null
  email: string
}

interface ApprovalInfo {
  status: string
  approvedAt?: string | null
  approvedBy?: ApprovalUser | null
  requiresApproval: boolean
}

interface DesignApprovalProps {
  designId: string
  currentUserRole?: string
  designOwnerId?: string
  currentUserId?: string
  onStatusChange?: (status: string) => void
}

const APPROVAL_STATUSES = {
  PENDING: {
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: Clock,
    label: 'Pending Approval',
    description: 'This design is waiting for approval from a team manager or admin.'
  },
  APPROVED: {
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: CheckCircle,
    label: 'Approved',
    description: 'This design has been approved and is ready for production.'
  },
  REJECTED: {
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: XCircle,
    label: 'Changes Requested',
    description: 'This design needs changes before it can be approved.'
  }
}

export default function DesignApproval({ 
  designId, 
  currentUserRole,
  designOwnerId,
  currentUserId,
  onStatusChange 
}: DesignApprovalProps) {
  const [approval, setApproval] = useState<ApprovalInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApprovalInfo()
  }, [designId])

  const fetchApprovalInfo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/designs/${designId}/approval`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch approval info')
      }

      setApproval(data.approval)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!approval) return

    try {
      setIsProcessing(true)
      setError(null)

      const response = await fetch(`/api/designs/${designId}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          comment: approvalComment.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} design`)
      }

      // Update local state
      setApproval({
        ...approval,
        status: data.design.approvalStatus,
        approvedAt: data.design.approvedAt,
        approvedBy: data.design.approvedBy,
      })

      // Notify parent component
      onStatusChange?.(data.design.approvalStatus)

      // Reset form
      setShowApprovalForm(false)
      setApprovalComment('')

      // Show success message briefly
      setTimeout(() => {
        fetchApprovalInfo() // Refresh to get latest data
      }, 1000)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetApproval = async () => {
    if (!approval || !confirm('Are you sure you want to reset the approval status?')) {
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      const response = await fetch(`/api/designs/${designId}/approval`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset approval')
      }

      setApproval({
        ...approval,
        status: 'PENDING',
        approvedAt: null,
        approvedBy: null,
      })

      onStatusChange?.('PENDING')

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canApprove = currentUserRole && ['OWNER', 'ADMIN', 'MANAGER'].includes(currentUserRole)
  const canReset = currentUserId && (
    approval?.approvedBy?.id === currentUserId ||
    designOwnerId === currentUserId ||
    ['OWNER', 'ADMIN'].includes(currentUserRole || '')
  )
  const isOwnDesign = designOwnerId === currentUserId

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!approval || !approval.requiresApproval) {
    return null
  }

  const statusInfo = APPROVAL_STATUSES[approval.status as keyof typeof APPROVAL_STATUSES]
  const StatusIcon = statusInfo?.icon || Clock

  return (
    <div className="space-y-4">
      {/* Approval Status */}
      <div className={`border rounded-lg p-4 ${statusInfo?.color || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <StatusIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {statusInfo?.label || 'Unknown Status'}
              </h3>
              <p className="text-sm mt-1">
                {statusInfo?.description || 'Status information not available'}
              </p>
              
              {approval.approvedBy && approval.approvedAt && (
                <div className="flex items-center space-x-2 text-sm mt-2">
                  <User className="h-4 w-4" />
                  <span>
                    {approval.status === 'APPROVED' ? 'Approved' : 'Reviewed'} by{' '}
                    <strong>{approval.approvedBy.name || approval.approvedBy.email}</strong>{' '}
                    on {formatDate(approval.approvedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {canApprove && approval.status === 'PENDING' && !isOwnDesign && (
              <button
                onClick={() => setShowApprovalForm(!showApprovalForm)}
                className="btn-primary btn-sm"
                disabled={isProcessing}
              >
                Review Design
              </button>
            )}

            {canReset && approval.status !== 'PENDING' && (
              <button
                onClick={handleResetApproval}
                className="btn-ghost btn-sm flex items-center space-x-1"
                disabled={isProcessing}
              >
                <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Warning for design owner */}
        {isOwnDesign && approval.status === 'PENDING' && (
          <div className="flex items-start space-x-2 mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Waiting for team approval</p>
              <p>A team manager or admin needs to approve this design before it can be ordered.</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Approval Form */}
      {showApprovalForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Review Design</h4>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="approvalComment" className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                id="approvalComment"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Add feedback or comments about this design..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isProcessing}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowApprovalForm(false)
                  setApprovalComment('')
                }}
                className="btn-ghost"
                disabled={isProcessing}
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleApprovalAction('reject')}
                  className="btn-danger flex items-center space-x-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>Request Changes</span>
                </button>

                <button
                  onClick={() => handleApprovalAction('approve')}
                  className="btn-success flex items-center space-x-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span>Approve Design</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      {approval.status === 'REJECTED' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="h-5 w-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">What happens next?</h4>
          </div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Make the requested changes to your design</li>
            <li>• The approval status will automatically reset to pending</li>
            <li>• Request another review from your team</li>
          </ul>
        </div>
      )}

      {approval.status === 'APPROVED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">Design Approved!</h4>
          </div>
          <p className="text-sm text-green-800">
            This design is approved and ready to be ordered. You can now add it to your cart and proceed to checkout.
          </p>
        </div>
      )}
    </div>
  )
}