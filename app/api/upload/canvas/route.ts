import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { uploadBase64Image } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { dataUrl, designName } = await request.json()
    
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image data' },
        { status: 400 }
      )
    }

    // Upload to Cloudinary
    const uploadResult = await uploadBase64Image(dataUrl, {
      folder: 'tshop/canvas-designs',
      public_id: designName ? `${designName}-${Date.now()}` : undefined,
      tags: ['canvas-design', 'user-created'],
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    })

  } catch (error) {
    console.error('Error uploading canvas image:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload image',
      },
      { status: 500 }
    )
  }
}