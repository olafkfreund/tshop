/**
 * Application monitoring and error tracking
 * Integrates with Sentry, custom error tracking, and performance monitoring
 */

import { analytics } from './analytics'

export interface ErrorContext {
  user?: {
    id?: string
    email?: string
  }
  request?: {
    url: string
    method: string
    headers: Record<string, string>
    body?: any
  }
  extra?: Record<string, any>
  tags?: Record<string, string>
  level?: 'error' | 'warning' | 'info' | 'debug'
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: number
  tags?: Record<string, string>
}

class ApplicationMonitoring {
  private isInitialized = false
  private performanceObserver?: PerformanceObserver

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  async initialize() {
    if (this.isInitialized) return

    try {
      // Initialize Sentry (if available)
      await this.initializeSentry()

      // Set up error handlers
      this.setupErrorHandlers()

      // Set up performance monitoring
      this.setupPerformanceMonitoring()

      // Set up unhandled promise rejection handler
      this.setupUnhandledRejectionHandler()

      this.isInitialized = true
      console.log('Monitoring initialized successfully')
    } catch (error) {
      console.error('Failed to initialize monitoring:', error)
    }
  }

  private async initializeSentry() {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

    try {
      const Sentry = await import('@sentry/nextjs')
      
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        beforeSend(event, hint) {
          // Filter out non-critical errors
          if (event.exception) {
            const error = hint.originalException
            if (error instanceof Error) {
              // Ignore network errors
              if (error.message.includes('NetworkError') || 
                  error.message.includes('fetch')) {
                return null
              }
              
              // Ignore script loading errors
              if (error.message.includes('Loading chunk') ||
                  error.message.includes('Loading CSS chunk')) {
                return null
              }
            }
          }
          
          return event
        },
        integrations: [
          new Sentry.BrowserTracing({
            // Set up automatic route change tracking for Next.js App Router
            routingInstrumentation: Sentry.nextRouterInstrumentation,
          }),
        ],
      })

