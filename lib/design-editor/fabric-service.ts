import * as fabric from 'fabric'
import { COMPANY_BRANDING } from '@/lib/constants'

export interface DesignCanvas {
  canvas: fabric.Canvas
  productType: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
  currentDesign: any
}

export class DesignEditorService {
  private canvas: fabric.Canvas | null = null
  private productType: 'TSHIRT' | 'CAP' | 'TOTE_BAG' = 'TSHIRT'
  private history: string[] = []
  private historyIndex: number = -1
  private maxHistory: number = 50

  // Product-specific canvas dimensions
  private readonly canvasDimensions = {
    TSHIRT: { width: 400, height: 500 },
    CAP: { width: 350, height: 200 },
    TOTE_BAG: { width: 350, height: 400 }
  }

  // Product-specific design constraints
  private readonly designConstraints = {
    TSHIRT: {
      maxWidth: 300,
      maxHeight: 350,
      centerX: 200,
      centerY: 250
    },
    CAP: {
      maxWidth: 200,
      maxHeight: 100,
      centerX: 175,
      centerY: 100
    },
    TOTE_BAG: {
      maxWidth: 250,
      maxHeight: 300,
      centerX: 175,
      centerY: 200
    }
  }

  initialize(canvasElement: HTMLCanvasElement, productType: 'TSHIRT' | 'CAP' | 'TOTE_BAG' = 'TSHIRT') {
    this.productType = productType
    const dimensions = this.canvasDimensions[productType]
    
    this.canvas = new fabric.Canvas(canvasElement, {
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true
    })

    // Add grid for guidance
    this.addDesignArea()
    
    // Add company logo
    this.addCompanyLogo()
    
    // Set up event listeners
    this.setupEventListeners()
    
    // Save initial state
    this.saveToHistory()
    
    return this.canvas
  }

  private addDesignArea() {
    if (!this.canvas) return
    
    const constraints = this.designConstraints[this.productType]
    
    // Add a visual guide for the printable area (not selectable)
    const designArea = new fabric.Rect({
      left: constraints.centerX - constraints.maxWidth / 2,
      top: constraints.centerY - constraints.maxHeight / 2,
      width: constraints.maxWidth,
      height: constraints.maxHeight,
      fill: 'transparent',
      stroke: '#e0e0e0',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true
    })
    
    this.canvas.add(designArea)
    this.canvas.sendObjectToBack(designArea)
  }

  private setupEventListeners() {
    if (!this.canvas) return
    
    this.canvas.on('object:modified', () => {
      this.saveToHistory()
      this.enforceConstraints()
    })
    
    this.canvas.on('object:added', () => {
      this.saveToHistory()
    })
    
    this.canvas.on('object:removed', () => {
      this.saveToHistory()
    })
  }

  private enforceConstraints() {
    if (!this.canvas) return
    
    const constraints = this.designConstraints[this.productType]
    
    this.canvas.getObjects().forEach(obj => {
      // Skip the design area guide
      if (obj.excludeFromExport) return
      
      // Enforce size constraints
      if (obj.width && obj.width * (obj.scaleX || 1) > constraints.maxWidth) {
        obj.scaleX = constraints.maxWidth / obj.width
      }
      if (obj.height && obj.height * (obj.scaleY || 1) > constraints.maxHeight) {
        obj.scaleY = constraints.maxHeight / obj.height
      }
      
      // Keep objects within design area
      const boundingRect = obj.getBoundingRect()
      const designLeft = constraints.centerX - constraints.maxWidth / 2
      const designTop = constraints.centerY - constraints.maxHeight / 2
      const designRight = constraints.centerX + constraints.maxWidth / 2
      const designBottom = constraints.centerY + constraints.maxHeight / 2
      
      if (boundingRect.left < designLeft) {
        obj.left = designLeft + (obj.left - boundingRect.left)
      }
      if (boundingRect.top < designTop) {
        obj.top = designTop + (obj.top - boundingRect.top)
      }
      if (boundingRect.left + boundingRect.width > designRight) {
        obj.left = designRight - boundingRect.width + (obj.left - boundingRect.left)
      }
      if (boundingRect.top + boundingRect.height > designBottom) {
        obj.top = designBottom - boundingRect.height + (obj.top - boundingRect.top)
      }
      
      obj.setCoords()
    })
    
    this.canvas.renderAll()
  }

