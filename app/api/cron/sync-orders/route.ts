import { NextRequest, NextResponse } from 'next/server'
import { fulfillmentService } from '@/lib/fulfillment/fulfillment-service'

// This endpoint should be called by a cron service (like Vercel Cron or external cron)
// to periodically sync order statuses with fulfillment providers
export async function GET(request: NextRequest) {
  try {
    // Verify the request is coming from an authorized source
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting order sync job...')
    
    // Sync all pending orders
    await fulfillmentService.syncPendingOrders()
    
    console.log('Order sync job completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Order sync completed',
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error in order sync job:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also allow POST for flexibility with different cron services
export async function POST(request: NextRequest) {
  return GET(request)
}