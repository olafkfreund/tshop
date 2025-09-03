'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Star } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (dismissedTime > oneWeekAgo) {
        return // Still in dismissed period
      } else {
        localStorage.removeItem('pwa-install-dismissed')
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show manual install instructions
    if (isIOSDevice && !window.navigator.standalone) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setShowPrompt(false)
        setIsInstalled(true)
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Install prompt failed:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Install TShop App
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Get the full experience with faster loading, offline access, and push notifications.
            </p>

            {/* Benefits */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>Faster loading times</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>Push notifications</span>
              </div>
            </div>

            {/* Install buttons */}
            {isIOS ? (
              <div>
                <p className="text-xs text-gray-600 mb-3">
                  To install: Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
                </p>
                <button
                  onClick={handleDismiss}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Got it
                </button>
              </div>
            ) : deferredPrompt ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Install</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Later
                </button>
              </div>
            ) : (
              <button
                onClick={handleDismiss}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Component to show install status in settings or dashboard
export function PWAInstallStatus() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches)
    setIsStandalone(window.navigator?.standalone || false)
  }, [])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${isInstalled || isStandalone ? 'bg-green-100' : 'bg-gray-100'}
        `}>
          <Smartphone className={`h-5 w-5 ${
            isInstalled || isStandalone ? 'text-green-600' : 'text-gray-500'
          }`} />
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900">
            {isInstalled || isStandalone ? 'App Installed' : 'Web Version'}
          </h4>
          <p className="text-sm text-gray-600">
            {isInstalled || isStandalone 
              ? 'You\'re using the installed TShop app' 
              : 'Install the app for a better experience'
            }
          </p>
        </div>
        
        {isInstalled || isStandalone ? (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Installed
            </span>
          </div>
        ) : (
          <button className="flex-shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium">
            Install →
          </button>
        )}
      </div>
    </div>
  )
}