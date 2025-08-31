import NextAuth, { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'

// Constants for string-based enums (SQLite doesn't support enums)
const UserRole = {
  CUSTOMER: 'CUSTOMER',
  DESIGNER: 'DESIGNER',
  ADMIN: 'ADMIN',
} as const

const AITier = {
  FREE: 'FREE',
  REGISTERED: 'REGISTERED',
  PREMIUM: 'PREMIUM',
} as const

const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow OAuth sign-ins
      if (account?.provider === 'google' || account?.provider === 'github') {
        return true
      }
      
      return true
    },
    
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
        session.user.role = (user as any).role || UserRole.CUSTOMER
        
        // Get or create AI usage stats
        let aiUsage = await prisma.aIUsageStats.findUnique({
          where: { userId: user.id }
        })
        
        if (!aiUsage) {
          aiUsage = await prisma.aIUsageStats.create({
            data: {
              userId: user.id,
              tier: AITier.REGISTERED,
            }
          })
        }
        
        session.user.aiUsage = {
          dailyCount: aiUsage.dailyCount,
          monthlyCount: aiUsage.monthlyCount,
          totalCount: aiUsage.totalCount,
          tier: aiUsage.tier,
        }
      }
      
      return session
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role || UserRole.CUSTOMER
      }
      
      return token
    },
  },
  events: {
    async createUser({ user }) {
      // Set default role for new users
      await prisma.user.update({
        where: { id: user.id! },
        data: { 
          role: UserRole.CUSTOMER,
        },
      })
      
      // Create AI usage stats for new user
      await prisma.aIUsageStats.create({
        data: {
          userId: user.id!,
          tier: AITier.REGISTERED,
        },
      })
    },
  },
  session: {
    strategy: 'database',
  },
  debug: process.env.NODE_ENV === 'development',
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
export { authConfig }