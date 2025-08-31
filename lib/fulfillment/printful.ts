import { FulfillmentProvider } from '@prisma/client'

if (!process.env.PRINTFUL_API_KEY) {
  console.warn('Printful API key not configured')
}

const PRINTFUL_BASE_URL = 'https://api.printful.com'

export interface PrintfulProduct {
  id: number
  external_id?: string
  name: string
  thumbnail: string
  is_ignored: boolean
}

export interface PrintfulVariant {
  id: number
  external_id?: string
  sync_product_id: number
  name: string
  synced: boolean
  variant_id: number
  retail_price: string
  currency: string
  product: {
    variant_id: number
    product_id: number
    image: string
    name: string
  }
  files: PrintfulFile[]
}

export interface PrintfulFile {
  id?: number
  type: 'front' | 'back' | 'preview'
  url: string
  filename: string
  visible: boolean
  position?: {
    area_width: number
    area_height: number
    width: number
    height: number
    top: number
    left: number
  }
}

export interface PrintfulOrder {
  id?: number
  external_id: string
  status: string
  shipping: string
  created: number
  updated: number
  recipient: PrintfulAddress
  items: PrintfulOrderItem[]
  costs: PrintfulCosts
  retail_costs: PrintfulCosts
  shipments: PrintfulShipment[]
}

export interface PrintfulAddress {
  name: string
  company?: string
  address1: string
  address2?: string
  city: string
  state_code: string
  state_name: string
  country_code: string
  country_name: string
  zip: string
  phone?: string
  email?: string
}

export interface PrintfulOrderItem {
  id?: number
  external_id?: string
  variant_id: number
  sync_variant_id?: number
  quantity: number
  price: string
  name: string
  product: {
    variant_id: number
    product_id: number
    image: string
    name: string
  }
  files?: PrintfulFile[]
  options?: Array<{
    id: string
    value: string
  }>
}

export interface PrintfulCosts {
  currency: string
  subtotal: string
  discount: string
  shipping: string
  tax: string
  total: string
}

export interface PrintfulShipment {
  id: number
  carrier: string
  service: string
  tracking_number: string
  tracking_url: string
  created: number
  shipped_at: number
  reshipment: boolean
  items: Array<{
    item_id: number
    quantity: number
  }>
}

