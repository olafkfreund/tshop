'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductCategory } from '@/types'
import Header from '@/components/navigation/header'
import AIPromptForm from '@/components/design/ai-prompt-form'
import DesignPreview from '@/components/design/design-preview'
import TemplateGallery from '@/components/design/template-gallery'
import ProductConfigModal from '@/components/cart/product-config-modal'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { DesignTemplate } from '@/lib/design-templates'
import { Palette, Cpu, Zap, Sparkles } from 'lucide-react'

export default function DesignPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') as ProductCategory
  const [selectedProduct, setSelectedProduct] = useState<ProductCategory>(categoryParam || 'TSHIRT')
  
  // Update selected product when URL parameter changes
  useEffect(() => {
    if (categoryParam && categoryParam !== selectedProduct) {
      setSelectedProduct(categoryParam)
    }
  }, [categoryParam, selectedProduct])
  const [generatedDesign, setGeneratedDesign] = useState<{
    imageUrl: string
    designId?: string
    prompt?: string
    metadata?: any
  } | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  const handleDesignGenerated = (designData: any) => {
    setGeneratedDesign(designData)
  }

  const handleTemplateSelect = (template: DesignTemplate) => {
    // Generate design based on template
    setGeneratedDesign({
      imageUrl: template.imageUrl,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        style: template.style
      }
    })
  }

  const handleEditDesign = () => {
    if (!generatedDesign) return
    
    // Navigate to advanced editor with design data preserved
    const params = new URLSearchParams({
      category: selectedProduct,
      design: generatedDesign.imageUrl,
      prompt: generatedDesign.prompt || '',
    })
    
    if (generatedDesign.designId) {
      params.set('designId', generatedDesign.designId)
    }
    
    if (generatedDesign.metadata) {
      params.set('metadata', JSON.stringify(generatedDesign.metadata))
    }
    
    // Store design data in session storage for the editor to access
    sessionStorage.setItem('editingDesign', JSON.stringify({
      imageUrl: generatedDesign.imageUrl,
      designId: generatedDesign.designId,
      prompt: generatedDesign.prompt,
      productCategory: selectedProduct,
      metadata: generatedDesign.metadata
    }))
    
    window.open(`/editor?${params.toString()}`, '_blank')
  }

  const handleAddToCart = () => {
    if (!generatedDesign) return
    setShowProductModal(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4
                        sm:px-6
                        lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4
                          sm:text-5xl">
              AI-Powered Design Studio
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Create professional custom designs in seconds with our AI technology. 
              Just describe what you want and watch it come to life.
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 gap-6 mt-12
                            sm:grid-cols-3">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-4">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">AI-Generated</h3>
                <p className="text-sm opacity-80">Advanced AI creates unique designs based on your description</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Instant Results</h3>
                <p className="text-sm opacity-80">Get professional-quality designs in seconds, not hours</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-4">
                  <Palette className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Print-Ready</h3>
                <p className="text-sm opacity-80">Optimized for high-quality printing on all product types</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12
                      sm:px-6
                      lg:px-8">
        
        {/* Product Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
            Choose Your Product
          </h2>
          <div className="flex justify-center">
            <div className="inline-flex bg-card border rounded-lg p-1">
              {Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProduct(key as ProductCategory)}
                  className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
                    selectedProduct === key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Design Interface */}
        <div className="grid grid-cols-1 gap-8
                        lg:grid-cols-2">
          {/* AI Form */}
          <div>
            <AIPromptForm
              selectedProduct={selectedProduct}
              onGenerate={handleDesignGenerated}
            />
          </div>

          {/* Preview */}
          <div>
            {generatedDesign ? (
              <DesignPreview
                imageUrl={generatedDesign.imageUrl}
                productCategory={selectedProduct}
                designId={generatedDesign.designId}
                prompt={generatedDesign.prompt}
                onEdit={handleEditDesign}
                onAddToCart={handleAddToCart}
              />
            ) : (
              <div className="card p-8 text-center">
                <div className="mx-auto h-24 w-24 text-muted-foreground/30 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Your Design Will Appear Here
                </h3>
                <p className="text-muted-foreground">
                  Describe your design idea in the form to the left and click "Generate Design" to see your AI-created design preview.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Template Gallery */}
        <TemplateGallery
          selectedCategory={selectedProduct}
          onTemplateSelect={handleTemplateSelect}
          className="mt-12"
        />

        {/* Additional Info */}
        <div className="mt-16 bg-card rounded-lg p-8 border">
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-4">
              How AI Design Generation Works
            </h3>
            <div className="grid grid-cols-1 gap-6 mt-8
                            md:grid-cols-3">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full text-primary font-bold mb-3">
                  1
                </div>
                <h4 className="font-semibold mb-2 text-foreground">Describe Your Vision</h4>
                <p className="text-sm text-muted-foreground">
                  Tell our AI what you want - colors, themes, styles, or specific elements
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full text-primary font-bold mb-3">
                  2
                </div>
                <h4 className="font-semibold mb-2 text-foreground">AI Creates Design</h4>
                <p className="text-sm text-muted-foreground">
                  Advanced AI generates a unique design optimized for your chosen product
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full text-primary font-bold mb-3">
                  3
                </div>
                <h4 className="font-semibold mb-2 text-foreground">Customize & Order</h4>
                <p className="text-sm text-muted-foreground">
                  Edit if needed, preview on products, then add to cart for printing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Configuration Modal */}
      {showProductModal && generatedDesign && (
        <ProductConfigModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          design={{
            id: generatedDesign.designId || `design-${Date.now()}`,
            imageUrl: generatedDesign.imageUrl,
            prompt: generatedDesign.prompt
          }}
          productCategory={selectedProduct}
        />
      )}
    </div>
  )
}