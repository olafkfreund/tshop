'use client'

import { useEffect, useRef, useState } from 'react'
import { DesignEditorService } from '@/lib/design-editor/fabric-service'
import { 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Image, 
  Trash2, 
  Undo, 
  Redo,
  Download,
  Upload,
  Save,
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff
} from 'lucide-react'
import { FONT_FAMILIES, FONT_SIZES, TEXT_ALIGNMENTS } from '@/lib/constants'

interface CanvasEditorProps {
  productType: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
  initialDesign?: string
  aiImageUrl?: string
  onSave?: (designData: string, imageData: string) => void
}

export default function CanvasEditor({ 
  productType, 
  initialDesign, 
  aiImageUrl,
  onSave 
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editorServiceRef = useRef<DesignEditorService | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [activeProperties, setActiveProperties] = useState<any>(null)
  const [textInput, setTextInput] = useState('')
  const [fillColor, setFillColor] = useState('#000000')
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [showCompanyLogo, setShowCompanyLogo] = useState(true)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize the design editor
    const editorService = new DesignEditorService()
    editorService.initialize(canvasRef.current, productType)
    editorServiceRef.current = editorService

    // Load initial design if provided
    if (initialDesign) {
      editorService.loadDesign(initialDesign)
    }

    // Load AI image if provided
    if (aiImageUrl) {
      console.log('Loading AI design with URL:', aiImageUrl)
      editorService.loadAIDesign(aiImageUrl)
    } else {
      console.log('No aiImageUrl provided')
    }

    // Set up property update listener
    const updateProperties = () => {
      const props = editorService.getActiveObjectProperties()
      setActiveProperties(props)
      if (props) {
        setFillColor(props.fill || '#000000')
        if (props.fontSize) setFontSize(props.fontSize)
        if (props.fontFamily) setFontFamily(props.fontFamily)
      }
    }

    // Listen for selection changes
    const canvas = (editorService as any).canvas
    if (canvas) {
      canvas.on('selection:created', updateProperties)
      canvas.on('selection:updated', updateProperties)
      canvas.on('selection:cleared', () => setActiveProperties(null))
    }

    return () => {
      editorService.destroy()
    }
  }, [productType, initialDesign, aiImageUrl])

  const handleAddText = () => {
    if (textInput && editorServiceRef.current) {
      editorServiceRef.current.addText(textInput, {
        fontSize,
        fontFamily,
        fill: fillColor
      })
      setTextInput('')
    }
  }

  const handleAddShape = (shapeType: 'rect' | 'circle' | 'triangle') => {
    if (editorServiceRef.current) {
      editorServiceRef.current.addShape(shapeType, {
        fill: fillColor
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editorServiceRef.current) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          editorServiceRef.current?.addImage(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleColorChange = (color: string) => {
    setFillColor(color)
    if (editorServiceRef.current) {
      editorServiceRef.current.updateActiveObject({ fill: color })
    }
  }

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    if (editorServiceRef.current) {
      editorServiceRef.current.updateActiveObject({ fontSize: size })
    }
  }

  const handleSave = () => {
    if (editorServiceRef.current && onSave) {
      const designData = editorServiceRef.current.exportDesign()
      const imageData = editorServiceRef.current.exportAsImage('png')
      onSave(designData, imageData)
    }
  }

  const handleExport = () => {
    if (editorServiceRef.current) {
      const imageData = editorServiceRef.current.exportAsImage('png')
      const link = document.createElement('a')
      link.download = `design-${productType.toLowerCase()}-${Date.now()}.png`
      link.href = imageData
      link.click()
    }
  }

  return (
    <div className="flex h-[700px] bg-gray-50 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="w-20 bg-white border-r p-2 flex flex-col items-center space-y-2">
        <button
          onClick={() => setSelectedTool('text')}
          className={`p-3 rounded-lg hover:bg-gray-100 transition-colors ${
            selectedTool === 'text' ? 'bg-indigo-100 text-indigo-600' : ''
          }`}
          title="Add Text"
        >
          <Type className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => handleAddShape('rect')}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
          title="Add Rectangle"
        >
          <Square className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => handleAddShape('circle')}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
          title="Add Circle"
        >
          <Circle className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => handleAddShape('triangle')}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
          title="Add Triangle"
        >
          <Triangle className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
          title="Upload Image"
        >
          <Image className="h-5 w-5" />
        </button>
        
        <div className="h-px bg-gray-200 w-full my-2" />
        
        <button
          onClick={() => editorServiceRef.current?.undo()}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
          title="Undo"
        >
          <Undo className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => editorServiceRef.current?.redo()}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
          title="Redo"
        >
          <Redo className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => editorServiceRef.current?.deleteSelected()}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors text-red-500"
          title="Delete Selected"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        
        <div className="h-px bg-gray-200 w-full my-2" />
        
        <button
          onClick={() => {
            setShowCompanyLogo(!showCompanyLogo)
            editorServiceRef.current?.toggleCompanyLogo()
          }}
          className={`p-3 rounded-lg transition-colors ${
            showCompanyLogo 
              ? 'bg-indigo-100 text-indigo-600' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Toggle Company Logo"
        >
          {showCompanyLogo ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
        
        <div className="flex-1" />
        
        <button
          onClick={handleExport}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
          title="Export Design"
        >
          <Download className="h-5 w-5" />
        </button>
        
        <button
          onClick={handleSave}
          className="p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          title="Save Design"
        >
          <Save className="h-5 w-5" />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg p-4">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-white border-l p-4">
        <h3 className="text-lg font-semibold mb-4">Properties</h3>
        
        {selectedTool === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text
              </label>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter text..."
              />
            </div>
            
            <button
              onClick={handleAddText}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Text
            </button>
          </div>
        )}
        
        {activeProperties && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fill Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-10 w-20 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={fillColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            {activeProperties.type === 'i-text' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={fontSize}
                      onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    >
                      {FONT_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}px
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                      className="w-20 px-2 py-2 border rounded-lg text-sm"
                      min="8"
                      max="120"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => {
                      setFontFamily(e.target.value)
                      editorServiceRef.current?.updateActiveObject({ fontFamily: e.target.value })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font.name} value={font.family}>
                        {font.name} ({font.category})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Alignment
                  </label>
                  <div className="flex space-x-1">
                    {TEXT_ALIGNMENTS.map((alignment) => (
                      <button
                        key={alignment.value}
                        onClick={() => {
                          editorServiceRef.current?.updateActiveObject({ 
                            textAlign: alignment.value as any 
                          })
                        }}
                        className="flex items-center justify-center px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                        title={alignment.label}
                      >
                        {alignment.value === 'left' && <AlignLeft className="h-4 w-4" />}
                        {alignment.value === 'center' && <AlignCenter className="h-4 w-4" />}
                        {alignment.value === 'right' && <AlignRight className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opacity
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={(activeProperties.opacity || 1) * 100}
                onChange={(e) => {
                  editorServiceRef.current?.updateActiveObject({ 
                    opacity: Number(e.target.value) / 100 
                  })
                }}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layer Order
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => editorServiceRef.current?.bringToFront()}
                  className="flex items-center justify-center px-3 py-2 border rounded-lg hover:bg-gray-50"
                  title="Bring to Front"
                >
                  <ChevronsUp className="h-4 w-4 mr-1" />
                  Front
                </button>
                <button
                  onClick={() => editorServiceRef.current?.sendToBack()}
                  className="flex items-center justify-center px-3 py-2 border rounded-lg hover:bg-gray-50"
                  title="Send to Back"
                >
                  <ChevronsDown className="h-4 w-4 mr-1" />
                  Back
                </button>
                <button
                  onClick={() => editorServiceRef.current?.bringForward()}
                  className="flex items-center justify-center px-3 py-2 border rounded-lg hover:bg-gray-50"
                  title="Bring Forward"
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Forward
                </button>
                <button
                  onClick={() => editorServiceRef.current?.sendBackward()}
                  className="flex items-center justify-center px-3 py-2 border rounded-lg hover:bg-gray-50"
                  title="Send Backward"
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Backward
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!selectedTool && !activeProperties && (
          <p className="text-gray-500 text-sm">
            Select a tool or click on an object to edit its properties
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  )
}