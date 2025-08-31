import { FulfillmentProvider } from '@prisma/client'

if (!process.env.PRINTIFY_API_KEY || !process.env.PRINTIFY_SHOP_ID) {
  console.warn('Printify API credentials not configured')
}

const PRINTIFY_BASE_URL = 'https://api.printify.com/v1'

export interface PrintifyProduct {
  id: string
  title: string
  description: string
  tags: string[]
  options: PrintifyOption[]
  variants: PrintifyVariant[]
  images: PrintifyImage[]
  created_at: string
  updated_at: string
  visible: boolean
  is_locked: boolean
  blueprint_id: number
  print_provider_id: number
  print_areas: PrintifyPrintArea[]
  sales_channel_properties: any[]
}

export interface PrintifyOption {
  name: string
  type: string
  values: Array<{
    id: number
    title: string
    colors: string[]
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
  name: string
  type: string
  height: number
  width: number
  x: number
  y: number
  scale: number
  angle: number
}

export interface PrintifyPrintArea {
  variant_ids: number[]
  placeholders: Array<{
    position: string
    height: number
    width: number
  }>
}

export interface PrintifyOrder {
  id?: string
  external_id: string
  label: string
  line_items: PrintifyLineItem[]
  shipping_method: number
  send_shipping_notification: boolean
  address_to: PrintifyAddress
}

export interface PrintifyLineItem {
  product_id: string
  variant_id: number
  quantity: number
  print_areas: {
    [key: string]: Array<{
      image_id: string
      x: number
      y: number
      scale: number
      angle: number
    }>
  }
}

export interface PrintifyAddress {
  first_name: string
  last_name: string
  email: string
  phone: string
  country: string
  region: string
  address1: string
  address2?: string
  city: string
  zip: string
}

export interface PrintifyShippingRate {
  id: number
  name: string
  rate: string
  currency: string
}

export class PrintifyAPI {
  private apiKey: string
  private shopId: string
  private baseUrl: string = PRINTIFY_BASE_URL

  constructor(apiKey?: string, shopId?: string) {
    this.apiKey = apiKey || process.env.PRINTIFY_API_KEY || ''
    this.shopId = shopId || process.env.PRINTIFY_SHOP_ID || ''
    
    if (!this.apiKey || !this.shopId) {
      throw new Error('Printify API key and shop ID are required')
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Printify API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('Printify API request failed:', error)
      throw error
    }
  }

  // Shop management
  async getShops() {
    return this.makeRequest('/shops.json')
  }

  async getShop() {
    return this.makeRequest(`/shops/${this.shopId}.json`)
  }

  // Products
  async getProducts(page: number = 1, limit: number = 10): Promise<{
    data: PrintifyProduct[]
    current_page: number
    last_page: number
    total: number
  }> {
    return this.makeRequest(`/shops/${this.shopId}/products.json?page=${page}&limit=${limit}`)
  }

  async getProduct(productId: string): Promise<PrintifyProduct> {
    return this.makeRequest(`/shops/${this.shopId}/products/${productId}.json`)
  }

  async createProduct(product: Partial<PrintifyProduct>): Promise<PrintifyProduct> {
    return this.makeRequest(`/shops/${this.shopId}/products.json`, 'POST', product)
  }

  async updateProduct(productId: string, updates: Partial<PrintifyProduct>): Promise<PrintifyProduct> {
    return this.makeRequest(`/shops/${this.shopId}/products/${productId}.json`, 'PUT', updates)
  }

  async deleteProduct(productId: string): Promise<void> {
    return this.makeRequest(`/shops/${this.shopId}/products/${productId}.json`, 'DELETE')
  }

  // Orders
  async getOrders(page: number = 1, limit: number = 10) {
    return this.makeRequest(`/shops/${this.shopId}/orders.json?page=${page}&limit=${limit}`)
  }

  async getOrder(orderId: string): Promise<PrintifyOrder> {
    return this.makeRequest(`/shops/${this.shopId}/orders/${orderId}.json`)
  }

  async createOrder(order: PrintifyOrder): Promise<PrintifyOrder> {
    return this.makeRequest(`/shops/${this.shopId}/orders.json`, 'POST', order)
  }

  async submitOrderForProduction(orderId: string): Promise<void> {
    return this.makeRequest(`/shops/${this.shopId}/orders/${orderId}/send_to_production.json`, 'POST')
  }

  async calculateShippingCosts(orderId: string): Promise<PrintifyShippingRate[]> {
    return this.makeRequest(`/shops/${this.shopId}/orders/${orderId}/shipments.json`)
  }

