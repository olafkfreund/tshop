'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { fabric } from 'fabric'
import { 
  Move3D, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Type, 
  Square, 
  Circle,
  Undo,
  Redo,
  Palette,
  Download,
  Share2
} from 'lucide-react'

interface MobileCanvasEditorProps {
  width?: number
  height?: number
  onCanvasReady?: (canvas: fabric.Canvas) => void
  onDesignChange?: (dataUrl: string) => void
  initialDesign?: string
}

interface TouchGesture {
  startDistance: number
  startAngle: number
  centerX: number
  centerY: number
}

export default function MobileCanvasEditor({
  width = 400,
  height = 500,
  onCanvasReady,
  onDesignChange,
  initialDesign
}: MobileCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null)
  const [isGestureMode, setIsGestureMode] = useState(false)
  const [lastTouches, setLastTouches] = useState<TouchList | null>(null)
  const [gestureData, setGestureData] = useState<TouchGesture | null>(null)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [showToolbar, setShowToolbar] = useState(true)

  // Initialize Fabric.js canvas with mobile optimizations
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: 'white',
        selection: true,
        preserveObjectStacking: true,
        // Mobile optimizations
        enableRetinaScaling: true,
        imageSmoothingEnabled: true,
        allowTouchScrolling: false,
        fireRightClick: false,
        stopContextMenu: false,
      })

      // Enhanced touch event handling
      canvas.on('touch:gesture', handleGesture)
      canvas.on('touch:drag', handleTouchDrag)
      canvas.on('selection:created', (e) => setActiveObject(e.selected?.[0] || null))
      canvas.on('selection:updated', (e) => setActiveObject(e.selected?.[0] || null))
      canvas.on('selection:cleared', () => setActiveObject(null))
      
      // Save state for undo/redo
      canvas.on('object:modified', saveCanvasState)
      canvas.on('object:added', saveCanvasState)
      canvas.on('object:removed', saveCanvasState)

      fabricCanvasRef.current = canvas
      onCanvasReady?.(canvas)

      // Load initial design if provided
      if (initialDesign) {
        loadDesignFromDataUrl(initialDesign)
      }

      return () => {
        canvas.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [width, height, onCanvasReady, initialDesign])

  // Enhanced touch gesture handling
  const handleGesture = useCallback((e: any) => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !e.e.touches || e.e.touches.length !== 2) return

    e.e.preventDefault()
    const touch1 = e.e.touches[0]
    const touch2 = e.e.touches[1]

    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )

    const centerX = (touch1.clientX + touch2.clientX) / 2
    const centerY = (touch1.clientY + touch2.clientY) / 2
    const angle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX)

    if (!gestureData) {
      setGestureData({
        startDistance: distance,
        startAngle: angle,
        centerX,
        centerY
      })
      setIsGestureMode(true)
      return
    }

    // Pinch to zoom
    const scale = distance / gestureData.startDistance
    const zoom = canvas.getZoom() * scale
    const clampedZoom = Math.min(Math.max(zoom, 0.5), 3)
    canvas.setZoom(clampedZoom)

    // Rotate gesture
    if (activeObject && activeObject.type !== 'group') {
      const angleDiff = angle - gestureData.startAngle
      const currentAngle = activeObject.angle || 0
      activeObject.set('angle', currentAngle + (angleDiff * 180 / Math.PI))
    }

    canvas.requestRenderAll()
    
    setGestureData({
      startDistance: distance,
      startAngle: angle,
      centerX,
      centerY
    })
  }, [gestureData, activeObject])

  const handleTouchDrag = useCallback((e: any) => {
    if (isGestureMode || !fabricCanvasRef.current) return
    
    // Single finger drag - pan canvas if no object selected
    if (!activeObject && e.e.touches?.length === 1) {
      const canvas = fabricCanvasRef.current
      const touch = e.e.touches[0]
      
      if (lastTouches && lastTouches.length === 1) {
        const deltaX = touch.clientX - lastTouches[0].clientX
        const deltaY = touch.clientY - lastTouches[0].clientY
        
        const vpt = canvas.viewportTransform!
        vpt[4] += deltaX
        vpt[5] += deltaY
        canvas.requestRenderAll()
      }
    }
    
    setLastTouches(e.e.touches)
  }, [isGestureMode, activeObject, lastTouches])

  // Touch end handler
  useEffect(() => {
    const handleTouchEnd = () => {
      setIsGestureMode(false)
      setGestureData(null)
      setLastTouches(null)
    }

    document.addEventListener('touchend', handleTouchEnd)
    return () => document.removeEventListener('touchend', handleTouchEnd)
  }, [])

  const saveCanvasState = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const state = JSON.stringify(canvas.toJSON())
    setUndoStack(prev => [...prev.slice(-19), state]) // Keep last 20 states
    setRedoStack([])
    
    // Notify parent of design change
    const dataUrl = canvas.toDataURL('image/png')
    onDesignChange?.(dataUrl)
  }, [onDesignChange])

  const loadDesignFromDataUrl = (dataUrl: string) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    fabric.Image.fromURL(dataUrl, (img) => {
      canvas.clear()
      img.scaleToWidth(width * 0.8)
      img.center()
      canvas.add(img)
      canvas.requestRenderAll()
    })
  }

  // Toolbar actions
  const addText = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const text = new fabric.Text('Tap to edit', {
      left: width / 2,
      top: height / 2,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      centeredScaling: true,
      originX: 'center',
      originY: 'center',
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.requestRenderAll()
  }

  const addShape = (type: 'rectangle' | 'circle') => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    let shape: fabric.Object

    if (type === 'rectangle') {
      shape = new fabric.Rect({
        left: width / 2,
        top: height / 2,
        width: 100,
        height: 100,
        fill: '#6366f1',
        originX: 'center',
        originY: 'center',
      })
    } else {
      shape = new fabric.Circle({
        left: width / 2,
        top: height / 2,
        radius: 50,
        fill: '#6366f1',
        originX: 'center',
        originY: 'center',
      })
    }

    canvas.add(shape)
    canvas.setActiveObject(shape)
    canvas.requestRenderAll()
  }

  const undo = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas || undoStack.length === 0) return

    const currentState = JSON.stringify(canvas.toJSON())
    setRedoStack(prev => [currentState, ...prev.slice(0, 19)])
    
    const previousState = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    
    canvas.loadFromJSON(previousState, () => {
      canvas.requestRenderAll()
    })
  }

  const redo = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas || redoStack.length === 0) return

    const currentState = JSON.stringify(canvas.toJSON())
    setUndoStack(prev => [...prev, currentState])
    
    const nextState = redoStack[0]
    setRedoStack(prev => prev.slice(1))
    
    canvas.loadFromJSON(nextState, () => {
      canvas.requestRenderAll()
    })
  }

  const zoomIn = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    
    const zoom = Math.min(canvas.getZoom() * 1.1, 3)
    canvas.setZoom(zoom)
    canvas.requestRenderAll()
  }

  const zoomOut = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    
    const zoom = Math.max(canvas.getZoom() * 0.9, 0.5)
    canvas.setZoom(zoom)
    canvas.requestRenderAll()
  }

  const resetView = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.setZoom(1)
    canvas.requestRenderAll()
  }

  const changeColor = (color: string) => {
    if (!activeObject) return
    
    activeObject.set('fill', color)
    fabricCanvasRef.current?.requestRenderAll()
  }

  const exportDesign = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2 // Higher resolution for mobile
    })
    
    // Create download link
    const link = document.createElement('a')
    link.download = 'tshop-design.png'
    link.href = dataUrl
    link.click()
  }

  const shareDesign = async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    
    if (navigator.share) {
      try {
        // Convert data URL to blob for native sharing
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const file = new File([blob], 'tshop-design.png', { type: 'image/png' })
        
        await navigator.share({
          title: 'My TShop Design',
          text: 'Check out my custom design created with TShop!',
          files: [file]
        })
      } catch (error) {
        console.log('Share failed:', error)
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(dataUrl)
        alert('Design copied to clipboard!')
      }
    }
  }

  // Auto-hide toolbar after inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    const resetTimer = () => {
      clearTimeout(timer)
      setShowToolbar(true)
      timer = setTimeout(() => setShowToolbar(false), 3000)
    }

    const handleTouch = () => resetTimer()
    
    document.addEventListener('touchstart', handleTouch)
    resetTimer()

    return () => {
      clearTimeout(timer)
      document.removeEventListener('touchstart', handleTouch)
    }
  }, [])

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-100">
      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 bg-white mx-auto block touch-none"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
        
        {/* Gesture Indicator */}
        {isGestureMode && (
          <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
            Gesture Mode
          </div>
        )}

        {/* Quick Actions (Floating) */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="p-2 bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo className="h-4 w-4 text-gray-700" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-2 bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo className="h-4 w-4 text-gray-700" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-20 right-4 flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="p-2 bg-white rounded-full shadow-lg"
          >
            <ZoomIn className="h-4 w-4 text-gray-700" />
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-white rounded-full shadow-lg"
          >
            <Move3D className="h-4 w-4 text-gray-700" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 bg-white rounded-full shadow-lg"
          >
            <ZoomOut className="h-4 w-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Mobile Toolbar */}
      <div className={`
        absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 
        transition-transform duration-300 ease-in-out
        ${showToolbar ? 'transform translate-y-0' : 'transform translate-y-full'}
      `}>
        <div className="flex justify-around items-center py-3 px-4">
          {/* Add Text */}
          <button
            onClick={addText}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100"
          >
            <Type className="h-6 w-6 text-gray-700" />
            <span className="text-xs text-gray-600">Text</span>
          </button>

          {/* Add Rectangle */}
          <button
            onClick={() => addShape('rectangle')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100"
          >
            <Square className="h-6 w-6 text-gray-700" />
            <span className="text-xs text-gray-600">Square</span>
          </button>

          {/* Add Circle */}
          <button
            onClick={() => addShape('circle')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100"
          >
            <Circle className="h-6 w-6 text-gray-700" />
            <span className="text-xs text-gray-600">Circle</span>
          </button>

          {/* Color Picker */}
          <div className="flex flex-col items-center space-y-1">
            <div className="relative">
              <Palette className="h-6 w-6 text-gray-700" />
              <input
                type="color"
                onChange={(e) => changeColor(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={!activeObject}
              />
            </div>
            <span className="text-xs text-gray-600">Color</span>
          </div>

          {/* Export */}
          <button
            onClick={exportDesign}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100"
          >
            <Download className="h-6 w-6 text-gray-700" />
            <span className="text-xs text-gray-600">Save</span>
          </button>

          {/* Share */}
          <button
            onClick={shareDesign}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100"
          >
            <Share2 className="h-6 w-6 text-gray-700" />
            <span className="text-xs text-gray-600">Share</span>
          </button>
        </div>
      </div>

      {/* Instructions Overlay */}
      <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm">
        👆 Pinch to zoom • Two fingers to rotate • Single tap to select • Long press for options
      </div>
    </div>
  )
}