  // Text operations
  addText(text: string, options?: fabric.ITextOptions) {
    if (!this.canvas) return
    
    const constraints = this.designConstraints[this.productType]
    
    const textObj = new fabric.IText(text, {
      left: constraints.centerX,
      top: constraints.centerY,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      originX: 'center',
      originY: 'center',
      ...options
    })
    
    this.canvas.add(textObj)
    this.canvas.setActiveObject(textObj)
    this.canvas.renderAll()
  }

  // Image operations
  addImage(imageUrl: string, options?: fabric.IImageOptions) {
    if (!this.canvas) return
    
    console.log('DesignEditorService: Adding image from URL:', imageUrl)
    const constraints = this.designConstraints[this.productType]
    
    fabric.Image.fromURL(
      imageUrl, 
      (img) => {
        console.log('DesignEditorService: Image loaded successfully:', img.width, 'x', img.height)
        // Scale image to fit within constraints
        const scale = Math.min(
          constraints.maxWidth / (img.width || 1),
          constraints.maxHeight / (img.height || 1),
          1 // Don't scale up
        )
        
        img.set({
          left: constraints.centerX,
          top: constraints.centerY,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          ...options
        })
        
        if (this.canvas) {
          this.canvas.add(img)
          this.canvas.setActiveObject(img)
          this.canvas.renderAll()
          console.log('DesignEditorService: Image added to canvas')
        } else {
          console.error('DesignEditorService: No canvas available when trying to add image')
        }
      }, 
      { crossOrigin: 'anonymous' }
    ).catch((error: any) => {
      console.error('DesignEditorService: Failed to load image from URL:', imageUrl, error)
    })
  }

  // Shape operations
  addShape(shapeType: 'rect' | 'circle' | 'triangle', options?: fabric.IShapeOptions) {
    if (!this.canvas) return
    
    const constraints = this.designConstraints[this.productType]
    let shape: fabric.Object
    
    const defaultOptions = {
      left: constraints.centerX,
      top: constraints.centerY,
      fill: '#333333',
      originX: 'center' as const,
      originY: 'center' as const
    }
    
    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({
          width: 100,
          height: 100,
          ...defaultOptions,
          ...options
        })
        break
      case 'circle':
        shape = new fabric.Circle({
          radius: 50,
          ...defaultOptions,
          ...options
        })
        break
      case 'triangle':
        shape = new fabric.Triangle({
          width: 100,
          height: 100,
          ...defaultOptions,
          ...options
        })
        break
    }
    
