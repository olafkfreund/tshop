// Core product types
export interface Product {
  id: string
  name: string
  description: string
  category: ProductCategory
  basePrice: number
  images: ProductImage[]
  variants: ProductVariant[]
  specifications: ProductSpecs
  createdAt: Date
  updatedAt: Date
}

export type ProductCategory = 'tshirt' | 'cap' | 'tote-bag'

export interface ProductImage {
  id: string
  url: string
  altText: string
  isPrimary: boolean
  angle?: 'front' | 'back' | 'side' | 'detail'
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string
  price: number
  color: Color
  size?: Size
  stock: number
  printfulId?: string
  printifyId?: string
}

export interface ProductSpecs {
  material: string
  care: string[]
  sizing: string
  printArea: PrintArea
}

export interface PrintArea {
  front: {
    width: number
    height: number
    x: number
    y: number
  }
  back?: {
    width: number
    height: number
    x: number
    y: number
  }
}

// Color and Size types
export interface Color {
  name: string
  hex: string
  slug: string
}

export interface Size {
  name: string
  slug: string
  measurements?: {
    chest?: number
    length?: number
    width?: number
  }
}

// Design types
export interface Design {
  id: string
  userId?: string
  name: string
  description?: string
  prompt?: string
  imageUrl: string
  category: DesignCategory
  tags: string[]
  isPublic: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export type DesignCategory = 'text' | 'graphic' | 'logo' | 'artwork' | 'pattern'

// AI Generation types
export interface AIGenerationRequest {
  prompt: string
  style?: AIStyle
  productCategory: ProductCategory
  userId?: string
}

export interface AIGenerationResponse {
  success: boolean
  imageUrl?: string
  error?: string
  metadata?: {
    model: string
    tokensUsed: number
    generationTime: number
  }
}

export type AIStyle = 'realistic' | 'cartoon' | 'minimalist' | 'vintage' | 'modern' | 'artistic'

// User and Auth types
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role: UserRole
  aiUsage: AIUsageStats
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'customer' | 'designer' | 'admin'

export interface AIUsageStats {
  dailyCount: number
  monthlyCount: number
  totalCount: number
  lastReset: Date
  tier: 'free' | 'registered' | 'premium'
}

// Order types
export interface Order {
  id: string
  userId?: string
  status: OrderStatus
  items: OrderItem[]
  shipping: ShippingAddress
  billing: BillingAddress
  totals: OrderTotals
  fulfillment: FulfillmentDetails
  createdAt: Date
  updatedAt: Date
}

export type OrderStatus = 'pending' | 'processing' | 'printed' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: string
  productId: string
  variantId: string
  designId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  customization?: CustomizationData
}

export interface CustomizationData {
  frontDesign?: {
    imageUrl: string
    position: { x: number; y: number }
    scale: number
    rotation: number
  }
  backDesign?: {
    imageUrl: string
    position: { x: number; y: number }
    scale: number
    rotation: number
  }
  text?: {
    content: string
    font: string
    size: number
    color: string
    position: { x: number; y: number }
  }[]
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export interface BillingAddress extends ShippingAddress {
  sameAsShipping: boolean
}

export interface OrderTotals {
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
}

export interface FulfillmentDetails {
  provider: 'printful' | 'printify'
  externalOrderId?: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: Date
}

// Cart types
export interface CartItem {
  id: string
  productId: string
  variantId: string
  designId?: string
  quantity: number
  customization?: CustomizationData
}

export interface Cart {
  items: CartItem[]
  totals: {
    subtotal: number
    estimatedShipping: number
    estimatedTax: number
    total: number
  }
}

// Design Editor types
export interface EditorState {
  canvas: any // Fabric.js canvas instance
  selectedObjects: any[]
  history: EditorAction[]
  historyIndex: number
  zoom: number
  product: Product
  variant: ProductVariant
}

export interface EditorAction {
  type: 'add' | 'remove' | 'modify' | 'move' | 'resize' | 'rotate'
  objectId: string
  before?: any
  after?: any
  timestamp: Date
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}