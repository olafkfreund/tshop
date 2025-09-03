import { NextRequest, NextResponse } from 'next/server'
import { adminApiRoute } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

// Third-party integrations management
export const GET = adminApiRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'list':
        return await getIntegrations()
      case 'webhooks':
        return await getWebhooks()
      case 'api_keys':
        return await getApiKeys()
      case 'fulfillment':
        return await getFulfillmentProviders()
      case 'payment':
        return await getPaymentProviders()
      case 'analytics':
        return await getIntegrationsAnalytics()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error in integrations admin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration data' },
      { status: 500 }
    )
  }
})

export const POST = adminApiRoute(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { action, integrationId, config, status } = body

    switch (action) {
      case 'enable_integration':
        return await enableIntegration(integrationId, config)
      
      case 'disable_integration':
        return await disableIntegration(integrationId)
      
      case 'update_config':
        return await updateIntegrationConfig(integrationId, config)
      
      case 'test_connection':
        return await testIntegrationConnection(integrationId, config)
      
      case 'sync_data':
        return await syncIntegrationData(integrationId)
      
      case 'revoke_api_key':
        return await revokeApiKey(body.keyId)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error managing integrations:', error)
    return NextResponse.json(
      { error: 'Failed to manage integration' },
      { status: 500 }
    )
  }
})

async function getIntegrations() {
  const integrations = [
    {
      id: 'printful',
      name: 'Printful',
      category: 'fulfillment',
      description: 'Print-on-demand fulfillment and dropshipping',
      status: 'active',
      isConfigured: true,
      lastSync: new Date('2024-01-15T10:30:00Z'),
      health: 'healthy',
      config: {
        apiKey: '***HIDDEN***',
        webhookUrl: 'https://api.tshop.com/webhooks/printful',
        autoFulfill: true,
        stockSync: true,
      },
      metrics: {
        ordersProcessed: 1247,
        errorRate: 0.2,
        avgProcessingTime: '2.3 hours',
        lastError: null,
      },
    },
    {
      id: 'printify',
      name: 'Printify',
      category: 'fulfillment',
      description: 'Cost-effective print-on-demand fulfillment',
      status: 'active',
      isConfigured: true,
      lastSync: new Date('2024-01-15T09:45:00Z'),
      health: 'healthy',
      config: {
        apiKey: '***HIDDEN***',
        webhookUrl: 'https://api.tshop.com/webhooks/printify',
        autoFulfill: true,
        stockSync: true,
      },
      metrics: {
        ordersProcessed: 823,
        errorRate: 0.5,
        avgProcessingTime: '3.1 hours',
        lastError: null,
      },
    },
    {
      id: 'stripe',
      name: 'Stripe',
      category: 'payment',
      description: 'Payment processing and billing',
      status: 'active',
      isConfigured: true,
      lastSync: new Date('2024-01-15T11:00:00Z'),
      health: 'healthy',
      config: {
        publishableKey: 'pk_live_***',
        secretKey: '***HIDDEN***',
        webhookSecret: '***HIDDEN***',
        currency: 'USD',
      },
      metrics: {
        transactionsProcessed: 3456,
        errorRate: 0.1,
        avgProcessingTime: '1.2 seconds',
        lastError: null,
      },
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      category: 'analytics',
      description: 'Web analytics and user behavior tracking',
      status: 'active',
      isConfigured: true,
      lastSync: new Date('2024-01-15T11:15:00Z'),
      health: 'healthy',
      config: {
        measurementId: 'G-XXXXXXXXXX',
        gtmId: 'GTM-XXXXXXX',
        enhancedEcommerce: true,
      },
      metrics: {
        eventsTracked: 89234,
        errorRate: 0.0,
        avgProcessingTime: '0.1 seconds',
        lastError: null,
      },
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      category: 'marketing',
      description: 'Email marketing and automation',
      status: 'disabled',
      isConfigured: false,
      lastSync: null,
      health: 'not_configured',
      config: {},
      metrics: {
        emailsSent: 0,
        errorRate: 0,
        avgProcessingTime: 'N/A',
        lastError: 'API key not configured',
      },
    },
    {
      id: 'facebook-pixel',
      name: 'Facebook Pixel',
      category: 'analytics',
      description: 'Facebook ads tracking and optimization',
      status: 'testing',
      isConfigured: true,
      lastSync: new Date('2024-01-15T10:00:00Z'),
      health: 'warning',
      config: {
        pixelId: '1234567890123456',
        accessToken: '***HIDDEN***',
        testEvents: true,
      },
      metrics: {
        eventsTracked: 5678,
        errorRate: 2.3,
        avgProcessingTime: '0.5 seconds',
        lastError: 'Test mode active',
      },
    },
  ]

  return NextResponse.json({
    success: true,
    data: { integrations },
  })
}

