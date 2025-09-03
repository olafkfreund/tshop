import { NextRequest, NextResponse } from 'next/server'
import { adminApiRoute } from '@/lib/admin-auth'
import { updateUserRole } from '@/lib/db-direct'

export const POST = adminApiRoute(async (request: NextRequest) => {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      )
    }

    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      )
    }

    const updatedUser = await updateUserRole(userId, role)
    
    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
})