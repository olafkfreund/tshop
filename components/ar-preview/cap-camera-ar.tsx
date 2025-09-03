'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, X, RotateCcw, Maximize2, Download, AlertCircle } from 'lucide-react'
import { useAnalytics } from '@/lib/analytics'

interface CapCameraARProps {
  designImageUrl?: string
  color?: string
  className?: string
  onClose?: () => void
}

// Cap model positioning and sizing
const CAP_CONFIG = {
  position: {
    x: 0.5,      // Center horizontally
    y: 0.3,      // Upper portion of face
    scale: 0.35   // Size relative to detected face
  },
  colors: {
    white: '#ffffff',
    black: '#1a1a1a',
    navy: '#1e40af',
    red: '#dc2626',
    gray: '#6b7280'
  }
}

// Simple face detection bounds (fallback for basic positioning)
interface FaceDetection {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

export default function CapCameraAR({ 
  designImageUrl, 
  color = 'white',
  className = '',
  onClose 
}: CapCameraARProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()
  
  const [isStarted, setIsStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  
  const { trackEvent } = useAnalytics()

  // Check if getUserMedia is supported
  const isCameraSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }, [])

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (!isCameraSupported()) {
      setError('Camera not supported on this device')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user' // Front-facing camera
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraReady(true)
          setIsLoading(false)
          startARLoop()
        }
      }

      trackEvent({
        action: 'ar_camera_started',
        category: 'engagement',
        custom_parameters: {
          product_type: 'cap',
          has_design: !!designImageUrl
        }
      })

    } catch (err) {
      console.error('Camera access error:', err)
      setError('Camera access denied or not available')
      setIsLoading(false)
      
      trackEvent({
        action: 'ar_camera_error',
        category: 'error',
        custom_parameters: {
          error_type: 'camera_access_denied'
        }
      })
    }
  }, [isCameraSupported, designImageUrl, trackEvent])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    setCameraReady(false)
    setIsStarted(false)
  }, [])

  // Simple face detection using basic heuristics
  const detectFace = useCallback((video: HTMLVideoElement): FaceDetection | null => {
    // This is a simplified face detection
    // In a production app, you'd use a library like MediaPipe or TensorFlow.js
    const centerX = video.videoWidth * 0.5
    const centerY = video.videoHeight * 0.3
    const faceWidth = video.videoWidth * 0.3
    const faceHeight = video.videoHeight * 0.4

    // Simulate face detection (always returns a centered face for demo)
    return {
      x: centerX - faceWidth / 2,
      y: centerY - faceHeight / 2,
      width: faceWidth,
      height: faceHeight,
      confidence: 0.8
    }
  }, [])

  // Draw cap overlay on canvas
  const drawCapOverlay = useCallback((
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    face?: FaceDetection
  ) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (face && face.confidence > 0.5) {
      setFaceDetected(true)
      
      // Calculate cap position and size
      const capX = face.x + (face.width * (0.5 - CAP_CONFIG.position.scale / 2))
      const capY = face.y - (face.height * 0.2) // Position above the face
      const capWidth = face.width * CAP_CONFIG.position.scale * 1.8
      const capHeight = capWidth * 0.6 // Cap aspect ratio

      // Draw cap base (simplified)
      ctx.fillStyle = CAP_CONFIG.colors[color as keyof typeof CAP_CONFIG.colors] || CAP_CONFIG.colors.white
      
      // Cap crown (ellipse)
      ctx.beginPath()
      ctx.ellipse(
        capX + capWidth / 2, 
        capY + capHeight / 3,
        capWidth / 2.2,
        capHeight / 3,
        0, 0, 2 * Math.PI
      )
      ctx.fill()

      // Cap visor (ellipse)
      ctx.fillStyle = CAP_CONFIG.colors[color as keyof typeof CAP_CONFIG.colors] || CAP_CONFIG.colors.white
      ctx.beginPath()
      ctx.ellipse(
        capX + capWidth / 2,
        capY + capHeight / 1.5,
        capWidth / 1.8,
        capHeight / 6,
        0, 0, 2 * Math.PI
      )
      ctx.fill()

      // Draw design on cap front panel if available
      if (designImageUrl) {
        const designImg = new Image()
        designImg.crossOrigin = 'anonymous'
        designImg.onload = () => {
          const designSize = Math.min(capWidth * 0.4, capHeight * 0.5)
          const designX = capX + capWidth / 2 - designSize / 2
          const designY = capY + capHeight / 4
          
          ctx.save()
          ctx.globalAlpha = 0.9
          ctx.drawImage(designImg, designX, designY, designSize, designSize * 0.8)
          ctx.restore()
        }
        designImg.src = designImageUrl
      }

      // Add some depth shading
      const gradient = ctx.createLinearGradient(capX, capY, capX + capWidth, capY + capHeight)
      gradient.addColorStop(0, 'rgba(255,255,255,0.1)')
      gradient.addColorStop(1, 'rgba(0,0,0,0.1)')
      ctx.fillStyle = gradient
      ctx.fill()

    } else {
      setFaceDetected(false)
    }
  }, [color, designImageUrl])

  // Main AR loop
  const startARLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    const loop = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const face = detectFace(video)
        drawCapOverlay(canvas, video, face || undefined)
      }
      
      animationRef.current = requestAnimationFrame(loop)
    }

    loop()
  }, [detectFace, drawCapOverlay])

  // Handle start AR
  const handleStart = async () => {
    setIsStarted(true)
    await startCamera()
    setTimeout(() => setShowInstructions(false), 3000)
  }

  // Handle stop/close
  const handleClose = () => {
    stopCamera()
    onClose?.()
    
    trackEvent({
      action: 'ar_camera_closed',
      category: 'engagement'
    })
  }

  // Take screenshot
  const takeScreenshot = () => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    
    // Create a new canvas for the screenshot
    const screenshotCanvas = document.createElement('canvas')
    const screenshotCtx = screenshotCanvas.getContext('2d')
    
    if (!screenshotCtx) return

    screenshotCanvas.width = video.videoWidth
    screenshotCanvas.height = video.videoHeight
    
    // Draw video frame
    screenshotCtx.drawImage(video, 0, 0)
    
    // Draw AR overlay
    screenshotCtx.drawImage(canvas, 0, 0)
    
    // Download screenshot
    screenshotCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `tshop-cap-ar-${Date.now()}.png`
        link.click()
        URL.revokeObjectURL(url)
      }
    })

    trackEvent({
      action: 'ar_screenshot_taken',
      category: 'engagement',
      custom_parameters: {
        product_type: 'cap'
      }
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  if (!isCameraSupported()) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-xl p-8 ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Not Supported</h3>
          <p className="text-gray-600 mb-4">
            AR preview requires camera access, which is not available on this device or browser.
          </p>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <div className={`relative ${isFullscreen ? 'w-full h-full' : 'rounded-xl overflow-hidden'} bg-gray-900`}>
        
        {/* Camera not started */}
        {!isStarted && (
          <div className="flex items-center justify-center h-full min-h-[400px] bg-gradient-to-br from-blue-900 to-purple-900 text-white">
            <div className="text-center p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6">
                <Camera className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AR Cap Try-On</h3>
              <p className="text-blue-100 mb-6 max-w-md mx-auto">
                See how this cap looks on you with real-time camera preview. 
                Your camera access stays private and secure.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Private & secure camera access</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Real-time design preview</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Take screenshots to share</span>
                </div>
              </div>
              <button 
                onClick={handleStart}
                className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Start AR Preview
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg font-medium">Starting camera...</p>
              <p className="text-gray-300 text-sm mt-2">Please allow camera access when prompted</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 text-white">
            <div className="text-center p-8">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Camera Error</h3>
              <p className="text-gray-300 mb-6">{error}</p>
              <div className="space-x-4">
                <button 
                  onClick={handleStart}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button 
                  onClick={handleClose}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AR Preview */}
        {cameraReady && (
          <>
            {/* Video element (hidden) */}
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
            />
            
            {/* AR Canvas */}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            
            {/* Instructions overlay */}
            {showInstructions && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
                  <h4 className="font-bold mb-3">AR Cap Try-On Instructions</h4>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>• Position your face in the center</p>
                    <p>• Look directly at the camera</p>
                    <p>• Keep good lighting for best results</p>
                    <p>• The cap will appear above your head</p>
                  </div>
                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="btn-primary text-sm"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            )}
            
            {/* Face detection indicator */}
            <div className="absolute top-4 left-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                faceDetected 
                  ? 'bg-green-500 text-white' 
                  : 'bg-orange-500 text-white'
              }`}>
                <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-200' : 'bg-orange-200'} animate-pulse`}></div>
                <span>{faceDetected ? 'Face detected' : 'Looking for face...'}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={takeScreenshot}
                  className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-gray-700 hover:bg-white transition-colors"
                  title="Take screenshot"
                >
                  <Download className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-gray-700 hover:bg-white transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={handleClose}
                className="bg-red-500 bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-white hover:bg-red-600 transition-colors"
                title="Close AR preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Product info */}
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-lg">
              Cap • {color.charAt(0).toUpperCase() + color.slice(1)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}