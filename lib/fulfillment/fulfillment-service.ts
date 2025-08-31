import { FulfillmentProvider, Order, OrderItem } from '@prisma/client'
import { prisma } from '@/lib/db'
import { printfulAPI, mapTShopOrderToPrintful } from './printful'
import { printifyAPI, mapTShopOrderToPrintify } from './printify'

export interface FulfillmentQuote {
  provider: FulfillmentProvider
  totalCost: number
  productionTime: number // in business days
  shippingCost: number
  tax: number
  estimatedDelivery: Date
  items: Array<{
    productId: string
    variantId: string
    unitCost: number
    available: boolean
  }>
}

export interface FulfillmentResult {
  success: boolean
  externalOrderId?: string
  trackingNumber?: string
  estimatedDelivery?: Date
  error?: string
  provider: FulfillmentProvider
}

export class FulfillmentService {
  
  /**
   * Get quotes from all available fulfillment providers
   */
  async getQuotes(order: any, items: any[]): Promise<FulfillmentQuote[]> {
    const quotes: FulfillmentQuote[] = []

    try {
      // Get Printful quote
      const printfulQuote = await this.getPrintfulQuote(order, items)
      if (printfulQuote) quotes.push(printfulQuote)
    } catch (error) {
      console.error('Error getting Printful quote:', error)
    }

    try {
      // Get Printify quote
      const printifyQuote = await this.getPrintifyQuote(order, items)
      if (printifyQuote) quotes.push(printifyQuote)
    } catch (error) {
      console.error('Error getting Printify quote:', error)
    }

    return quotes
  }

  /**
   * Select the best fulfillment provider based on strategy
   */
  selectProvider(
    quotes: FulfillmentQuote[],
    strategy: 'cost' | 'speed' | 'quality' = 'cost'
  ): FulfillmentQuote | null {
    if (quotes.length === 0) return null

    // Filter only available quotes (all items available)
    const availableQuotes = quotes.filter(quote => 
      quote.items.every(item => item.available)
    )

    if (availableQuotes.length === 0) return null

    switch (strategy) {
      case 'cost':
        return availableQuotes.reduce((min, quote) => 
          quote.totalCost < min.totalCost ? quote : min
        )
      
      case 'speed':
        return availableQuotes.reduce((fastest, quote) => 
          quote.productionTime < fastest.productionTime ? quote : fastest
        )
      
      case 'quality':
        // Prefer Printful for quality (can be made configurable)
        const printfulQuote = availableQuotes.find(q => q.provider === 'PRINTFUL')
        return printfulQuote || availableQuotes[0]
      
      default:
        return availableQuotes[0]
    }
  }

  /**
   * Submit order to selected fulfillment provider
   */
  async submitOrder(
    order: any,
    items: any[],
    provider: FulfillmentProvider
  ): Promise<FulfillmentResult> {
    try {
      switch (provider) {
        case 'PRINTFUL':
          return await this.submitToPrintful(order, items)
        
        case 'PRINTIFY':
          return await this.submitToPrintify(order, items)
        
        default:
          throw new Error(`Unsupported fulfillment provider: ${provider}`)
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider,
      }
    }
  }

  /**
   * Get order status from fulfillment provider
   */
  async getOrderStatus(
    externalOrderId: string,
    provider: FulfillmentProvider
  ): Promise<{
    status: string
    trackingNumber?: string
    trackingUrl?: string
    estimatedDelivery?: Date
  }> {
    switch (provider) {
      case 'PRINTFUL':
        const printfulOrder = await printfulAPI.getOrder(externalOrderId)
        return {
          status: printfulOrder.status,
          trackingNumber: printfulOrder.shipments[0]?.tracking_number,
          trackingUrl: printfulOrder.shipments[0]?.tracking_url,
          estimatedDelivery: printfulOrder.shipments[0] 
            ? new Date(printfulOrder.shipments[0].shipped_at * 1000)
            : undefined,
        }
      
      case 'PRINTIFY':
        const printifyOrder = await printifyAPI.getOrder(externalOrderId)
        // Printify status mapping would need to be implemented
        return {
          status: 'processing', // Simplified for now
        }
      
      default:
        throw new Error(`Unsupported fulfillment provider: ${provider}`)
    }
  }

