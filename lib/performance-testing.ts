'use client'

/**
 * Performance testing and optimization utilities for mobile experience
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  ttfb: number | null // Time to First Byte
  
  // Custom metrics
  deviceType: 'mobile' | 'tablet' | 'desktop'
  connectionType: string
  memoryUsage: number | null
  loadTime: number
  domReadyTime: number
  
  // Mobile-specific
  touchCapable: boolean
  screenSize: { width: number; height: number }
  pixelRatio: number
  batteryLevel: number | null
  networkSpeed: string
}

export interface PerformanceIssue {
  type: 'warning' | 'error' | 'info'
  metric: string
  value: number
  threshold: number
  message: string
  recommendation: string
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {}
  private observer?: PerformanceObserver
  private batteryAPI?: any

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring()
    }
  }

  async initializeMonitoring() {
    // Get battery info if available
    if ('getBattery' in navigator) {
      try {
        this.batteryAPI = await (navigator as any).getBattery()
      } catch (error) {
        console.log('Battery API not available')
      }
    }

    // Set up performance observers
    this.setupPerformanceObservers()
    
    // Collect basic device info
    this.collectDeviceInfo()
    
    // Start monitoring
    this.startContinuousMonitoring()
  }

  private setupPerformanceObservers() {
    if (!('PerformanceObserver' in window)) return

    try {
      // Core Web Vitals Observer
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                this.metrics.fcp = entry.startTime
              }
              break
              
            case 'largest-contentful-paint':
              this.metrics.lcp = entry.startTime
              break
              
            case 'first-input':
              this.metrics.fid = (entry as any).processingStart - entry.startTime
              break
              
            case 'layout-shift':
              const shift = entry as any
              if (!shift.hadRecentInput) {
                this.metrics.cls = (this.metrics.cls || 0) + shift.value
              }
              break
          }
        }
      })

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })
      this.observer = observer

    } catch (error) {
      console.warn('Performance Observer setup failed:', error)
    }
  }

  private collectDeviceInfo() {
    const { innerWidth, innerHeight, devicePixelRatio } = window
    
    this.metrics = {
      ...this.metrics,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      touchCapable: 'ontouchstart' in window,
      screenSize: { width: innerWidth, height: innerHeight },
      pixelRatio: devicePixelRatio || 1,
      batteryLevel: this.batteryAPI?.level || null,
      networkSpeed: this.getNetworkSpeed(),
    }
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    return connection?.effectiveType || 'unknown'
  }

  private getNetworkSpeed(): string {
    const connection = (navigator as any).connection
    if (!connection) return 'unknown'
    
    if (connection.effectiveType) {
      return connection.effectiveType // '4g', '3g', '2g', 'slow-2g'
    }
    
    if (connection.downlink) {
      const speed = connection.downlink // Mbps
      if (speed >= 10) return 'fast'
      if (speed >= 1.5) return 'good'
      if (speed >= 0.6) return 'slow'
      return 'very-slow'
    }
    
    return 'unknown'
  }

  private startContinuousMonitoring() {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      }, 5000)
    }

    // Monitor load times
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.metrics.loadTime = navigation.loadEventEnd - navigation.navigationStart
        this.metrics.domReadyTime = navigation.domContentLoadedEventEnd - navigation.navigationStart
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart
      }
    })
  }

  getMetrics(): PerformanceMetrics {
    return this.metrics as PerformanceMetrics
  }

  analyzePerformance(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []
    const metrics = this.getMetrics()

    // Check Core Web Vitals
    if (metrics.lcp && metrics.lcp > 2500) {
      issues.push({
        type: 'warning',
        metric: 'Largest Contentful Paint',
        value: metrics.lcp,
        threshold: 2500,
        message: 'LCP is slower than recommended for mobile',
        recommendation: 'Optimize images, reduce server response time, or implement lazy loading'
      })
    }

    if (metrics.fid && metrics.fid > 100) {
      issues.push({
        type: 'warning',
        metric: 'First Input Delay',
        value: metrics.fid,
        threshold: 100,
        message: 'FID indicates poor input responsiveness',
        recommendation: 'Reduce JavaScript execution time, split code bundles, or use web workers'
      })
    }

    if (metrics.cls && metrics.cls > 0.1) {
      issues.push({
        type: 'warning',
        metric: 'Cumulative Layout Shift',
        value: metrics.cls,
        threshold: 0.1,
        message: 'High layout shift may frustrate mobile users',
        recommendation: 'Reserve space for images and ads, avoid inserting content above existing content'
      })
    }

    // Mobile-specific checks
    if (metrics.deviceType === 'mobile') {
      if (metrics.memoryUsage && metrics.memoryUsage > 0.8) {
        issues.push({
          type: 'error',
          metric: 'Memory Usage',
          value: metrics.memoryUsage,
          threshold: 0.8,
          message: 'High memory usage on mobile device',
          recommendation: 'Reduce memory-intensive operations, implement virtual scrolling, clear unused objects'
        })
      }

      if (metrics.loadTime > 3000) {
        issues.push({
          type: 'warning',
          metric: 'Load Time',
          value: metrics.loadTime,
          threshold: 3000,
          message: 'Slow load time on mobile',
          recommendation: 'Enable compression, optimize images, reduce bundle size'
        })
      }

      if (metrics.batteryLevel && metrics.batteryLevel < 0.2) {
        issues.push({
          type: 'info',
          metric: 'Battery Level',
          value: metrics.batteryLevel,
          threshold: 0.2,
          message: 'User has low battery',
          recommendation: 'Reduce CPU-intensive operations, limit animations'
        })
      }
    }

    return issues
  }

  // Mobile-specific performance optimizations
  optimizeForMobile() {
    const metrics = this.getMetrics()
    const optimizations = []

    if (metrics.deviceType === 'mobile') {
      // Reduce animation frequency on low-end devices
      if (metrics.memoryUsage && metrics.memoryUsage > 0.7) {
        document.documentElement.style.setProperty('--animation-duration', '0.1s')
        optimizations.push('Reduced animation duration for low-memory device')
      }

      // Adjust image quality based on connection
      if (metrics.connectionType === '2g' || metrics.connectionType === 'slow-2g') {
        document.documentElement.style.setProperty('--image-quality', '70')
        optimizations.push('Reduced image quality for slow connection')
      }

      // Disable non-essential features on very slow connections
      if (metrics.networkSpeed === 'very-slow') {
        document.documentElement.classList.add('low-bandwidth')
        optimizations.push('Disabled non-essential features for slow connection')
      }

      // Battery-aware optimizations
      if (metrics.batteryLevel && metrics.batteryLevel < 0.2) {
        document.documentElement.classList.add('low-battery')
        optimizations.push('Enabled power-saving mode')
      }
    }

    return optimizations
  }

  // Generate performance report
  generateReport(): {
    metrics: PerformanceMetrics
    issues: PerformanceIssue[]
    score: number
    recommendations: string[]
  } {
    const metrics = this.getMetrics()
    const issues = this.analyzePerformance()
    
    // Calculate performance score (0-100)
    let score = 100
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'error':
          score -= 25
          break
        case 'warning':
          score -= 15
          break
        case 'info':
          score -= 5
          break
      }
    })

    score = Math.max(0, score)

    // General recommendations
    const recommendations = [
      'Optimize images with WebP format and lazy loading',
      'Minimize JavaScript bundle size',
      'Use service workers for caching',
      'Implement virtual scrolling for long lists',
      'Reduce third-party script usage',
      'Enable gzip/brotli compression',
      'Use CSS containment for better performance',
      'Implement proper loading states',
    ]

    return {
      metrics,
      issues,
      score,
      recommendations: recommendations.slice(0, 5) // Top 5 recommendations
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
import { useState, useEffect } from 'react'

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [issues, setIssues] = useState<PerformanceIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceMonitor.getMetrics()
      const currentIssues = performanceMonitor.analyzePerformance()
      
      setMetrics(currentMetrics)
      setIssues(currentIssues)
      setIsLoading(false)
    }

    // Initial load
    setTimeout(updateMetrics, 1000)

    // Update every 10 seconds
    const interval = setInterval(updateMetrics, 10000)

    return () => clearInterval(interval)
  }, [])

  const optimizeMobile = () => {
    return performanceMonitor.optimizeForMobile()
  }

  const generateReport = () => {
    return performanceMonitor.generateReport()
  }

  return {
    metrics,
    issues,
    isLoading,
    optimizeMobile,
    generateReport,
  }
}