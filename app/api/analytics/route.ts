import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { RateLimiter } from '@/lib/performance'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.ip || 
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
      
    const rateLimitResult = await RateLimiter.checkLimit(
      `analytics:${clientIp}`,
      100, // 100 requests per minute
      60 * 1000 // 1 minute window
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.action || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: action and category' },
        { status: 400 }
      )
    }

    // Extract request metadata
    const headersList = headers()
    const metadata = {
      user_agent: headersList.get('user-agent'),
      referer: headersList.get('referer'),
      client_ip: clientIp,
      timestamp: Date.now(),
      ...body,
    }

    // Store analytics data (you can implement your preferred storage)
    await storeAnalyticsEvent(metadata)

    // Forward to external analytics services if configured
    await forwardToExternalServices(metadata)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function storeAnalyticsEvent(data: any) {
  try {
    // Store in database (optional - implement based on needs)
    if (process.env.STORE_ANALYTICS_IN_DB === 'true') {
      await prisma.analyticsEvent.create({
        data: {
          action: data.action,
          category: data.category,
          label: data.label || null,
          value: data.value || null,
          userId: data.user_id || null,
          sessionId: data.session_id || null,
          userAgent: data.user_agent || null,
          referer: data.referer || null,
          clientIp: data.client_ip || null,
          customParameters: data.custom_parameters || {},
          createdAt: new Date(data.timestamp),
        },
      })
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', {
        action: data.action,
        category: data.category,
        label: data.label,
        value: data.value,
        custom_parameters: data.custom_parameters,
      })
    }
  } catch (error) {
    console.error('Failed to store analytics event:', error)
    // Don't throw - analytics shouldn't break the app
  }
}

async function forwardToExternalServices(data: any) {
  const promises: Promise<any>[] = []

  // Forward to Google Analytics 4 Measurement Protocol (optional)
  if (process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET) {
    promises.push(
      fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: data.session_id || 'unknown',
          user_id: data.user_id,
          events: [{
            name: data.action,
            parameters: {
              event_category: data.category,
              event_label: data.label,
              value: data.value,
              custom_session_id: data.session_id,
              ...data.custom_parameters,
            },
          }],
        }),
      }).catch(error => {
        console.warn('Failed to forward to GA4:', error)
      })
    )
  }

  // Forward to Mixpanel (optional)
  if (process.env.MIXPANEL_PROJECT_TOKEN) {
    promises.push(
      fetch('https://api.mixpanel.com/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          event: `${data.category}_${data.action}`,
          properties: {
            token: process.env.MIXPANEL_PROJECT_TOKEN,
            distinct_id: data.user_id || data.session_id,
            time: Math.floor(data.timestamp / 1000),
            $user_agent: data.user_agent,
            $referrer: data.referer,
            $ip: data.client_ip,
            category: data.category,
            action: data.action,
            label: data.label,
            value: data.value,
            ...data.custom_parameters,
          },
        }]),
      }).catch(error => {
        console.warn('Failed to forward to Mixpanel:', error)
      })
    )
  }

  // Forward to custom analytics endpoint (optional)
  if (process.env.CUSTOM_ANALYTICS_ENDPOINT) {
    promises.push(
      fetch(process.env.CUSTOM_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.CUSTOM_ANALYTICS_TOKEN ? `Bearer ${process.env.CUSTOM_ANALYTICS_TOKEN}` : '',
        },
        body: JSON.stringify(data),
      }).catch(error => {
        console.warn('Failed to forward to custom analytics:', error)
      })
    )
  }

  // Don't await - fire and forget
  Promise.allSettled(promises)
}