      // Set user context if available
      const userId = localStorage.getItem('userId')
      if (userId) {
        Sentry.setUser({ id: userId })
      }
    } catch (error) {
      console.warn('Sentry initialization failed:', error)
    }
  }

  private setupErrorHandlers() {
    if (typeof window === 'undefined') return

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          message: event.message,
        },
        level: 'error',
      })
    })

    // React error boundary fallback
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        extra: {
          type: 'unhandled_promise_rejection',
          promise: event.promise,
        },
        level: 'error',
      })
    })
  }

  private setupPerformanceMonitoring() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    try {
      // Monitor Core Web Vitals
      this.observeCoreWebVitals()

      // Monitor navigation timing
      this.observeNavigationTiming()

      // Monitor resource loading
      this.observeResourceTiming()

      // Monitor long tasks
      this.observeLongTasks()
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error)
    }
  }

  private observeCoreWebVitals() {
    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordPerformanceMetric({
          name: 'first_input_delay',
          value: entry.processingStart - entry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
          tags: {
            event_type: entry.name,
          },
        })
      }
    }).observe({ type: 'first-input', buffered: true })

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      this.recordPerformanceMetric({
        name: 'largest_contentful_paint',
        value: lastEntry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
        tags: {
          element: lastEntry.element?.tagName || 'unknown',
        },
      })
    }).observe({ type: 'largest-contentful-paint', buffered: true })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      
      this.recordPerformanceMetric({
        name: 'cumulative_layout_shift',
        value: clsValue,
        unit: 'count',
        timestamp: Date.now(),
      })
    }).observe({ type: 'layout-shift', buffered: true })
  }

  private observeNavigationTiming() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        // DNS lookup time
        this.recordPerformanceMetric({
          name: 'dns_lookup_time',
          value: navigation.domainLookupEnd - navigation.domainLookupStart,
          unit: 'ms',
          timestamp: Date.now(),
        })

        // TCP connection time
        this.recordPerformanceMetric({
          name: 'tcp_connection_time',
          value: navigation.connectEnd - navigation.connectStart,
          unit: 'ms',
          timestamp: Date.now(),
        })

        // Time to first byte
        this.recordPerformanceMetric({
          name: 'time_to_first_byte',
          value: navigation.responseStart - navigation.requestStart,
          unit: 'ms',
          timestamp: Date.now(),
        })

        // DOM content loaded time
        this.recordPerformanceMetric({
          name: 'dom_content_loaded',
          value: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          unit: 'ms',
          timestamp: Date.now(),
        })

        // Page load time
        this.recordPerformanceMetric({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.navigationStart,
          unit: 'ms',
          timestamp: Date.now(),
        })
      }
    })
  }

  private observeResourceTiming() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming
        
        // Track slow resources (>1000ms)
        if (resource.duration > 1000) {
          this.recordPerformanceMetric({
            name: 'slow_resource',
            value: resource.duration,
            unit: 'ms',
            timestamp: Date.now(),
            tags: {
              resource_type: resource.initiatorType,
              resource_name: resource.name.split('/').pop() || 'unknown',
            },
          })
        }
      }
    }).observe({ type: 'resource', buffered: true })
  }

  private observeLongTasks() {
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceMetric({
            name: 'long_task',
            value: entry.duration,
            unit: 'ms',
            timestamp: Date.now(),
            tags: {
              attribution: (entry as any).attribution?.[0]?.name || 'unknown',
            },
          })
        }
      }).observe({ type: 'longtask', buffered: true })
    } catch (error) {
      console.warn('Long task observer not supported:', error)
    }
  }

  private setupUnhandledRejectionHandler() {
    if (typeof window === 'undefined') return

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        extra: {
          type: 'unhandled_promise_rejection',
          reason: event.reason,
        },
        level: 'error',
      })
    })
  }

  async captureError(error: Error | string, context: ErrorContext = {}) {
    const errorObject = typeof error === 'string' ? new Error(error) : error

    try {
      // Send to Sentry (if initialized)
      if (typeof window !== 'undefined' && window.Sentry) {
        const Sentry = await import('@sentry/nextjs')
        
        Sentry.withScope((scope) => {
          if (context.user) {
            scope.setUser(context.user)
          }
          
          if (context.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
              scope.setTag(key, value)
            })
          }
          
          if (context.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
              scope.setExtra(key, value)
            })
          }
          
          scope.setLevel(context.level || 'error')
          
          Sentry.captureException(errorObject)
        })
      }

      // Send to custom error tracking
      await this.sendCustomError(errorObject, context)

      // Track error in analytics
      analytics.trackError(
        errorObject.message,
        context.extra?.context || 'unknown',
        context.level === 'warning' ? 'medium' : 'high'
      )
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError)
    }
  }

  async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: ErrorContext = {}) {
    try {
      // Send to Sentry
      if (typeof window !== 'undefined' && window.Sentry) {
        const Sentry = await import('@sentry/nextjs')
        
        Sentry.withScope((scope) => {
          if (context.user) {
            scope.setUser(context.user)
          }
          
          if (context.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
              scope.setTag(key, value)
            })
          }
          
          if (context.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
              scope.setExtra(key, value)
            })
          }
          
          scope.setLevel(level)
          
          Sentry.captureMessage(message)
        })
      }

      // Send to custom tracking
      await this.sendCustomError(new Error(message), { ...context, level })
    } catch (error) {
      console.error('Failed to capture message:', error)
    }
  }

  recordPerformanceMetric(metric: PerformanceMetric) {
    try {
      // Send to custom analytics
      analytics.trackEvent({
        action: 'performance_metric',
        category: 'performance',
        label: metric.name,
        value: metric.value,
        custom_parameters: {
          unit: metric.unit,
          tags: metric.tags,
        },
      })

      // Log slow performance metrics
      if ((metric.name.includes('time') || metric.name.includes('delay')) && metric.value > 2000) {
        console.warn(`Slow performance detected: ${metric.name} = ${metric.value}${metric.unit}`)
      }
    } catch (error) {
      console.error('Failed to record performance metric:', error)
    }
  }

  private async sendCustomError(error: Error, context: ErrorContext) {
    if (!process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT) return

    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          timestamp: Date.now(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          context,
        }),
      })
    } catch (trackingError) {
      console.error('Failed to send custom error:', trackingError)
    }
  }

  // Health check method
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, boolean>
  }> {
    const checks: Record<string, boolean> = {}

    try {
      // Check API health
      const apiResponse = await fetch('/api/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      checks.api = apiResponse.ok
    } catch {
      checks.api = false
    }

    // Check local storage
    try {
      localStorage.setItem('health-check', 'test')
      localStorage.removeItem('health-check')
      checks.localStorage = true
    } catch {
      checks.localStorage = false
    }

    // Check performance
    checks.performance = performance.now() > 0

    const failedChecks = Object.values(checks).filter(check => !check).length
    const status = failedChecks === 0 ? 'healthy' : 
                  failedChecks <= 1 ? 'degraded' : 'unhealthy'

    return { status, checks }
  }
}

// Create singleton instance
export const monitoring = new ApplicationMonitoring()

// React error boundary
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    monitoring.captureError(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      level: 'error',
    })
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      return <Fallback />
    }

    return this.props.children
  }
}

function DefaultErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We've been notified of this error and are working to fix it.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}

// React hooks for monitoring
export function useMonitoring() {
  return {
    captureError: (error: Error | string, context?: ErrorContext) =>
      monitoring.captureError(error, context),
    captureMessage: (message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext) =>
      monitoring.captureMessage(message, level, context),
    recordPerformanceMetric: (metric: PerformanceMetric) =>
      monitoring.recordPerformanceMetric(metric),
    checkHealth: () => monitoring.checkHealth(),
  }
}

// Import React for error boundary
import React from 'react'