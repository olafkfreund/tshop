import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db'

// POST /api/branding/preview - Generate white-label preview
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { teamId, config, previewType = 'storefront' } = body

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Get user and team
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId: user.id,
            role: {
              in: ['OWNER', 'ADMIN'],
            },
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found or access denied' },
        { status: 404 }
      )
    }

    // Generate preview based on type
    const preview = await generatePreview(previewType, team, config)

    return NextResponse.json({
      success: true,
      preview,
    })

  } catch (error: any) {
    console.error('Error generating branding preview:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview' },
      { status: 500 }
    )
  }
}

async function generatePreview(previewType: string, team: any, config: any) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  switch (previewType) {
    case 'storefront':
      return generateStorefrontPreview(team, config, baseUrl)
    case 'email':
      return generateEmailPreview(team, config)
    case 'checkout':
      return generateCheckoutPreview(team, config)
    default:
      return generateStorefrontPreview(team, config, baseUrl)
  }
}

function generateStorefrontPreview(team: any, config: any, baseUrl: string) {
  const brandingConfig = config || JSON.parse(team.brandingConfig || '{}')
  
  return {
    type: 'storefront',
    url: `${baseUrl}/preview/storefront/${team.id}`,
    components: {
      header: {
        backgroundColor: brandingConfig.colors?.primary || '#3B82F6',
        textColor: getContrastColor(brandingConfig.colors?.primary || '#3B82F6'),
        logo: team.logo,
        showTeamName: brandingConfig.customization?.showTeamName !== false,
        teamName: team.name,
        navigation: [
          { label: 'Home', href: '#' },
          { label: 'Products', href: '#' },
          { label: 'Design', href: '#' },
          { label: 'Gallery', href: '#' },
        ],
        style: brandingConfig.layout?.headerStyle || 'default',
      },
      hero: {
        backgroundColor: brandingConfig.colors?.background || '#FFFFFF',
        textColor: brandingConfig.colors?.text || '#111827',
        title: brandingConfig.customization?.customWelcomeMessage || `Welcome to ${team.name}`,
        subtitle: 'Create amazing custom apparel with our AI-powered design tools',
        ctaButton: {
          backgroundColor: brandingConfig.colors?.primary || '#3B82F6',
          textColor: getContrastColor(brandingConfig.colors?.primary || '#3B82F6'),
          text: 'Start Designing',
        },
      },
      products: {
        cards: [
          {
            name: 'Custom T-Shirt',
            price: '$24.99',
            image: '/images/products/tshirt-preview.jpg',
            borderRadius: brandingConfig.layout?.borderRadius || '8px',
          },
          {
            name: 'Custom Cap',
            price: '$19.99',
            image: '/images/products/cap-preview.jpg',
            borderRadius: brandingConfig.layout?.borderRadius || '8px',
          },
          {
            name: 'Tote Bag',
            price: '$16.99',
            image: '/images/products/tote-preview.jpg',
            borderRadius: brandingConfig.layout?.borderRadius || '8px',
          },
        ],
      },
      footer: {
        style: brandingConfig.layout?.footerStyle || 'default',
        backgroundColor: brandingConfig.colors?.text || '#111827',
        textColor: getContrastColor(brandingConfig.colors?.text || '#111827'),
        showTShopBranding: !brandingConfig.whiteLabel?.hideTShopBranding,
        customText: brandingConfig.whiteLabel?.customFooterText || '',
        customPoweredBy: brandingConfig.whiteLabel?.customPoweredBy || '',
        contactInfo: brandingConfig.customization?.customContactInfo || '',
      },
      typography: {
        fontFamily: brandingConfig.typography?.fontFamily || 'Inter',
        headingFont: brandingConfig.typography?.headingFont || 'Inter',
        fontSize: brandingConfig.typography?.fontSize || {
          small: '14px',
          medium: '16px',
          large: '18px',
        },
      },
    },
    css: generatePreviewCSS(brandingConfig),
  }
}

function generateEmailPreview(team: any, config: any) {
  const brandingConfig = config || JSON.parse(team.brandingConfig || '{}')
  
  return {
    type: 'email',
    templates: [
      {
        name: 'Order Confirmation',
        subject: `Your order from ${team.name} is confirmed!`,
        preview: generateEmailTemplate('order-confirmation', team, brandingConfig),
      },
      {
        name: 'Design Shared',
        subject: `${team.name} shared a design with you`,
        preview: generateEmailTemplate('design-shared', team, brandingConfig),
      },
      {
        name: 'Team Invitation',
        subject: `You've been invited to join ${team.name}`,
        preview: generateEmailTemplate('team-invitation', team, brandingConfig),
      },
    ],
  }
}

