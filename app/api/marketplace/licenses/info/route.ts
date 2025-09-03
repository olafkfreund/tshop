import { NextRequest, NextResponse } from 'next/server'
import { LicensingService } from '@/lib/marketplace/licensing-service'
import { z } from 'zod'

const getLicenseInfoSchema = z.object({
  licenseType: z.enum(['STANDARD', 'EXTENDED', 'EXCLUSIVE']).optional(),
  designId: z.string().cuid().optional()
})

// GET /api/marketplace/licenses/info - Get license type information and availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const licenseType = searchParams.get('licenseType') as 'STANDARD' | 'EXTENDED' | 'EXCLUSIVE' | null
    const designId = searchParams.get('designId')

    // Get license details for all types or specific type
    const licenseTypes = licenseType ? [licenseType] : ['STANDARD', 'EXTENDED', 'EXCLUSIVE']
    
    const licenseInfo = licenseTypes.reduce((acc, type) => {
      acc[type] = LicensingService.getLicenseDetails(type as any)
      return acc
    }, {} as Record<string, any>)

    // If design ID is provided, check availability
    let designAvailability: any = null
    if (designId) {
      const availabilityChecks = await Promise.all(
        licenseTypes.map(async (type) => {
          const availability = await LicensingService.canLicenseDesign(
            designId,
            type as 'STANDARD' | 'EXTENDED' | 'EXCLUSIVE'
          )
          return { type, ...availability }
        })
      )

      designAvailability = availabilityChecks.reduce((acc, check) => {
        acc[check.type] = {
          canLicense: check.canLicense,
          reason: check.reason,
          soldDate: check.soldDate,
          existingLicenses: check.existingLicenses
        }
        return acc
      }, {} as Record<string, any>)
    }

    // Get general licensing statistics
    const stats = await LicensingService.getLicensingStatistics()

    const response = {
      success: true,
      data: {
        licenseTypes: licenseInfo,
        designAvailability,
        statistics: stats
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching license information:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch license information' },
      { status: 500 }
    )
  }
}