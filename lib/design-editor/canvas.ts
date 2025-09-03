import * as fabric from 'fabric'
import { FabricImage } from 'fabric'

// Ensure fabric is loaded in browser context
if (typeof window !== 'undefined' && !fabric) {
  throw new Error('Fabric.js is not properly loaded')
}
import { PRINT_AREAS } from '@/lib/constants'

type ProductCategory = 'TSHIRT' | 'CAP' | 'TOTE_BAG'

export interface CanvasConfig {
  width: number
  height: number
  backgroundColor: string
  selection: boolean
}

export interface DesignObject {
  id: string
  type: 'text' | 'image' | 'shape'
  data: any
  position: { x: number; y: number }
  scale: { x: number; y: number }
  rotation: number
  visible: boolean
}

export class DesignCanvas {
  private canvas: fabric.Canvas | null = null
  private productCategory: ProductCategory
  private printArea: any
  private history: any[] = []
  private historyIndex: number = -1
  private maxHistorySize: number = 50

  constructor(
    canvasElement: HTMLCanvasElement,
    productCategory: ProductCategory,
    config?: Partial<CanvasConfig>
  ) {
    this.productCategory = productCategory
    this.printArea = PRINT_AREAS[productCategory]
    
    const defaultConfig: CanvasConfig = {
      width: 800,
      height: 600,
      backgroundColor: '#f8fafc',
      selection: true,
    }

    const finalConfig = { ...defaultConfig, ...config }

    this.canvas = new fabric.Canvas(canvasElement, {
      width: finalConfig.width,
      height: finalConfig.height,
      backgroundColor: finalConfig.backgroundColor,
      selection: finalConfig.selection,
      preserveObjectStacking: true,
      controlsAboveOverlay: true,
    })

    this.setupEventHandlers()
    this.setupPrintArea()
    this.saveState()
  }

