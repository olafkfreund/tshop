import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LicensingService } from '@/lib/marketplace/licensing-service'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/license/verify/[id] - Public license verification endpoint
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: licenseId } = params

    // Get license details
    const license = await prisma.designPurchase.findUnique({
      where: { id: licenseId },
      include: {
        marketplaceDesign: {
          include: {
            design: {
              select: {
                id: true,
                prompt: true,
                imageUrl: true
              }
            },
            designer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!license) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'License not found',
          isValid: false
        },
        { status: 404 }
      )
    }

    if (license.status !== 'COMPLETED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'License is not valid/completed',
          isValid: false
        },
        { status: 400 }
      )
    }

    const licenseDetails = LicensingService.getLicenseDetails(license.licenseType)

    // Create public verification data (without sensitive information)
    const verificationData = {
      isValid: true,
      licenseId: license.id,
      purchaseDate: license.purchasedAt,
      licenseType: license.licenseType,
      designTitle: license.marketplaceDesign.title,
      designId: license.marketplaceDesign.design?.id,
      // Only show partial design prompt for verification
      designPrompt: license.marketplaceDesign.design?.prompt?.substring(0, 100) + '...',
      designer: {
        name: license.marketplaceDesign.designer.user.name,
        id: license.marketplaceDesign.designer.id
      },
      licensee: {
        // Only show partial name for privacy
        name: license.buyer.name?.substring(0, 1) + '*'.repeat((license.buyer.name?.length || 1) - 1),
        id: license.buyer.id
      },
      licenseDetails: {
        type: licenseDetails.type,
        permissions: licenseDetails.permissions,
        restrictions: licenseDetails.restrictions,
        attributionRequired: licenseDetails.attributionRequired,
        commercialUse: licenseDetails.commercialUse,
        modificationAllowed: licenseDetails.modificationAllowed
      },
      verifiedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: verificationData
    })
  } catch (error) {
    console.error('Error verifying license:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'License verification failed',
        isValid: false
      },
      { status: 500 }
    )
  }
}