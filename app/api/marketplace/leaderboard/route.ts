import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/marketplace/analytics-service'

// GET /api/marketplace/leaderboard - Get designer leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric') as 'earnings' | 'sales' | 'followers' || 'earnings'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    const leaderboard = await AnalyticsService.getDesignerLeaderboard(metric, limit)

    // Get platform-wide stats for context
    const platformStats = await AnalyticsService.getPlatformAnalytics()

    return NextResponse.json({
      success: true,
      data: {
        metric,
        leaderboard,
        platformStats: platformStats.totals
      }
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}