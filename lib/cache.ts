import { Redis } from '@upstash/redis'
import { revalidateTag } from 'next/cache'

// Redis client for caching (optional - falls back to in-memory)
let redis: Redis | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

// In-memory cache as fallback
const memoryCache = new Map<string, { value: any; expires: number }>()

// Cache configuration
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: (id: string) => `product:${id}`,
  USER_CART: (userId: string) => `cart:${userId}`,
  GUEST_CART: (sessionId: string) => `cart:guest:${sessionId}`,
  USER_DESIGNS: (userId: string) => `designs:${userId}`,
  AI_USAGE: (userId: string) => `ai_usage:${userId}`,
  ORDER: (id: string) => `order:${id}`,
  FULFILLMENT_QUOTE: (productId: string, variantId: string) => `quote:${productId}:${variantId}`,
} as const

export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 2 * 60 * 60, // 2 hours
  VERY_LONG: 24 * 60 * 60, // 24 hours
} as const

export const CACHE_TAGS = {
  PRODUCTS: 'products',
  PRODUCT: (id: string) => `product-${id}`,
  USER: (id: string) => `user-${id}`,
  ORDER: (id: string) => `order-${id}`,
  CART: 'cart',
  DESIGNS: 'designs',
} as const

/**
 * Get value from cache
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const value = await redis.get(key)
      return value as T
    }

    // Fallback to memory cache
    const cached = memoryCache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.value as T
    }

    return null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set value in cache
 */
export async function setInCache(
  key: string,
  value: any,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<void> {
  try {
    if (redis) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
      return
    }

    // Fallback to memory cache
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    })
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

/**
 * Delete from cache
 */
export async function deleteFromCache(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key)
      return
    }

    // Fallback to memory cache
    memoryCache.delete(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

/**
 * Delete multiple keys with pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    if (redis) {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      return
    }

    // Fallback to memory cache
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        memoryCache.delete(key)
      }
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error)
  }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  try {
    if (redis) {
      await redis.flushall()
      return
    }

    // Fallback to memory cache
    memoryCache.clear()
  } catch (error) {
    console.error('Cache clear error:', error)
  }
}

/**
 * Cache wrapper for functions
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<T> {
  const cached = await getFromCache<T>(key)
  if (cached !== null) {
    return cached
  }

  const result = await fetcher()
  await setInCache(key, result, ttlSeconds)
  return result
}

/**
 * Memory cleanup for in-memory cache
 */
function cleanupMemoryCache() {
  const now = Date.now()
  for (const [key, value] of memoryCache.entries()) {
    if (value.expires <= now) {
      memoryCache.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupMemoryCache, 5 * 60 * 1000)
}

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  products: () => revalidateTag(CACHE_TAGS.PRODUCTS),
  product: (id: string) => revalidateTag(CACHE_TAGS.PRODUCT(id)),
  user: (id: string) => revalidateTag(CACHE_TAGS.USER(id)),
  order: (id: string) => revalidateTag(CACHE_TAGS.ORDER(id)),
  cart: () => revalidateTag(CACHE_TAGS.CART),
  designs: () => revalidateTag(CACHE_TAGS.DESIGNS),
}

/**
 * Cached database queries
 */
export const cachedQueries = {
  async getProducts() {
    return withCache(
      CACHE_KEYS.PRODUCTS,
      async () => {
        const { prisma } = await import('@/lib/db')
        return prisma.product.findMany({
          include: {
            variants: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        })
      },
      CACHE_TTL.LONG
    )
  },

  async getProduct(id: string) {
    return withCache(
      CACHE_KEYS.PRODUCT(id),
      async () => {
        const { prisma } = await import('@/lib/db')
        return prisma.product.findUnique({
          where: { id },
          include: {
            variants: true,
            images: true,
            category: true,
          },
        })
      },
      CACHE_TTL.LONG
    )
  },

  async getUserCart(userId: string) {
    return withCache(
      CACHE_KEYS.USER_CART(userId),
      async () => {
        const { CartService } = await import('@/lib/cart')
        return CartService.getUserCart(userId)
      },
      CACHE_TTL.SHORT // Short TTL for cart data
    )
  },

  async getUserDesigns(userId: string) {
    return withCache(
      CACHE_KEYS.USER_DESIGNS(userId),
      async () => {
        const { prisma } = await import('@/lib/db')
        return prisma.design.findMany({
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
      },
      CACHE_TTL.MEDIUM
    )
  },

  async getAIUsage(userId: string) {
    return withCache(
      CACHE_KEYS.AI_USAGE(userId),
      async () => {
        const { prisma } = await import('@/lib/db')
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        return prisma.aIUsage.count({
          where: {
            userId,
            createdAt: {
              gte: startOfMonth,
            },
          },
        })
      },
      CACHE_TTL.SHORT
    )
  },
}