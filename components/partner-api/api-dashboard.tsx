'use client'

import { useState, useEffect } from 'react'
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff,
  Copy, 
  Trash2,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Book,
  Code,
  Zap,
  Crown
} from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  permissions: string[]
  lastUsedAt?: string
  isActive: boolean
  createdAt: string
  rateLimit: number
  usage?: {
    requestCount: number
    lastRequestAt?: string
  }
}

interface Team {
  id: string
  name: string
  plan: string
}

interface ApiLimits {
  maxApiKeys: number
  defaultRateLimit: number
  maxRateLimit: number
  features: string[]
}

interface ApiDashboardProps {
  teamId: string
}

const PERMISSION_OPTIONS = [
  { 
    value: 'designs:read', 
    label: 'Read Designs', 
    description: 'View team designs and public designs' 
  },
  { 
    value: 'designs:write', 
    label: 'Write Designs', 
    description: 'Create and update designs' 
  },
  { 
    value: 'designs:delete', 
    label: 'Delete Designs', 
    description: 'Delete designs (with restrictions)' 
  },
  { 
    value: 'products:read', 
    label: 'Read Products', 
    description: 'Access product catalog' 
  },
  { 
    value: 'orders:read', 
    label: 'Read Orders', 
    description: 'View team orders and order history' 
  },
  { 
    value: 'orders:write', 
    label: 'Create Orders', 
    description: 'Place orders via API' 
  },
  { 
    value: 'teams:read', 
    label: 'Read Team Info', 
    description: 'Access team information and members' 
  },
  { 
    value: 'analytics:read', 
    label: 'Read Analytics', 
    description: 'Access usage statistics and reports' 
  },
]

