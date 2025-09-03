import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configure web-push (these should be environment variables)
webpush.setVapidDetails(
  'mailto:contact@tshop.com', // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI2PacGgXrcfpwt-9vO6jWLXYt6X_AKg9Q2ZHK1LQcJLKa4pclRjhKXG5I',
  process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key-here'
)

// Mock subscription storage (replace with actual database)
const subscriptions = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      message, 
      userId, 
      url, 
      icon, 
      image,
      tag,
      actions 
    } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      image,
      tag: tag || 'tshop-notification',
      url: url || '/',
      actions: actions || [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ],
      timestamp: Date.now(),
    })

    let sentCount = 0
    let errorCount = 0
    const results = []

    // Send to specific user or all subscribers
    for (const [endpoint, subscriptionData] of subscriptions) {
      // Skip if userId specified and doesn't match
      if (userId && subscriptionData.userId !== userId) {
        continue
      }

      try {
        const result = await webpush.sendNotification(
          subscriptionData.subscription,
          payload
        )
        
        sentCount++
        results.push({
          endpoint,
          success: true,
          status: result.statusCode,
        })
        
      } catch (error: any) {
        errorCount++
        console.error('Failed to send notification:', error)
        
        // Remove invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          subscriptions.delete(endpoint)
          console.log('Removed invalid subscription:', endpoint)
        }
        
        results.push({
          endpoint,
          success: false,
          error: error.message,
        })
      }
    }

    console.log(`Notifications sent: ${sentCount}, errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      details: results,
    })

  } catch (error) {
    console.error('Error sending push notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

// GET endpoint to test notification sending
export async function GET() {
  try {
    // Send test notification to all subscribers
    const testPayload = {
      title: 'TShop Test Notification',
      message: 'This is a test notification from TShop PWA!',
      url: '/',
      icon: '/icons/icon-192x192.png',
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })

    const result = await response.json()
    
    return NextResponse.json({
      message: 'Test notification sent',
      result,
    })

  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    )
  }
}