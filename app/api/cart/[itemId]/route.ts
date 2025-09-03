import { NextRequest, NextResponse } from 'next/server'
import { CartService } from '@/lib/cart'

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { quantity } = await request.json()
    
    // TODO: Get actual userId from session/auth
    const userId = null // For now, treating all as guest users
    
    const updatedItem = await CartService.updateCartItem(
      params.itemId,
      quantity,
      userId || undefined
    )

    return NextResponse.json({
      success: true,
      data: updatedItem,
    })
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    // TODO: Get actual userId from session/auth
    const userId = null // For now, treating all as guest users
    
    await CartService.removeFromCart(params.itemId, userId || undefined)

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    })
  } catch (error) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}