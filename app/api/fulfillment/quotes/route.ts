import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fulfillmentService } from '@/lib/fulfillment/fulfillment-service'
import { ProductCategory } from '@prisma/client'
import { COMPANY_BRANDING } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { items, shippingAddress, strategy = 'cost' } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
    }

    // Validate and enhance items with design placement data
    const validatedItems = items.map((item, index) => {
      if (!item.productCategory) {
        throw new Error(`Item ${index}: productCategory is required`)
      }

      if (!item.designImageUrl && !item.customDesign) {
        throw new Error(`Item ${index}: designImageUrl or customDesign is required`)
      }

      const productCategory = item.productCategory as ProductCategory
      
      // Get company logo placement for this product
      const logoPlacement = COMPANY_BRANDING.logo.placement[productCategory]
      
      // Calculate design positioning based on product constraints  
      const designPlacement = {
        front: {
          customDesign: {
            url: item.designImageUrl || item.customDesign?.imageUrl || '',
            position: 'center', // Center the custom design
            maxWidth: 300,  // Max width for custom design
            maxHeight: 400, // Max height for custom design
          }
        },
        back: logoPlacement?.back ? {
          companyLogo: {
            url: COMPANY_BRANDING.logo.url,
            position: logoPlacement.back.x,
            width: logoPlacement.back.width,
            height: logoPlacement.back.height,
            offsetY: logoPlacement.back.offsetY || 0,
          }
        } : undefined
      }

      return {
        ...item,
        productId: item.productId || `${productCategory.toLowerCase()}-${Date.now()}`,
        variantId: item.variantId || `${productCategory.toLowerCase()}-variant`,
        unitPrice: item.unitPrice || '24.99',
        quantity: item.quantity || 1,
        designPlacement,
        // Include color and size if provided
        color: item.color || 'white',
        size: item.size || 'M'
      }
    })

    // Create order structure for fulfillment service
    const orderForQuote = {
      shippingAddress,
      userId: session.user.id
    }

    // Get quotes from all available providers
    const quotes = await fulfillmentService.getQuotes(orderForQuote, validatedItems)

    // Select best provider based on strategy
    const selectedProvider = fulfillmentService.selectProvider(quotes, strategy as 'cost' | 'speed' | 'quality')

    // Prepare comprehensive response
    const response = {
      quotes: quotes.map(quote => ({
        provider: quote.provider,
        totalCost: quote.totalCost,
        productionTime: quote.productionTime,
        shippingCost: quote.shippingCost,
        tax: quote.tax,
        estimatedDelivery: quote.estimatedDelivery,
        items: quote.items.map((quoteItem, itemIndex) => ({
          ...quoteItem,
          // Include design placement information
          designPlacement: validatedItems[itemIndex]?.placement,
          printFiles: validatedItems[itemIndex]?.printReadyData,
          designValidation: validatedItems[itemIndex]?.designValidation
        }))
      })),
      recommended: selectedProvider ? {
        provider: selectedProvider.provider,
        totalCost: selectedProvider.totalCost,
        productionTime: selectedProvider.productionTime,
        estimatedDelivery: selectedProvider.estimatedDelivery,
        reason: strategy === 'cost' ? 'Lowest cost option' :
               strategy === 'speed' ? 'Fastest production time' :
               strategy === 'quality' ? 'Highest quality provider' : 'Best overall option'
      } : null,
      designValidation: {
        allDesignsValid: validatedItems.every(item => item.designValidation?.isValid),
        warnings: validatedItems
          .map((item, index) => ({
            itemIndex: index,
            productCategory: item.productCategory,
            isValid: item.designValidation?.isValid,
            issue: item.designValidation?.reason,
            suggestedScale: item.designValidation?.suggestedScale
          }))
          .filter(warning => !warning.isValid),
        placementInfo: validatedItems.map((item, index) => ({
          itemIndex: index,
          productCategory: item.productCategory,
          frontPlacement: item.placement?.front,
          backPlacement: item.placement?.back,
          printReadyFiles: {
            front: item.printReadyData?.front,
            back: item.printReadyData?.back
          }
        }))
      },
      totalProviders: quotes.length,
      strategy
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Error getting fulfillment quotes:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get fulfillment quotes'
      },
      { status: 500 }
    )
  }
}