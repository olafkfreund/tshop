'use client'

import { useState, useEffect } from 'react'
import { usePerformanceMonitoring } from '@/lib/performance-testing'
import { 
  Zap, 
  Smartphone, 
  Wifi, 
  Battery, 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

export default function PerformanceDashboard() {
  const { metrics, issues, isLoading, optimizeMobile, generateReport } = usePerformanceMonitoring()
  const [optimizations, setOptimizations] = useState<string[]>([])
  const [report, setReport] = useState<any>(null)

  const handleOptimize = () => {
    const applied = optimizeMobile()
    setOptimizations(applied)
  }

  const handleGenerateReport = () => {
    const performanceReport = generateReport()
    setReport(performanceReport)
  }

  if (isLoading || !metrics) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="h-5 w-5 text-green-600" />
    if (score >= 70) return <Zap className="h-5 w-5 text-yellow-600" />
    return <TrendingDown className="h-5 w-5 text-red-600" />
  }

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      {report && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Score</h3>
            <button
              onClick={handleGenerateReport}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh Report
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {getScoreIcon(report.score)}
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(report.score)}`}>
                {report.score}/100
              </div>
              <p className="text-sm text-gray-600">
                {report.score >= 90 ? 'Excellent' : 
                 report.score >= 70 ? 'Good' : 
                 report.score >= 50 ? 'Needs Improvement' : 'Poor'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Device Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <span>Device Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <Monitor className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium text-gray-900 capitalize">
              {metrics.deviceType}
            </div>
            <div className="text-xs text-gray-600">
              {metrics.screenSize.width} × {metrics.screenSize.height}
            </div>
          </div>

          <div className="text-center">
            <Wifi className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium text-gray-900">
              {metrics.connectionType?.toUpperCase() || 'Unknown'}
            </div>
            <div className="text-xs text-gray-600 capitalize">
              {metrics.networkSpeed}
            </div>
          </div>

          <div className="text-center">
            <Battery className={`h-8 w-8 mx-auto mb-2 ${
              metrics.batteryLevel && metrics.batteryLevel < 0.2 ? 'text-red-600' : 'text-green-600'
            }`} />
            <div className="text-sm font-medium text-gray-900">
              {metrics.batteryLevel ? `${Math.round(metrics.batteryLevel * 100)}%` : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Battery</div>
          </div>

          <div className="text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium text-gray-900">
              {metrics.memoryUsage ? `${Math.round(metrics.memoryUsage * 100)}%` : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Memory</div>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">First Contentful Paint</div>
            <div className={`text-xs mt-1 ${
              metrics.fcp && metrics.fcp <= 1800 ? 'text-green-600' : 
              metrics.fcp && metrics.fcp <= 3000 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.fcp && metrics.fcp <= 1800 ? 'Good' : 
               metrics.fcp && metrics.fcp <= 3000 ? 'Needs Improvement' : 'Poor'}
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Largest Contentful Paint</div>
            <div className={`text-xs mt-1 ${
              metrics.lcp && metrics.lcp <= 2500 ? 'text-green-600' : 
              metrics.lcp && metrics.lcp <= 4000 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.lcp && metrics.lcp <= 2500 ? 'Good' : 
               metrics.lcp && metrics.lcp <= 4000 ? 'Needs Improvement' : 'Poor'}
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">First Input Delay</div>
            <div className={`text-xs mt-1 ${
              metrics.fid && metrics.fid <= 100 ? 'text-green-600' : 
              metrics.fid && metrics.fid <= 300 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.fid && metrics.fid <= 100 ? 'Good' : 
               metrics.fid && metrics.fid <= 300 ? 'Needs Improvement' : 'Poor'}
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
            <div className={`text-xs mt-1 ${
              metrics.cls && metrics.cls <= 0.1 ? 'text-green-600' : 
              metrics.cls && metrics.cls <= 0.25 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.cls && metrics.cls <= 0.1 ? 'Good' : 
               metrics.cls && metrics.cls <= 0.25 ? 'Needs Improvement' : 'Poor'}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Issues */}
      {issues.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Issues</h3>
          
          <div className="space-y-3">
            {issues.map((issue, index) => {
              const getIcon = () => {
                switch (issue.type) {
                  case 'error':
                    return <AlertTriangle className="h-5 w-5 text-red-600" />
                  case 'warning':
                    return <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  default:
                    return <Info className="h-5 w-5 text-blue-600" />
                }
              }

              const getBgColor = () => {
                switch (issue.type) {
                  case 'error':
                    return 'bg-red-50 border-red-200'
                  case 'warning':
                    return 'bg-yellow-50 border-yellow-200'
                  default:
                    return 'bg-blue-50 border-blue-200'
                }
              }

              return (
                <div key={index} className={`p-4 rounded-lg border ${getBgColor()}`}>
                  <div className="flex items-start space-x-3">
                    {getIcon()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {issue.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {issue.metric}: {issue.value} (threshold: {issue.threshold})
                      </p>
                      <p className="text-xs text-gray-700 mt-2">
                        <strong>Recommendation:</strong> {issue.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Optimization Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Optimization</h3>
        
        <div className="space-y-4">
          <div className="flex space-x-3">
            <button
              onClick={handleOptimize}
              className="btn-primary flex-shrink-0"
            >
              Optimize for Mobile
            </button>
            
            <button
              onClick={handleGenerateReport}
              className="btn-secondary flex-shrink-0"
            >
              Generate Report
            </button>
          </div>

          {optimizations.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Optimizations Applied:
                </span>
              </div>
              <ul className="text-sm text-green-800 space-y-1">
                {optimizations.map((optimization, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                    <span>{optimization}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report?.recommendations && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Recommendations:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {report.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}