    this.canvas.add(shape)
    this.canvas.setActiveObject(shape)
    this.canvas.renderAll()
  }

  // Layer management
  bringForward() {
    if (!this.canvas) return
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      this.canvas.bringForward(activeObject)
      this.canvas.renderAll()
    }
  }

  sendBackward() {
    if (!this.canvas) return
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      this.canvas.sendBackwards(activeObject)
      this.canvas.renderAll()
    }
  }

  bringToFront() {
    if (!this.canvas) return
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      this.canvas.bringObjectToFront(activeObject)
      this.canvas.renderAll()
    }
  }

  sendToBack() {
    if (!this.canvas) return
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      this.canvas.sendObjectToBack(activeObject)
      // Make sure design area stays at back
      const designArea = this.canvas.getObjects().find(obj => obj.excludeFromExport)
      if (designArea) {
        this.canvas.sendObjectToBack(designArea)
      }
      this.canvas.renderAll()
    }
  }

  // Selection operations
  deleteSelected() {
    if (!this.canvas) return
    const activeObject = this.canvas.getActiveObject()
    if (activeObject && !activeObject.excludeFromExport) {
      this.canvas.remove(activeObject)
      this.canvas.renderAll()
    }
  }

  selectAll() {
    if (!this.canvas) return
    const objects = this.canvas.getObjects().filter(obj => !obj.excludeFromExport)
    if (objects.length > 0) {
      const selection = new fabric.ActiveSelection(objects, { canvas: this.canvas })
      this.canvas.setActiveObject(selection)
      this.canvas.renderAll()
    }
  }

  deselectAll() {
    if (!this.canvas) return
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
  }

  // History management
  private saveToHistory() {
    if (!this.canvas) return
    
    const currentState = JSON.stringify(this.canvas.toJSON(['excludeFromExport']))
    
    // Remove any states after current index
    this.history = this.history.slice(0, this.historyIndex + 1)
    
    // Add new state
    this.history.push(currentState)
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
  }

  undo() {
    if (!this.canvas || this.historyIndex <= 0) return
    
    this.historyIndex--
    const state = this.history[this.historyIndex]
    
    this.canvas.loadFromJSON(state, () => {
      this.canvas?.renderAll()
    })
  }

  redo() {
    if (!this.canvas || this.historyIndex >= this.history.length - 1) return
    
    this.historyIndex++
    const state = this.history[this.historyIndex]
    
    this.canvas.loadFromJSON(state, () => {
      this.canvas?.renderAll()
    })
  }

  // Export operations
  exportDesign(): string {
    if (!this.canvas) return '{}'
    
    // Filter out guide elements
    const objects = this.canvas.getObjects().filter(obj => !obj.excludeFromExport)
    const exportData = {
      version: '1.0',
      productType: this.productType,
      objects: objects.map(obj => obj.toJSON()),
      background: this.canvas.backgroundColor
    }
    
    return JSON.stringify(exportData)
  }

  exportAsImage(format: 'png' | 'jpeg' = 'png', quality: number = 1): string {
    if (!this.canvas) return ''
    
    // Hide guide elements temporarily
    const guides = this.canvas.getObjects().filter(obj => obj.excludeFromExport)
    guides.forEach(guide => guide.set('visible', false))
    
    const dataURL = this.canvas.toDataURL({
      format,
      quality,
      multiplier: 2 // Higher resolution
    })
    
    // Show guides again
    guides.forEach(guide => guide.set('visible', true))
    this.canvas.renderAll()
    
    return dataURL
  }

  loadDesign(designData: string) {
    if (!this.canvas) return
    
    try {
      const data = JSON.parse(designData)
      
      // Clear canvas except guides
      const guides = this.canvas.getObjects().filter(obj => obj.excludeFromExport)
      this.canvas.clear()
      guides.forEach(guide => this.canvas?.add(guide))
      
      // Load objects
      if (data.objects) {
        data.objects.forEach((objData: any) => {
          fabric.util.enlivenObjects([objData], (objects: fabric.Object[]) => {
            objects.forEach(obj => this.canvas?.add(obj))
          })
        })
      }
      
      this.canvas.renderAll()
      this.saveToHistory()
    } catch (error) {
      console.error('Failed to load design:', error)
    }
  }

  // AI design integration
  loadAIDesign(imageUrl: string) {
    if (!this.canvas) return
    
    // Clear existing design
    const guides = this.canvas.getObjects().filter(obj => obj.excludeFromExport)
    this.canvas.clear()
    guides.forEach(guide => this.canvas?.add(guide))
    
    // Add AI-generated image
    this.addImage(imageUrl, {
      selectable: true,
      hasControls: true,
      hasBorders: true
    })
    
    // Automatically add company logo
    this.addCompanyLogo()
  }

  // Company logo placement system
  addCompanyLogo() {
    if (!this.canvas) return
    
    const logoConfig = COMPANY_BRANDING.logo
    const placement = logoConfig.placement[this.productType]
    
    if (!placement || !placement.back) return
    
    console.log('Adding company logo for product type:', this.productType)
    
    fabric.Image.fromURL(
      logoConfig.url,
      (logoImg) => {
        if (!logoImg || !this.canvas) return
        
        const canvasDimensions = this.canvasDimensions[this.productType]
        const logoPlacement = placement.back
        
        // Calculate position based on placement configuration
        let left: number
        let top: number
        
        // Handle X positioning
        if (logoPlacement.x === 'center') {
          left = canvasDimensions.width / 2
        } else if (logoPlacement.x === 'left') {
          left = logoPlacement.width / 2 + 20 // 20px padding
        } else if (logoPlacement.x === 'right') {
          left = canvasDimensions.width - logoPlacement.width / 2 - 20
        } else {
          left = canvasDimensions.width / 2 // default to center
        }
        
        // Handle Y positioning
        if (logoPlacement.y === 'top') {
          top = logoPlacement.height / 2 + (logoPlacement.offsetY || 0)
        } else if (logoPlacement.y === 'center') {
          top = canvasDimensions.height / 2
        } else if (logoPlacement.y === 'bottom') {
          top = canvasDimensions.height - logoPlacement.height / 2 + (logoPlacement.offsetY || 0)
        } else {
          top = canvasDimensions.height / 2 // default to center
        }
        
        // Scale logo to specified dimensions
        const scaleX = logoPlacement.width / (logoImg.width || 1)
        const scaleY = logoPlacement.height / (logoImg.height || 1)
        const scale = Math.min(scaleX, scaleY) // Maintain aspect ratio
        
        logoImg.set({
          left,
          top,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          selectable: false, // Company logo should not be user-editable
          evented: false,
          excludeFromExport: false, // Include in final design export
          opacity: 0.8, // Subtle presence
          isCompanyLogo: true // Custom property for identification
        } as any)
        
        this.canvas?.add(logoImg)
        this.canvas?.sendObjectToBack(logoImg)
        
        // Ensure design area guide stays at back
        const designArea = this.canvas?.getObjects().find(obj => obj.excludeFromExport)
        if (designArea) {
          this.canvas?.sendObjectToBack(designArea)
        }
        
        this.canvas?.renderAll()
        console.log('Company logo added successfully')
      },
      { crossOrigin: 'anonymous' }
    ).catch((error: any) => {
      console.error('Failed to load company logo:', logoConfig.url, error)
    })
  }

  // Remove company logo (for editing modes)
  removeCompanyLogo() {
    if (!this.canvas) return
    
    const companyLogo = this.canvas.getObjects().find(obj => (obj as any).isCompanyLogo)
    if (companyLogo) {
      this.canvas.remove(companyLogo)
      this.canvas.renderAll()
      console.log('Company logo removed')
    }
  }

  // Toggle company logo visibility
  toggleCompanyLogo() {
    if (!this.canvas) return
    
    const companyLogo = this.canvas.getObjects().find(obj => (obj as any).isCompanyLogo)
    if (companyLogo) {
      companyLogo.set('visible', !companyLogo.visible)
      this.canvas.renderAll()
    }
  }

  // Update active object properties
  updateActiveObject(properties: Partial<fabric.Object>) {
    if (!this.canvas) return
    
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      activeObject.set(properties)
      this.canvas.renderAll()
      this.saveToHistory()
    }
  }

  // Get active object properties
  getActiveObjectProperties() {
    if (!this.canvas) return null
    
    const activeObject = this.canvas.getActiveObject()
    if (!activeObject) return null
    
    return {
      type: activeObject.type,
      fill: activeObject.fill,
      stroke: activeObject.stroke,
      strokeWidth: activeObject.strokeWidth,
      opacity: activeObject.opacity,
      angle: activeObject.angle,
      scaleX: activeObject.scaleX,
      scaleY: activeObject.scaleY,
      left: activeObject.left,
      top: activeObject.top,
      fontSize: (activeObject as any).fontSize,
      fontFamily: (activeObject as any).fontFamily,
      text: (activeObject as any).text
    }
  }

  // Clean up
  destroy() {
    if (this.canvas) {
      this.canvas.dispose()
      this.canvas = null
    }
    this.history = []
    this.historyIndex = -1
  }
}