import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { LicensingService } from '@/lib/marketplace/licensing-service'
import { z } from 'zod'

const verifyLicenseSchema = z.object({
  designId: z.string().cuid(),
  intendedUsage: z.string().max(500).optional()
})

// GET /api/marketplace/licenses - Get user's licenses
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const licenseType = searchParams.get('licenseType') as 'STANDARD' | 'EXTENDED' | 'EXCLUSIVE' | null

    const result = await LicensingService.getUserLicenses(session.user.id, {
      page,
      limit,
      licenseType: licenseType || undefined
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching user licenses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/licenses/verify - Verify license for specific usage
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { designId, intendedUsage } = verifyLicenseSchema.parse(body)

    const verification = await LicensingService.verifyLicense(
      session.user.id,
      designId,
      intendedUsage
    )

    return NextResponse.json({
      success: true,
      data: verification
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error verifying license:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify license' },
      { status: 500 }
    )
  }
}