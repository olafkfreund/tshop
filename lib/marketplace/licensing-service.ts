import { prisma } from '@/lib/prisma'
import type { DesignPurchase, MarketplaceDesign } from '@prisma/client'

export interface LicenseVerificationResult {
  isValid: boolean
  license?: DesignPurchase
  restrictions?: string[]
  allowedUsage?: string[]
  attribution?: {
    required: boolean
    text?: string
    url?: string
  }
}

export interface LicenseDetails {
  type: 'STANDARD' | 'EXTENDED' | 'EXCLUSIVE'
  permissions: string[]
  restrictions: string[]
  attributionRequired: boolean
  commercialUse: boolean
  resaleAllowed: boolean
  modificationAllowed: boolean
  maxUsageInstances?: number
}

export class LicensingService {
  /**
   * Get license details for a license type
   */
  static getLicenseDetails(licenseType: 'STANDARD' | 'EXTENDED' | 'EXCLUSIVE'): LicenseDetails {
    switch (licenseType) {
      case 'STANDARD':
        return {
          type: 'STANDARD',
          permissions: [
            'Personal use',
            'Single commercial project',
            'Social media posts',
            'Website use',
            'Print up to 1000 copies',
            'Digital products (single project)'
          ],
          restrictions: [
            'No resale of design as-is',
            'No mass production (over 1000 units)',
            'No use in templates or design products',
            'No redistribution rights'
          ],
          attributionRequired: true,
          commercialUse: true,
          resaleAllowed: false,
          modificationAllowed: true,
          maxUsageInstances: 1
        }

      case 'EXTENDED':
        return {
          type: 'EXTENDED',
          permissions: [
            'All Standard license permissions',
            'Multiple commercial projects',
            'Mass production (unlimited copies)',
            'Resale of end products',
            'Template and design product use',
            'Team/client usage',
            'Broadcast and streaming'
          ],
          restrictions: [
            'No resale of design as standalone item',
            'No redistribution of source files',
            'Cannot claim ownership of original design'
          ],
          attributionRequired: false,
          commercialUse: true,
          resaleAllowed: true,
          modificationAllowed: true,
          maxUsageInstances: 100
        }

      case 'EXCLUSIVE':
        return {
          type: 'EXCLUSIVE',
          permissions: [
            'All Extended license permissions',
            'Exclusive usage rights',
            'Design removed from marketplace',
            'Ownership transfer (excluding copyright)',
            'Unlimited commercial use',
            'Sublicensing rights',
            'Trademark usage (in some cases)'
          ],
          restrictions: [
            'Original designer retains copyright',
            'Cannot resell exclusive rights to others',
            'Designer cannot use design commercially after sale'
          ],
          attributionRequired: false,
          commercialUse: true,
          resaleAllowed: true,
          modificationAllowed: true
        }
    }
  }

