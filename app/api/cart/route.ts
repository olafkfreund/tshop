import { NextRequest, NextResponse } from 'next/server'
import { CartService } from '@/lib/cart'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionId = cookieStore.get('session')?.value || 'guest-' + Date.now()
    
    // TODO: Get actual userId from session/auth
    const userId = null // For now, treating all as guest users
    
    const cart = userId 
      ? await CartService.getUserCart(userId)
      : await CartService.getGuestCart(sessionId)

    return NextResponse.json({
      success: true,
      data: cart,
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, variantId, quantity, customization } = await request.json()
    
    const cookieStore = cookies()
    let sessionId = cookieStore.get('session')?.value
    
    if (!sessionId) {
      sessionId = 'guest-' + Date.now()
    }
    
    // TODO: Get actual userId from session/auth
    const userId = null // For now, treating all as guest users
    
    const cartItem = await CartService.addToCart(
      userId,
      sessionId,
      productId,
      variantId,
      quantity,
      customization
    )

    // Set session cookie if it's a new guest
    const response = NextResponse.json({
      success: true,
      data: cartItem,
    })

    if (!cookieStore.get('session')?.value) {
      response.cookies.set('session', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    }

    return response
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}