function generateCheckoutPreview(team: any, config: any) {
  const brandingConfig = config || JSON.parse(team.brandingConfig || '{}')
  
  return {
    type: 'checkout',
    components: {
      header: {
        logo: team.logo,
        teamName: team.name,
        backgroundColor: brandingConfig.colors?.primary || '#3B82F6',
        textColor: getContrastColor(brandingConfig.colors?.primary || '#3B82F6'),
      },
      form: {
        backgroundColor: brandingConfig.colors?.background || '#FFFFFF',
        textColor: brandingConfig.colors?.text || '#111827',
        borderRadius: brandingConfig.layout?.borderRadius || '8px',
        accentColor: brandingConfig.colors?.accent || '#8B5CF6',
      },
      summary: {
        items: [
          {
            name: 'Custom T-Shirt',
            design: 'My Awesome Design',
            quantity: 2,
            price: '$49.98',
          },
        ],
        total: '$49.98',
        shipping: '$5.99',
        tax: '$4.20',
        grandTotal: '$60.17',
      },
      buttons: {
        primary: {
          backgroundColor: brandingConfig.colors?.primary || '#3B82F6',
          textColor: getContrastColor(brandingConfig.colors?.primary || '#3B82F6'),
          borderRadius: brandingConfig.layout?.borderRadius || '8px',
        },
        secondary: {
          backgroundColor: 'transparent',
          textColor: brandingConfig.colors?.primary || '#3B82F6',
          borderColor: brandingConfig.colors?.primary || '#3B82F6',
          borderRadius: brandingConfig.layout?.borderRadius || '8px',
        },
      },
    },
  }
}

function generateEmailTemplate(type: string, team: any, brandingConfig: any) {
  const baseStyles = {
    fontFamily: brandingConfig.typography?.fontFamily || 'Arial, sans-serif',
    primaryColor: brandingConfig.colors?.primary || '#3B82F6',
    backgroundColor: brandingConfig.colors?.background || '#FFFFFF',
    textColor: brandingConfig.colors?.text || '#111827',
  }

  const templates = {
    'order-confirmation': `
      <div style="font-family: ${baseStyles.fontFamily}; max-width: 600px; margin: 0 auto; background-color: ${baseStyles.backgroundColor};">
        <header style="background-color: ${baseStyles.primaryColor}; padding: 20px; text-align: center;">
          ${team.logo ? `<img src="${team.logo}" alt="${team.name}" style="height: 40px; margin-bottom: 10px;">` : ''}
          <h1 style="color: ${getContrastColor(baseStyles.primaryColor)}; margin: 0; font-size: 24px;">${team.name}</h1>
        </header>
        <div style="padding: 30px 20px;">
          <h2 style="color: ${baseStyles.textColor}; margin-bottom: 20px;">Order Confirmed!</h2>
          <p style="color: ${baseStyles.textColor}; line-height: 1.6;">Thank you for your order. We're preparing your custom items and will notify you when they ship.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: ${baseStyles.textColor}; margin-top: 0;">Order #12345</h3>
            <p style="color: ${baseStyles.textColor}; margin: 10px 0;">Custom T-Shirt × 2 - $49.98</p>
            <p style="color: ${baseStyles.textColor}; margin: 10px 0; font-weight: bold;">Total: $60.17</p>
          </div>
        </div>
        <footer style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          ${brandingConfig.whiteLabel?.hideTShopBranding ? '' : 'Powered by TShop'}
          ${brandingConfig.whiteLabel?.customFooterText ? `<br>${brandingConfig.whiteLabel.customFooterText}` : ''}
        </footer>
      </div>
    `,
    'design-shared': `
      <div style="font-family: ${baseStyles.fontFamily}; max-width: 600px; margin: 0 auto; background-color: ${baseStyles.backgroundColor};">
        <header style="background-color: ${baseStyles.primaryColor}; padding: 20px; text-align: center;">
          ${team.logo ? `<img src="${team.logo}" alt="${team.name}" style="height: 40px; margin-bottom: 10px;">` : ''}
          <h1 style="color: ${getContrastColor(baseStyles.primaryColor)}; margin: 0; font-size: 24px;">${team.name}</h1>
        </header>
        <div style="padding: 30px 20px;">
          <h2 style="color: ${baseStyles.textColor}; margin-bottom: 20px;">New Design Shared</h2>
          <p style="color: ${baseStyles.textColor}; line-height: 1.6;">A team member has shared a new design with you for review.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <div style="width: 200px; height: 200px; background-color: #e5e7eb; margin: 0 auto 15px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
              Design Preview
            </div>
            <h3 style="color: ${baseStyles.textColor}; margin: 10px 0;">Awesome Team Design</h3>
            <a href="#" style="background-color: ${baseStyles.primaryColor}; color: ${getContrastColor(baseStyles.primaryColor)}; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 15px;">View Design</a>
          </div>
        </div>
        <footer style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          ${brandingConfig.whiteLabel?.hideTShopBranding ? '' : 'Powered by TShop'}
          ${brandingConfig.whiteLabel?.customFooterText ? `<br>${brandingConfig.whiteLabel.customFooterText}` : ''}
        </footer>
      </div>
    `,
    'team-invitation': `
      <div style="font-family: ${baseStyles.fontFamily}; max-width: 600px; margin: 0 auto; background-color: ${baseStyles.backgroundColor};">
        <header style="background-color: ${baseStyles.primaryColor}; padding: 20px; text-align: center;">
          ${team.logo ? `<img src="${team.logo}" alt="${team.name}" style="height: 40px; margin-bottom: 10px;">` : ''}
          <h1 style="color: ${getContrastColor(baseStyles.primaryColor)}; margin: 0; font-size: 24px;">${team.name}</h1>
        </header>
        <div style="padding: 30px 20px; text-align: center;">
          <h2 style="color: ${baseStyles.textColor}; margin-bottom: 20px;">You're Invited!</h2>
          <p style="color: ${baseStyles.textColor}; line-height: 1.6; margin-bottom: 30px;">You've been invited to join ${team.name} on our custom design platform. Start collaborating with your team today!</p>
          <a href="#" style="background-color: ${baseStyles.primaryColor}; color: ${getContrastColor(baseStyles.primaryColor)}; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-bottom: 20px;">Accept Invitation</a>
          <p style="color: #6b7280; font-size: 14px;">This invitation expires in 7 days</p>
        </div>
        <footer style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          ${brandingConfig.whiteLabel?.hideTShopBranding ? '' : 'Powered by TShop'}
          ${brandingConfig.whiteLabel?.customFooterText ? `<br>${brandingConfig.whiteLabel.customFooterText}` : ''}
        </footer>
      </div>
    `,
  }

  return templates[type] || templates['order-confirmation']
}

