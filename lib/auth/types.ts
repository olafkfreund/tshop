import { UserRole, AITier } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      aiUsage: {
        dailyCount: number
        monthlyCount: number
        totalCount: number
        tier: AITier
      }
    }
  }

  interface User {
    id: string
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
  }
}