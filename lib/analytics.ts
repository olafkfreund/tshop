/**
 * Analytics and tracking utilities for TShop
 * Supports multiple providers: Google Analytics 4, Vercel Analytics, and custom tracking
 */

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void
    dataLayer: any[]
  }
}

export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
  custom_parameters?: Record<string, any>
}

export interface EcommerceEvent {
  transaction_id: string
  value: number
  currency: string
  items: Array<{
    item_id: string
    item_name: string
    category: string
    quantity: number
    price: number
    variant?: string
  }>
  custom_parameters?: Record<string, any>
}

export interface UserEvent {
  user_id?: string
  user_properties?: Record<string, any>
  event_name: string
  event_parameters?: Record<string, any>
}

class Analytics {
  private isInitialized = false
  private userId?: string
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async initialize() {
    if (this.isInitialized) return

    try {
      // Initialize Google Analytics 4
      if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
        await this.initializeGA4()
      }

      // Initialize Vercel Analytics
      if (process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID) {
        await this.initializeVercelAnalytics()
      }

      // Initialize custom analytics
      await this.initializeCustomAnalytics()

      this.isInitialized = true
      console.log('Analytics initialized successfully')
    } catch (error) {
      console.error('Failed to initialize analytics:', error)
    }
  }

  private async initializeGA4() {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!

    // Load gtag script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)

    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function() {
      window.dataLayer.push(arguments)
    }

    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      custom_map: {
        custom_session_id: 'session_id',
      },
    })
  }

  private async initializeVercelAnalytics() {
    // Dynamically import Vercel Analytics
    try {
      const { inject } = await import('@vercel/analytics')
      inject()
    } catch (error) {
      console.warn('Vercel Analytics not available:', error)
    }
  }

  private async initializeCustomAnalytics() {
    // Send initial page view to custom analytics
    await this.sendCustomEvent({
      action: 'page_view',
      category: 'navigation',
      custom_parameters: {
        session_id: this.sessionId,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      },
    })
  }

  setUserId(userId: string) {
    this.userId = userId

    // Update GA4 user
    if (window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
        user_id: userId,
      })
    }

    // Send user identification event
    this.trackEvent({
      action: 'login',
      category: 'authentication',
      custom_parameters: {
        user_id: userId,
        session_id: this.sessionId,
      },
    })
  }

  clearUserId() {
    this.userId = undefined

    // Send logout event
    this.trackEvent({
      action: 'logout',
      category: 'authentication',
      custom_parameters: {
        session_id: this.sessionId,
      },
    })
  }

  async trackEvent(event: AnalyticsEvent) {
    try {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_session_id: this.sessionId,
          user_id: this.userId,
          ...event.custom_parameters,
        })
      }

      // Custom analytics
      await this.sendCustomEvent(event)
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  async trackEcommerce(event: EcommerceEvent) {
    try {
      // Google Analytics 4 Enhanced Ecommerce
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: event.transaction_id,
          value: event.value,
          currency: event.currency,
          items: event.items.map(item => ({
            item_id: item.item_id,
            item_name: item.item_name,
            item_category: item.category,
            quantity: item.quantity,
            price: item.price,
            item_variant: item.variant,
          })),
          custom_session_id: this.sessionId,
          user_id: this.userId,
          ...event.custom_parameters,
        })
      }

      // Custom ecommerce tracking
      await this.sendCustomEvent({
        action: 'purchase',
        category: 'ecommerce',
        value: event.value,
        custom_parameters: {
          transaction_id: event.transaction_id,
          currency: event.currency,
          items: event.items,
          session_id: this.sessionId,
          user_id: this.userId,
          ...event.custom_parameters,
        },
      })
    } catch (error) {
      console.error('Failed to track ecommerce event:', error)
    }
  }

  async trackPageView(path: string, title?: string) {
    try {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
          page_path: path,
          page_title: title || document.title,
          custom_session_id: this.sessionId,
          user_id: this.userId,
        })
      }

      // Custom page view tracking
      await this.sendCustomEvent({
        action: 'page_view',
        category: 'navigation',
        custom_parameters: {
          page_path: path,
          page_title: title || document.title,
          session_id: this.sessionId,
          user_id: this.userId,
          timestamp: Date.now(),
        },
      })
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  async trackUser(event: UserEvent) {
    try {
      // Set user properties in GA4
      if (window.gtag && event.user_properties) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
          user_properties: event.user_properties,
          user_id: event.user_id,
        })
      }

      // Track custom user event
      await this.sendCustomEvent({
        action: event.event_name,
        category: 'user',
        custom_parameters: {
          user_id: event.user_id,
          user_properties: event.user_properties,
          session_id: this.sessionId,
          ...event.event_parameters,
        },
      })
    } catch (error) {
      console.error('Failed to track user event:', error)
    }
  }

  private async sendCustomEvent(event: AnalyticsEvent) {
    if (!process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) return

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          timestamp: Date.now(),
          session_id: this.sessionId,
          user_id: this.userId,
          url: window.location.href,
          referrer: document.referrer,
        }),
      })
    } catch (error) {
      console.error('Failed to send custom analytics event:', error)
    }
  }

  // Convenience methods for common events
  trackDesignCreated(designId: string, productType: string, aiGenerated: boolean) {
    this.trackEvent({
      action: 'design_created',
      category: 'design',
      label: productType,
      custom_parameters: {
        design_id: designId,
        product_type: productType,
        ai_generated: aiGenerated,
      },
    })
  }

  trackProductViewed(productId: string, productName: string, category: string) {
    this.trackEvent({
      action: 'view_item',
      category: 'ecommerce',
      label: productName,
      custom_parameters: {
        product_id: productId,
        product_name: productName,
        product_category: category,
      },
    })
  }

  trackAddToCart(productId: string, productName: string, price: number, quantity: number) {
    this.trackEvent({
      action: 'add_to_cart',
      category: 'ecommerce',
      label: productName,
      value: price * quantity,
      custom_parameters: {
        product_id: productId,
        product_name: productName,
        price,
        quantity,
      },
    })
  }

  trackPurchaseStarted(orderTotal: number, itemCount: number) {
    this.trackEvent({
      action: 'begin_checkout',
      category: 'ecommerce',
      value: orderTotal,
      custom_parameters: {
        item_count: itemCount,
        order_total: orderTotal,
      },
    })
  }

  trackSearchPerformed(query: string, resultCount: number) {
    this.trackEvent({
      action: 'search',
      category: 'engagement',
      label: query,
      value: resultCount,
      custom_parameters: {
        search_query: query,
        result_count: resultCount,
      },
    })
  }

  trackError(error: string, context: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    this.trackEvent({
      action: 'error',
      category: 'technical',
      label: context,
      custom_parameters: {
        error_message: error,
        error_context: context,
        error_severity: severity,
      },
    })

    // Also track with Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        const Sentry = (window as any).Sentry
        Sentry.withScope((scope: any) => {
          scope.setTag('severity', severity)
          scope.setContext('analytics_context', { context })
          Sentry.captureMessage(`Analytics Error: ${error}`, severity === 'high' ? 'error' : 'warning')
        })
      } catch (sentryError) {
        console.error('Failed to send error to Sentry:', sentryError)
      }
    }
  }
}

