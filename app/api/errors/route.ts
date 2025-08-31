import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { RateLimiter } from '@/lib/performance'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - more restrictive for error reporting
    const clientIp = request.ip || 
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
      
    const rateLimitResult = await RateLimiter.checkLimit(
      `errors:${clientIp}`,
      50, // 50 error reports per minute
      60 * 1000 // 1 minute window
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      )
    }

    // Extract request metadata
    const headersList = headers()
    const errorData = {
      message: body.message,
      stack: body.stack || null,
      timestamp: body.timestamp || Date.now(),
      url: body.url || null,
      user_agent: body.userAgent || headersList.get('user-agent'),
      client_ip: clientIp,
      context: body.context || {},
      severity: body.context?.level || 'error',
      user_id: body.context?.user?.id || null,
    }

    // Store error data
    await storeError(errorData)

    // Forward to external services
    await forwardErrorToServices(errorData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reporting API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function storeError(errorData: any) {
  try {
    // Store in database for analysis
    await prisma.errorLog.create({
      data: {
        message: errorData.message,
        stack: errorData.stack,
        url: errorData.url,
        userAgent: errorData.user_agent,
        clientIp: errorData.client_ip,
        severity: errorData.severity,
        userId: errorData.user_id,
        context: errorData.context,
        timestamp: new Date(errorData.timestamp),
      },
    })

    // Log to console
    console.error('Error reported:', {
      message: errorData.message,
      severity: errorData.severity,
      url: errorData.url,
      user_id: errorData.user_id,
      timestamp: new Date(errorData.timestamp).toISOString(),
    })

    // Check for error patterns and alert if needed
    await checkErrorPatterns(errorData)
  } catch (error) {
    console.error('Failed to store error:', error)
  }
}

async function checkErrorPatterns(errorData: any) {
  try {
    // Check for similar errors in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const similarErrors = await prisma.errorLog.count({
      where: {
        message: errorData.message,
        timestamp: {
          gte: oneHourAgo,
        },
      },
    })

    // Alert if this error is happening frequently
    if (similarErrors >= 10) {
      console.warn(`High frequency error detected: "${errorData.message}" occurred ${similarErrors} times in the last hour`)
      
      // Send alert to monitoring service
      await sendErrorAlert({
        type: 'high_frequency_error',
        message: errorData.message,
        count: similarErrors,
        timeframe: '1 hour',
        severity: 'high',
      })
    }

    // Check for critical errors
    if (errorData.severity === 'error' && (
      errorData.message.includes('Database') ||
      errorData.message.includes('Payment') ||
      errorData.message.includes('Auth')
    )) {
      await sendErrorAlert({
        type: 'critical_error',
        message: errorData.message,
        url: errorData.url,
        user_id: errorData.user_id,
        severity: 'critical',
      })
    }
  } catch (error) {
    console.error('Failed to check error patterns:', error)
  }
}

async function sendErrorAlert(alert: any) {
  try {
    // Send to Slack if webhook is configured
    if (process.env.SLACK_ERROR_WEBHOOK) {
      await fetch(process.env.SLACK_ERROR_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 TShop Error Alert: ${alert.type}`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `🚨 ${alert.type.replace('_', ' ').toUpperCase()}`,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Message:*\n${alert.message}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Severity:*\n${alert.severity}`,
                },
                ...(alert.count ? [{
                  type: 'mrkdwn',
                  text: `*Count:*\n${alert.count} in ${alert.timeframe}`,
                }] : []),
                ...(alert.url ? [{
                  type: 'mrkdwn',
                  text: `*URL:*\n${alert.url}`,
                }] : []),
              ],
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Environment: ${process.env.NODE_ENV} | Time: ${new Date().toISOString()}`,
                },
              ],
            },
          ],
        }),
      })
    }

    // Send email alert if configured
    if (process.env.ERROR_ALERT_EMAIL && process.env.SENDGRID_API_KEY) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: process.env.ERROR_ALERT_EMAIL }],
          }],
          from: { email: 'alerts@tshop.com' },
          subject: `TShop Error Alert: ${alert.type}`,
          content: [{
            type: 'text/html',
            value: `
              <h2>🚨 TShop Error Alert</h2>
              <p><strong>Type:</strong> ${alert.type}</p>
              <p><strong>Severity:</strong> ${alert.severity}</p>
              <p><strong>Message:</strong> ${alert.message}</p>
              ${alert.count ? `<p><strong>Count:</strong> ${alert.count} in ${alert.timeframe}</p>` : ''}
              ${alert.url ? `<p><strong>URL:</strong> ${alert.url}</p>` : ''}
              ${alert.user_id ? `<p><strong>User ID:</strong> ${alert.user_id}</p>` : ''}
              <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            `,
          }],
        }),
      })
    }
  } catch (error) {
    console.error('Failed to send error alert:', error)
  }
}

async function forwardErrorToServices(errorData: any) {
  const promises: Promise<any>[] = []

  // Forward to external error tracking service if configured
  if (process.env.EXTERNAL_ERROR_TRACKING_ENDPOINT) {
    promises.push(
      fetch(process.env.EXTERNAL_ERROR_TRACKING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.EXTERNAL_ERROR_TRACKING_TOKEN ? `Bearer ${process.env.EXTERNAL_ERROR_TRACKING_TOKEN}` : '',
        },
        body: JSON.stringify(errorData),
      }).catch(error => {
        console.warn('Failed to forward error to external service:', error)
      })
    )
  }

  // Don't await - fire and forget
  Promise.allSettled(promises)
}