  private setupEventHandlers() {
    if (!this.canvas) return

    // Save state after modifications
    this.canvas.on('object:added', () => this.saveState())
    this.canvas.on('object:removed', () => this.saveState())
    this.canvas.on('object:modified', () => this.saveState())

    // Custom controls styling
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#3B82F6',
      cornerStyle: 'circle',
      borderColor: '#3B82F6',
      borderScaleFactor: 1.5,
    })
  }

  private setupPrintArea() {
    if (!this.canvas || !this.printArea) return

    // Create print area guides
    const printAreaRect = new fabric.Rect({
      left: (this.canvas.width! - this.printArea.front.width) / 2,
      top: (this.canvas.height! - this.printArea.front.height) / 2,
      width: this.printArea.front.width,
      height: this.printArea.front.height,
      fill: 'transparent',
      stroke: '#E5E7EB',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true,
    })

    this.canvas.add(printAreaRect)
    this.canvas.sendToBack(printAreaRect)

    // Add print area label
    const label = new fabric.Text('Print Area', {
      left: printAreaRect.left! + 10,
      top: printAreaRect.top! + 10,
      fontSize: 12,
      fill: '#9CA3AF',
      selectable: false,
      evented: false,
      excludeFromExport: true,
    })

    this.canvas.add(label)
  }

  // Text methods
  addText(text: string = 'Your Text', options?: any) {
    if (!this.canvas) return null

    const textObject = new fabric.Text(text, {
      left: this.canvas.width! / 2,
      top: this.canvas.height! / 2,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      originX: 'center',
      originY: 'center',
      ...options,
    })

    this.canvas.add(textObject)
    this.canvas.setActiveObject(textObject)
    return textObject
  }

  updateText(object: fabric.Text, properties: any) {
    if (!object) return

    Object.keys(properties).forEach(key => {
      if (key === 'text') {
        object.set('text', properties[key])
      } else {
        object.set(key, properties[key])
      }
    })

    this.canvas?.renderAll()
  }

  // Image methods
  addImage(imageUrl: string, options?: any) {
    if (!this.canvas) return null

    return new Promise((resolve, reject) => {
      FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
        if (!img || !this.canvas) {
          reject(new Error('Failed to load image'))
          return
        }

        // Calculate scale to fit within reasonable bounds but keep it larger
        const maxSize = 400 // Increased to make AI-generated images more prominent
        const scale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1))
        
        img.set({
          left: this.canvas.width! / 2,
          top: this.canvas.height! / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          ...options, // This will override scale if provided in options
        })

        this.canvas.add(img)
        this.canvas.setActiveObject(img)
        this.canvas.renderAll()
        resolve(img)
      }).catch((error) => {
        reject(error)
      })
    })
  }

  // Shape methods
  addShape(type: 'rect' | 'circle' | 'triangle', options?: any) {
    if (!this.canvas) return null

    let shape: fabric.Object

    const defaultOptions = {
      left: this.canvas.width! / 2,
      top: this.canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      ...options,
    }

    switch (type) {
      case 'rect':
        shape = new fabric.Rect({
          width: 100,
          height: 100,
          ...defaultOptions,
        })
        break
      case 'circle':
        shape = new fabric.Circle({
          radius: 50,
          ...defaultOptions,
        })
        break
      case 'triangle':
        shape = new fabric.Triangle({
          width: 100,
          height: 100,
          ...defaultOptions,
        })
        break
      default:
        return null
    }

    this.canvas.add(shape)
    this.canvas.setActiveObject(shape)
    return shape
  }

  // Layer management
  moveObjectUp() {
    const activeObject = this.canvas?.getActiveObject()
    if (activeObject) {
      this.canvas?.bringForward(activeObject)
    }
  }

  moveObjectDown() {
    const activeObject = this.canvas?.getActiveObject()
    if (activeObject) {
      this.canvas?.sendBackwards(activeObject)
    }
  }

  moveObjectToFront() {
    const activeObject = this.canvas?.getActiveObject()
    if (activeObject) {
      this.canvas?.bringToFront(activeObject)
    }
  }

  moveObjectToBack() {
    const activeObject = this.canvas?.getActiveObject()
    if (activeObject) {
      this.canvas?.sendToBack(activeObject)
    }
  }

  // Object management
  deleteSelected() {
    const activeObjects = this.canvas?.getActiveObjects()
    if (activeObjects) {
      activeObjects.forEach(obj => this.canvas?.remove(obj))
      this.canvas?.discardActiveObject()
    }
  }

  duplicateSelected() {
    const activeObject = this.canvas?.getActiveObject()
    if (!activeObject) return

    activeObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: cloned.left! + 10,
        top: cloned.top! + 10,
      })
      this.canvas?.add(cloned)
      this.canvas?.setActiveObject(cloned)
    })
  }

  // History management
  private saveState() {
    if (!this.canvas) return

    // Remove any states after current index
    this.history = this.history.slice(0, this.historyIndex + 1)
    
    // Add current state
    const state = JSON.stringify(this.canvas.toJSON())
    this.history.push(state)
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize)
    }
    
    this.historyIndex = this.history.length - 1
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.loadState(this.history[this.historyIndex])
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.loadState(this.history[this.historyIndex])
    }
  }

  private loadState(state: string) {
    if (!this.canvas) return

    this.canvas.loadFromJSON(state, () => {
      this.canvas?.renderAll()
      this.setupPrintArea()
    })
  }

  // Export methods
  toDataURL(options?: any): string {
    if (!this.canvas) return ''
    
    // Temporarily hide guides
    const guides = this.canvas.getObjects().filter((obj: any) => obj.excludeFromExport)
    guides.forEach(guide => guide.set('visible', false))
    
    const dataURL = this.canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // High resolution
      ...options,
    })
    
    // Restore guides
    guides.forEach(guide => guide.set('visible', true))
    this.canvas.renderAll()
    
    return dataURL
  }

  toSVG(): string {
    if (!this.canvas) return ''
    
    // Temporarily hide guides
    const guides = this.canvas.getObjects().filter((obj: any) => obj.excludeFromExport)
    guides.forEach(guide => guide.set('visible', false))
    
    const svg = this.canvas.toSVG({
      suppressPreamble: false,
      width: this.printArea.front.width,
      height: this.printArea.front.height,
    })
    
    // Restore guides
    guides.forEach(guide => guide.set('visible', true))
    this.canvas.renderAll()
    
    return svg
  }

  // Utility methods
  clear() {
    this.canvas?.clear()
    this.setupPrintArea()
    this.saveState()
  }

  getCanvas(): fabric.Canvas | null {
    return this.canvas
  }

  setZoom(zoom: number) {
    if (!this.canvas) return
    this.canvas.setZoom(zoom)
  }

  centerView() {
    if (!this.canvas) return
    this.canvas.viewportCenterObject(this.canvas.getActiveObject() || this.canvas)
  }

  dispose() {
    if (this.canvas) {
      this.canvas.dispose()
      this.canvas = null
    }
  }
}