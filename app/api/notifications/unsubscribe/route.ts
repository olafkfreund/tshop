import { NextRequest, NextResponse } from 'next/server'

// Using the same in-memory storage as subscribe route
// In production, this should be your actual database
const subscriptions = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // Remove subscription using endpoint as key
    const subscriptionKey = subscription.endpoint
    const removed = subscriptions.delete(subscriptionKey)

    console.log(`Push subscription ${removed ? 'removed' : 'not found'}: ${subscriptionKey}`)

    return NextResponse.json({
      success: true,
      message: removed ? 'Subscription removed successfully' : 'Subscription not found',
    })

  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}