import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const orderId = params.id

    // Get order details for sharing
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            },
            design: {
              select: {
                name: true,
                imageUrl: true
              }
            },
            variant: {
              select: {
                colorName: true,
                sizeName: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Generate share-friendly data
    const shareData = {
      orderId: order.id,
      orderNumber: order.id.slice(-8),
      customerName: order.user?.name || 'TShop Customer',
      itemCount: order.items.length,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        productName: item.product.name,
        designName: item.design?.name,
        designImage: item.design?.imageUrl,
        productImage: item.product.images[0]?.url,
        color: item.variant.colorName,
        size: item.variant.sizeName,
        quantity: item.quantity
      })),
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders/${order.id}/share`
    }

    // Create an HTML page for social media sharing
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TShop Order #${shareData.orderNumber}</title>
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${shareData.shareUrl}">
        <meta property="og:title" content="Check out my custom TShop order!">
        <meta property="og:description" content="${shareData.customerName} just ordered ${shareData.itemCount} custom item${shareData.itemCount > 1 ? 's' : ''} from TShop! 🎨✨">
        <meta property="og:image" content="${shareData.items[0]?.designImage || shareData.items[0]?.productImage || `${process.env.NEXT_PUBLIC_SITE_URL}/images/tshop-og-image.png`}">

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="${shareData.shareUrl}">
        <meta property="twitter:title" content="Check out my custom TShop order!">
        <meta property="twitter:description" content="${shareData.customerName} just ordered ${shareData.itemCount} custom item${shareData.itemCount > 1 ? 's' : ''} from TShop! 🎨✨">
        <meta property="twitter:image" content="${shareData.items[0]?.designImage || shareData.items[0]?.productImage || `${process.env.NEXT_PUBLIC_SITE_URL}/images/tshop-og-image.png`}">

        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card {
            background: white;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .title {
            font-size: 2rem;
            font-weight: bold;
            color: #1a202c;
            margin-bottom: 16px;
          }
          .subtitle {
            color: #718096;
            margin-bottom: 32px;
            font-size: 1.1rem;
          }
          .order-preview {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            margin-bottom: 32px;
          }
          .item-preview {
            width: 80px;
            height: 80px;
            border-radius: 12px;
            object-fit: cover;
            border: 3px solid #e2e8f0;
          }
          .cta {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            margin-top: 16px;
            transition: transform 0.2s;
          }
          .cta:hover {
            transform: translateY(-2px);
          }
          .powered-by {
            margin-top: 24px;
            font-size: 0.875rem;
            color: #a0aec0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">🎉 Custom Order from TShop!</div>
          <div class="subtitle">
            ${shareData.customerName} just ordered ${shareData.itemCount} awesome custom item${shareData.itemCount > 1 ? 's' : ''}!
          </div>
          
          <div class="order-preview">
            ${shareData.items.slice(0, 4).map(item => 
              `<img src="${item.designImage || item.productImage || '/images/placeholder.png'}" 
                   alt="${item.productName}" 
                   class="item-preview">`
            ).join('')}
            ${shareData.items.length > 4 ? `<div class="item-preview" style="background: #f7fafc; display: flex; align-items: center; justify-content: center; color: #718096; font-weight: bold;">+${shareData.items.length - 4}</div>` : ''}
          </div>

          <div style="margin-bottom: 24px;">
            <strong>Order Total: $${(Number(shareData.total) / 100).toFixed(2)}</strong>
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" class="cta">
            Create Your Own Custom Design! ✨
          </a>
          
          <div class="powered-by">
            Powered by TShop AI Design Studio
          </div>
        </div>

        <script>
          // Track social share view
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics', JSON.stringify({
              action: 'share_page_viewed',
              category: 'social',
              custom_parameters: {
                order_id: '${order.id}',
                referrer: document.referrer
              }
            }));
          }
        </script>
      </body>
      </html>
    `

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Error generating order share page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// API endpoint for getting order data for sharing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const orderId = params.id
    const body = await request.json()

    // Validate request
    if (!body.platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    // Log share event
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        total: true,
        items: {
          select: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (session?.user?.id !== order.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Track the share event in analytics
    // This would integrate with your analytics system
    console.log(`Order ${orderId} shared on ${body.platform}`)

    return NextResponse.json({ 
      success: true,
      message: 'Share tracked successfully'
    })

  } catch (error) {
    console.error('Error tracking order share:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}