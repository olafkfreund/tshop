import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { LicensingService } from '@/lib/marketplace/licensing-service'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/marketplace/licenses/[id]/certificate - Generate license certificate
export async function GET(
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

    const { id: licenseId } = params

    const certificate = await LicensingService.generateLicenseCertificate(
      licenseId,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: { certificate }
    })
  } catch (error) {
    console.error('Error generating license certificate:', error)
    
    if (error instanceof Error && error.message === 'License not found or access denied') {
      return NextResponse.json(
        { success: false, error: 'License not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}