async function getWebhooks() {
  const webhooks = await prisma.partnerWebhook.findMany({
    include: {
      team: {
        select: { id: true, name: true },
      },
      _count: {
        select: { deliveries: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const systemWebhooks = [
    {
      id: 'system-printful',
      url: 'https://api.tshop.com/webhooks/printful',
      events: ['order.created', 'order.updated', 'order.shipped'],
      isActive: true,
      isSystem: true,
      team: { name: 'System' },
      deliveries: 1247,
      successRate: 99.8,
      lastDelivery: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: 'system-stripe',
      url: 'https://api.tshop.com/webhooks/stripe',
      events: ['payment.succeeded', 'payment.failed', 'subscription.updated'],
      isActive: true,
      isSystem: true,
      team: { name: 'System' },
      deliveries: 3456,
      successRate: 99.9,
      lastDelivery: new Date('2024-01-15T11:00:00Z'),
    },
  ]

  const formattedWebhooks = [
    ...systemWebhooks,
    ...webhooks.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      isSystem: false,
      team: webhook.team,
      deliveries: webhook._count.deliveries,
      successRate: 95, // Mock calculation
      lastDelivery: webhook.updatedAt,
    })),
  ]

  return NextResponse.json({
    success: true,
    data: { webhooks: formattedWebhooks },
  })
}

async function getApiKeys() {
  const apiKeys = await prisma.partnerApiKey.findMany({
    include: {
      team: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const formattedKeys = apiKeys.map(key => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    permissions: key.permissions,
    rateLimit: key.rateLimit,
    isActive: key.isActive,
    team: key.team,
    lastUsedAt: key.lastUsedAt,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    // Calculate usage stats
    dailyUsage: Math.floor(Math.random() * key.rateLimit * 0.8), // Mock usage
    monthlyUsage: Math.floor(Math.random() * key.rateLimit * 24 * 30 * 0.6),
  }))

  return NextResponse.json({
    success: true,
    data: { apiKeys: formattedKeys },
  })
}

async function getFulfillmentProviders() {
  const providers = [
    {
      id: 'printful',
      name: 'Printful',
      status: 'active',
      priority: 1,
      isDefault: true,
      capabilities: ['t-shirts', 'caps', 'tote-bags', 'international-shipping'],
      pricing: 'premium',
      avgCost: 12.50,
      avgDeliveryTime: '7-12 days',
      qualityScore: 9.2,
      orderVolume: 1247,
      errorRate: 0.2,
      config: {
        autoFulfill: true,
        stockSync: true,
        priceMarkup: 15, // percentage
      },
    },
    {
      id: 'printify',
      name: 'Printify',
      status: 'active',
      priority: 2,
      isDefault: false,
      capabilities: ['t-shirts', 'caps', 'tote-bags', 'budget-options'],
      pricing: 'budget',
      avgCost: 8.75,
      avgDeliveryTime: '8-15 days',
      qualityScore: 7.8,
      orderVolume: 823,
      errorRate: 0.5,
      config: {
        autoFulfill: true,
        stockSync: true,
        priceMarkup: 25, // percentage
      },
    },
    {
      id: 'gooten',
      name: 'Gooten',
      status: 'disabled',
      priority: 3,
      isDefault: false,
      capabilities: ['t-shirts', 'custom-products', 'bulk-orders'],
      pricing: 'variable',
      avgCost: 10.25,
      avgDeliveryTime: '10-18 days',
      qualityScore: 8.1,
      orderVolume: 0,
      errorRate: 0,
      config: {
        autoFulfill: false,
        stockSync: false,
        priceMarkup: 20,
      },
    },
  ]

  return NextResponse.json({
    success: true,
    data: { providers },
  })
}

async function getPaymentProviders() {
  const providers = [
    {
      id: 'stripe',
      name: 'Stripe',
      status: 'active',
      isDefault: true,
      capabilities: ['cards', 'digital-wallets', 'subscriptions', 'international'],
      fees: { percentage: 2.9, fixed: 0.30 },
      volume: {
        transactions: 3456,
        revenue: 125678.90,
        avgAmount: 36.35,
      },
      successRate: 98.7,
      config: {
        currency: 'USD',
        captureMethod: 'automatic',
        statementDescriptor: 'TSHOP*',
      },
    },
    {
      id: 'paypal',
      name: 'PayPal',
      status: 'disabled',
      isDefault: false,
      capabilities: ['paypal-account', 'pay-later', 'international'],
      fees: { percentage: 3.2, fixed: 0.00 },
      volume: {
        transactions: 0,
        revenue: 0,
        avgAmount: 0,
      },
      successRate: 0,
      config: {
        environment: 'sandbox',
        clientId: 'not_configured',
      },
    },
  ]

  return NextResponse.json({
    success: true,
    data: { providers },
  })
}

async function getIntegrationsAnalytics() {
  const analytics = {
    overview: {
      totalIntegrations: 6,
      activeIntegrations: 4,
      healthyIntegrations: 3,
      failingIntegrations: 0,
      totalApiCalls: 15678,
      errorRate: 0.3,
    },
    usage: {
      daily: [
        { date: '2024-01-10', apiCalls: 1234, errors: 5 },
        { date: '2024-01-11', apiCalls: 1456, errors: 3 },
        { date: '2024-01-12', apiCalls: 1345, errors: 7 },
        { date: '2024-01-13', apiCalls: 1567, errors: 2 },
        { date: '2024-01-14', apiCalls: 1789, errors: 4 },
        { date: '2024-01-15', apiCalls: 1432, errors: 1 },
      ],
    },
    topIntegrations: [
      { name: 'Stripe', calls: 5678, errors: 3, uptime: 99.9 },
      { name: 'Google Analytics', calls: 4321, errors: 0, uptime: 100 },
      { name: 'Printful', calls: 3456, errors: 8, uptime: 99.7 },
      { name: 'Printify', calls: 2123, errors: 12, uptime: 99.4 },
    ],
    costs: {
      monthly: 234.56,
      breakdown: [
        { integration: 'Google Analytics', cost: 0.00 },
        { integration: 'Stripe', cost: 156.78 },
        { integration: 'Printful', cost: 45.32 },
        { integration: 'Printify', cost: 32.46 },
      ],
    },
  }

  return NextResponse.json({
    success: true,
    data: analytics,
  })
}

async function enableIntegration(integrationId: string, config: any) {
  console.log(`Enabling integration: ${integrationId}`, config)
  
  // In production, this would update integration settings
  return NextResponse.json({
    success: true,
    message: `Integration ${integrationId} enabled successfully`,
  })
}

async function disableIntegration(integrationId: string) {
  console.log(`Disabling integration: ${integrationId}`)
  
  return NextResponse.json({
    success: true,
    message: `Integration ${integrationId} disabled successfully`,
  })
}

async function updateIntegrationConfig(integrationId: string, config: any) {
  console.log(`Updating config for integration: ${integrationId}`, config)
  
  return NextResponse.json({
    success: true,
    message: `Integration ${integrationId} configuration updated`,
  })
}

async function testIntegrationConnection(integrationId: string, config: any) {
  console.log(`Testing connection for integration: ${integrationId}`)
  
  // Mock connection test
  const success = Math.random() > 0.1 // 90% success rate
  
  if (success) {
    return NextResponse.json({
      success: true,
      message: 'Connection test successful',
      data: {
        responseTime: Math.floor(Math.random() * 500 + 100) + 'ms',
        status: 'connected',
      },
    })
  } else {
    return NextResponse.json({
      success: false,
      message: 'Connection test failed',
      error: 'Invalid API credentials',
    }, { status: 400 })
  }
}

async function syncIntegrationData(integrationId: string) {
  console.log(`Syncing data for integration: ${integrationId}`)
  
  return NextResponse.json({
    success: true,
    message: `Data sync initiated for ${integrationId}`,
    data: {
      syncId: 'sync_' + Date.now(),
      estimatedTime: '2-5 minutes',
    },
  })
}

async function revokeApiKey(keyId: string) {
  await prisma.partnerApiKey.update({
    where: { id: keyId },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  })

  return NextResponse.json({
    success: true,
    message: 'API key revoked successfully',
  })
}