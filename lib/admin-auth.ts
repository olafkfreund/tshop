import { auth } from '@/lib/auth'
import { query } from '@/lib/db-direct'
import { NextRequest, NextResponse } from 'next/server'

export async function requireAdmin() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }
  
  // Check user role in database
  const users = await query('SELECT role FROM users WHERE id = $1', [session.user.id])
  const user = users[0]
  
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return session
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const users = await query('SELECT role FROM users WHERE id = $1', [userId])
    return users[0]?.role === 'admin'
  } catch {
    return false
  }
}

export async function adminApiRoute(
  handler: (request: NextRequest, session: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const session = await requireAdmin()
      return await handler(request, session)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Access denied'
      
      if (errorMessage === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
  }
}

// AdminRoute component would be implemented here if needed for client-side route protection