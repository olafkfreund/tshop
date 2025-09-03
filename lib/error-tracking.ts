/**
 * Error tracking utilities for TShop
 * Integrates with Sentry and provides standardized error handling
 */

import * as Sentry from '@sentry/nextjs'

export interface ErrorContext {
  user_id?: string
  action?: string
  component?: string
  metadata?: Record<string, any>
}

export interface APIError {
  code: string
  message: string
  details?: any
  context?: ErrorContext
}

/**
 * Track an error with Sentry and console logging
 */
export function trackError(
  error: Error | string,
  context: ErrorContext = {},
  level: 'error' | 'warning' | 'info' = 'error'
) {
  try {
    // Set Sentry context
    Sentry.withScope((scope) => {
      if (context.user_id) {
        scope.setUser({ id: context.user_id })
      }
      
      if (context.action) {
        scope.setTag('action', context.action)
      }
      
      if (context.component) {
        scope.setTag('component', context.component)
      }
      
      if (context.metadata) {
        scope.setContext('metadata', context.metadata)
      }
      
      scope.setLevel(level)
      
      if (typeof error === 'string') {
        Sentry.captureMessage(error)
      } else {
        Sentry.captureException(error)
      }
    })
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', error, context)
    }
  } catch (trackingError) {
    console.error('Failed to track error:', trackingError)
  }
}

/**
 * Track API errors with standardized format
 */
export function trackAPIError(
  apiError: APIError,
  request?: {
    method?: string
    url?: string
    body?: any
  }
) {
  const context: ErrorContext = {
    ...apiError.context,
    component: 'api',
    metadata: {
      code: apiError.code,
      details: apiError.details,
      request: request ? {
        method: request.method,
        url: request.url,
        body: request.body ? JSON.stringify(request.body).slice(0, 1000) : null
      } : null
    }
  }
  
  trackError(new Error(apiError.message), context)
}

/**
 * Track AI-related errors with specific context
 */
export function trackAIError(
  error: Error | string,
  context: {
    provider?: 'gemini' | 'openai'
    operation?: 'generation' | 'processing' | 'validation'
    prompt?: string
    user_id?: string
    cost?: number
  }
) {
  const aiContext: ErrorContext = {
    user_id: context.user_id,
    component: 'ai',
    action: context.operation,
    metadata: {
      provider: context.provider,
      prompt: context.prompt ? context.prompt.slice(0, 500) : null,
      cost: context.cost
    }
  }
  
  trackError(error, aiContext, 'error')
}

/**
 * Track fulfillment errors with provider context
 */
export function trackFulfillmentError(
  error: Error | string,
  context: {
    provider?: 'printful' | 'printify'
    operation?: 'quote' | 'order' | 'webhook' | 'sync'
    order_id?: string
    user_id?: string
    cost?: number
  }
) {
  const fulfillmentContext: ErrorContext = {
    user_id: context.user_id,
    component: 'fulfillment',
    action: context.operation,
    metadata: {
      provider: context.provider,
      order_id: context.order_id,
      cost: context.cost
    }
  }
  
  trackError(error, fulfillmentContext, 'error')
}

/**
 * Track payment errors with transaction context
 */
export function trackPaymentError(
  error: Error | string,
  context: {
    provider?: 'stripe'
    operation?: 'checkout' | 'webhook' | 'refund'
    transaction_id?: string
    user_id?: string
    amount?: number
    currency?: string
  }
) {
  const paymentContext: ErrorContext = {
    user_id: context.user_id,
    component: 'payment',
    action: context.operation,
    metadata: {
      provider: context.provider,
      transaction_id: context.transaction_id,
      amount: context.amount,
      currency: context.currency
    }
  }
  
  trackError(error, paymentContext, 'error')
}

/**
 * Track user action errors
 */
export function trackUserError(
  error: Error | string,
  context: {
    user_id?: string
    action?: string
    page?: string
    component?: string
    metadata?: Record<string, any>
  }
) {
  const userContext: ErrorContext = {
    user_id: context.user_id,
    component: context.component || 'user',
    action: context.action,
    metadata: {
      page: context.page,
      ...context.metadata
    }
  }
  
  trackError(error, userContext, 'warning')
}

/**
 * Create a standardized API error response
 */
export function createAPIErrorResponse(
  message: string,
  code: string = 'INTERNAL_ERROR',
  status: number = 500,
  details?: any
): Response {
  const errorResponse = {
    success: false,
    error: message,
    code,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Middleware for handling errors in API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R> | R
): (...args: T) => Promise<R | Response> {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API Error:', error)
      
      const apiError: APIError = {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : error
      }
      
      trackAPIError(apiError)
      
      return createAPIErrorResponse(
        apiError.message,
        apiError.code,
        500,
        apiError.details
      )
    }
  }
}