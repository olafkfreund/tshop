/**
 * Printful API Integration Service
 * 
 * Handles communication with Printful's REST API for:
 * - Product catalog management
 * - Order creation and management
 * - File uploads for custom designs
 * - Shipping estimates and tracking
 * 
 * Documentation: https://developers.printful.com/
 */

export interface PrintfulProduct {
  id: number
  external_id: string
  name: string
  variants: PrintfulVariant[]
  sync_product?: {
    id: number
    external_id: string
    name: string
    website: string
    thumbnail_url: string
  }
}

export interface PrintfulVariant {
  id: number
  external_id: string
  sync_variant_id: number
  name: string
  size: string
  color: string
  color_code: string
  image: string
  price: string
  in_stock: boolean
  availability_regions: object
  availability_status: Array<{
    region: string
    status: string
  }>
}

export interface PrintfulFile {
  id: number
  type: 'default' | 'preview'
  hash: string
  url: string
  filename: string
  mime_type: string
  size: number
  width: number
  height: number
  dpi: number
  status: 'ok' | 'waiting' | 'failed'
  created: number
  thumbnail_url: string
  preview_url: string
  visible: boolean
}

export interface PrintfulOrderItem {
  sync_variant_id?: number
  external_id?: string
  variant_id?: number
  quantity: number
  price?: string
  retail_price?: string
  name?: string
  product?: {
    variant_id: number
    name: string
    size: string
    color: string
  }
  files?: Array<{
    id?: number
    url?: string
    type: 'default' | 'preview'
    hash?: string
  }>
  options?: Array<{
    id: string
    value: string | boolean | number
  }>
}

export interface PrintfulShippingAddress {
  name: string
  company?: string
  address1: string
  address2?: string
  city: string
  state_code: string
  state_name?: string
  country_code: string
  country_name?: string
  zip: string
  phone?: string
  email?: string
}

export interface PrintfulOrder {
  external_id: string
  shipping: PrintfulShippingAddress
  recipient: PrintfulShippingAddress
  items: PrintfulOrderItem[]
  retail_costs?: {
    currency: string
    subtotal?: string
    discount?: string
    shipping?: string
    tax?: string
    total?: string
  }
  gift?: {
    subject?: string
    message?: string
  }
  packing_slip?: {
    email?: string
    phone?: string
    message?: string
    logo_url?: string
  }
}

export interface PrintfulOrderResponse {
  id: number
  external_id: string
  store: number
  status: 'draft' | 'pending' | 'failed' | 'canceled' | 'onhold' | 'inprocess' | 'fulfilled' | 'shipped'
  shipping: string
  shipping_service_name: string
  created: number
  updated: number
  items: Array<{
    id: number
    external_id: string
    variant_id: number
    sync_variant_id: number
    external_variant_id: string
    quantity: number
    price: string
    retail_price: string
    name: string
    product: {
      variant_id: number
      product_id: number
      image: string
      name: string
    }
    files: PrintfulFile[]
    options: Array<{
      id: string
      value: any
    }>
  }>
  costs: {
    currency: string
    subtotal: string
    discount: string
    shipping: string
    digitization: string
    additional_fee: string
    fulfillment_fee: string
    tax: string
    vat: string
    total: string
  }
  retail_costs: {
    currency: string
    subtotal: string
    discount: string
    shipping: string
    tax: string
    total: string
  }
  pricing_breakdown: Array<{
    customer_pays: string
    printful_price: string
    profit: string
  }>
}

class PrintfulAPI {
  private apiKey: string
  private storeId?: string
  private baseURL = 'https://api.printful.com'
  
  constructor(apiKey?: string, storeId?: string) {
    this.apiKey = apiKey || process.env.PRINTFUL_API_KEY || ''
    this.storeId = storeId || process.env.PRINTFUL_STORE_ID
    
    if (!this.apiKey) {
      throw new Error('Printful API key is required. Set PRINTFUL_API_KEY environment variable.')
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ result: T; code: number; error?: string }> {
    const url = `${this.baseURL}/${endpoint.replace(/^\//, '')}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-PF-Store-Id': this.storeId || '',
        ...options.headers,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Printful API error: ${data.error?.message || data.error || 'Unknown error'}`)
    }

