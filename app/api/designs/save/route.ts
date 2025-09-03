import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createDesign, getUserDesigns } from '@/lib/db-direct'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, imageUrl, designData, productType, isPublic } = body

    if (!name || !imageUrl || !designData || !productType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, imageUrl, designData, productType' },
        { status: 400 }
      )
    }

    const design = await createDesign({
      userId: session.user.id,
      name,
      description,
      imageUrl,
      designData,
      productType,
      isPublic: isPublic || false
    })

    return NextResponse.json({ success: true, data: design })
  } catch (error) {
    console.error('Error saving design:', error)
    return NextResponse.json(
      { error: 'Failed to save design' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const designs = await getUserDesigns(session.user.id, limit, offset)
    return NextResponse.json({ success: true, data: designs })
  } catch (error) {
    console.error('Error fetching user designs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    )
  }
}