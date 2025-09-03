'use client'

import { useState } from 'react'
import { X, Users, Building2, Zap, Crown } from 'lucide-react'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamCreated: (team: any) => void
}

interface Team {
  id: string
  name: string
  slug: string
  description?: string
  industry?: string
  size?: string
  plan: string
  memberCount?: number
  designCount?: number
  createdAt: string
}

const TEAM_SIZES = [
  { value: 'SMALL', label: '2-10 people', icon: Users },
  { value: 'MEDIUM', label: '11-50 people', icon: Building2 },
  { value: 'LARGE', label: '51-200 people', icon: Zap },
  { value: 'ENTERPRISE', label: '200+ people', icon: Crown },
]

const TEAM_PLANS = [
  {
    value: 'TEAM',
    name: 'Team',
    price: '$29/month',
    features: ['Up to 25 members', '500 AI generations/month', 'Basic analytics', 'Email support'],
    popular: false,
  },
  {
    value: 'BUSINESS',
    name: 'Business',
    price: '$79/month',
    features: ['Up to 100 members', '2000 AI generations/month', 'Advanced analytics', 'Priority support'],
    popular: true,
  },
  {
    value: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Custom pricing',
    features: ['Unlimited members', 'Unlimited AI generations', 'Custom analytics', 'Dedicated support'],
    popular: false,
  },
]

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    size: '',
    plan: 'TEAM',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Team name is required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team')
      }

      onTeamCreated(data.team)
      
      setFormData({
        name: '',
        description: '',
        industry: '',
        size: '',
        plan: 'TEAM',
      })
    } catch (error: any) {
      setError(error.message || 'Failed to create team')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    if (error) setError(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Team</h2>
            <p className="text-sm text-gray-600 mt-1">
              Start collaborating on custom designs with your team
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

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your team name"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What does your team work on?"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <input
              type="text"
              id="industry"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Technology, Marketing, Education"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Team Size
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TEAM_SIZES.map((size) => {
                const Icon = size.icon
                return (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => handleInputChange('size', size.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      formData.size === size.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-5 w-5 ${
                        formData.size === size.value ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium">{size.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Your Plan
            </label>
            <div className="space-y-3">
              {TEAM_PLANS.map((plan) => (
                <div
                  key={plan.value}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.plan === plan.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.popular ? 'ring-2 ring-purple-500 ring-opacity-20' : ''}`}
                  onClick={() => handleInputChange('plan', plan.value)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-4">
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.value}
                        checked={formData.plan === plan.value}
                        onChange={() => handleInputChange('plan', plan.value)}
                        className="text-blue-600 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                        <p className="text-sm text-gray-600">{plan.price}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 ml-6">
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
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
                <Users className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Creating...' : 'Create Team'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}