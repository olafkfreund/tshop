/**
 * Printify API Integration Service
 * 
 * Handles communication with Printify's REST API for:
 * - Product catalog management
 * - Order creation and management
 * - Image uploads for custom designs
 * - Shop management and webhooks
 * 
 * Documentation: https://developers.printify.com/
 */

export interface PrintifyProduct {
  id: string
  title: string
  description: string
  tags: string[]
  options: Array<{
    name: string
    type: string
    values: Array<{
      id: number
      title: string
      colors?: string[]
    }>
  }>
  variants: PrintifyVariant[]
  images: Array<{
    src: string
    variant_ids: number[]
    position: string
    is_default: boolean
  }>
  created_at: string
  updated_at: string
  visible: boolean
  is_locked: boolean
  blueprint_id: number
  user_id: number
  shop_id: number
  print_provider_id: number
  print_areas: Array<{
    variant_ids: number[]
    placeholders: Array<{
      position: string
      images: Array<{
        id: string
        name: string
        type: string
        height: number
        width: number
        x: number
        y: number
        scale: number
        angle: number
      }>
    }>
  }>
}

export interface PrintifyVariant {
  id: number
  sku: string
  cost: number
  price: number
  title: string
  grams: number
  is_enabled: boolean
  is_default: boolean
  is_available: boolean
  options: number[]
}

export interface PrintifyImage {
  id: string
  file_name: string
  height: number
  width: number
  size: number
  mime_type: string
  preview_url: string
  upload_time: string
}

export interface PrintifyOrder {
  external_id: string
  label?: string
  line_items: Array<{
    product_id: string
    variant_id: number
    quantity: number
    print_areas: Array<{
      variant_ids: number[]
      placeholders: Array<{
        position: string
        images: Array<{
          id: string
          x: number
          y: number
          scale: number
          angle: number
        }>
      }>
    }>
  }>
  shipping_method: number
  is_printify_express: boolean
  send_shipping_notification: boolean
  address_to: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    country: string
    region?: string
    address1: string
    address2?: string
    city: string
    zip: string
  }
}

export interface PrintifyOrderResponse {
  id: string
  external_id: string
  shop_id: number
  status: 'pending' | 'in-production' | 'fulfilled' | 'shipped' | 'cancelled' | 'on-hold'
  line_items: Array<{
    id: string
    product_id: string
    variant_id: number
    quantity: number
    cost: number
    shipping_cost: number
    status: string
    metadata: {
      title: string
      price: number
      variant_label: string
      sku: string
      country: string
    }
    sent_to_production_at?: string
    fulfilled_at?: string
  }>
  address_to: {
    first_name: string
    last_name: string
    email: string
    phone: string
    country: string
    region: string
    address1: string
    address2: string
    city: string
    zip: string
  }
  total_price: number
  total_shipping: number
  total_tax: number
  created_at: string
  updated_at: string
  shipments?: Array<{
    id: string
    carrier: string
    number: string
    url: string
    delivered_at?: string
  }>
}

class PrintifyAPI {
  private apiKey: string
  private shopId?: string
  private baseURL = 'https://api.printify.com/v1'
  
