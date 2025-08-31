import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { deleteImage } from '@/lib/cloudinary'

interface RouteParams {
  params: { id: string }
}

// GET /api/designs/[id] - Get a specific design
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const session = await auth()

    const design = await prisma.design.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    if (!design) {
      return NextResponse.json(
        { success: false, error: 'Design not found' },
        { status: 404 }
      )
    }

    // Check if user can access this design
    if (!design.isPublic && design.userId !== session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Increment usage count if it's a public design being viewed by someone else
    if (design.isPublic && design.userId !== session?.user?.id) {
      await prisma.design.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      })
    }

    return NextResponse.json({
      success: true,
      data: design,
    })

  } catch (error) {
    console.error('Error fetching design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch design' },
      { status: 500 }
    )
  }
}

// PUT /api/designs/[id] - Update a design
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if design exists and user owns it
    const existingDesign = await prisma.design.findUnique({
      where: { id },
    })

    if (!existingDesign) {
      return NextResponse.json(
        { success: false, error: 'Design not found' },
        { status: 404 }
      )
    }

    if (existingDesign.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Update the design
    const updatedDesign = await prisma.design.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        tags: body.tags,
        isPublic: body.isPublic,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedDesign,
    })

  } catch (error) {
    console.error('Error updating design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update design' },
      { status: 500 }
    )
  }
}

// DELETE /api/designs/[id] - Delete a design
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if design exists and user owns it
    const existingDesign = await prisma.design.findUnique({
      where: { id },
    })

    if (!existingDesign) {
      return NextResponse.json(
        { success: false, error: 'Design not found' },
        { status: 404 }
      )
    }

    if (existingDesign.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (existingDesign.imageUrl.includes('cloudinary.com')) {
      const publicId = extractPublicIdFromUrl(existingDesign.imageUrl)
      if (publicId) {
        await deleteImage(publicId)
      }
    }

    // Delete from database
    await prisma.design.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Design deleted successfully',
    })

  } catch (error) {
    console.error('Error deleting design:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete design' },
      { status: 500 }
    )
  }
}

// Helper function to extract Cloudinary public ID from URL
function extractPublicIdFromUrl(url: string): string | null {
  try {
    const matches = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)\.[a-z]+$/i)
    return matches ? matches[1] : null
  } catch {
    return null
  }
}