'use client'

/**
 * Push notifications service for PWA
 * Handles subscription, sending notifications, and permission management
 */

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  url?: string
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  async initialize() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser')
      return false
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully')

      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription()
      
      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    return permission === 'granted'
  }

  async subscribe(userId?: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service Worker not registered')
      return null
    }

    const hasPermission = await this.requestPermission()
    if (!hasPermission) {
      console.warn('Push notification permission denied')
      return null
    }

    try {
      // VAPID key for push notifications (replace with your actual key)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        'BEl62iUYgUivxIkv69yViEuiBIa40HI2PacGgXrcfpwt-9vO6jWLXYt6X_AKg9Q2ZHK1LQcJLKa4pclRjhKXG5I'

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      })

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription, userId)
      
      console.log('Push notification subscription successful')
      return this.subscription
    } catch (error) {
      console.error('Push notification subscription failed:', error)
      return null
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true
    }

    try {
      const success = await this.subscription.unsubscribe()
      if (success) {
        // Remove subscription from server
        await this.removeSubscriptionFromServer(this.subscription)
        this.subscription = null
        console.log('Push notification unsubscribed successfully')
      }
      return success
    } catch (error) {
      console.error('Push notification unsubscribe failed:', error)
      return false
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null
    }

    return await this.registration.pushManager.getSubscription()
  }

  private async sendSubscriptionToServer(subscription: PushSubscription, userId?: string) {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        }),
      })
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription) {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
        }),
      })
    } catch (error) {
      console.error('Failed to remove subscription from server:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  // Show local notification (for testing)
  async showLocalNotification(payload: NotificationPayload) {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return
    }

    const hasPermission = await this.requestPermission()
    if (!hasPermission) {
      return
    }

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      image: payload.image,
      tag: payload.tag,
      requireInteraction: true,
      actions: payload.actions,
    })

    notification.onclick = () => {
      window.focus()
      if (payload.url) {
        window.open(payload.url, '_blank')
      }
      notification.close()
    }

    return notification
  }

  // Check notification permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }
}

// Singleton instance
export const pushNotifications = new PushNotificationService()

// React hook for using push notifications
import { useState, useEffect } from 'react'

export function usePushNotifications(userId?: string) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    const checkSupport = async () => {
      setIsSupported(pushNotifications.isSupported())
      setPermission(pushNotifications.getPermissionStatus())
      
      const existingSubscription = await pushNotifications.getSubscription()
      setSubscription(existingSubscription)
    }

    checkSupport()
  }, [])

  const subscribe = async () => {
    setIsLoading(true)
    try {
      const sub = await pushNotifications.subscribe(userId)
      setSubscription(sub)
      setPermission(pushNotifications.getPermissionStatus())
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    try {
      await pushNotifications.unsubscribe()
      setSubscription(null)
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (payload: NotificationPayload) => {
    return pushNotifications.showLocalNotification(payload)
  }

  return {
    subscription,
    permission,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
    showNotification,
  }
}