  private async getPrintfulQuote(order: any, items: any[]): Promise<FulfillmentQuote | null> {
    try {
      const recipient = {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        address1: order.shippingAddress.address1,
        city: order.shippingAddress.city,
        state_code: order.shippingAddress.state,
        country_code: order.shippingAddress.country,
        zip: order.shippingAddress.postalCode,
      }

      const printfulItems = items.map(item => ({
        variant_id: parseInt(item.variant.printfulId),
        quantity: item.quantity,
      }))

      // Calculate shipping
      const shippingRates = await printfulAPI.calculateShipping(recipient, printfulItems)
      const standardShipping = shippingRates.find((rate: any) => 
        rate.name.toLowerCase().includes('standard')
      ) || shippingRates[0]

      // Calculate tax
      const taxInfo = await printfulAPI.calculateTax(recipient)

      // Calculate total cost
      const itemsCost = items.reduce((sum, item) => 
        sum + (parseFloat(item.unitPrice) * item.quantity), 0
      )
      
      const shippingCost = parseFloat(standardShipping?.rate || '0')
      const tax = parseFloat(taxInfo?.rate || '0') * itemsCost
      const totalCost = itemsCost + shippingCost + tax

      // Estimate delivery (Printful typically 2-5 business days production + shipping)
      const productionTime = 3 // business days
      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + productionTime + 5) // +5 for shipping

      return {
        provider: 'PRINTFUL',
        totalCost,
        productionTime,
        shippingCost,
        tax,
        estimatedDelivery,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          unitCost: parseFloat(item.unitPrice),
          available: !!item.variant.printfulId, // Available if we have a Printful mapping
        })),
      }
    } catch (error) {
      console.error('Error getting Printful quote:', error)
      return null
    }
  }

  private async getPrintifyQuote(order: any, items: any[]): Promise<FulfillmentQuote | null> {
    try {
      // Printify doesn't have a direct quote API like Printful
      // We'll estimate based on known costs and shipping
      
      const itemsCost = items.reduce((sum, item) => 
        sum + (parseFloat(item.unitPrice) * item.quantity), 0
      )
      
      // Estimate shipping (Printify typically lower than Printful)
      const shippingCost = 4.99 // Simplified - would need more complex logic
      const tax = itemsCost * 0.08 // 8% estimated tax rate
      const totalCost = itemsCost + shippingCost + tax

      // Printify typically has longer production times but lower costs
      const productionTime = 5 // business days
      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + productionTime + 7)

      return {
        provider: 'PRINTIFY',
        totalCost,
        productionTime,
        shippingCost,
        tax,
        estimatedDelivery,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          unitCost: parseFloat(item.unitPrice) * 0.9, // Typically 10% cheaper
          available: !!item.variant.printifyId,
        })),
      }
    } catch (error) {
      console.error('Error getting Printify quote:', error)
      return null
    }
  }

  private async submitToPrintful(order: any, items: any[]): Promise<FulfillmentResult> {
    const printfulOrder = mapTShopOrderToPrintful(order, items)
    
    // Create draft order first
    const createdOrder = await printfulAPI.createOrder(printfulOrder)
    
    // Confirm order for production
    const confirmedOrder = await printfulAPI.confirmOrder(createdOrder.id!)
    
    return {
      success: true,
      externalOrderId: confirmedOrder.id!.toString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      provider: 'PRINTFUL',
    }
  }

  private async submitToPrintify(order: any, items: any[]): Promise<FulfillmentResult> {
    // For Printify, we need product mappings
    const productMappings = new Map<string, string>()
    // This would be populated from database mappings
    
    const printifyOrder = mapTShopOrderToPrintify(order, items, productMappings)
    
    // Create order
    const createdOrder = await printifyAPI.createOrder(printifyOrder)
    
    // Submit for production
    await printifyAPI.submitOrderForProduction(createdOrder.id!)
    
    return {
      success: true,
      externalOrderId: createdOrder.id!,
      estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      provider: 'PRINTIFY',
    }
  }

  /**
   * Update fulfillment record in database
   */
  async updateFulfillmentRecord(
    orderId: string,
    provider: FulfillmentProvider,
    externalOrderId: string,
    status: string,
    trackingInfo?: {
      trackingNumber: string
      trackingUrl: string
      estimatedDelivery?: Date
    }
  ) {
    await prisma.fulfillmentOrder.upsert({
      where: {
        orderId,
      },
      update: {
        externalOrderId,
        status: status as any,
        trackingNumber: trackingInfo?.trackingNumber,
        trackingUrl: trackingInfo?.trackingUrl,
        estimatedDelivery: trackingInfo?.estimatedDelivery,
        updatedAt: new Date(),
      },
      create: {
        orderId,
        provider,
        externalOrderId,
        status: status as any,
        trackingNumber: trackingInfo?.trackingNumber,
        trackingUrl: trackingInfo?.trackingUrl,
        estimatedDelivery: trackingInfo?.estimatedDelivery,
      },
    })
  }

  /**
   * Sync all pending orders with fulfillment providers
   */
  async syncPendingOrders() {
    const pendingOrders = await prisma.fulfillmentOrder.findMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING', 'PRINTED']
        }
      },
      include: {
        order: true,
      },
    })

    for (const fulfillmentOrder of pendingOrders) {
      try {
        const status = await this.getOrderStatus(
          fulfillmentOrder.externalOrderId!,
          fulfillmentOrder.provider
        )

        // Update database with latest status
        await this.updateFulfillmentRecord(
          fulfillmentOrder.orderId,
          fulfillmentOrder.provider,
          fulfillmentOrder.externalOrderId!,
          status.status,
          status.trackingNumber ? {
            trackingNumber: status.trackingNumber,
            trackingUrl: status.trackingUrl || '',
            estimatedDelivery: status.estimatedDelivery,
          } : undefined
        )

        // Update main order status if shipped
        if (status.status === 'shipped' || status.status === 'delivered') {
          await prisma.order.update({
            where: { id: fulfillmentOrder.orderId },
            data: { 
              status: status.status === 'delivered' ? 'DELIVERED' : 'SHIPPED'
            },
          })
        }

      } catch (error) {
        console.error(`Error syncing order ${fulfillmentOrder.orderId}:`, error)
      }
    }
  }
}

export const fulfillmentService = new FulfillmentService()