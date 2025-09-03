'use client'

import { useState, useEffect } from 'react'
import { fabric } from 'fabric'
import CanvasEditor from './canvas-editor'
import MobileCanvasEditor from './mobile-canvas-editor'

interface ResponsiveCanvasEditorProps {
  width?: number
  height?: number
  onCanvasReady?: (canvas: fabric.Canvas) => void
  onDesignChange?: (dataUrl: string) => void
  initialDesign?: string
}

export default function ResponsiveCanvasEditor(props: ResponsiveCanvasEditorProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const checkDevice = () => {
      // Check for mobile device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      // Check for touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Check screen size
      const isSmallScreen = window.innerWidth < 768
      
      // Mobile if any of these conditions are true
      setIsMobile(isMobileDevice || (isTouchDevice && isSmallScreen))
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // Don't render until client-side to avoid hydration issues
  if (!isClient) {
    return (
      <div className="flex items-center justify-center w-full h-96 bg-gray-100">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  // Adjust dimensions for mobile
  const editorProps = {
    ...props,
    width: isMobile ? Math.min(350, window.innerWidth - 40) : props.width,
    height: isMobile ? Math.min(450, window.innerHeight * 0.6) : props.height,
  }

  return (
    <div className="w-full h-full">
      {isMobile ? (
        <MobileCanvasEditor {...editorProps} />
      ) : (
        <CanvasEditor {...editorProps} />
      )}
    </div>
  )
}