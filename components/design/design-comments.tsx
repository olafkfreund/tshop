'use client'

import { useState, useEffect } from 'react'
import { 
  MessageCircle, 
  Send, 
  Reply, 
  MoreVertical,
  Heart,
  Flag,
  Trash2,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface User {
  id: string
  name?: string | null
  email: string
  image?: string | null
}

interface DesignComment {
  id: string
  content: string
  type?: string
  createdAt: string
  updatedAt: string
  user: User
  replies: DesignComment[]
}

interface DesignCommentsProps {
  designId: string
  canComment?: boolean
  showApprovalComments?: boolean
}

export default function DesignComments({ 
  designId, 
  canComment = true,
  showApprovalComments = false 
}: DesignCommentsProps) {
  const [comments, setComments] = useState<DesignComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [designId])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/designs/${designId}/comments`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments')
      }

      setComments(data.comments)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim()) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/designs/${designId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment')
      }

      setComments(prev => [data.comment, ...prev])
      setNewComment('')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    
    if (!replyContent.trim()) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/designs/${designId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add reply')
      }

      // Add reply to the parent comment
      setComments(prev => prev.map(comment => 
        comment.id === parentId
          ? { ...comment, replies: [...comment.replies, data.comment] }
          : comment
      ))
      
      setReplyContent('')
      setReplyingTo(null)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getCommentTypeIcon = (type?: string) => {
    switch (type) {
      case 'APPROVAL':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECTION':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <MessageCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const getCommentTypeColor = (type?: string) => {
    switch (type) {
      case 'APPROVAL':
        return 'border-green-200 bg-green-50'
      case 'REJECTION':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const filteredComments = showApprovalComments 
    ? comments 
    : comments.filter(comment => !comment.type || comment.type === 'COMMENT')

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      {canComment && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <form onSubmit={handleAddComment}>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Be constructive and respectful in your feedback
                  </p>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="btn-primary btn-sm flex items-center space-x-1 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canComment 
                ? 'Start the conversation by adding the first comment.'
                : 'Comments will appear here when team members add them.'
              }
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className={`border rounded-lg p-4 ${getCommentTypeColor(comment.type)}`}>
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {comment.user.image ? (
                    <img
                      src={comment.user.image}
                      alt={comment.user.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {(comment.user.name || comment.user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {comment.user.name || 'Unnamed User'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {getCommentTypeIcon(comment.type)}
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Comment Content */}
              <div className="ml-11 mb-3">
                <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
              </div>

              {/* Comment Actions */}
              <div className="ml-11 flex items-center space-x-4">
                <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                  <Heart className="h-3 w-3" />
                  <span>Like</span>
                </button>
                
                {canComment && (
                  <button 
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                  >
                    <Reply className="h-3 w-3" />
                    <span>Reply</span>
                  </button>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="ml-11 mt-4 pt-4 border-t border-gray-200">
                  <form onSubmit={(e) => handleAddReply(e, comment.id)}>
                    <div className="flex items-start space-x-2">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        rows={2}
                        disabled={isSubmitting}
                      />
                      <div className="flex flex-col space-y-1">
                        <button
                          type="submit"
                          disabled={!replyContent.trim() || isSubmitting}
                          className="btn-primary btn-sm disabled:opacity-50"
                        >
                          {isSubmitting ? '...' : 'Reply'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyContent('')
                          }}
                          className="btn-ghost btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-11 mt-4 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        {reply.user.image ? (
                          <img
                            src={reply.user.image}
                            alt={reply.user.name || 'User'}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-xs">
                              {(reply.user.name || reply.user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <p className="font-medium text-sm text-gray-900">
                          {reply.user.name || 'Unnamed User'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 ml-8 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}