  /**
   * Verify if a user has a valid license for a design
   */
  static async verifyLicense(
    userId: string,
    designId: string,
    intendedUsage?: string
  ): Promise<LicenseVerificationResult> {
    try {
      // Find the user's license for this design
      const license = await prisma.designPurchase.findFirst({
        where: {
          buyerId: userId,
          marketplaceDesign: {
            designId: designId
          },
          status: 'COMPLETED'
        },
        include: {
          marketplaceDesign: {
            include: {
              design: {
                select: {
                  id: true,
                  prompt: true
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
          }
        },
        orderBy: { purchasedAt: 'desc' } // Get the highest license if multiple
      })

      if (!license) {
        return {
          isValid: false,
          restrictions: ['No valid license found for this design']
        }
      }

      const licenseDetails = this.getLicenseDetails(license.licenseType)
      
      // Check if the intended usage is allowed
      const usageRestrictions: string[] = []
      
      if (intendedUsage) {
        const usage = intendedUsage.toLowerCase()
        
        // Check for mass production restrictions
        if (usage.includes('mass production') || usage.includes('1000+')) {
          if (license.licenseType === 'STANDARD') {
            usageRestrictions.push('Mass production requires Extended or Exclusive license')
          }
        }
        
        // Check for resale restrictions
        if (usage.includes('resale') || usage.includes('sell')) {
          if (license.licenseType === 'STANDARD') {
            usageRestrictions.push('Commercial resale requires Extended or Exclusive license')
          }
        }
        
        // Check for template/design product restrictions
        if (usage.includes('template') || usage.includes('design product')) {
          if (license.licenseType === 'STANDARD') {
            usageRestrictions.push('Template/design product usage requires Extended or Exclusive license')
          }
        }
      }

      // Build attribution information
      const attribution = {
        required: licenseDetails.attributionRequired,
        text: licenseDetails.attributionRequired 
          ? `Design by ${license.marketplaceDesign.designer.user.name || 'Unknown Designer'}`
          : undefined,
        url: licenseDetails.attributionRequired 
          ? `/marketplace/designers/${license.marketplaceDesign.designer.id}`
          : undefined
      }

      return {
        isValid: usageRestrictions.length === 0,
        license,
        restrictions: usageRestrictions.length > 0 ? usageRestrictions : licenseDetails.restrictions,
        allowedUsage: licenseDetails.permissions,
        attribution
      }
    } catch (error) {
      console.error('Error verifying license:', error)
      return {
        isValid: false,
        restrictions: ['Error verifying license']
      }
    }
  }

  /**
   * Get all licenses owned by a user
   */
  static async getUserLicenses(
    userId: string,
    options: {
      page?: number
      limit?: number
      licenseType?: 'STANDARD' | 'EXTENDED' | 'EXCLUSIVE'
    } = {}
  ) {
    const { page = 1, limit = 20, licenseType } = options
    const skip = (page - 1) * limit

    const where: any = {
      buyerId: userId,
      status: 'COMPLETED'
    }

    if (licenseType) {
      where.licenseType = licenseType
    }

    const [licenses, total] = await Promise.all([
      prisma.designPurchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchasedAt: 'desc' },
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
                      name: true,
                      image: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.designPurchase.count({ where })
    ])

    const licensesWithDetails = licenses.map(license => ({
      ...license,
      licenseDetails: this.getLicenseDetails(license.licenseType),
      design: license.marketplaceDesign
    }))

    return {
      licenses: licensesWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  }

  /**
   * Generate license certificate/proof
   */
  static async generateLicenseCertificate(licenseId: string, userId: string) {
    const license = await prisma.designPurchase.findFirst({
      where: {
        id: licenseId,
        buyerId: userId,
        status: 'COMPLETED'
      },
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
      throw new Error('License not found or access denied')
    }

    const licenseDetails = this.getLicenseDetails(license.licenseType)

    return {
      certificateId: license.id,
      purchaseDate: license.purchasedAt,
      licenseType: license.licenseType,
      designTitle: license.marketplaceDesign.title,
      designId: license.marketplaceDesign.design?.id,
      designPrompt: license.marketplaceDesign.design?.prompt,
      designImage: license.marketplaceDesign.design?.imageUrl,
      designer: {
        name: license.marketplaceDesign.designer.user.name,
        id: license.marketplaceDesign.designer.id
      },
      licensee: {
        name: license.buyer.name,
        email: license.buyer.email,
        id: license.buyer.id
      },
      licenseDetails,
      validationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/license/verify/${license.id}`,
      issuedAt: new Date().toISOString()
    }
  }

  /**
   * Check if design can still be licensed (for exclusive licenses)
   */
  static async canLicenseDesign(designId: string, licenseType: 'STANDARD' | 'EXTENDED' | 'EXCLUSIVE') {
    const design = await prisma.marketplaceDesign.findUnique({
      where: { id: designId },
      include: {
        purchases: {
          where: { status: 'COMPLETED' },
          select: {
            licenseType: true,
            purchasedAt: true
          }
        }
      }
    })

    if (!design || !design.isActive) {
      return {
        canLicense: false,
        reason: 'Design not available'
      }
    }

    // Check if exclusive license already sold
    const exclusivePurchase = design.purchases.find(p => p.licenseType === 'EXCLUSIVE')
    
    if (exclusivePurchase) {
      return {
        canLicense: false,
        reason: 'Exclusive license already sold',
        soldDate: exclusivePurchase.purchasedAt
      }
    }

    // Check if trying to buy exclusive when other licenses exist
    if (licenseType === 'EXCLUSIVE' && design.purchases.length > 0) {
      return {
        canLicense: false,
        reason: 'Cannot purchase exclusive license - other licenses already sold',
        existingLicenses: design.purchases.length
      }
    }

    return {
      canLicense: true,
      reason: 'Design available for licensing'
    }
  }

  /**
   * Get licensing statistics
   */
  static async getLicensingStatistics(designerId?: string) {
    const where = designerId ? { designerId } : {}

    const [totalSales, licenseBreakdown, revenueStats] = await Promise.all([
      prisma.designPurchase.count({
        where: {
          marketplaceDesign: where,
          status: 'COMPLETED'
        }
      }),
      prisma.designPurchase.groupBy({
        by: ['licenseType'],
        where: {
          marketplaceDesign: where,
          status: 'COMPLETED'
        },
        _count: { _all: true },
        _sum: { price: true }
      }),
      prisma.designPurchase.aggregate({
        where: {
          marketplaceDesign: where,
          status: 'COMPLETED'
        },
        _sum: {
          price: true,
          designerEarnings: true,
          platformFee: true
        },
        _avg: {
          price: true
        }
      })
    ])

    const licenseStats = licenseBreakdown.reduce((acc, group) => {
      acc[group.licenseType] = {
        count: group._count._all,
        revenue: Number(group._sum.price || 0)
      }
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    return {
      totalSales,
      totalRevenue: Number(revenueStats._sum.price || 0),
      totalDesignerEarnings: Number(revenueStats._sum.designerEarnings || 0),
      totalPlatformFees: Number(revenueStats._sum.platformFee || 0),
      averageSalePrice: Number(revenueStats._avg.price || 0),
      licenseStats
    }
  }
}