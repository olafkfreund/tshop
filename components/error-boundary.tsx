'use client'

import React from 'react'
import { trackError } from '@/lib/error-tracking'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error?: Error
    resetError: () => void
    errorId?: string
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private errorId?: string

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
    this.resetError = this.resetError.bind(this)
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Generate unique error ID
    this.errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.setState({ error, errorInfo })
    
    // Track error with Sentry
    trackError(error, {
      component: 'error-boundary',
      metadata: {
        errorId: this.errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    })
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Error ID:', this.errorId)
      console.groupEnd()
    }
  }

  resetError() {
    this.errorId = undefined
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
            errorId={this.errorId}
          />
        )
      }

      // Default error UI
      return <DefaultErrorFallback
        error={this.state.error}
        resetError={this.resetError}
        errorId={this.errorId}
      />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
  errorId?: string
}

function DefaultErrorFallback({ error, resetError, errorId }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report: ${error?.name || 'Unknown Error'}`)
    const body = encodeURIComponent(
      `Error ID: ${errorId}\n` +
      `Error: ${error?.message || 'Unknown error'}\n` +
      `Stack: ${error?.stack || 'No stack trace'}\n` +
      `URL: ${window.location.href}\n` +
      `User Agent: ${navigator.userAgent}\n` +
      `Timestamp: ${new Date().toISOString()}\n\n` +
      'Please describe what you were doing when this error occurred:\n\n'
    )
    window.open(`mailto:support@tshop.com?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">
            <AlertTriangle className="h-full w-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but something unexpected happened. Don't worry - we've been notified!
          </p>
          
          {isDevelopment && error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <h3 className="font-medium text-red-900 mb-2">Development Error:</h3>
              <p className="text-sm text-red-800 mb-2 font-mono break-all">
                {error.message}
              </p>
              {errorId && (
                <p className="text-xs text-red-600">
                  Error ID: {errorId}
                </p>
              )}
            </div>
          )}
          
          {!isDevelopment && errorId && (
            <p className="text-sm text-gray-500 mb-4">
              Error ID: <code className="bg-gray-100 px-2 py-1 rounded">{errorId}</code>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>

          <div className="flex space-x-3">
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </button>

            <button
              onClick={handleReportBug}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <Bug className="h-4 w-4 mr-2" />
              Report Bug
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            If this problem persists, please contact our support team at{' '}
            <a 
              href="mailto:support@tshop.com" 
              className="text-primary-600 hover:text-primary-500"
            >
              support@tshop.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// React component wrapper
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />
}

// Higher-order component for wrapping pages/components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ErrorBoundaryProps['fallback']
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return ComponentWithErrorBoundary
}

// Hook for manually triggering errors (useful for testing)
export function useErrorHandler() {
  return React.useCallback((error: Error, context?: Record<string, any>) => {
    trackError(error, {
      component: 'manual',
      metadata: context
    })
    throw error
  }, [])
}