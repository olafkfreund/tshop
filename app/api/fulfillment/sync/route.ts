import { NextRequest, NextResponse } from 'next/server'
import { fulfillmentService } from '@/lib/fulfillment/fulfillment-service'

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request or has proper authorization
    const authHeader = request.headers.get('authorization')
    const internalToken = process.env.INTERNAL_API_TOKEN
    
    if (internalToken && authHeader !== `Bearer ${internalToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting fulfillment sync...')
    
    // Sync all pending orders with fulfillment providers
    await fulfillmentService.syncPendingOrders()
    
    console.log('Fulfillment sync completed successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Fulfillment sync completed',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error during fulfillment sync:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Allow GET requests to check sync status
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const internalToken = process.env.INTERNAL_API_TOKEN
    
    if (internalToken && authHeader !== `Bearer ${internalToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return basic sync information
    return NextResponse.json({ 
      success: true,
      message: 'Fulfillment sync endpoint is active',
      endpoint: '/api/fulfillment/sync',
      methods: ['POST'],
      lastSync: null, // Could track this in database
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}