import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'tshop_dev',
  user: 'tshop_user',
  password: 'tshop_password',
  ssl: false, // local development
  // Connection pool configuration for better reliability
  max: 10, // maximum number of clients in the pool
  min: 2, // minimum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // return error after 5 seconds if connection could not be established
})

export async function query(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params)
    return result.rows
  } catch (error) {
    console.error('Database query error:', error)
    console.error('Query:', text)
    console.error('Params:', params)
    throw error
  }
}

// Test connection health
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time')
    console.log('✅ Database connection healthy:', result[0]?.current_time)
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

export async function getProducts() {
  try {
    const products = await query('SELECT * FROM products ORDER BY created_at DESC')
    
    // Get related data for each product
    const productsWithRelations = await Promise.all(
      products.map(async (product) => {
        const [images, variants, specs] = await Promise.all([
          query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC', [product.id]),
          query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY price ASC', [product.id]),
          query('SELECT * FROM product_specs WHERE product_id = $1', [product.id])
        ])
        
        return {
          ...product,
          images: images || [],
          variants: variants || [],
          specs: specs?.[0] || null
        }
      })
    )
    
    return productsWithRelations
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getProductById(id: string) {
  try {
    const products = await query('SELECT * FROM products WHERE id = $1', [id])
    
    if (products.length === 0) {
      return null
    }
    
    const product = products[0]
    
    const [images, variants, specs] = await Promise.all([
      query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC', [product.id]),
      query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY color_slug ASC, size_name ASC', [product.id]),
      query('SELECT * FROM product_specs WHERE product_id = $1', [product.id])
    ])
    
    return {
      ...product,
      images: images || [],
      variants: variants || [],
      specs: specs?.[0] || null
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return null
  }
}

export async function createUser(email: string, name?: string) {
  try {
    return await query(
      'INSERT INTO users (id, email, name) VALUES (gen_random_uuid()::text, $1, $2) RETURNING *',
      [email, name]
    )
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

// Cart-related functions
export async function getUserCartItems(userId: string) {
  try {
    const cartItems = await query(`
      SELECT 
        ci.*,
        p.name as product_name, p.description as product_description, p.category as product_category, p.base_price as product_base_price,
        pv.name as variant_name, pv.price as variant_price, pv.color_name, pv.color_hex, pv.size_name, pv.stock,
        pi.url as image_url, pi.alt_text as image_alt
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [userId])

    return cartItems.map(item => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      customization: item.customization,
      product: {
        id: item.product_id,
        name: item.product_name,
        description: item.product_description,
        category: item.product_category,
        basePrice: item.product_base_price,
        images: item.image_url ? [{
          url: item.image_url,
          altText: item.image_alt,
          isPrimary: true
        }] : []
      },
      variant: {
        id: item.variant_id,
        name: item.variant_name,
        price: item.variant_price,
        colorName: item.color_name,
        colorHex: item.color_hex,
        sizeName: item.size_name,
        stock: item.stock
      }
    }))
  } catch (error) {
    console.error('Error fetching user cart items:', error)
    return []
  }
}

export async function getGuestCartItems(sessionId: string) {
  try {
    const cartItems = await query(`
      SELECT 
        ci.*,
        p.name as product_name, p.description as product_description, p.category as product_category, p.base_price as product_base_price,
        pv.name as variant_name, pv.price as variant_price, pv.color_name, pv.color_hex, pv.size_name, pv.stock,
        pi.url as image_url, pi.alt_text as image_alt
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE ci.session_id = $1
      ORDER BY ci.created_at DESC
    `, [sessionId])

    return cartItems.map(item => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      customization: item.customization,
      product: {
        id: item.product_id,
        name: item.product_name,
        description: item.product_description,
        category: item.product_category,
        basePrice: item.product_base_price,
        images: item.image_url ? [{
          url: item.image_url,
          altText: item.image_alt,
          isPrimary: true
        }] : []
      },
      variant: {
        id: item.variant_id,
        name: item.variant_name,
        price: item.variant_price,
        colorName: item.color_name,
        colorHex: item.color_hex,
        sizeName: item.size_name,
        stock: item.stock
      }
    }))
  } catch (error) {
    console.error('Error fetching guest cart items:', error)
    return []
  }
}

export async function addToCart(
  userId: string | null,
  sessionId: string | null,
  productId: string,
  variantId: string,
  quantity: number,
  customization?: any
) {
  try {
    // Check if item already exists in cart
    let whereClause = 'WHERE product_id = $1 AND variant_id = $2'
    let params: any[] = [productId, variantId]
    
    if (userId) {
      whereClause += ' AND user_id = $3'
      params.push(userId)
    } else {
      whereClause += ' AND session_id = $3'
      params.push(sessionId)
    }

    const existingItems = await query(`
      SELECT * FROM cart_items ${whereClause}
    `, params)

    if (existingItems.length > 0) {
      // Update existing item
      const existingItem = existingItems[0]
      const updatedQuantity = existingItem.quantity + quantity
      const updatedCustomization = customization || existingItem.customization

      const updatedItems = await query(`
        UPDATE cart_items 
        SET quantity = $1, customization = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [updatedQuantity, JSON.stringify(updatedCustomization), existingItem.id])

      return updatedItems[0]
    } else {
      // Create new cart item
      const newItems = await query(`
        INSERT INTO cart_items (id, user_id, session_id, product_id, variant_id, quantity, customization, created_at, updated_at)
        VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [userId, sessionId, productId, variantId, quantity, JSON.stringify(customization)])

      return newItems[0]
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
    throw error
  }
}

export async function updateCartItem(itemId: string, quantity: number, userId?: string) {
  try {
    let whereClause = 'WHERE id = $1'
    let params: any[] = [itemId]
    
    if (userId) {
      whereClause += ' AND user_id = $2'
      params.push(userId)
    }

    const updatedItems = await query(`
      UPDATE cart_items 
      SET quantity = $${params.length + 1}, updated_at = CURRENT_TIMESTAMP
      ${whereClause}
      RETURNING *
    `, [...params, quantity])

    return updatedItems[0]
  } catch (error) {
    console.error('Error updating cart item:', error)
    throw error
  }
}

export async function removeFromCart(itemId: string, userId?: string) {
  try {
    let whereClause = 'WHERE id = $1'
    let params: any[] = [itemId]
    
    if (userId) {
      whereClause += ' AND user_id = $2'
      params.push(userId)
    }

    await query(`DELETE FROM cart_items ${whereClause}`, params)
  } catch (error) {
    console.error('Error removing from cart:', error)
    throw error
  }
}

export async function clearCart(userId: string | null, sessionId: string | null) {
  try {
    if (userId) {
      await query('DELETE FROM cart_items WHERE user_id = $1', [userId])
    } else if (sessionId) {
      await query('DELETE FROM cart_items WHERE session_id = $1', [sessionId])
    }
  } catch (error) {
    console.error('Error clearing cart:', error)
    throw error
  }
}

export async function transferGuestCartToUser(sessionId: string, userId: string) {
  try {
    // Get existing user cart items
    const userCartItems = await query(`
      SELECT id, product_id, variant_id, quantity 
      FROM cart_items 
      WHERE user_id = $1
    `, [userId])

    // Get guest cart items
    const guestCartItems = await query(`
      SELECT * FROM cart_items WHERE session_id = $1
    `, [sessionId])

    for (const guestItem of guestCartItems) {
      // Check if user already has this item
      const existingUserItem = userCartItems.find(
        (item: any) => item.product_id === guestItem.product_id && item.variant_id === guestItem.variant_id
      )

      if (existingUserItem) {
        // Update quantity of existing user item
        await query(`
          UPDATE cart_items 
          SET quantity = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [existingUserItem.quantity + guestItem.quantity, existingUserItem.id])

        // Delete guest item
        await query('DELETE FROM cart_items WHERE id = $1', [guestItem.id])
      } else {
        // Transfer guest item to user
        await query(`
          UPDATE cart_items 
          SET user_id = $1, session_id = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [userId, guestItem.id])
      }
    }
  } catch (error) {
    console.error('Error transferring guest cart to user:', error)
    throw error
  }
}

export async function cleanupOldCartItems() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await query(`
      DELETE FROM cart_items 
      WHERE updated_at < $1
    `, [thirtyDaysAgo])
  } catch (error) {
    console.error('Error cleaning up old cart items:', error)
    throw error
  }
}

// Order management functions
export async function createOrder({
  userId,
  sessionId,
  stripeSessionId,
  stripePaymentIntentId,
  subtotal,
  shipping,
  tax,
  total,
  currency,
  status,
  customerEmail,
  customerName,
  shippingAddress,
  billingAddress,
  metadata
}: {
  userId?: string
  sessionId?: string
  stripeSessionId: string
  stripePaymentIntentId?: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  currency: string
  status: string
  customerEmail: string
  customerName?: string
  shippingAddress?: any
  billingAddress?: any
  metadata?: any
}) {
  try {
    const orderRows = await query(`
      INSERT INTO orders (
        id, user_id, session_id, stripe_session_id, stripe_payment_intent_id,
        subtotal, shipping, tax, total, currency, status,
        customer_email, customer_name, shipping_address, billing_address,
        metadata, created_at, updated_at
      )
      VALUES (
        gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `, [
      userId || null,
      sessionId || null,
      stripeSessionId,
      stripePaymentIntentId || null,
      subtotal,
      shipping,
      tax,
      total,
      currency,
      status,
      customerEmail,
      customerName || null,
      shippingAddress ? JSON.stringify(shippingAddress) : null,
      billingAddress ? JSON.stringify(billingAddress) : null,
      metadata ? JSON.stringify(metadata) : null
    ])
    
    return orderRows[0]
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

export async function createOrderItem({
  orderId,
  productId,
  variantId,
  quantity,
  unitPrice,
  totalPrice,
  customization,
  fulfillmentStatus
}: {
  orderId: string
  productId: string
  variantId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  customization?: any
  fulfillmentStatus?: string
}) {
  try {
    const itemRows = await query(`
      INSERT INTO order_items (
        id, order_id, product_id, variant_id, quantity,
        unit_price, total_price, customization, fulfillment_status,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `, [
      orderId,
      productId,
      variantId,
      quantity,
      unitPrice,
      totalPrice,
      customization ? JSON.stringify(customization) : null,
      fulfillmentStatus || 'pending'
    ])
    
    return itemRows[0]
  } catch (error) {
    console.error('Error creating order item:', error)
    throw error
  }
}

export async function getOrderByStripeSessionId(stripeSessionId: string) {
  try {
    const orders = await query(
      'SELECT * FROM orders WHERE stripe_session_id = $1',
      [stripeSessionId]
    )
    return orders[0] || null
  } catch (error) {
    console.error('Error fetching order by Stripe session ID:', error)
    return null
  }
}

export async function updateOrderStatus(orderId: string, status: string, metadata?: any) {
  try {
    const updateParts = ['status = $2', 'updated_at = CURRENT_TIMESTAMP']
    const params = [orderId, status]
    
    if (metadata) {
      updateParts.push(`metadata = $${params.length + 1}`)
      params.push(JSON.stringify(metadata))
    }
    
    const orderRows = await query(`
      UPDATE orders 
      SET ${updateParts.join(', ')}
      WHERE id = $1
      RETURNING *
    `, params)
    
    return orderRows[0]
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

export async function getOrdersByUserId(userId: string) {
  try {
    const orders = await query(`
      SELECT o.*, 
        COUNT(oi.id) as item_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'variant_id', oi.variant_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'customization', oi.customization,
            'product_name', p.name,
            'variant_name', pv.name
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId])
    
    return orders
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return []
  }
}

export async function getOrderById(orderId: string) {
  try {
    const orders = await query(`
      SELECT o.*, 
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'variant_id', oi.variant_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'customization', oi.customization,
            'fulfillment_status', oi.fulfillment_status,
            'product_name', p.name,
            'product_description', p.description,
            'variant_name', pv.name,
            'image_url', pi.url
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE o.id = $1
      GROUP BY o.id
    `, [orderId])
    
    return orders[0] || null
  } catch (error) {
    console.error('Error fetching order by ID:', error)
    return null
  }
}

// Admin functions
export async function getAllUsers(limit = 50, offset = 0, search?: string) {
  try {
    let whereClause = ''
    const params: any[] = [limit, offset]
    
    if (search) {
      whereClause = 'WHERE email ILIKE $3 OR name ILIKE $3'
      params.push(`%${search}%`)
    }
    
    const users = await query(`
      SELECT id, email, name, image, role, created_at, updated_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count,
        (SELECT COUNT(*) FROM ai_usage_stats WHERE user_id = users.id) as ai_usage_count
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, params)
    
    const totalCount = await query(`
      SELECT COUNT(*) as count FROM users ${whereClause}
    `, search ? [`%${search}%`] : [])
    
    return {
      users,
      total: parseInt(totalCount[0]?.count || '0')
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0 }
  }
}

export async function updateUserRole(userId: string, role: string) {
  try {
    const users = await query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [role, userId]
    )
    return users[0]
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

export async function getAllOrders(limit = 50, offset = 0, status?: string) {
  try {
    let whereClause = ''
    const params: any[] = [limit, offset]
    
    if (status && status !== 'all') {
      whereClause = 'WHERE o.status = $3'
      params.push(status)
    }
    
    const orders = await query(`
      SELECT o.*, u.email as customer_email_user, u.name as customer_name_user,
        COUNT(oi.id) as item_count,
        SUM(oi.quantity) as total_items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, u.email, u.name
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `, params)
    
    const totalCount = await query(`
      SELECT COUNT(DISTINCT o.id) as count 
      FROM orders o 
      ${whereClause}
    `, status && status !== 'all' ? [status] : [])
    
    return {
      orders,
      total: parseInt(totalCount[0]?.count || '0')
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { orders: [], total: 0 }
  }
}

export async function getOrderAnalytics() {
  try {
    const analytics = await query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN total ELSE NULL END), 0) as avg_order_value,
        COUNT(DISTINCT user_id) as unique_customers
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)
    
    const monthlyRevenue = await query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `)
    
    return {
      overview: analytics[0] || {},
      dailyRevenue: monthlyRevenue
    }
  } catch (error) {
    console.error('Error fetching order analytics:', error)
    return { overview: {}, dailyRevenue: [] }
  }
}

export async function getAIUsageAnalytics() {
  try {
    const analytics = await query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        SUM(daily_count) as total_generations_today,
        SUM(monthly_count) as total_generations_month,
        AVG(daily_count) as avg_daily_per_user,
        COUNT(CASE WHEN tier = 'FREE' THEN 1 END) as free_tier_users,
        COUNT(CASE WHEN tier = 'REGISTERED' THEN 1 END) as registered_users,
        COUNT(CASE WHEN tier = 'PREMIUM' THEN 1 END) as premium_users
      FROM ai_usage_stats
      WHERE last_updated >= CURRENT_DATE
    `)
    
    const dailyUsage = await query(`
      SELECT 
        DATE_TRUNC('day', last_updated) as date,
        SUM(daily_count) as total_generations,
        COUNT(DISTINCT user_id) as active_users
      FROM ai_usage_stats
      WHERE last_updated >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', last_updated)
      ORDER BY date DESC
    `)
    
    return {
      overview: analytics[0] || {},
      dailyUsage
    }
  } catch (error) {
    console.error('Error fetching AI usage analytics:', error)
    return { overview: {}, dailyUsage: [] }
  }
}

export async function getSystemHealth() {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM cart_items WHERE created_at >= CURRENT_DATE) as active_carts_today,
        (SELECT COUNT(*) FROM ai_usage_stats WHERE last_updated >= CURRENT_DATE - INTERVAL '1 hour') as active_ai_users_hour
    `)
    
    return stats[0] || {}
  } catch (error) {
    console.error('Error fetching system health:', error)
    return {}
  }
}

export async function createProduct({
  name,
  description,
  category,
  basePrice,
  isActive = true
}: {
  name: string
  description: string
  category: string
  basePrice: number
  isActive?: boolean
}) {
  try {
    const products = await query(`
      INSERT INTO products (id, name, description, category, base_price, is_active, created_at, updated_at)
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [name, description, category, basePrice, isActive])
    
    return products[0]
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

export async function updateProduct(id: string, updates: {
  name?: string
  description?: string
  category?: string
  basePrice?: number
  isActive?: boolean
}) {
  try {
    const setParts = []
    const params = [id]
    let paramIndex = 2
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const columnName = key === 'basePrice' ? 'base_price' : 
                          key === 'isActive' ? 'is_active' : key
        setParts.push(`${columnName} = $${paramIndex}`)
        params.push(value)
        paramIndex++
      }
    }
    
    if (setParts.length === 0) {
      throw new Error('No updates provided')
    }
    
    setParts.push('updated_at = CURRENT_TIMESTAMP')
    
    const products = await query(`
      UPDATE products 
      SET ${setParts.join(', ')}
      WHERE id = $1
      RETURNING *
    `, params)
    
    return products[0]
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

// Design management functions
export async function createDesign({
  userId,
  name,
  description,
  imageUrl,
  designData,
  productType,
  isPublic = false
}: {
  userId: string
  name: string
  description?: string
  imageUrl: string
  designData: string
  productType: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
  isPublic?: boolean
}) {
  try {
    const designs = await query(`
      INSERT INTO designs (id, user_id, name, description, image_url, design_data, product_type, is_public, created_at, updated_at)
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [userId, name, description, imageUrl, designData, productType, isPublic])
    
    return designs[0]
  } catch (error) {
    console.error('Error creating design:', error)
    throw error
  }
}

export async function getUserDesigns(userId: string, limit = 20, offset = 0) {
  try {
    const designs = await query(`
      SELECT * FROM designs 
      WHERE user_id = $1 
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset])
    
    return designs
  } catch (error) {
    console.error('Error fetching user designs:', error)
    return []
  }
}

export async function getDesignById(designId: string, userId?: string) {
  try {
    let whereClause = 'WHERE d.id = $1'
    const params = [designId]
    
    if (userId) {
      whereClause += ' AND (d.user_id = $2 OR d.is_public = true)'
      params.push(userId)
    } else {
      whereClause += ' AND d.is_public = true'
    }
    
    const designs = await query(`
      SELECT d.*, u.name as user_name, u.email as user_email
      FROM designs d
      LEFT JOIN users u ON d.user_id = u.id
      ${whereClause}
    `, params)
    
    return designs[0] || null
  } catch (error) {
    console.error('Error fetching design by ID:', error)
    return null
  }
}

export async function updateDesign(designId: string, userId: string, updates: {
  name?: string
  description?: string
  imageUrl?: string
  designData?: string
  isPublic?: boolean
}) {
  try {
    const setParts = []
    const params = [designId, userId]
    let paramIndex = 3
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const columnName = key === 'imageUrl' ? 'image_url' : 
                          key === 'designData' ? 'design_data' :
                          key === 'isPublic' ? 'is_public' : key
        setParts.push(`${columnName} = $${paramIndex}`)
        params.push(value)
        paramIndex++
      }
    }
    
    if (setParts.length === 0) {
      throw new Error('No updates provided')
    }
    
    setParts.push('updated_at = CURRENT_TIMESTAMP')
    
    const designs = await query(`
      UPDATE designs 
      SET ${setParts.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, params)
    
    return designs[0]
  } catch (error) {
    console.error('Error updating design:', error)
    throw error
  }
}

export async function deleteDesign(designId: string, userId: string) {
  try {
    const result = await query(`
      DELETE FROM designs 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [designId, userId])
    
    return result[0]
  } catch (error) {
    console.error('Error deleting design:', error)
    throw error
  }
}

export async function getPublicDesigns(productType?: string, limit = 20, offset = 0) {
  try {
    let whereClause = 'WHERE is_public = true'
    const params = [limit, offset]
    
    if (productType) {
      whereClause += ' AND product_type = $3'
      params.splice(2, 0, productType)
    }
    
    const designs = await query(`
      SELECT d.*, u.name as user_name
      FROM designs d
      LEFT JOIN users u ON d.user_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2
    `, params)
    
    return designs
  } catch (error) {
    console.error('Error fetching public designs:', error)
    return []
  }
}

export default pool