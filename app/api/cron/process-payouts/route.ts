import { NextRequest, NextResponse } from 'next/server'
import { PayoutService } from '@/lib/marketplace/payout-service'

// This endpoint should be called by a cron service (like Vercel Cron or external scheduler)
// POST /api/cron/process-payouts - Process all pending payouts
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (cron service)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting automated payout processing...')

    // Process all pending payouts
    const results = await PayoutService.processAllPendingPayouts()

    // Calculate summary stats
    const totalProcessed = results.length
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    const summary = {
      timestamp: new Date().toISOString(),
      totalProcessed,
      successful,
      failed,
      successRate: totalProcessed > 0 ? Math.round((successful / totalProcessed) * 100) : 0
    }

    // Log results
    console.log('Payout processing completed:', summary)
    
    if (failed > 0) {
      console.log('Failed payouts:', results.filter(r => !r.success))
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        results: results.map(r => ({
          payoutId: r.payoutId,
          success: r.success,
          message: r.message,
          error: r.error
        }))
      }
    })
  } catch (error) {
    console.error('Error in payout processing cron job:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Payout processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/cron/process-payouts - Get payout processing status and stats
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current payout statistics
    const [globalStats, pendingSummary] = await Promise.all([
      PayoutService.getPayoutStatistics(),
      PayoutService.getPendingPayoutsSummary()
    ])

    return NextResponse.json({
      success: true,
      data: {
        globalStats,
        pendingSummary,
        nextProcessingRecommendation: {
          shouldProcess: pendingSummary.length > 0,
          totalPendingAmount: pendingSummary.reduce((sum, item) => sum + Number(item.pendingAmount), 0),
          totalPendingCount: pendingSummary.reduce((sum, item) => sum + item.pendingCount, 0)
        }
      }
    })
  } catch (error) {
    console.error('Error getting payout processing status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payout status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}