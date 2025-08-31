'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'
import {
  Eye,
  EyeOff,
  Users,
  Globe,
  Lock,
  Download,
  Trash2,
  Save,
  AlertTriangle,
  Shield
} from 'lucide-react'

interface User {
  id: string
  privacySettings?: {
    profileVisibility?: 'public' | 'private'
    showEmail?: boolean
    showLocation?: boolean
    allowDesignDownloads?: boolean
    allowMessaging?: boolean
    showActivityStatus?: boolean
    allowAnalytics?: boolean
    allowMarketingCookies?: boolean
  }
}

interface PrivacySettingsProps {
  user: User
}

export default function PrivacySettings({ user }: PrivacySettingsProps) {
  const [isSaving, setSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [settings, setSettings] = useState({
    profileVisibility: user.privacySettings?.profileVisibility || 'public',
    showEmail: user.privacySettings?.showEmail ?? false,
    showLocation: user.privacySettings?.showLocation ?? true,
    allowDesignDownloads: user.privacySettings?.allowDesignDownloads ?? true,
    allowMessaging: user.privacySettings?.allowMessaging ?? true,
    showActivityStatus: user.privacySettings?.showActivityStatus ?? true,
    allowAnalytics: user.privacySettings?.allowAnalytics ?? true,
    allowMarketingCookies: user.privacySettings?.allowMarketingCookies ?? false,
  })

  const router = useRouter()
  const { trackEvent } = useAnalytics()

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/user/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privacySettings: settings }),
      })

      if (!response.ok) {
        throw new Error('Failed to update privacy settings')
      }

      trackEvent({
        action: 'privacy_settings_updated',
        category: 'settings',
        custom_parameters: {
          profile_visibility: settings.profileVisibility,
          analytics_enabled: settings.allowAnalytics,
          marketing_cookies: settings.allowMarketingCookies,
        },
      })

      alert('Privacy settings updated successfully!')
      router.refresh()
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
      alert('Failed to update settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)

    try {
      const response = await fetch('/api/user/export-data', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tshop-user-data-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      trackEvent({
        action: 'user_data_exported',
        category: 'privacy',
      })

      alert('Your data export has started downloading.')
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      trackEvent({
        action: 'account_deletion_requested',
        category: 'account',
      })

      alert('Your account deletion request has been submitted. You will receive an email confirmation.')
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert('Failed to delete account. Please contact support.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Visibility */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <Eye className="h-5 w-5 text-gray-400" />
          <span>Profile Visibility</span>
        </h3>

        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Globe className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="public"
                    checked={settings.profileVisibility === 'public'}
                    onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">Public Profile</h4>
                    <p className="text-sm text-gray-600">
                      Your profile and public designs are visible to everyone. You'll appear in search results and the community gallery.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="private"
                    checked={settings.profileVisibility === 'private'}
                    onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">Private Profile</h4>
                    <p className="text-sm text-gray-600">
                      Your profile is only visible to you. Your designs won't appear in public galleries or search results.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Visibility */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Show Email Address</h4>
              <p className="text-sm text-gray-600">Display your email address on your public profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showEmail}
                onChange={(e) => handleSettingChange('showEmail', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Show Location</h4>
              <p className="text-sm text-gray-600">Display your location on your public profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showLocation}
                onChange={(e) => handleSettingChange('showLocation', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Show Activity Status</h4>
              <p className="text-sm text-gray-600">Show when you were last active on the platform</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showActivityStatus}
                onChange={(e) => handleSettingChange('showActivityStatus', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Communication</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Allow Direct Messages</h4>
              <p className="text-sm text-gray-600">Let other users send you direct messages</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowMessaging}
                onChange={(e) => handleSettingChange('allowMessaging', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Allow Design Downloads</h4>
              <p className="text-sm text-gray-600">Let others download your public designs</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowDesignDownloads}
                onChange={(e) => handleSettingChange('allowDesignDownloads', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data & Analytics */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Data & Analytics</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Analytics & Performance</h4>
              <p className="text-sm text-gray-600">Help us improve TShop by sharing anonymous usage data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowAnalytics}
                onChange={(e) => handleSettingChange('allowAnalytics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Marketing Cookies</h4>
              <p className="text-sm text-gray-600">Allow cookies for personalized ads and marketing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowMarketingCookies}
                onChange={(e) => handleSettingChange('allowMarketingCookies', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-400" />
          <span>Data Management</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-4
                        sm:grid-cols-2">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Export Your Data</h4>
            <p className="text-sm text-gray-600 mb-4">
              Download a copy of all your data, including designs, orders, and account information.
            </p>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="btn-secondary text-sm w-full"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? 'Preparing Export...' : 'Export Data'}
            </button>
          </div>

          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn text-sm bg-red-600 text-white hover:bg-red-700 w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you absolutely sure you want to delete your account? This will:
            </p>
            
            <ul className="text-sm text-gray-600 mb-6 space-y-1">
              <li>• Delete all your designs permanently</li>
              <li>• Cancel any active orders</li>
              <li>• Remove your profile from the community</li>
              <li>• Delete all your account data</li>
            </ul>
            
            <p className="text-red-600 text-sm font-medium mb-6">
              This action cannot be undone.
            </p>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Delete Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
          Save Privacy Settings
        </button>
      </div>
    </div>
  )
}