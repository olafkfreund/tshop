import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data

    // Register the user
    const result = await registerUser(email, password, name)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.error === 'User already exists' ? 409 : 500 }
      )
    }

    // Return success without sensitive data
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
      },
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}