export class PrintfulAPI {
  private apiKey: string
  private baseUrl: string = PRINTFUL_BASE_URL

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PRINTFUL_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('Printful API key is required')
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
        throw new Error(`Printful API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data.result || data
    } catch (error) {
      console.error('Printful API request failed:', error)
      throw error
    }
  }

  // Products
  async getProducts(): Promise<PrintfulProduct[]> {
    return this.makeRequest<PrintfulProduct[]>('/store/products')
  }

  async getProduct(id: number): Promise<PrintfulProduct> {
    return this.makeRequest<PrintfulProduct>(`/store/products/${id}`)
  }

  async getVariants(productId: number): Promise<PrintfulVariant[]> {
    return this.makeRequest<PrintfulVariant[]>(`/store/products/${productId}/variants`)
  }

  // Calculate shipping costs
  async calculateShipping(recipient: PrintfulAddress, items: PrintfulOrderItem[]) {
    const body = {
      recipient,
      items: items.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      })),
    }

    return this.makeRequest('/shipping/rates', 'POST', body)
  }

  // Orders
  async createOrder(order: Partial<PrintfulOrder>): Promise<PrintfulOrder> {
    return this.makeRequest<PrintfulOrder>('/orders', 'POST', order)
  }

  async getOrder(id: number | string): Promise<PrintfulOrder> {
    return this.makeRequest<PrintfulOrder>(`/orders/${id}`)
  }

  async updateOrder(id: number | string, updates: Partial<PrintfulOrder>): Promise<PrintfulOrder> {
    return this.makeRequest<PrintfulOrder>(`/orders/${id}`, 'PUT', updates)
  }

  async confirmOrder(id: number | string): Promise<PrintfulOrder> {
    return this.makeRequest<PrintfulOrder>(`/orders/${id}/confirm`, 'POST')
  }

  async cancelOrder(id: number | string): Promise<PrintfulOrder> {
    return this.makeRequest<PrintfulOrder>(`/orders/${id}`, 'DELETE')
  }

  async getOrders(status?: string, offset?: number, limit?: number): Promise<{
    orders: PrintfulOrder[]
    paging: {
      total: number
      offset: number
      limit: number
    }
  }> {
    let endpoint = '/orders'
    const params = new URLSearchParams()
    
    if (status) params.append('status', status)
    if (offset) params.append('offset', offset.toString())
    if (limit) params.append('limit', limit.toString())
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    const response = await this.makeRequest<any>(endpoint)
    return {
      orders: response.data || [],
      paging: response.paging || { total: 0, offset: 0, limit: 20 }
    }
  }

  // Files and mockups
  async uploadFile(imageUrl: string, filename: string): Promise<{ id: number; url: string }> {
    const body = {
      url: imageUrl,
      filename,
    }
    
    return this.makeRequest('/files', 'POST', body)
  }

  async generateMockup(variantId: number, files: PrintfulFile[]) {
    const body = {
      variant_id: variantId,
      files,
    }
    
    return this.makeRequest('/mockup-generator/create-task', 'POST', body)
  }

  async getMockupTask(taskKey: string) {
    return this.makeRequest(`/mockup-generator/task?task_key=${taskKey}`)
  }

  // Store information
  async getStoreInfo() {
    return this.makeRequest('/store')
  }

  // Product catalog (all available products, not just store products)
  async getCatalogProducts() {
    return this.makeRequest('/products')
  }

  async getCatalogProduct(id: number) {
    return this.makeRequest(`/products/${id}`)
  }

  async getCatalogVariants(productId: number) {
    return this.makeRequest(`/products/${productId}/variants`)
  }

  // Tax rates
  async calculateTax(recipient: PrintfulAddress) {
    return this.makeRequest('/tax/rates', 'POST', { recipient })
  }
}

// Helper functions
export function mapTShopOrderToPrintful(
  tshopOrder: any,
  items: any[]
): Partial<PrintfulOrder> {
  return {
    external_id: tshopOrder.id,
    recipient: {
      name: `${tshopOrder.shippingAddress.firstName} ${tshopOrder.shippingAddress.lastName}`,
      company: tshopOrder.shippingAddress.company,
      address1: tshopOrder.shippingAddress.address1,
      address2: tshopOrder.shippingAddress.address2,
      city: tshopOrder.shippingAddress.city,
      state_code: tshopOrder.shippingAddress.state,
      country_code: tshopOrder.shippingAddress.country,
      zip: tshopOrder.shippingAddress.postalCode,
      phone: tshopOrder.shippingAddress.phone,
      email: tshopOrder.user?.email,
    },
    items: items.map(item => ({
      external_id: item.id,
      variant_id: parseInt(item.variant.printfulId),
      quantity: item.quantity,
      price: item.unitPrice.toString(),
      name: item.product.name,
      files: item.customization ? mapCustomizationToFiles(item.customization) : undefined,
    })),
  }
}

function mapCustomizationToFiles(customization: any): PrintfulFile[] {
  const files: PrintfulFile[] = []

  if (customization.frontDesign) {
    files.push({
      type: 'front',
      url: customization.frontDesign.imageUrl,
      filename: 'front-design.png',
      visible: true,
      position: {
        area_width: 1800,
        area_height: 2400,
        width: Math.round(1800 * customization.frontDesign.scale),
        height: Math.round(2400 * customization.frontDesign.scale),
        top: Math.round(customization.frontDesign.position.y),
        left: Math.round(customization.frontDesign.position.x),
      },
    })
  }

  if (customization.backDesign) {
    files.push({
      type: 'back',
      url: customization.backDesign.imageUrl,
      filename: 'back-design.png',
      visible: true,
      position: {
        area_width: 1800,
        area_height: 2400,
        width: Math.round(1800 * customization.backDesign.scale),
        height: Math.round(2400 * customization.backDesign.scale),
        top: Math.round(customization.backDesign.position.y),
        left: Math.round(customization.backDesign.position.x),
      },
    })
  }

  return files
}

export const printfulAPI = new PrintfulAPI()