    return data
  }

  // Product Management
  async getProducts(): Promise<PrintfulProduct[]> {
    const response = await this.makeRequest<PrintfulProduct[]>('sync/products')
    return response.result
  }

  async getProduct(productId: string | number): Promise<PrintfulProduct> {
    const response = await this.makeRequest<PrintfulProduct>(`sync/products/${productId}`)
    return response.result
  }

  async getProductVariants(productId: string | number): Promise<PrintfulVariant[]> {
    const product = await this.getProduct(productId)
    return product.variants || []
  }

  // File Management
  async uploadFile(fileUrl: string, fileName: string): Promise<PrintfulFile> {
    const response = await this.makeRequest<PrintfulFile>('files', {
      method: 'POST',
      body: JSON.stringify({
        url: fileUrl,
        filename: fileName,
        type: 'default'
      })
    })
    return response.result
  }

  async getFile(fileId: number): Promise<PrintfulFile> {
    const response = await this.makeRequest<PrintfulFile>(`files/${fileId}`)
    return response.result
  }

  // Order Management
  async createOrder(order: PrintfulOrder): Promise<PrintfulOrderResponse> {
    const response = await this.makeRequest<PrintfulOrderResponse>('orders', {
      method: 'POST',
      body: JSON.stringify(order)
    })
    return response.result
  }

  async getOrder(orderId: string | number): Promise<PrintfulOrderResponse> {
    const response = await this.makeRequest<PrintfulOrderResponse>(`orders/${orderId}`)
    return response.result
  }

  async confirmOrder(orderId: string | number): Promise<PrintfulOrderResponse> {
    const response = await this.makeRequest<PrintfulOrderResponse>(`orders/${orderId}/confirm`, {
      method: 'POST'
    })
    return response.result
  }

  async getOrders(status?: string, limit?: number, offset?: number): Promise<{
    orders: PrintfulOrderResponse[]
    paging: { total: number; offset: number; limit: number }
  }> {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (limit) params.set('limit', limit.toString())
    if (offset) params.set('offset', offset.toString())
    
    const endpoint = `orders${params.toString() ? `?${params.toString()}` : ''}`
    const response = await this.makeRequest<{
      orders: PrintfulOrderResponse[]
      paging: { total: number; offset: number; limit: number }
    }>(endpoint)
    return response.result
  }

  // Shipping Estimates
  async getShippingRates(recipient: PrintfulShippingAddress, items: PrintfulOrderItem[], currency = 'USD') {
    const response = await this.makeRequest('shipping/rates', {
      method: 'POST',
      body: JSON.stringify({
        recipient,
        items,
        currency,
        locale: 'en_US'
      })
    })
    return response.result
  }

  // Product catalog for TShop integration
  async getTShopProducts() {
    // Map Printful products to TShop product categories
    const productMapping = {
      // T-Shirts
      71: 'TSHIRT', // Unisex Staple T-Shirt
      // Caps
      258: 'CAP', // Embroidered Cap
      // Tote Bags
      163: 'TOTE_BAG', // Tote Bag
    }

    const products = []
    for (const [printfulId, category] of Object.entries(productMapping)) {
      try {
        const product = await this.getProduct(parseInt(printfulId))
        products.push({
          printfulId: parseInt(printfulId),
          category,
          name: product.name,
          variants: product.variants
        })
      } catch (error) {
        console.error(`Failed to fetch Printful product ${printfulId}:`, error)
      }
    }
    
    return products
  }

  // Webhook signature verification
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return signature === expectedSignature
  }
}

// Singleton instance for use throughout the application
let printfulInstance: PrintfulAPI | null = null

export function getPrintfulAPI(): PrintfulAPI {
  if (!printfulInstance) {
    printfulInstance = new PrintfulAPI()
  }
  return printfulInstance
}

export default PrintfulAPI