function generatePreviewCSS(brandingConfig: any) {
  return `
    :root {
      --primary-color: ${brandingConfig.colors?.primary || '#3B82F6'};
      --secondary-color: ${brandingConfig.colors?.secondary || '#10B981'};
      --accent-color: ${brandingConfig.colors?.accent || '#8B5CF6'};
      --background-color: ${brandingConfig.colors?.background || '#FFFFFF'};
      --text-color: ${brandingConfig.colors?.text || '#111827'};
      --font-family: ${brandingConfig.typography?.fontFamily || 'Inter'}, sans-serif;
      --heading-font: ${brandingConfig.typography?.headingFont || 'Inter'}, sans-serif;
      --border-radius: ${brandingConfig.layout?.borderRadius || '8px'};
      --spacing: ${getSpacingValue(brandingConfig.layout?.spacing || 'normal')};
    }

    body {
      font-family: var(--font-family);
      background-color: var(--background-color);
      color: var(--text-color);
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--heading-font);
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: ${getContrastColor(brandingConfig.colors?.primary || '#3B82F6')};
      border-radius: var(--border-radius);
      padding: calc(var(--spacing) * 0.75) calc(var(--spacing) * 1.5);
    }

    .btn-secondary {
      background-color: var(--secondary-color);
      color: ${getContrastColor(brandingConfig.colors?.secondary || '#10B981')};
      border-radius: var(--border-radius);
      padding: calc(var(--spacing) * 0.75) calc(var(--spacing) * 1.5);
    }

    .card {
      border-radius: var(--border-radius);
      padding: var(--spacing);
      margin-bottom: var(--spacing);
    }

    .header {
      background-color: var(--primary-color);
      color: ${getContrastColor(brandingConfig.colors?.primary || '#3B82F6')};
      padding: var(--spacing);
    }

    .footer {
      background-color: var(--text-color);
      color: ${getContrastColor(brandingConfig.colors?.text || '#111827')};
      padding: var(--spacing);
    }
  `
}

function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

function getSpacingValue(spacing: string): string {
  switch (spacing) {
    case 'compact':
      return '12px'
    case 'spacious':
      return '24px'
    default:
      return '16px'
  }
}