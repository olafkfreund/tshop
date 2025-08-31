import { NextRequest, NextResponse } from 'next/server'
import React from 'react'

/**
 * Performance monitoring and optimization utilities
 */

export interface PerformanceMetrics {
  duration: number
  timestamp: number
  route: string
  method: string
  status: number
  userAgent?: string
  country?: string
}

/**
 * Performance monitoring middleware
 */
export function withPerformanceMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const start = performance.now()
    const route = request.nextUrl.pathname
    const method = request.method

    try {
      const response = await handler(request)
      const duration = performance.now() - start

      // Log performance metrics
      const metrics: PerformanceMetrics = {
        duration,
        timestamp: Date.now(),
        route,
        method,
        status: response.status,
        userAgent: request.headers.get('user-agent') || undefined,
        country: request.geo?.country || undefined,
      }

      // Send to analytics (implement based on your analytics provider)
      await logPerformanceMetrics(metrics)

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`)
      
      return response
    } catch (error) {
      const duration = performance.now() - start
      
      // Log error metrics
      const metrics: PerformanceMetrics = {
        duration,
        timestamp: Date.now(),
        route,
        method,
        status: 500,
        userAgent: request.headers.get('user-agent') || undefined,
        country: request.geo?.country || undefined,
      }

      await logPerformanceMetrics(metrics)
      throw error
    }
  }
}

/**
 * Database query performance optimization
 */
export class DatabaseOptimizer {
  private static queryCache = new Map<string, any>()
  private static queryTimes = new Map<string, number[]>()

  static async optimizeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    cacheMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const start = performance.now()

    try {
      // Check cache first
      const cached = this.queryCache.get(queryKey)
      if (cached && cached.expires > Date.now()) {
        return cached.data
      }

      // Execute query
      const result = await queryFn()
      const duration = performance.now() - start

      // Cache result
      this.queryCache.set(queryKey, {
        data: result,
        expires: Date.now() + cacheMs,
      })

      // Track query performance
      this.trackQueryPerformance(queryKey, duration)

      return result
    } catch (error) {
      const duration = performance.now() - start
      this.trackQueryPerformance(queryKey, duration, true)
      throw error
    }
  }

  private static trackQueryPerformance(queryKey: string, duration: number, isError = false) {
    if (!this.queryTimes.has(queryKey)) {
      this.queryTimes.set(queryKey, [])
    }

    const times = this.queryTimes.get(queryKey)!
    times.push(duration)

    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift()
    }

    // Log slow queries
    if (duration > 1000) { // 1 second threshold
      console.warn(`Slow query detected: ${queryKey} took ${duration.toFixed(2)}ms`, {
        isError,
        avgDuration: times.reduce((a, b) => a + b, 0) / times.length,
      })
    }
  }

  static getQueryStats(queryKey: string) {
    const times = this.queryTimes.get(queryKey) || []
    if (times.length === 0) return null

    return {
      count: times.length,
      avgDuration: times.reduce((a, b) => a + b, 0) / times.length,
      minDuration: Math.min(...times),
      maxDuration: Math.max(...times),
      p95Duration: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)],
    }
  }
}

/**
 * Image optimization utilities
 */
export const imageOptimization = {
  /**
   * Get optimized image URL with Next.js Image Optimization
   */
  getOptimizedUrl(
    src: string,
    width: number,
    height?: number,
    quality: number = 80
  ): string {
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: quality.toString(),
    })

    if (height) {
      params.set('h', height.toString())
    }

    return `/_next/image?${params.toString()}`
  },

  /**
   * Generate responsive image srcSet
   */
  generateSrcSet(src: string, sizes: number[], quality: number = 80): string {
    return sizes
      .map(size => `${this.getOptimizedUrl(src, size, undefined, quality)} ${size}w`)
      .join(', ')
  },

  /**
   * Get Cloudinary transformation URL
   */
  getCloudinaryUrl(
    publicId: string,
    transformations: {
      width?: number
      height?: number
      crop?: string
      quality?: number
      format?: string
      effect?: string
    } = {}
  ): string {
    const {
      width = 800,
      height,
      crop = 'fill',
      quality = 80,
      format = 'auto',
      effect,
    } = transformations

    let transformation = `c_${crop},q_${quality},f_${format},w_${width}`
    
    if (height) {
      transformation += `,h_${height}`
    }
    
    if (effect) {
      transformation += `,e_${effect}`
    }

    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`
  },
}

/**
 * Bundle optimization utilities
 */
export const bundleOptimization = {
  /**
   * Preload critical resources
   */
  preloadResource(href: string, as: 'script' | 'style' | 'font' | 'image') {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      
      if (as === 'font') {
        link.crossOrigin = 'anonymous'
      }
      
      document.head.appendChild(link)
    }
  },
}

/**
 * API response compression
 */
export function compressResponse(data: any): string {
  // Simple compression for JSON responses
  return JSON.stringify(data, (key, value) => {
    // Remove null values
    if (value === null) return undefined
    
    // Truncate long strings in development
    if (typeof value === 'string' && value.length > 1000) {
      return process.env.NODE_ENV === 'development' 
        ? value.substring(0, 1000) + '...' 
        : value
    }
    
    return value
  })
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private static requests = new Map<string, number[]>()

  static async checkLimit(
    identifier: string,
    limit: number,
    windowMs: number = 60 * 1000 // 1 minute default
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || []
    
    // Filter out old requests
    const validRequests = requests.filter(time => time > windowStart)
    
    // Update the map
    this.requests.set(identifier, validRequests)

    const remaining = Math.max(0, limit - validRequests.length)
    const allowed = validRequests.length < limit

    if (allowed) {
      validRequests.push(now)
      this.requests.set(identifier, validRequests)
    }

    return {
      allowed,
      remaining,
      resetTime: Math.max(...validRequests, now) + windowMs,
    }
  }
}

/**
 * Log performance metrics (implement based on your analytics provider)
 */
async function logPerformanceMetrics(metrics: PerformanceMetrics) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance:', metrics)
    return
  }

  try {
    // Example: Send to Vercel Analytics
    if (process.env.VERCEL_ANALYTICS_ID) {
      await fetch('https://vitals.vercel-analytics.com/v1/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dsn: process.env.VERCEL_ANALYTICS_ID,
          id: crypto.randomUUID(),
          page: metrics.route,
          href: metrics.route,
          event_name: 'api_call',
          value: metrics.duration,
          ...metrics,
        }),
      })
    }

    // Example: Send to custom analytics endpoint
    if (process.env.ANALYTICS_ENDPOINT) {
      await fetch(process.env.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ANALYTICS_TOKEN}`,
        },
        body: JSON.stringify(metrics),
      })
    }
  } catch (error) {
    console.error('Failed to log performance metrics:', error)
  }
}