  // Catalog
  async getBlueprints() {
    return this.makeRequest('/catalog/blueprints.json')
  }

  async getBlueprint(blueprintId: number) {
    return this.makeRequest(`/catalog/blueprints/${blueprintId}.json`)
  }

  async getPrintProviders(blueprintId: number) {
    return this.makeRequest(`/catalog/blueprints/${blueprintId}/print_providers.json`)
  }

  async getPrintProvider(blueprintId: number, providerId: number) {
    return this.makeRequest(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}.json`)
  }

  async getVariants(blueprintId: number, providerId: number) {
    return this.makeRequest(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`)
  }

  // Images
  async uploadImage(imageUrl: string, filename: string): Promise<{ id: string; file_name: string; url: string }> {
    const body = {
      file_name: filename,
      url: imageUrl,
    }
    
    return this.makeRequest(`/uploads/images.json`, 'POST', body)
  }

  async getUploadedImages(page: number = 1, limit: number = 10) {
    return this.makeRequest(`/uploads/images.json?page=${page}&limit=${limit}`)
  }

  // Webhooks
  async getWebhooks() {
    return this.makeRequest(`/shops/${this.shopId}/webhooks.json`)
  }

  async createWebhook(url: string, topics: string[]) {
    const body = {
      webhook: {
        topic: topics.join(','),
        url,
      }
    }
    
    return this.makeRequest(`/shops/${this.shopId}/webhooks.json`, 'POST', body)
  }

  async updateWebhook(webhookId: string, url: string, topics: string[]) {
    const body = {
      webhook: {
        topic: topics.join(','),
        url,
      }
    }
    
    return this.makeRequest(`/shops/${this.shopId}/webhooks/${webhookId}.json`, 'PUT', body)
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    return this.makeRequest(`/shops/${this.shopId}/webhooks/${webhookId}.json`, 'DELETE')
  }
}

// Helper functions
export function mapTShopOrderToPrintify(
  tshopOrder: any,
  items: any[],
  productMappings: Map<string, string> // Maps TShop product IDs to Printify product IDs
): PrintifyOrder {
  return {
    external_id: tshopOrder.id,
    label: `TShop Order ${tshopOrder.id}`,
    line_items: items.map(item => ({
      product_id: productMappings.get(item.productId) || '',
      variant_id: parseInt(item.variant.printifyId),
      quantity: item.quantity,
      print_areas: item.customization ? mapCustomizationToPrintAreas(item.customization) : {},
    })),
    shipping_method: 1, // Standard shipping - should be configurable
    send_shipping_notification: true,
    address_to: {
      first_name: tshopOrder.shippingAddress.firstName,
      last_name: tshopOrder.shippingAddress.lastName,
      email: tshopOrder.user?.email || '',
      phone: tshopOrder.shippingAddress.phone || '',
      country: tshopOrder.shippingAddress.country,
      region: tshopOrder.shippingAddress.state,
      address1: tshopOrder.shippingAddress.address1,
      address2: tshopOrder.shippingAddress.address2,
      city: tshopOrder.shippingAddress.city,
      zip: tshopOrder.shippingAddress.postalCode,
    },
  }
}

function mapCustomizationToPrintAreas(customization: any): { [key: string]: any[] } {
  const printAreas: { [key: string]: any[] } = {}

  if (customization.frontDesign) {
    printAreas.front = [{
      image_id: customization.frontDesign.imageId, // This would need to be uploaded to Printify first
      x: customization.frontDesign.position.x,
      y: customization.frontDesign.position.y,
      scale: customization.frontDesign.scale,
      angle: customization.frontDesign.rotation || 0,
    }]
  }

  if (customization.backDesign) {
    printAreas.back = [{
      image_id: customization.backDesign.imageId,
      x: customization.backDesign.position.x,
      y: customization.backDesign.position.y,
      scale: customization.backDesign.scale,
      angle: customization.backDesign.rotation || 0,
    }]
  }

  return printAreas
}

// Blueprint IDs for common products (these would be configured based on actual Printify catalog)
export const PRINTIFY_BLUEPRINTS = {
  TSHIRT: 5, // Unisex Heavy Cotton Tee
  CAP: 26, // Dad Hat
  TOTE_BAG: 30, // Tote Bag
} as const

// Common print provider IDs
export const PRINTIFY_PROVIDERS = {
  MONSTER_DIGITAL: 1,
  AWKWARD_STYLES: 3,
  GOOTEN: 8,
  DREAM_JUNCTION: 9,
} as const

export const printifyAPI = new PrintifyAPI()