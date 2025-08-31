import { prisma } from '@/lib/db'
import { AI_USAGE_LIMITS } from '@/lib/constants'

// AI tier constants (using strings for SQLite compatibility)
export const AITier = {
  FREE: 'FREE',
  REGISTERED: 'REGISTERED', 
  PREMIUM: 'PREMIUM'
} as const

export type AITierType = typeof AITier[keyof typeof AITier]

export interface UsageCheckResult {
  allowed: boolean
  remainingDaily: number
  remainingMonthly: number
  tier: AITierType
  resetTime?: Date
}

export class AIUsageLimiter {
  static async checkUsage(userId: string): Promise<UsageCheckResult> {
    try {
      let usage = await prisma.aIUsageStats.findUnique({
        where: { userId },
      })

      // Create usage stats if they don't exist
      if (!usage) {
        usage = await prisma.aIUsageStats.create({
          data: {
            userId,
            tier: 'REGISTERED',
          },
        })
      }

      const now = new Date()
      const lastReset = new Date(usage.lastReset)
      const limits = AI_USAGE_LIMITS[usage.tier]

      // Reset daily count if it's a new day
      let dailyCount = usage.dailyCount
      let monthlyCount = usage.monthlyCount
      let needsUpdate = false

      // Check if we need to reset daily counter
      const daysDiff = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff >= 1) {
        dailyCount = 0
        needsUpdate = true
      }

      // Check if we need to reset monthly counter (reset on the same day each month)
      const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                        (now.getMonth() - lastReset.getMonth())
      if (monthsDiff >= 1) {
        monthlyCount = 0
        needsUpdate = true
      }

      // Update reset time if needed
      if (needsUpdate) {
        await prisma.aIUsageStats.update({
          where: { userId },
          data: {
            dailyCount,
            monthlyCount,
            lastReset: now,
          },
        })
      }

      const remainingDaily = Math.max(0, limits.daily - dailyCount)
      const remainingMonthly = Math.max(0, limits.monthly - monthlyCount)
      
      const allowed = remainingDaily > 0 && remainingMonthly > 0

      // Calculate next reset time (next day at midnight)
      const nextReset = new Date(now)
      nextReset.setDate(nextReset.getDate() + 1)
      nextReset.setHours(0, 0, 0, 0)

      return {
        allowed,
        remainingDaily,
        remainingMonthly,
        tier: usage.tier as AITierType,
        resetTime: nextReset,
      }
    } catch (error) {
      console.error('Error checking AI usage:', error)
      // In case of error, deny access to be safe
      return {
        allowed: false,
        remainingDaily: 0,
        remainingMonthly: 0,
        tier: 'FREE' as AITierType,
      }
    }
  }

  static async recordUsage(userId: string, tokensUsed: number = 1): Promise<void> {
    try {
      await prisma.aIUsageStats.update({
        where: { userId },
        data: {
          dailyCount: { increment: 1 },
          monthlyCount: { increment: 1 },
          totalCount: { increment: 1 },
        },
      })
    } catch (error) {
      console.error('Error recording AI usage:', error)
    }
  }

  static async getUserUsageStats(userId: string): Promise<{
    daily: number
    monthly: number
    total: number
    tier: AITierType
    limits: any
  } | null> {
    try {
      const usage = await prisma.aIUsageStats.findUnique({
        where: { userId },
      })

      if (!usage) return null

      return {
        daily: usage.dailyCount,
        monthly: usage.monthlyCount,
        total: usage.totalCount,
        tier: usage.tier as AITierType,
        limits: AI_USAGE_LIMITS[usage.tier as keyof typeof AI_USAGE_LIMITS],
      }
    } catch (error) {
      console.error('Error getting usage stats:', error)
      return null
    }
  }

  static async upgradeTier(userId: string, newTier: AITierType): Promise<boolean> {
    try {
      await prisma.aIUsageStats.update({
        where: { userId },
        data: { tier: newTier },
      })
      return true
    } catch (error) {
      console.error('Error upgrading tier:', error)
      return false
    }
  }

  // Grant bonus uses for purchases
  static async grantBonusUses(userId: string, bonusCount: number = 5): Promise<void> {
    try {
      const usage = await prisma.aIUsageStats.findUnique({
        where: { userId },
      })

      if (!usage) return

      const limits = AI_USAGE_LIMITS[usage.tier]
      
      // Add bonus to daily (capped at limit + bonus)
      const newDailyCount = Math.max(0, usage.dailyCount - bonusCount)
      // Add bonus to monthly (capped at limit + bonus) 
      const newMonthlyCount = Math.max(0, usage.monthlyCount - bonusCount)

      await prisma.aIUsageStats.update({
        where: { userId },
        data: {
          dailyCount: newDailyCount,
          monthlyCount: newMonthlyCount,
        },
      })
    } catch (error) {
      console.error('Error granting bonus uses:', error)
    }
  }
}

// Helper function for guest users (limited to session)
export function getGuestUsageFromSession(session: any): UsageCheckResult {
  const guestUsage = session?.aiUsage || { count: 0 }
  const remaining = Math.max(0, AI_USAGE_LIMITS.FREE.daily - guestUsage.count)
  
  return {
    allowed: remaining > 0,
    remainingDaily: remaining,
    remainingMonthly: remaining,
    tier: 'FREE' as AITierType,
  }
}

export function setGuestUsageInSession(session: any, count: number): void {
  if (!session.aiUsage) {
    session.aiUsage = {}
  }
  session.aiUsage.count = count
}