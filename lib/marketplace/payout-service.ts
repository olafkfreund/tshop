import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import type { DesignerPayout, DesignerProfile } from '@prisma/client'

export interface PayoutProcessingResult {
  success: boolean
  payoutId: string
  message: string
  error?: string
  externalTransactionId?: string
}

export class PayoutService {
  /**
   * Process all pending payouts
   */
  static async processAllPendingPayouts(): Promise<PayoutProcessingResult[]> {
    const pendingPayouts = await prisma.designerPayout.findMany({
      where: { status: 'PENDING' },
      include: {
        designer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const results: PayoutProcessingResult[] = []

    for (const payout of pendingPayouts) {
      try {
        const result = await this.processSinglePayout(payout)
        results.push(result)
        
        // Add delay between payouts to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error processing payout ${payout.id}:`, error)
        results.push({
          success: false,
          payoutId: payout.id,
          message: 'Processing failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * Process a single payout
   */
  static async processSinglePayout(
    payout: DesignerPayout & {
      designer: DesignerProfile & {
        user: {
          id: string
          name: string | null
          email: string | null
        }
      }
    }
  ): Promise<PayoutProcessingResult> {
    // Update status to processing
    await prisma.designerPayout.update({
      where: { id: payout.id },
      data: { status: 'PROCESSING' }
    })

    try {
      let result: PayoutProcessingResult

      switch (payout.method) {
        case 'STRIPE':
          result = await this.processStripePayout(payout)
          break
        case 'PAYPAL':
          result = await this.processPayPalPayout(payout)
          break
        case 'BANK_TRANSFER':
          result = await this.processBankTransferPayout(payout)
          break
        default:
          throw new Error(`Unsupported payout method: ${payout.method}`)
      }

      // Update payout status based on result
      await prisma.designerPayout.update({
        where: { id: payout.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          processedAt: result.success ? new Date() : undefined,
          externalTransactionId: result.externalTransactionId,
          failureReason: result.success ? undefined : result.error
        }
      })

      // If successful, update designer profile stats
      if (result.success) {
        await prisma.designerProfile.update({
          where: { id: payout.designerId },
          data: {
            totalEarnings: { decrement: payout.amount }
          }
        })
      }

      return result
    } catch (error) {
      console.error(`Payout processing failed for ${payout.id}:`, error)

      // Update status to failed
      await prisma.designerPayout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          failureReason: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        payoutId: payout.id,
        message: 'Payout processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Process Stripe payout
   */
  private static async processStripePayout(
    payout: DesignerPayout & {
      designer: DesignerProfile & {
        user: {
          id: string
          name: string | null
          email: string | null
        }
      }
    }
  ): Promise<PayoutProcessingResult> {
    if (!payout.stripeAccountId) {
      throw new Error('Stripe account ID is required for Stripe payouts')
    }

    try {
      // Create Stripe transfer
      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(payout.amount) * 100), // Convert to cents
        currency: payout.currency.toLowerCase(),
        destination: payout.stripeAccountId,
        metadata: {
          payoutId: payout.id,
          designerId: payout.designerId,
          type: 'marketplace_payout'
        }
      })

      return {
        success: true,
        payoutId: payout.id,
        message: `Stripe payout of $${payout.amount} completed`,
        externalTransactionId: transfer.id
      }
    } catch (stripeError: any) {
      console.error('Stripe payout failed:', stripeError)
      
      return {
        success: false,
        payoutId: payout.id,
        message: 'Stripe payout failed',
        error: stripeError.message || 'Unknown Stripe error'
      }
    }
  }

  /**
   * Process PayPal payout (placeholder - would integrate with PayPal API)
   */
  private static async processPayPalPayout(
    payout: DesignerPayout & {
      designer: DesignerProfile & {
        user: {
          id: string
          name: string | null
          email: string | null
        }
      }
    }
  ): Promise<PayoutProcessingResult> {
    // This would integrate with PayPal Payouts API
    // For now, we'll simulate the process
    
    const paypalEmail = payout.payoutDetails?.email
    if (!paypalEmail) {
      throw new Error('PayPal email is required for PayPal payouts')
    }

    // TODO: Integrate with actual PayPal Payouts API
    // const paypalClient = new paypal.PayPalHttpClient(environment)
    // const request = new paypal.PayoutsPostRequest()
    // ... PayPal implementation

    // Simulate successful payout for now
    console.log(`Simulating PayPal payout to ${paypalEmail} for $${payout.amount}`)

    return {
      success: true,
      payoutId: payout.id,
      message: `PayPal payout of $${payout.amount} to ${paypalEmail} completed`,
      externalTransactionId: `PP_${Date.now()}_${payout.id.slice(0, 8)}`
    }
  }

  /**
   * Process bank transfer payout (placeholder)
   */
  private static async processBankTransferPayout(
    payout: DesignerPayout & {
      designer: DesignerProfile & {
        user: {
          id: string
          name: string | null
          email: string | null
        }
      }
    }
  ): Promise<PayoutProcessingResult> {
    // This would integrate with a banking API or require manual processing
    // For now, we'll mark it as requiring manual processing
    
    const bankDetails = payout.payoutDetails
    if (!bankDetails?.accountNumber || !bankDetails?.routingNumber) {
      throw new Error('Bank account details are required for bank transfers')
    }

    // In a real system, this would either:
    // 1. Integrate with a banking API (like Plaid, Dwolla, etc.)
    // 2. Create a manual task for the admin team to process
    
    console.log(`Bank transfer payout queued for manual processing: $${payout.amount} to account ending in ${bankDetails.accountNumber.slice(-4)}`)

    return {
      success: true,
      payoutId: payout.id,
      message: `Bank transfer of $${payout.amount} queued for manual processing`,
      externalTransactionId: `BT_MANUAL_${Date.now()}_${payout.id.slice(0, 8)}`
    }
  }

  /**
   * Calculate total pending payout amounts by designer
   */
  static async getPendingPayoutsSummary() {
    const pendingPayouts = await prisma.designerPayout.groupBy({
      by: ['designerId'],
      where: {
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    })

    const summary = await Promise.all(
      pendingPayouts.map(async (group) => {
        const designer = await prisma.designerProfile.findUnique({
          where: { id: group.designerId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        return {
          designerId: group.designerId,
          designer,
          pendingAmount: group._sum.amount || 0,
          pendingCount: group._count._all
        }
      })
    )

    return summary
  }

  /**
   * Get payout statistics
   */
  static async getPayoutStatistics(designerId?: string) {
    const where = designerId ? { designerId } : {}

    const [stats, recentPayouts] = await Promise.all([
      prisma.designerPayout.aggregate({
        where,
        _sum: {
          amount: true
        },
        _count: {
          _all: true
        }
      }),
      prisma.designerPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
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
      })
    ])

    const statusBreakdown = await prisma.designerPayout.groupBy({
      by: ['status'],
      where,
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    })

    return {
      totalAmount: stats._sum.amount || 0,
      totalPayouts: stats._count._all,
      statusBreakdown: statusBreakdown.reduce((acc, group) => {
        acc[group.status] = {
          amount: group._sum.amount || 0,
          count: group._count._all
        }
        return acc
      }, {} as Record<string, { amount: number; count: number }>),
      recentPayouts
    }
  }
}