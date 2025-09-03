import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

export interface PartnerApiKey {
  id: string
  teamId: string
  name: string
  permissions: string[]
  rateLimit: number
  isActive: boolean
  team: {
    id: string
    name: string
    plan: string
  }
}

export interface RateLimitInfo {
  remaining: number
  resetTime: number
  limit: number
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  const prefix = 'tshop_'
  const random = crypto.randomBytes(32).toString('hex')
  return `${prefix}${random}`
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Verify and authenticate a partner API request
 */
export async function authenticatePartnerRequest(request: NextRequest): Promise<{
  success: boolean
  apiKey?: PartnerApiKey
  error?: string
}> {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid Authorization header' }
    }

    const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!apiKey.startsWith('tshop_')) {
      return { success: false, error: 'Invalid API key format' }
    }

    // Hash the provided key to compare with stored hash
    const hashedKey = hashApiKey(apiKey)

    // Find the API key in database
    const keyRecord = await prisma.partnerApiKey.findFirst({
      where: {
        keyHash: hashedKey,
        isActive: true,
        revokedAt: null,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
      },
    })

    if (!keyRecord) {
      return { success: false, error: 'Invalid or revoked API key' }
    }

    // Update last used timestamp
    await prisma.partnerApiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    })

    return {
      success: true,
      apiKey: {
        id: keyRecord.id,
        teamId: keyRecord.teamId,
        name: keyRecord.name,
        permissions: keyRecord.permissions,
        rateLimit: keyRecord.rateLimit,
        isActive: keyRecord.isActive,
        team: keyRecord.team,
      },
    }

  } catch (error: any) {
    console.error('Partner authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Check if API key has required permission
 */
export function hasPermission(apiKey: PartnerApiKey, permission: string): boolean {
  return apiKey.permissions.includes(permission)
}

/**
 * Check and enforce rate limiting
 */
export async function checkRateLimit(apiKeyId: string, rateLimit: number): Promise<{
  allowed: boolean
  rateLimitInfo: RateLimitInfo
}> {
  try {
    const now = Date.now()
    const hourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000)

    // Get or create usage record for current hour
    let usage = await prisma.partnerApiUsage.findFirst({
      where: {
        apiKeyId,
        periodStart: new Date(hourStart),
      },
    })

    if (!usage) {
      usage = await prisma.partnerApiUsage.create({
        data: {
          apiKeyId,
          periodStart: new Date(hourStart),
          requestCount: 0,
          lastRequestAt: new Date(now),
        },
      })
    }

    const remaining = Math.max(0, rateLimit - usage.requestCount)
    const resetTime = hourStart + (60 * 60 * 1000) // Next hour

    if (usage.requestCount >= rateLimit) {
      return {
        allowed: false,
        rateLimitInfo: {
          remaining: 0,
          resetTime,
          limit: rateLimit,
        },
      }
    }

    // Increment request count
    await prisma.partnerApiUsage.update({
      where: { id: usage.id },
      data: {
        requestCount: usage.requestCount + 1,
        lastRequestAt: new Date(now),
      },
    })

    return {
      allowed: true,
      rateLimitInfo: {
        remaining: remaining - 1,
        resetTime,
        limit: rateLimit,
      },
    }

  } catch (error: any) {
    console.error('Rate limiting error:', error)
    // Allow request on error to avoid blocking legitimate traffic
    return {
      allowed: true,
      rateLimitInfo: {
        remaining: 100,
        resetTime: Date.now() + (60 * 60 * 1000),
        limit: rateLimit,
      },
    }
  }
}

/**
 * Validate partner webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    const providedSignature = signature.startsWith('sha256=') 
      ? signature.substring(7) 
      : signature

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )
  } catch (error) {
    return false
  }
}

/**
 * Create partner webhook event
 */
export async function createWebhookEvent(
  teamId: string,
  eventType: string,
  data: any
): Promise<void> {
  try {
    // Get active webhook endpoints for the team
    const webhooks = await prisma.partnerWebhook.findMany({
      where: {
        teamId,
        isActive: true,
        events: {
          has: eventType,
        },
      },
    })

    // Create webhook deliveries
    for (const webhook of webhooks) {
      await prisma.partnerWebhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType,
          payload: JSON.stringify(data),
          status: 'PENDING',
          scheduledFor: new Date(),
        },
      })
    }

  } catch (error: any) {
    console.error('Error creating webhook event:', error)
  }
}

/**
 * Get partner API usage statistics
 */
export async function getApiUsageStats(apiKeyId: string, days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const usage = await prisma.partnerApiUsage.findMany({
      where: {
        apiKeyId,
        periodStart: {
          gte: startDate,
        },
      },
      orderBy: {
        periodStart: 'asc',
      },
    })

    const totalRequests = usage.reduce((sum, record) => sum + record.requestCount, 0)
    const avgRequestsPerHour = usage.length > 0 ? totalRequests / usage.length : 0

    return {
      totalRequests,
      avgRequestsPerHour: Math.round(avgRequestsPerHour),
      dailyUsage: groupUsageByDay(usage),
      peakHour: findPeakHour(usage),
    }

  } catch (error: any) {
    console.error('Error getting API usage stats:', error)
    return {
      totalRequests: 0,
      avgRequestsPerHour: 0,
      dailyUsage: [],
      peakHour: null,
    }
  }
}

function groupUsageByDay(usage: any[]) {
  const dailyUsage = new Map<string, number>()

  for (const record of usage) {
    const day = record.periodStart.toISOString().split('T')[0]
    dailyUsage.set(day, (dailyUsage.get(day) || 0) + record.requestCount)
  }

  return Array.from(dailyUsage.entries()).map(([date, requests]) => ({
    date,
    requests,
  }))
}

function findPeakHour(usage: any[]) {
  if (usage.length === 0) return null

  const peakRecord = usage.reduce((peak, current) => 
    current.requestCount > peak.requestCount ? current : peak
  )

  return {
    hour: peakRecord.periodStart.getHours(),
    requests: peakRecord.requestCount,
    date: peakRecord.periodStart,
  }
}

/**
 * Partner middleware for API routes
 */
export async function withPartnerAuth(
  request: NextRequest,
  requiredPermission: string,
  handler: (apiKey: PartnerApiKey, request: NextRequest) => Promise<Response>
): Promise<Response> {
  // Authenticate the request
  const authResult = await authenticatePartnerRequest(request)
  
  if (!authResult.success || !authResult.apiKey) {
    return new Response(
      JSON.stringify({ error: authResult.error || 'Authentication failed' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Check permissions
  if (!hasPermission(authResult.apiKey, requiredPermission)) {
    return new Response(
      JSON.stringify({ error: `Missing required permission: ${requiredPermission}` }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Check rate limiting
  const rateLimitResult = await checkRateLimit(
    authResult.apiKey.id, 
    authResult.apiKey.rateLimit
  )

  const response = rateLimitResult.allowed 
    ? await handler(authResult.apiKey, request)
    : new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      )

  // Add rate limit headers
  const headers = new Headers(response.headers)
  headers.set('X-RateLimit-Limit', rateLimitResult.rateLimitInfo.limit.toString())
  headers.set('X-RateLimit-Remaining', rateLimitResult.rateLimitInfo.remaining.toString())
  headers.set('X-RateLimit-Reset', rateLimitResult.rateLimitInfo.resetTime.toString())

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}