// Create singleton instance
export const analytics = new Analytics()

// React hooks for analytics
export function useAnalytics() {
  return {
    trackEvent: (event: AnalyticsEvent) => analytics.trackEvent(event),
    trackEcommerce: (event: EcommerceEvent) => analytics.trackEcommerce(event),
    trackPageView: (path: string, title?: string) => analytics.trackPageView(path, title),
    trackUser: (event: UserEvent) => analytics.trackUser(event),
    setUserId: (userId: string) => analytics.setUserId(userId),
    clearUserId: () => analytics.clearUserId(),
    
    // Convenience methods
    trackDesignCreated: (designId: string, productType: string, aiGenerated: boolean) => 
      analytics.trackDesignCreated(designId, productType, aiGenerated),
    trackProductViewed: (productId: string, productName: string, category: string) => 
      analytics.trackProductViewed(productId, productName, category),
    trackAddToCart: (productId: string, productName: string, price: number, quantity: number) => 
      analytics.trackAddToCart(productId, productName, price, quantity),
    trackPurchaseStarted: (orderTotal: number, itemCount: number) => 
      analytics.trackPurchaseStarted(orderTotal, itemCount),
    trackSearchPerformed: (query: string, resultCount: number) => 
      analytics.trackSearchPerformed(query, resultCount),
    trackError: (error: string, context: string, severity?: 'low' | 'medium' | 'high') => 
      analytics.trackError(error, context, severity),
  }
}