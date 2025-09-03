import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/marketplace/designs/[id]/like - Like/unlike a design
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: designId } = params

    // Check if design exists
    const design = await prisma.marketplaceDesign.findUnique({
      where: { id: designId, isActive: true }
    })

    if (!design) {
      return NextResponse.json(
        { success: false, error: 'Design not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this design
    const existingLike = await prisma.designLike.findUnique({
      where: {
        userId_marketplaceDesignId: {
          userId: session.user.id,
          marketplaceDesignId: designId
        }
      }
    })

    if (existingLike) {
      // Unlike the design
      await prisma.designLike.delete({
        where: {
          userId_marketplaceDesignId: {
            userId: session.user.id,
            marketplaceDesignId: designId
          }
        }
      })

      // Get updated like count
      const likeCount = await prisma.designLike.count({
        where: { marketplaceDesignId: designId }
      })

      return NextResponse.json({
        success: true,
        data: {
          action: 'unliked',
          likeCount,
          isLiked: false
        }
      })
    } else {
      // Like the design
      await prisma.designLike.create({
        data: {
          userId: session.user.id,
          marketplaceDesignId: designId
        }
      })

      // Get updated like count
      const likeCount = await prisma.designLike.count({
        where: { marketplaceDesignId: designId }
      })

      return NextResponse.json({
        success: true,
        data: {
          action: 'liked',
          likeCount,
          isLiked: true
        }
      })
    }
  } catch (error) {
    console.error('Error liking/unliking design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update like status' },
      { status: 500 }
    )
  }
}