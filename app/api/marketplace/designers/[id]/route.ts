import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/marketplace/designers/[id] - Get designer profile by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    const designer = await prisma.designerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true
          }
        },
        designs: {
          where: { isActive: true },
          include: {
            design: {
              select: {
                id: true,
                prompt: true,
                imageUrl: true,
                createdAt: true
              }
            },
            likes: {
              select: { id: true }
            },
            purchases: {
              select: { id: true }
            },
            _count: {
              select: {
                likes: true,
                purchases: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        followers: {
          select: {
            id: true,
            follower: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        following: {
          select: {
            id: true,
            designer: {
              select: {
                id: true,
                displayName: true,
                user: {
                  select: {
                    image: true
                  }
                }
              }
            }
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        collections: {
          where: { isPublic: true },
          include: {
            designs: {
              take: 4,
              include: {
                design: {
                  select: {
                    id: true,
                    imageUrl: true
                  }
                }
              }
            },
            _count: {
              select: { designs: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 6
        },
        _count: {
          select: {
            designs: true,
            followers: true,
            following: true,
            reviews: true,
            collections: true
          }
        }
      }
    })

    if (!designer) {
      return NextResponse.json(
        { success: false, error: 'Designer not found' },
        { status: 404 }
      )
    }

    // Calculate additional stats
    const designStats = designer.designs.reduce((acc, design) => {
      acc.totalLikes += design._count.likes
      acc.totalPurchases += design._count.purchases
      return acc
    }, { totalLikes: 0, totalPurchases: 0 })

    const designerWithStats = {
      ...designer,
      stats: {
        ...designStats,
        followerCount: designer._count.followers,
        followingCount: designer._count.following,
        designCount: designer._count.designs,
        reviewCount: designer._count.reviews,
        collectionCount: designer._count.collections
      }
    }

    return NextResponse.json({
      success: true,
      data: { designer: designerWithStats }
    })
  } catch (error) {
    console.error('Error fetching designer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch designer' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/designers/[id]/follow - Follow/unfollow designer
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

    const { id } = params
    const { action } = await request.json()

    if (!['follow', 'unfollow'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "follow" or "unfollow"' },
        { status: 400 }
      )
    }

    // Check if designer exists
    const designer = await prisma.designerProfile.findUnique({
      where: { id }
    })

    if (!designer) {
      return NextResponse.json(
        { success: false, error: 'Designer not found' },
        { status: 404 }
      )
    }

    // Don't allow self-following
    if (designer.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    if (action === 'follow') {
      // Create follow relationship
      await prisma.designerFollower.upsert({
        where: {
          designerId_followerId: {
            designerId: id,
            followerId: session.user.id
          }
        },
        create: {
          designerId: id,
          followerId: session.user.id
        },
        update: {} // No update needed if already exists
      })
    } else {
      // Remove follow relationship
      await prisma.designerFollower.deleteMany({
        where: {
          designerId: id,
          followerId: session.user.id
        }
      })
    }

    // Get updated follower count
    const followerCount = await prisma.designerFollower.count({
      where: { designerId: id }
    })

    return NextResponse.json({
      success: true,
      data: {
        action,
        followerCount,
        isFollowing: action === 'follow'
      }
    })
  } catch (error) {
    console.error('Error following/unfollowing designer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update follow status' },
      { status: 500 }
    )
  }
}