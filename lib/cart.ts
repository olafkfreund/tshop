import { CartItem, Cart } from '@/types'
import { prisma } from '@/lib/db'

export class CartService {
  
  /**
   * Get cart for authenticated user
   */
  static async getUserCart(userId: string): Promise<Cart> {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return this.buildCartFromItems(cartItems)
  }

  /**
   * Get cart for guest user by session ID
   */
  static async getGuestCart(sessionId: string): Promise<Cart> {
    const cartItems = await prisma.cartItem.findMany({
      where: { sessionId },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
    })

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
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        AND: [
          { productId },
          { variantId },
          userId ? { userId } : { sessionId },
        ],
      },
    })

    if (existingItem) {
      // Update quantity if item exists
      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          customization: customization || existingItem.customization,
          updatedAt: new Date(),
        },
      })
    }

    // Create new cart item
    return await prisma.cartItem.create({
      data: {
        userId,
        sessionId,
        productId,
        variantId,
        quantity,
        customization,
      },
    })
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(
    itemId: string,
    quantity: number,
    userId?: string
  ): Promise<CartItem> {
    const whereClause: any = { id: itemId }
    if (userId) {
      whereClause.userId = userId
    }

    return await prisma.cartItem.update({
      where: whereClause,
      data: {
        quantity,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(itemId: string, userId?: string): Promise<void> {
    const whereClause: any = { id: itemId }
    if (userId) {
      whereClause.userId = userId
    }

    await prisma.cartItem.delete({
      where: whereClause,
    })
  }

  /**
   * Clear entire cart
   */
  static async clearCart(userId: string | null, sessionId: string | null): Promise<void> {
    const whereClause = userId ? { userId } : { sessionId }
    
    await prisma.cartItem.deleteMany({
      where: whereClause,
    })
  }

  /**
   * Transfer guest cart to user account on login
   */
  static async transferGuestCartToUser(sessionId: string, userId: string): Promise<void> {
    // Get existing user cart items
    const userCartItems = await prisma.cartItem.findMany({
      where: { userId },
      select: { productId: true, variantId: true, id: true, quantity: true },
    })

    // Get guest cart items
    const guestCartItems = await prisma.cartItem.findMany({
      where: { sessionId },
    })

    for (const guestItem of guestCartItems) {
      // Check if user already has this item
      const existingUserItem = userCartItems.find(
        item => item.productId === guestItem.productId && item.variantId === guestItem.variantId
      )

      if (existingUserItem) {
        // Update quantity of existing user item
        await prisma.cartItem.update({
          where: { id: existingUserItem.id },
          data: {
            quantity: existingUserItem.quantity + guestItem.quantity,
            updatedAt: new Date(),
          },
        })

        // Delete guest item
        await prisma.cartItem.delete({
          where: { id: guestItem.id },
        })
      } else {
        // Transfer guest item to user
        await prisma.cartItem.update({
          where: { id: guestItem.id },
          data: {
            userId,
            sessionId: null,
            updatedAt: new Date(),
          },
        })
      }
    }
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
      // Check if product/variant still exists and is available
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      })

      if (!variant || !variant.product) {
        errors.push(`Item "${item.product?.name}" is no longer available`)
        await this.removeFromCart(item.id, userId || undefined)
        continue
      }

      // Check stock
      if (variant.stock < item.quantity) {
        if (variant.stock === 0) {
          errors.push(`"${variant.product.name}" is out of stock`)
          await this.removeFromCart(item.id, userId || undefined)
        } else {
          errors.push(`Only ${variant.stock} of "${variant.product.name}" available`)
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
        errors.push(`Price for "${variant.product.name}" has changed`)
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
    // Remove cart items older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await prisma.cartItem.deleteMany({
      where: {
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      },
    })
  }
}