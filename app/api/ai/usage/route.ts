import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { AIUsageLimiter, getGuestUsageFromSession } from '@/lib/ai/usage-limiter'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get authentication session
    const session = await auth()
    const cookieStore = cookies()
    
    // Check usage limits
    let usageInfo
    if (session?.user?.id) {
      // Registered user
      const usageCheck = await AIUsageLimiter.checkUsage(session.user.id)
      usageInfo = {
        remainingDaily: usageCheck.remainingDaily,
        remainingMonthly: usageCheck.remainingMonthly,
        tier: usageCheck.tier,
        resetTime: usageCheck.resetTime,
      }
    } else {
      // Guest user - get usage from cookies
      const guestUsageData = cookieStore.get('ai-usage')?.value
      const sessionData = guestUsageData ? JSON.parse(guestUsageData) : { count: 0, lastReset: new Date().toDateString() }
      
      // Reset daily count if it's a new day
      const today = new Date().toDateString()
      if (sessionData.lastReset !== today) {
        sessionData.count = 0
        sessionData.lastReset = today
      }
      
      const usageCheck = getGuestUsageFromSession({ aiUsage: sessionData })
      usageInfo = {
        remainingDaily: usageCheck.remainingDaily,
        remainingMonthly: usageCheck.remainingMonthly,
        tier: usageCheck.tier,
        resetTime: usageCheck.resetTime,
      }
    }
    
    return NextResponse.json(usageInfo)
    
  } catch (error) {
    console.error('Error checking AI usage:', error)
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    )
  }
}