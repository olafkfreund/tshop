'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductCategory } from '@prisma/client'
import Header from '@/components/navigation/header'
import dynamic from 'next/dynamic'

// Dynamically import canvas editor to avoid SSR issues with Fabric.js
const CanvasEditor = dynamic(
  () => import('@/components/design-editor/canvas-editor'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Design Editor...</p>
        </div>
      </div>
    )
  }
)

const ProductPreview3D = dynamic(
  () => import('@/components/3d-preview/product-preview-3d'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading 3D Preview...</div>
      </div>
    )
  }
)
import { PRODUCT_CATEGORIES, COLORS } from '@/lib/constants'
import { 
  Save, 
  Download, 
  Share2, 
  ShoppingCart, 
  Eye, 
  Edit3,
  Layers,
  Settings,
  ArrowLeft
} from 'lucide-react'

export default function EditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [productCategory, setProductCategory] = useState<ProductCategory>('TSHIRT')
  const [selectedColor, setSelectedColor] = useState('#FFFFFF')
  const [designDataUrl, setDesignDataUrl] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load initial data from URL params and session storage
  useEffect(() => {
    const category = searchParams?.get('category') as ProductCategory
    const color = searchParams?.get('color')
    const templateId = searchParams?.get('template')
    const designParam = searchParams?.get('design')
    
    if (category && Object.keys(PRODUCT_CATEGORIES).includes(category)) {
      setProductCategory(category)
    }
    
    if (color) {
      setSelectedColor(color)
    }
    
    // Check for AI design data from session storage
    const storedDesign = sessionStorage.getItem('editingDesign')
    if (storedDesign) {
      try {
        const designData = JSON.parse(storedDesign)
        console.log('Loading AI design for editing:', designData)
        
        // Set initial design image
        if (designData.imageUrl) {
          setDesignDataUrl(designData.imageUrl)
        }
        
        // Clear session storage after loading
        sessionStorage.removeItem('editingDesign')
      } catch (error) {
        console.error('Error loading design from session storage:', error)
      }
    } else if (designParam) {
      // Load design from URL parameter
      setDesignDataUrl(designParam)
    }
    
    if (templateId) {
      // Load template design
      loadTemplateDesign(templateId)
    }
  }, [searchParams])

  const loadTemplateDesign = async (templateId: string) => {
    try {
      const response = await fetch(`/api/designs/${templateId}`)
      const data = await response.json()
      
      if (data.success) {
        // Template loading logic would go here
        console.log('Loading template:', data.data)
      }
    } catch (error) {
      console.error('Error loading template:', error)
    }
  }

  const handleDesignChange = (dataURL: string) => {
    setDesignDataUrl(dataURL)
  }

  const handleSaveDesign = async () => {
    if (!designDataUrl) {
      alert('No design to save')
      return
    }

    setIsSaving(true)
    try {
      // First upload canvas image to Cloudinary
      const uploadResponse = await fetch('/api/upload/canvas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataUrl: designDataUrl,
          designName: `${productCategory.toLowerCase()}-design`,
        }),
      })

      const uploadData = await uploadResponse.json()
      
      if (!uploadData.success) {
        throw new Error(uploadData.error)
      }

      // Then save design with Cloudinary URL
      const saveResponse = await fetch('/api/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Custom ${PRODUCT_CATEGORIES[productCategory]} Design`,
          description: `Custom design created with the TShop editor`,
          imageUrl: uploadData.data.imageUrl,
          category: 'GRAPHIC',
          tags: [productCategory.toLowerCase(), 'custom', 'editor-created'],
          isPublic: false,
        }),
      })

      const saveData = await saveResponse.json()
      
      if (saveData.success) {
        alert('Design saved successfully!')
      } else {
        alert(saveData.error || 'Failed to save design')
      }
    } catch (error) {
      console.error('Error saving design:', error)
      alert('Error saving design')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadDesign = () => {
    if (!designDataUrl) {
      alert('No design to download')
      return
    }

    const link = document.createElement('a')
    link.href = designDataUrl
    link.download = `tshop-design-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAddToCart = () => {
    if (!designDataUrl) {
      alert('Please create a design first')
      return
    }
    
    // Add to cart logic
    alert('Add to cart functionality coming soon!')
  }

  const handleShareDesign = () => {
    if (navigator.share && designDataUrl) {
      navigator.share({
        title: 'Check out my custom design!',
        text: 'I created this design with TShop AI-powered design tools',
        url: window.location.href,
      })
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Editor Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4
                        sm:px-6
                        lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <h1 className="text-xl font-bold text-gray-900">
                Design Editor
              </h1>
              
              <span className="text-sm text-gray-600">
                {PRODUCT_CATEGORIES[productCategory]}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`btn-ghost text-sm px-3 py-2 ${showPreview ? 'bg-primary-50 text-primary-700' : ''}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              
              <button
                onClick={handleSaveDesign}
                disabled={isSaving || !designDataUrl}
                className="btn-secondary text-sm px-3 py-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              
              <button
                onClick={handleDownloadDesign}
                disabled={!designDataUrl}
                className="btn-ghost text-sm px-3 py-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              
              <button
                onClick={handleShareDesign}
                disabled={!designDataUrl}
                className="btn-ghost text-sm px-3 py-2 disabled:opacity-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
              
              <button
                onClick={handleAddToCart}
                disabled={!designDataUrl}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left Panel - Product Selection */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            
            {/* Product Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value as ProductCategory)}
                className="input text-sm"
              >
                {Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.slice(0, 8).map((color) => (
                  <button
                    key={color.slug}
                    onClick={() => setSelectedColor(color.hex)}
                    className={`w-12 h-12 rounded-lg border-2 hover:scale-105 transition-transform ${
                      selectedColor === color.hex ? 'border-primary-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button className="w-full btn-ghost text-sm py-2 px-3 justify-start">
                <Layers className="h-4 w-4 mr-2" />
                Layers
              </button>
              <button className="w-full btn-ghost text-sm py-2 px-3 justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Center - Canvas Editor */}
        <div className="flex-1">
          <CanvasEditor
            productCategory={productCategory}
            initialDesign={designDataUrl}
            onDesignChange={handleDesignChange}
          />
        </div>

        {/* Right Panel - 3D Preview */}
        {showPreview && (
          <div className="w-80 bg-white border-l">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">3D Preview</h3>
              <p className="text-sm text-gray-600 mt-1">
                See how your design looks on the product
              </p>
            </div>
            <div className="p-4">
              <ProductPreview3D
                productCategory={productCategory}
                designImageUrl={designDataUrl}
                selectedColor={selectedColor}
                className="h-80"
              />
            </div>
            
            {/* Preview Controls */}
            <div className="p-4 border-t">
              <div className="space-y-2">
                <button className="w-full btn-secondary text-sm py-2">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Customize Product
                </button>
                <button className="w-full btn-primary text-sm py-2">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}