'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'
import {
  Bell,
  Mail,
  Smartphone,
  Package,
  ShoppingCart,
  Star,
  Users,
  TrendingUp,
  Save
} from 'lucide-react'

interface User {
  id: string
  notificationPreferences?: {
    email?: {
      orderUpdates?: boolean
      marketingEmails?: boolean
      designUpdates?: boolean
      communityActivity?: boolean
      newsletters?: boolean
      promotions?: boolean
    }
    push?: {
      orderUpdates?: boolean
      designLikes?: boolean
      designComments?: boolean
      newFollowers?: boolean
      promotions?: boolean
    }
  }
}

interface NotificationSettingsProps {
  user: User
}

interface NotificationPreference {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: 'order' | 'social' | 'marketing'
  channels: {
    email: boolean
    push: boolean
  }
}

export default function NotificationSettings({ user }: NotificationSettingsProps) {
  const [isSaving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'orderUpdates',
      title: 'Order Updates',
      description: 'Get notified about order confirmations, shipping updates, and delivery status',
      icon: <Package className="h-5 w-5 text-blue-600" />,
      category: 'order',
      channels: {
        email: user.notificationPreferences?.email?.orderUpdates ?? true,
        push: user.notificationPreferences?.push?.orderUpdates ?? true,
      },
    },
    {
      id: 'designLikes',
      title: 'Design Likes',
      description: 'Get notified when someone likes your designs',
      icon: <Star className="h-5 w-5 text-yellow-600" />,
      category: 'social',
      channels: {
        email: user.notificationPreferences?.email?.designUpdates ?? true,
        push: user.notificationPreferences?.push?.designLikes ?? true,
      },
    },
    {
      id: 'designComments',
      title: 'Design Comments',
      description: 'Get notified when someone comments on your designs',
      icon: <Users className="h-5 w-5 text-green-600" />,
      category: 'social',
      channels: {
        email: user.notificationPreferences?.email?.communityActivity ?? true,
        push: user.notificationPreferences?.push?.designComments ?? true,
      },
    },
    {
      id: 'newFollowers',
      title: 'New Followers',
      description: 'Get notified when someone follows your profile',
      icon: <Users className="h-5 w-5 text-purple-600" />,
      category: 'social',
      channels: {
        email: user.notificationPreferences?.email?.communityActivity ?? false,
        push: user.notificationPreferences?.push?.newFollowers ?? true,
      },
    },
    {
      id: 'marketingEmails',
      title: 'Marketing Emails',
      description: 'Receive emails about new products, features, and design tips',
      icon: <Mail className="h-5 w-5 text-pink-600" />,
      category: 'marketing',
      channels: {
        email: user.notificationPreferences?.email?.marketingEmails ?? false,
        push: false,
      },
    },
    {
      id: 'newsletters',
      title: 'Newsletters',
      description: 'Weekly roundup of trending designs and community highlights',
      icon: <TrendingUp className="h-5 w-5 text-indigo-600" />,
      category: 'marketing',
      channels: {
        email: user.notificationPreferences?.email?.newsletters ?? false,
        push: false,
      },
    },
    {
      id: 'promotions',
      title: 'Promotions & Discounts',
      description: 'Get notified about special offers, sales, and discount codes',
      icon: <ShoppingCart className="h-5 w-5 text-red-600" />,
      category: 'marketing',
      channels: {
        email: user.notificationPreferences?.email?.promotions ?? false,
        push: user.notificationPreferences?.push?.promotions ?? false,
      },
    },
  ])

  const router = useRouter()
  const { trackEvent } = useAnalytics()

  const updatePreference = (id: string, channel: 'email' | 'push', enabled: boolean) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id 
        ? { ...pref, channels: { ...pref.channels, [channel]: enabled } }
        : pref
    ))
  }

  const toggleCategory = (category: 'order' | 'social' | 'marketing', channel: 'email' | 'push', enabled: boolean) => {
    setPreferences(prev => prev.map(pref => 
      pref.category === category 
        ? { ...pref, channels: { ...pref.channels, [channel]: enabled } }
        : pref
    ))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const notificationPreferences = {
        email: {
          orderUpdates: preferences.find(p => p.id === 'orderUpdates')?.channels.email ?? true,
          marketingEmails: preferences.find(p => p.id === 'marketingEmails')?.channels.email ?? false,
          designUpdates: preferences.find(p => p.id === 'designLikes')?.channels.email ?? true,
          communityActivity: preferences.find(p => p.id === 'designComments')?.channels.email ?? true,
          newsletters: preferences.find(p => p.id === 'newsletters')?.channels.email ?? false,
          promotions: preferences.find(p => p.id === 'promotions')?.channels.email ?? false,
        },
        push: {
          orderUpdates: preferences.find(p => p.id === 'orderUpdates')?.channels.push ?? true,
          designLikes: preferences.find(p => p.id === 'designLikes')?.channels.push ?? true,
          designComments: preferences.find(p => p.id === 'designComments')?.channels.push ?? true,
          newFollowers: preferences.find(p => p.id === 'newFollowers')?.channels.push ?? true,
          promotions: preferences.find(p => p.id === 'promotions')?.channels.push ?? false,
        },
      }

      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationPreferences }),
      })

      if (!response.ok) {
        throw new Error('Failed to update notification preferences')
      }

      trackEvent({
        action: 'notification_preferences_updated',
        category: 'settings',
        custom_parameters: {
          email_notifications: Object.values(notificationPreferences.email).filter(Boolean).length,
          push_notifications: Object.values(notificationPreferences.push).filter(Boolean).length,
        },
      })

      alert('Notification preferences updated successfully!')
      router.refresh()
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      alert('Failed to update preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryPrefs = (category: 'order' | 'social' | 'marketing') => {
    return preferences.filter(p => p.category === category)
  }

  const isCategoryEnabled = (category: 'order' | 'social' | 'marketing', channel: 'email' | 'push') => {
    const categoryPrefs = getCategoryPrefs(category)
    return categoryPrefs.some(pref => pref.channels[channel])
  }

  return (
    <div className="space-y-8">
      {/* Notification Channels */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Enable Push Notifications</h3>
            <p className="text-sm text-blue-700 mt-1">
              To receive push notifications, please enable them in your browser settings when prompted.
            </p>
          </div>
        </div>
      </div>

      {/* Order Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <Package className="h-5 w-5 text-gray-400" />
            <span>Order Notifications</span>
          </h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">All Email</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCategoryEnabled('order', 'email')}
                onChange={(e) => toggleCategory('order', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
            <label className="text-sm text-gray-600">All Push</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCategoryEnabled('order', 'push')}
                onChange={(e) => toggleCategory('order', 'push', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        {getCategoryPrefs('order').map((pref) => (
          <div key={pref.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3">
              {pref.icon}
              <div>
                <h4 className="font-medium text-gray-900">{pref.title}</h4>
                <p className="text-sm text-gray-600">{pref.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pref.channels.email}
                    onChange={(e) => updatePreference(pref.id, 'email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-gray-400" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pref.channels.push}
                    onChange={(e) => updatePreference(pref.id, 'push', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Social Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span>Social & Community</span>
          </h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">All Email</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCategoryEnabled('social', 'email')}
                onChange={(e) => toggleCategory('social', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
            <label className="text-sm text-gray-600">All Push</label>
            <label className="relative inline-flex items-centers cursor-pointer">
              <input
                type="checkbox"
                checked={isCategoryEnabled('social', 'push')}
                onChange={(e) => toggleCategory('social', 'push', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        {getCategoryPrefs('social').map((pref) => (
          <div key={pref.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3">
              {pref.icon}
              <div>
                <h4 className="font-medium text-gray-900">{pref.title}</h4>
                <p className="text-sm text-gray-600">{pref.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pref.channels.email}
                    onChange={(e) => updatePreference(pref.id, 'email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-gray-400" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pref.channels.push}
                    onChange={(e) => updatePreference(pref.id, 'push', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Marketing Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <span>Marketing & Promotions</span>
          </h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">All Email</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCategoryEnabled('marketing', 'email')}
                onChange={(e) => toggleCategory('marketing', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        {getCategoryPrefs('marketing').map((pref) => (
          <div key={pref.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3">
              {pref.icon}
              <div>
                <h4 className="font-medium text-gray-900">{pref.title}</h4>
                <p className="text-sm text-gray-600">{pref.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pref.channels.email}
                    onChange={(e) => updatePreference(pref.id, 'email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              {pref.id === 'promotions' && (
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-gray-400" />
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.channels.push}
                      onChange={(e) => updatePreference(pref.id, 'push', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  )
}