export default function ApiDashboard({ teamId }: ApiDashboardProps) {
  const [data, setData] = useState<{
    team: Team | null
    apiKeys: ApiKey[]
    limits: ApiLimits | null
  }>({ team: null, apiKeys: [], limits: null })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState<{
    key: string
    warning: string
  } | null>(null)

  useEffect(() => {
    fetchApiData()
  }, [teamId])

  const fetchApiData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/partners/auth?teamId=${teamId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch API data')
      }

      setData({
        team: result.team,
        apiKeys: result.apiKeys,
        limits: result.limits,
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateApiKey = async (keyData: {
    name: string
    permissions: string[]
    rateLimit: number
  }) => {
    try {
      const response = await fetch('/api/partners/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          ...keyData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create API key')
      }

      setNewApiKey({
        key: result.apiKey.key,
        warning: result.warning,
      })

      await fetchApiData()
      setShowCreateModal(false)

    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleRevokeApiKey = async (apiKeyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${keyName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/partners/auth?apiKeyId=${apiKeyId}&teamId=${teamId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to revoke API key')
      }

      await fetchApiData()

    } catch (error: any) {
      setError(error.message)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPermissionColor = (permission: string) => {
    if (permission.includes('write') || permission.includes('delete')) {
      return 'bg-red-100 text-red-800'
    }
    if (permission.includes('analytics')) {
      return 'bg-purple-100 text-purple-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!data.limits || !['BUSINESS', 'ENTERPRISE'].includes(data.team?.plan || '')) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <Crown className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner API Access</h2>
          <p className="text-gray-600 mb-6">
            Access to the Partner API requires a Business or Enterprise plan
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">API Features</h3>
            <ul className="text-blue-800 text-sm space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Full REST API access</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Design and order management</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Team integration</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Usage analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Webhook support</span>
              </li>
            </ul>
          </div>
          <button className="btn-primary">
            Upgrade to Business
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partner API</h2>
          <p className="text-gray-600">
            Manage API keys and integrate with third-party applications
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="btn-ghost flex items-center space-x-2">
            <Book className="h-4 w-4" />
            <span>Documentation</span>
          </button>
          
          {data.apiKeys.length < data.limits.maxApiKeys && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create API Key</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* New API Key Display */}
      {newApiKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900 mb-2">API Key Created Successfully</h3>
              <p className="text-green-800 text-sm mb-4">{newApiKey.warning}</p>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <code className="text-green-400 font-mono text-sm break-all">
                    {newApiKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newApiKey.key)}
                    className="ml-3 p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setNewApiKey(null)}
                className="btn-primary btn-sm"
              >
                I've Saved the Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Key className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">API Keys</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.apiKeys.filter(key => key.isActive).length} / {data.limits.maxApiKeys}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rate Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.limits.defaultRateLimit.toLocaleString()}/hr
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.apiKeys.reduce((sum, key) => sum + (key.usage?.requestCount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Plan</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.team?.plan}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {data.apiKeys.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first API key to start integrating with external applications.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 btn-primary flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create API Key</span>
              </button>
            </div>
          ) : (
            data.apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        apiKey.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiKey.isActive ? 'Active' : 'Revoked'}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span>Key: {apiKey.keyPrefix}••••••••</span>
                      <span>Rate limit: {apiKey.rateLimit.toLocaleString()}/hr</span>
                      <span>Created: {formatDate(apiKey.createdAt)}</span>
                      {apiKey.lastUsedAt && (
                        <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {apiKey.permissions.map((permission) => (
                        <span
                          key={permission}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(permission)}`}
                        >
                          {permission}
                        </span>
                      ))}
                    </div>

                    {apiKey.usage && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Usage Statistics</span>
                          <span className="font-medium text-gray-900">
                            {apiKey.usage.requestCount.toLocaleString()} requests
                          </span>
                        </div>
                        {apiKey.usage.lastRequestAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Last request: {formatDate(apiKey.usage.lastRequestAt)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-6">
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    
                    {apiKey.isActive && (
                      <button
                        onClick={() => handleRevokeApiKey(apiKey.id, apiKey.name)}
                        className="p-2 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <CreateApiKeyModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateApiKey}
          limits={data.limits}
        />
      )}

      {/* API Documentation Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Start</h3>
          <button className="btn-ghost flex items-center space-x-2">
            <Book className="h-4 w-4" />
            <span>Full Documentation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Authentication</h4>
            <div className="bg-gray-900 rounded-lg p-4">
              <code className="text-green-400 text-sm">
                <div>curl -H "Authorization: Bearer YOUR_API_KEY" \</div>
                <div className="ml-4">https://api.tshop.com/v1/designs</div>
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Create Design</h4>
            <div className="bg-gray-900 rounded-lg p-4">
              <code className="text-green-400 text-sm">
                <div>POST /api/partners/v1/designs</div>
                <div className="text-blue-400 mt-1">{"{"}</div>
                <div className="ml-2 text-blue-400">"title": "My Design",</div>
                <div className="ml-2 text-blue-400">"designData": {"{"}"..."{"}"}</div>
                <div className="text-blue-400">{"}"}</div>
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create API Key Modal Component
function CreateApiKeyModal({ 
  onClose, 
  onSubmit, 
  limits 
}: {
  onClose: () => void
  onSubmit: (data: { name: string; permissions: string[]; rateLimit: number }) => Promise<void>
  limits: ApiLimits
}) {
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
    rateLimit: limits.defaultRateLimit,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || formData.permissions.length === 0) {
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create API Key</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              API Key Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Production API, Development, etc."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions *
            </label>
            <div className="space-y-3">
              {PERMISSION_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.permissions.includes(option.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => togglePermission(option.value)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(option.value)}
                      onChange={() => togglePermission(option.value)}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{option.label}</h4>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rateLimit" className="block text-sm font-medium text-gray-700 mb-2">
              Rate Limit (requests per hour)
            </label>
            <input
              type="number"
              id="rateLimit"
              min="1"
              max={limits.maxRateLimit}
              value={formData.rateLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, rateLimit: parseInt(e.target.value) || limits.defaultRateLimit }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum: {limits.maxRateLimit.toLocaleString()} requests per hour
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || formData.permissions.length === 0 || isSubmitting}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Key className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Creating...' : 'Create API Key'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}