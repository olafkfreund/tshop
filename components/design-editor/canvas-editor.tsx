'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ProductCategory } from '@prisma/client'
import { DesignCanvas } from '@/lib/design-editor/canvas'
import { fabric } from 'fabric'
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Triangle,
  Trash2,
  Copy,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react'

interface CanvasEditorProps {
  productCategory: ProductCategory
  initialDesign?: string
  onDesignChange?: (dataURL: string) => void
}

interface ActiveObjectProperties {
  left?: number
  top?: number
  scaleX?: number
  scaleY?: number
  angle?: number
  fill?: string
  fontSize?: number
  fontFamily?: string
  text?: string
  visible?: boolean
}

export default function CanvasEditor({ 
  productCategory, 
  initialDesign,
  onDesignChange 
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const designCanvasRef = useRef<DesignCanvas | null>(null)
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null)
  const [zoom, setZoom] = useState(1)
  const [selectedTool, setSelectedTool] = useState<string>('')

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !designCanvasRef.current) {
      designCanvasRef.current = new DesignCanvas(canvasRef.current, productCategory)
      
      const canvas = designCanvasRef.current.getCanvas()
      if (canvas) {
        // Set up selection events
        canvas.on('selection:created', (e) => {
          setActiveObject(e.selected?.[0] || null)
        })
        
        canvas.on('selection:updated', (e) => {
          setActiveObject(e.selected?.[0] || null)
        })
        
        canvas.on('selection:cleared', () => {
          setActiveObject(null)
        })

        // Set up change events
        canvas.on('object:modified', () => {
          if (onDesignChange && designCanvasRef.current) {
            const dataURL = designCanvasRef.current.toDataURL()
            onDesignChange(dataURL)
          }
        })
      }

      // Load initial design if provided
      if (initialDesign) {
        // Load initial design logic here
      }
    }

    return () => {
      if (designCanvasRef.current) {
        designCanvasRef.current.dispose()
        designCanvasRef.current = null
      }
    }
  }, [productCategory, initialDesign, onDesignChange])

  // Tool handlers
  const addText = () => {
    if (designCanvasRef.current) {
      designCanvasRef.current.addText('Your Text Here')
      setSelectedTool('')
    }
  }

  const addShape = (type: 'rect' | 'circle' | 'triangle') => {
    if (designCanvasRef.current) {
      designCanvasRef.current.addShape(type)
      setSelectedTool('')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !designCanvasRef.current) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      designCanvasRef.current?.addImage(imageUrl)
    }
    reader.readAsDataURL(file)
    setSelectedTool('')
  }

  const deleteSelected = () => {
    if (designCanvasRef.current) {
      designCanvasRef.current.deleteSelected()
    }
  }

  const duplicateSelected = () => {
    if (designCanvasRef.current) {
      designCanvasRef.current.duplicateSelected()
    }
  }

  const undo = () => {
    if (designCanvasRef.current) {
      designCanvasRef.current.undo()
    }
  }

  const redo = () => {
    if (designCanvasRef.current) {
      designCanvasRef.current.redo()
    }
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.1, 3)
    setZoom(newZoom)
    designCanvasRef.current?.setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom * 0.9, 0.1)
    setZoom(newZoom)
    designCanvasRef.current?.setZoom(newZoom)
  }

  const moveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!designCanvasRef.current) return
    
    switch (direction) {
      case 'up':
        designCanvasRef.current.moveObjectUp()
        break
      case 'down':
        designCanvasRef.current.moveObjectDown()
        break
      case 'top':
        designCanvasRef.current.moveObjectToFront()
        break
      case 'bottom':
        designCanvasRef.current.moveObjectToBack()
        break
    }
  }

  // Update object properties
  const updateObjectProperty = (property: string, value: any) => {
    if (!activeObject || !designCanvasRef.current) return

    if (property === 'text' && activeObject.type === 'text') {
      designCanvasRef.current.updateText(activeObject as fabric.Text, { text: value })
    } else {
      activeObject.set(property, value)
      designCanvasRef.current.getCanvas()?.renderAll()
    }

    if (onDesignChange) {
      const dataURL = designCanvasRef.current.toDataURL()
      onDesignChange(dataURL)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-white border-b">
        {/* Add Tools */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button
            onClick={addText}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Add Text"
          >
            <Type className="h-4 w-4" />
          </button>
          
          <label className="p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer" title="Add Image">
            <ImageIcon className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          
          <button
            onClick={() => addShape('rect')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Add Rectangle"
          >
            <Square className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => addShape('circle')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Add Circle"
          >
            <Circle className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => addShape('triangle')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Add Triangle"
          >
            <Triangle className="h-4 w-4" />
          </button>
        </div>

        {/* Edit Tools */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button
            onClick={undo}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Undo"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          
          <button
            onClick={redo}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Redo"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={duplicateSelected}
            disabled={!activeObject}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          <button
            onClick={deleteSelected}
            disabled={!activeObject}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Layer Tools */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button
            onClick={() => moveLayer('up')}
            disabled={!activeObject}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Bring Forward"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => moveLayer('down')}
            disabled={!activeObject}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send Backward"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <span className="text-sm text-gray-600 px-2">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Properties Panel */}
        {activeObject && (
          <div className="w-80 bg-white border-l p-4 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-4">Properties</h3>
            
            {/* Object Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <p className="text-sm text-gray-600 capitalize">{activeObject.type}</p>
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  X Position
                </label>
                <input
                  type="number"
                  value={Math.round(activeObject.left || 0)}
                  onChange={(e) => updateObjectProperty('left', parseInt(e.target.value))}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Y Position
                </label>
                <input
                  type="number"
                  value={Math.round(activeObject.top || 0)}
                  onChange={(e) => updateObjectProperty('top', parseInt(e.target.value))}
                  className="input text-sm"
                />
              </div>
            </div>

            {/* Rotation */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rotation
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={activeObject.angle || 0}
                onChange={(e) => updateObjectProperty('angle', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Text Properties */}
            {activeObject.type === 'text' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text
                  </label>
                  <textarea
                    value={(activeObject as any).text || ''}
                    onChange={(e) => updateObjectProperty('text', e.target.value)}
                    className="input text-sm"
                    rows={3}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={(activeObject as any).fontSize || 24}
                    onChange={(e) => updateObjectProperty('fontSize', parseInt(e.target.value))}
                    className="input text-sm"
                    min="8"
                    max="200"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Family
                  </label>
                  <select
                    value={(activeObject as any).fontFamily || 'Arial'}
                    onChange={(e) => updateObjectProperty('fontFamily', e.target.value)}
                    className="input text-sm"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Impact">Impact</option>
                  </select>
                </div>
              </>
            )}

            {/* Fill Color */}
            {activeObject.type !== 'image' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fill Color
                </label>
                <input
                  type="color"
                  value={(activeObject as any).fill || '#000000'}
                  onChange={(e) => updateObjectProperty('fill', e.target.value)}
                  className="w-full h-10 border rounded-md cursor-pointer"
                />
              </div>
            )}

            {/* Visibility */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={activeObject.visible !== false}
                  onChange={(e) => updateObjectProperty('visible', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Visible</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}