  constructor(apiKey?: string, shopId?: string) {
    this.apiKey = apiKey || process.env.PRINTIFY_API_KEY || ''
    this.shopId = shopId || process.env.PRINTIFY_SHOP_ID
    
    if (!this.apiKey) {
      throw new Error('Printify API key is required. Set PRINTIFY_API_KEY environment variable.')
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/${endpoint.replace(/^\//, '')}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Printify API error: ${errorData.message || response.statusText}`)
    }

    return response.json()
  }

  // Shop Management
  async getShops() {
    return this.makeRequest('shops.json')
  }

  // Product Management
  async getProducts(): Promise<{ data: PrintifyProduct[] }> {
    if (!this.shopId) {
      throw new Error('Shop ID is required for product operations')
    }
    return this.makeRequest(`shops/${this.shopId}/products.json`)
  }

  async getProduct(productId: string): Promise<PrintifyProduct> {
    if (!this.shopId) {
      throw new Error('Shop ID is required for product operations')
    }
    return this.makeRequest(`shops/${this.shopId}/products/${productId}.json`)
  }

  async createProduct(productData: Partial<PrintifyProduct>): Promise<PrintifyProduct> {
    if (!this.shopId) {
      throw new Error('Shop ID is required for product operations')
    }
    return this.makeRequest(`shops/${this.shopId}/products.json`, {
      method: 'POST',
      body: JSON.stringify(productData)
    })
  }

  async updateProduct(productId: string, productData: Partial<PrintifyProduct>): Promise<PrintifyProduct> {
    if (!this.shopId) {
      throw new Error('Shop ID is required for product operations')
    }
    return this.makeRequest(`shops/${this.shopId}/products/${productId}.json`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    })
  }

  // Image Management
  async uploadImage(imageUrl: string, fileName: string): Promise<PrintifyImage> {
    return this.makeRequest('uploads/images.json', {
      method: 'POST',
      body: JSON.stringify({
        file_name: fileName,
        url: imageUrl
      })
    })
  }

  async getImage(imageId: string): Promise<PrintifyImage> {
    return this.makeRequest(`uploads/images/${imageId}.json`)
  }

  // Order Management
  async createOrder(order: PrintifyOrder): Promise<PrintifyOrderResponse> {
    if (!this.shopId) {
      throw new Error('Shop ID is required for order operations')
    }
    return this.makeRequest(`shops/${this.shopId}/orders.json`, {
      method: 'POST',
      body: JSON.stringify(order)
    })
  }

  async getOrder(orderId: string): Promise<PrintifyOrderResponse> {
    if (!this.shopId) {
      throw new Error('Shop ID is required for order operations')
    }
    return this.makeRequest(`shops/${this.shopId}/orders/${orderId}.json`)
  }

  async submitOrder(orderId: string): Promise<PrintifyOrderResponse> {
    if (!this.shopId) {
      throw new Error('Shop ID is required for order operations')
    }
    return this.makeRequest(`shops/${this.shopId}/orders/${orderId}/send_to_production.json`, {
      method: 'POST'
    })
  }

  async getOrders(page = 1, limit = 20): Promise<{
    current_page: number
    data: PrintifyOrderResponse[]
    first_page_url: string
    last_page: number
    last_page_url: string
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number
    total: number
  }> {
    if (!this.shopId) {
      throw new Error('Shop ID is required for order operations')
    }
    return this.makeRequest(`shops/${this.shopId}/orders.json?page=${page}&limit=${limit}`)
  }

  // Catalog for TShop integration
  async getBlueprints() {
    return this.makeRequest('catalog/blueprints.json')
  }

  async getBlueprintProviders(blueprintId: number) {
    return this.makeRequest(`catalog/blueprints/${blueprintId}/print_providers.json`)
  }

  async getBlueprintVariants(blueprintId: number, printProviderId: number) {
    return this.makeRequest(`catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`)
  }

  // Get TShop compatible products
  async getTShopProducts() {
    // Blueprint mapping for TShop product categories
    const blueprintMapping = {
      // T-Shirts
      5: 'TSHIRT', // Unisex Heavy Cotton Tee
      // Caps  
      258: 'CAP', // Embroidered Dad hat
      // Tote Bags
      163: 'TOTE_BAG', // Tote Bag
    }

    const products = []
    for (const [blueprintId, category] of Object.entries(blueprintMapping)) {
      try {
        const providers = await this.getBlueprintProviders(parseInt(blueprintId))
        if (providers.data && providers.data.length > 0) {
          const variants = await this.getBlueprintVariants(parseInt(blueprintId), providers.data[0].id)
          products.push({
            blueprintId: parseInt(blueprintId),
            category,
            printProviderId: providers.data[0].id,
            variants: variants.data || []
          })
        }
      } catch (error) {
        console.error(`Failed to fetch Printify blueprint ${blueprintId}:`, error)
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
    
    return `sha256=${expectedSignature}` === signature
  }
}

// Singleton instance for use throughout the application
let printifyInstance: PrintifyAPI | null = null

export function getPrintifyAPI(): PrintifyAPI {
  if (!printifyInstance) {
    printifyInstance = new PrintifyAPI()
  }
  return printifyInstance
}

export default PrintifyAPI