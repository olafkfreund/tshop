'use client'

import { useState } from 'react'
import { Bell, BellOff, Smartphone, Package, Star, Zap } from 'lucide-react'
import { usePushNotifications } from '@/lib/push-notifications'

export default function NotificationSettings() {
  const {
    subscription,
    permission,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
    showNotification,
  } = usePushNotifications()

  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    newFeatures: false,
    designTips: true,
    promotions: false,
  })

  const handleToggleNotifications = async () => {
    if (subscription) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  const testNotification = () => {
    showNotification({
      title: '🎉 TShop Notification Test',
      body: 'Your push notifications are working perfectly!',
      icon: '/icons/icon-192x192.png',
      url: '/dashboard',
    })
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <BellOff className="h-5 w-5 text-yellow-600" />
          <p className="text-yellow-800">
            Push notifications are not supported in this browser.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {subscription ? (
              <Bell className="h-6 w-6 text-green-600" />
            ) : (
              <BellOff className="h-6 w-6 text-gray-400" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-600">
                {subscription 
                  ? 'You\'ll receive notifications about your orders and updates'
                  : 'Enable notifications to stay updated on your orders'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={handleToggleNotifications}
            disabled={isLoading || permission === 'denied'}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${subscription 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading ? 'Loading...' : subscription ? 'Disable' : 'Enable'}
          </button>
        </div>

        {permission === 'denied' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        {subscription && (
          <div className="mt-4">
            <button
              onClick={testNotification}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Send test notification
            </button>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      {subscription && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            What would you like to be notified about?
          </h4>
          
          <div className="space-y-4">
            {/* Order Updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Order Updates</p>
                  <p className="text-sm text-gray-600">
                    Shipping, delivery, and order status changes
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.orderUpdates}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    orderUpdates: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* New Features */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">New Features</p>
                  <p className="text-sm text-gray-600">
                    Latest tools and platform updates
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.newFeatures}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    newFeatures: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Design Tips */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Design Tips</p>
                  <p className="text-sm text-gray-600">
                    Weekly tips to improve your designs
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.designTips}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    designTips: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Promotions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Promotions & Deals</p>
                  <p className="text-sm text-gray-600">
                    Special offers and discounts
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.promotions}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    promotions: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                // Save preferences to server
                console.log('Saving preferences:', preferences)
                // TODO: Implement API call to save preferences
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Hint */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center space-x-3">
          <Smartphone className="h-6 w-6 text-blue-600" />
          <div>
            <h4 className="font-semibold text-gray-900">Install TShop App</h4>
            <p className="text-sm text-gray-600 mt-1">
              Add TShop to your home screen for the best mobile experience and reliable notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}