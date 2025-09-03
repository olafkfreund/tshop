import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db'

// GET /api/designs/[designId]/comments - Get design comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: designId } = params

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this design
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        user: true,
        team: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    })

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    // Check access: owner, team member, or shared design
    const hasAccess = design.userId === user.id || 
                     (design.team && design.team.members.length > 0) ||
                     design.isPublic

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const comments = await prisma.designComment.findMany({
      where: { designId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      comments,
    })

  } catch (error: any) {
    console.error('Error fetching design comments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/designs/[designId]/comments - Add comment to design
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: designId } = params
    const body = await request.json()
    const { content, parentId } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this design
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    })

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    // Check access: owner, team member, or shared design
    const hasAccess = design.userId === user.id || 
                     (design.team && design.team.members.length > 0) ||
                     design.isPublic

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // If this is a reply, validate parent comment exists
    if (parentId) {
      const parentComment = await prisma.designComment.findFirst({
        where: {
          id: parentId,
          designId,
        },
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create comment
    const comment = await prisma.designComment.create({
      data: {
        content: content.trim(),
        designId,
        userId: user.id,
        parentId: parentId || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // Update design activity
    await prisma.design.update({
      where: { id: designId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      comment,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating design comment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    )
  }
}