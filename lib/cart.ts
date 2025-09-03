import { CartItem, Cart } from '@/types'
import { 
  getUserCartItems, 
  getGuestCartItems, 
  addToCart as addToCartDB,
  updateCartItem as updateCartItemDB,
  removeFromCart as removeFromCartDB,
  clearCart as clearCartDB,
  transferGuestCartToUser as transferGuestCartToUserDB,
  cleanupOldCartItems as cleanupOldCartItemsDB,
  getProductById
} from '@/lib/db-direct'

export class CartService {
  
  /**
   * Get cart for authenticated user
   */
  static async getUserCart(userId: string): Promise<Cart> {
    const cartItems = await getUserCartItems(userId)
    return this.buildCartFromItems(cartItems)
  }

  /**
   * Get cart for guest user by session ID
   */
  static async getGuestCart(sessionId: string): Promise<Cart> {
    const cartItems = await getGuestCartItems(sessionId)
    return this.buildCartFromItems(cartItems)
  }

  /**
   * Add item to cart
   */
  static async addToCart(
    userId: string | null,
    sessionId: string | null,
    productId: string,
    variantId: string,
    quantity: number,
    customization?: any
  ): Promise<CartItem> {
    const result = await addToCartDB(
      userId,
      sessionId,
      productId,
      variantId,
      quantity,
      customization
    )
    
    return {
      id: result.id,
      productId: result.product_id,
      variantId: result.variant_id,
      quantity: result.quantity,
      customization: result.customization,
      product: null,
      variant: null,
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(
    itemId: string,
    quantity: number,
    userId?: string
  ): Promise<CartItem> {
    const result = await updateCartItemDB(itemId, quantity, userId)
    
    return {
      id: result.id,
      productId: result.product_id,
      variantId: result.variant_id,
      quantity: result.quantity,
      customization: result.customization,
      product: null,
      variant: null,
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(itemId: string, userId?: string): Promise<void> {
    await removeFromCartDB(itemId, userId)
  }

  /**
   * Clear entire cart
   */
  static async clearCart(userId: string | null, sessionId: string | null): Promise<void> {
    await clearCartDB(userId, sessionId)
  }

  /**
   * Transfer guest cart to user account on login
   */
  static async transferGuestCartToUser(sessionId: string, userId: string): Promise<void> {
    await transferGuestCartToUserDB(sessionId, userId)
  }

  /**
   * Get cart totals with shipping and tax estimates
   */
  static async getCartTotals(
    cart: Cart,
    shippingAddress?: any
  ): Promise<{
    subtotal: number
    shipping: number
    tax: number
    total: number
  }> {
    const subtotal = cart.items.reduce((sum, item) => {
      const itemPrice = Number(item.variant?.price || item.product?.basePrice || 0)
      return sum + (itemPrice * item.quantity)
    }, 0)

    // Estimate shipping (would use fulfillment service in production)
    const shipping = this.estimateShipping(cart.items, shippingAddress)

    // Estimate tax
    const tax = this.estimateTax(subtotal, shippingAddress)

    const total = subtotal + shipping + tax

    return {
      subtotal,
      shipping,
      tax,
      total,
    }
  }

  /**
   * Validate cart items (check availability, prices)
   */
  static async validateCart(userId: string | null, sessionId: string | null): Promise<{
    isValid: boolean
    errors: string[]
    updatedItems: string[]
  }> {
    const cart = userId 
      ? await this.getUserCart(userId)
      : await this.getGuestCart(sessionId!)

    const errors: string[] = []
    const updatedItems: string[] = []

    for (const item of cart.items) {
      // Check if product still exists and get variant info
      const product = await getProductById(item.productId)
      const variant = product?.variants.find(v => v.id === item.variantId)

      if (!product || !variant) {
        errors.push(`Item "${item.product?.name}" is no longer available`)
        await this.removeFromCart(item.id, userId || undefined)
        continue
      }

      // Check stock
      if (variant.stock < item.quantity) {
        if (variant.stock === 0) {
          errors.push(`"${product.name}" is out of stock`)
          await this.removeFromCart(item.id, userId || undefined)
        } else {
          errors.push(`Only ${variant.stock} of "${product.name}" available`)
          await this.updateCartItem(item.id, variant.stock, userId || undefined)
          updatedItems.push(item.id)
        }
        continue
      }

      // Check if price has changed (within 5% tolerance)
      const currentPrice = Number(variant.price)
      const cartPrice = Number(item.variant?.price || 0)
      const priceChange = Math.abs(currentPrice - cartPrice) / cartPrice

      if (priceChange > 0.05) {
        errors.push(`Price for "${product.name}" has changed`)
        updatedItems.push(item.id)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      updatedItems,
    }
  }

  /**
   * Build cart object from database items
   */
  private static buildCartFromItems(items: any[]): Cart {
    const cartItems: CartItem[] = items.map(item => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      customization: item.customization,
      product: item.product,
      variant: item.variant,
    }))

    const totals = {
      subtotal: cartItems.reduce((sum, item) => {
        const price = Number(item.variant?.price || item.product?.basePrice || 0)
        return sum + (price * item.quantity)
      }, 0),
      estimatedShipping: this.estimateShipping(cartItems),
      estimatedTax: 0, // Will be calculated at checkout
      total: 0,
    }

    totals.total = totals.subtotal + totals.estimatedShipping + totals.estimatedTax

    return {
      items: cartItems,
      totals,
    }
  }

  /**
   * Estimate shipping cost
   */
  private static estimateShipping(items: CartItem[], address?: any): number {
    if (!items.length) return 0

    // Simplified shipping calculation
    // In production, this would use the fulfillment service
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    
    if (itemCount === 1) return 4.99
    if (itemCount <= 3) return 6.99
    if (itemCount <= 5) return 8.99
    
    return 9.99 // Free shipping over certain amounts could be implemented
  }

  /**
   * Estimate tax
   */
  private static estimateTax(subtotal: number, address?: any): number {
    if (!address || address.country !== 'US') return 0
    
    // Simplified tax calculation - 8.5% for US addresses
    return subtotal * 0.085
  }

  /**
   * Clean up old cart items (cleanup job)
   */
  static async cleanupOldCartItems(): Promise<void> {
    await cleanupOldCartItemsDB()
  }
}