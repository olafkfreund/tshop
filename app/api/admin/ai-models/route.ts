import { NextRequest, NextResponse } from 'next/server'
import { adminApiRoute } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

// AI Model configuration and management
export const GET = adminApiRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'models':
        return await getAIModels()
      case 'usage':
        return await getAIUsage()
      case 'costs':
        return await getAICosts()
      case 'settings':
        return await getAISettings()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error in AI models admin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI data' },
      { status: 500 }
    )
  }
})

export const POST = adminApiRoute(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { action, modelId, settings, limits } = body

    switch (action) {
      case 'enable_model':
        return await enableAIModel(modelId, settings)
      
      case 'disable_model':
        return await disableAIModel(modelId)
      
      case 'update_limits':
        return await updateAILimits(limits)
      
      case 'update_pricing':
        return await updateAIPricing(body.pricing)
      
      case 'update_prompts':
        return await updateSystemPrompts(body.prompts)
      
      case 'moderate_content':
        return await moderateContent(body.contentId, body.action)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error updating AI models:', error)
    return NextResponse.json(
      { error: 'Failed to update AI models' },
      { status: 500 }
    )
  }
})

async function getAIModels() {
  // In a production system, this would be stored in database
  const models = [
    {
      id: 'gemini-pro',
      name: 'Google Gemini Pro',
      provider: 'Google',
      type: 'text-to-image',
      status: 'active',
      costPerRequest: 0.002,
      avgResponseTime: '3.2s',
      successRate: 98.5,
      dailyRequests: 1247,
      dailyCost: 2.49,
      features: ['high-quality', 'fast', 'apparel-optimized'],
      limits: {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
        maxImageSize: '2048x2048',
      },
    },
    {
      id: 'dalle-3',
      name: 'DALL-E 3',
      provider: 'OpenAI',
      type: 'text-to-image',
      status: 'disabled',
      costPerRequest: 0.04,
      avgResponseTime: '8.1s',
      successRate: 96.2,
      dailyRequests: 0,
      dailyCost: 0,
      features: ['creative', 'artistic', 'detailed'],
      limits: {
        requestsPerMinute: 10,
        requestsPerDay: 1000,
        maxImageSize: '1024x1024',
      },
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      provider: 'Midjourney',
      type: 'text-to-image',
      status: 'testing',
      costPerRequest: 0.025,
      avgResponseTime: '15.3s',
      successRate: 94.8,
      dailyRequests: 23,
      dailyCost: 0.58,
      features: ['artistic', 'photorealistic', 'style-variety'],
      limits: {
        requestsPerMinute: 5,
        requestsPerDay: 500,
        maxImageSize: '2048x2048',
      },
    },
  ]

  return NextResponse.json({
    success: true,
    data: { models },
  })
}

async function getAIUsage() {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  // Get usage from analytics events
  const usage = await prisma.analyticsEvent.findMany({
    where: {
      eventType: 'AI_GENERATION',
      createdAt: { gte: last30Days },
    },
    select: {
      createdAt: true,
      properties: true,
      userId: true,
      teamId: true,
    },
  })

  // Process usage data
  const dailyUsage = usage.reduce((acc: any, event) => {
    const date = event.createdAt.toISOString().split('T')[0]
    if (!acc[date]) acc[date] = { date, requests: 0, cost: 0, users: new Set() }
    
    acc[date].requests++
    acc[date].cost += 0.002 // Mock cost calculation
    if (event.userId) acc[date].users.add(event.userId)
    
    return acc
  }, {})

  // Convert to array and add unique user counts
  const dailyUsageArray = Object.values(dailyUsage).map((day: any) => ({
    ...day,
    uniqueUsers: day.users.size,
    users: undefined,
  }))

  const topUsers = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          designs: {
            where: {
              createdAt: { gte: last30Days },
              metadata: {
                path: ['createdViaAI'],
                equals: true,
              },
            },
          },
        },
      },
    },
    orderBy: {
      designs: {
        _count: 'desc',
      },
    },
    take: 10,
  })

  return NextResponse.json({
    success: true,
    data: {
      totalRequests: usage.length,
      totalCost: usage.length * 0.002,
      avgCostPerRequest: 0.002,
      dailyUsage: dailyUsageArray,
      topUsers: topUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        aiGenerations: user._count.designs,
        estimatedCost: user._count.designs * 0.002,
      })),
    },
  })
}

async function getAICosts() {
  const costs = {
    monthly: {
      current: 847.32,
      budget: 2000,
      previousMonth: 623.18,
      trend: '+35.9%',
    },
    breakdown: [
      { model: 'Gemini Pro', cost: 567.84, percentage: 67.0, requests: 283920 },
      { model: 'DALL-E 3', cost: 156.24, percentage: 18.4, requests: 3906 },
      { model: 'Midjourney', cost: 123.24, percentage: 14.6, requests: 4929 },
    ],
    predictions: {
      endOfMonth: 1243.67,
      willExceedBudget: false,
      recommendedBudget: 1500,
    },
  }

  return NextResponse.json({
    success: true,
    data: costs,
  })
}

async function getAISettings() {
  const settings = {
    global: {
      enableAI: true,
      fallbackModel: 'gemini-pro',
      maxRetries: 3,
      timeout: 30000,
      contentFilter: true,
      logRequests: true,
    },
    limits: {
      free: { daily: 2, monthly: 50 },
      registered: { daily: 10, monthly: 200 },
      premium: { daily: 50, monthly: 1000 },
      enterprise: { daily: 200, monthly: 5000 },
    },
    prompts: {
      system: "You are an AI assistant that creates apparel designs. Focus on trendy, marketable designs suitable for t-shirts, caps, and tote bags.",
      safety: "Avoid creating designs with offensive content, copyrighted material, or inappropriate imagery.",
      quality: "Ensure designs are high-quality, print-ready, and optimized for the specified product type.",
    },
    contentModeration: {
      enableAutoModeration: true,
      flagKeywords: ['violence', 'hate', 'nsfw', 'copyright'],
      humanReviewRequired: true,
      autoRejectThreshold: 0.8,
    },
  }

  return NextResponse.json({
    success: true,
    data: settings,
  })
}

async function enableAIModel(modelId: string, settings: any) {
  // In production, this would update model configuration in database
  console.log(`Enabling AI model: ${modelId}`, settings)
  
  return NextResponse.json({
    success: true,
    message: `AI model ${modelId} enabled successfully`,
  })
}

async function disableAIModel(modelId: string) {
  console.log(`Disabling AI model: ${modelId}`)
  
  return NextResponse.json({
    success: true,
    message: `AI model ${modelId} disabled successfully`,
  })
}

async function updateAILimits(limits: any) {
  console.log('Updating AI limits:', limits)
  
  return NextResponse.json({
    success: true,
    message: 'AI limits updated successfully',
  })
}

async function updateAIPricing(pricing: any) {
  console.log('Updating AI pricing:', pricing)
  
  return NextResponse.json({
    success: true,
    message: 'AI pricing updated successfully',
  })
}

async function updateSystemPrompts(prompts: any) {
  console.log('Updating system prompts:', prompts)
  
  return NextResponse.json({
    success: true,
    message: 'System prompts updated successfully',
  })
}

async function moderateContent(contentId: string, action: 'approve' | 'reject' | 'flag') {
  // Update design status based on moderation action
  const statusMap = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    flag: 'UNDER_REVIEW',
  }

  await prisma.design.update({
    where: { id: contentId },
    data: { 
      status: statusMap[action],
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({
    success: true,
    message: `Content ${action}ed successfully`,
  })
}