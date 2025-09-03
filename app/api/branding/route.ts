import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db'

// GET /api/branding - Get team branding settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is team member with appropriate permissions
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Get team with branding
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        logo: true,
        brandingConfig: true,
        customDomain: true,
        plan: true,
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Parse branding configuration
    const brandingConfig = team.brandingConfig ? JSON.parse(team.brandingConfig) : getDefaultBrandingConfig()

    return NextResponse.json({
      success: true,
      branding: {
        teamId: team.id,
        teamName: team.name,
        logo: team.logo,
        customDomain: team.customDomain,
        plan: team.plan,
        config: brandingConfig,
        canUseWhiteLabel: ['BUSINESS', 'ENTERPRISE'].includes(team.plan),
        canUseCustomDomain: ['ENTERPRISE'].includes(team.plan),
      },
    })

  } catch (error: any) {
    console.error('Error fetching branding settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branding settings' },
      { status: 500 }
    )
  }
}

// PUT /api/branding - Update team branding settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { teamId, config, logo, customDomain } = body

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
      include: {
        team: true,
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const team = teamMember.team

    // Validate plan-based features
    if (customDomain && team.plan !== 'ENTERPRISE') {
      return NextResponse.json(
        { error: 'Custom domains are only available for Enterprise plans' },
        { status: 403 }
      )
    }

    if (config?.whiteLabel?.enabled && !['BUSINESS', 'ENTERPRISE'].includes(team.plan)) {
      return NextResponse.json(
        { error: 'White-label features are only available for Business and Enterprise plans' },
        { status: 403 }
      )
    }

    // Validate branding configuration
    const validatedConfig = validateBrandingConfig(config)

    // Update team branding
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        logo: logo || team.logo,
        customDomain: customDomain !== undefined ? customDomain : team.customDomain,
        brandingConfig: JSON.stringify(validatedConfig),
        updatedAt: new Date(),
      },
    })

    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        type: 'BRANDING_UPDATED',
        userId: user.id,
        teamId,
        metadata: {
          hasLogo: !!logo,
          hasCustomDomain: !!customDomain,
          whiteLabel: validatedConfig.whiteLabel?.enabled || false,
          customColors: Object.keys(validatedConfig.colors || {}).length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      branding: {
        teamId: updatedTeam.id,
        logo: updatedTeam.logo,
        customDomain: updatedTeam.customDomain,
        config: validatedConfig,
      },
      message: 'Branding settings updated successfully',
    })

  } catch (error: any) {
    console.error('Error updating branding settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update branding settings' },
      { status: 500 }
    )
  }
}

function getDefaultBrandingConfig() {
  return {
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#8B5CF6',
      background: '#FFFFFF',
      text: '#111827',
    },
    typography: {
      fontFamily: 'Inter',
      headingFont: 'Inter',
      fontSize: {
        small: '14px',
        medium: '16px',
        large: '18px',
      },
    },
    layout: {
      headerStyle: 'default',
      footerStyle: 'default',
      borderRadius: '8px',
      spacing: 'normal',
    },
    whiteLabel: {
      enabled: false,
      hideTShopBranding: false,
      customFooterText: '',
      customPoweredBy: '',
    },
    customization: {
      showTeamName: true,
      showTeamLogo: true,
      customWelcomeMessage: '',
      customContactInfo: '',
    },
  }
}

function validateBrandingConfig(config: any) {
  const defaultConfig = getDefaultBrandingConfig()
  
  if (!config || typeof config !== 'object') {
    return defaultConfig
  }

  return {
    colors: {
      primary: isValidColor(config.colors?.primary) ? config.colors.primary : defaultConfig.colors.primary,
      secondary: isValidColor(config.colors?.secondary) ? config.colors.secondary : defaultConfig.colors.secondary,
      accent: isValidColor(config.colors?.accent) ? config.colors.accent : defaultConfig.colors.accent,
      background: isValidColor(config.colors?.background) ? config.colors.background : defaultConfig.colors.background,
      text: isValidColor(config.colors?.text) ? config.colors.text : defaultConfig.colors.text,
    },
    typography: {
      fontFamily: isValidFont(config.typography?.fontFamily) ? config.typography.fontFamily : defaultConfig.typography.fontFamily,
      headingFont: isValidFont(config.typography?.headingFont) ? config.typography.headingFont : defaultConfig.typography.headingFont,
      fontSize: {
        small: config.typography?.fontSize?.small || defaultConfig.typography.fontSize.small,
        medium: config.typography?.fontSize?.medium || defaultConfig.typography.fontSize.medium,
        large: config.typography?.fontSize?.large || defaultConfig.typography.fontSize.large,
      },
    },
    layout: {
      headerStyle: ['default', 'minimal', 'centered'].includes(config.layout?.headerStyle) 
        ? config.layout.headerStyle : defaultConfig.layout.headerStyle,
      footerStyle: ['default', 'minimal', 'hidden'].includes(config.layout?.footerStyle) 
        ? config.layout.footerStyle : defaultConfig.layout.footerStyle,
      borderRadius: config.layout?.borderRadius || defaultConfig.layout.borderRadius,
      spacing: ['compact', 'normal', 'spacious'].includes(config.layout?.spacing) 
        ? config.layout.spacing : defaultConfig.layout.spacing,
    },
    whiteLabel: {
      enabled: !!config.whiteLabel?.enabled,
      hideTShopBranding: !!config.whiteLabel?.hideTShopBranding,
      customFooterText: sanitizeText(config.whiteLabel?.customFooterText || ''),
      customPoweredBy: sanitizeText(config.whiteLabel?.customPoweredBy || ''),
    },
    customization: {
      showTeamName: config.customization?.showTeamName !== false,
      showTeamLogo: config.customization?.showTeamLogo !== false,
      customWelcomeMessage: sanitizeText(config.customization?.customWelcomeMessage || ''),
      customContactInfo: sanitizeText(config.customization?.customContactInfo || ''),
    },
  }
}

function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false
  
  // Check hex color format
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (hexRegex.test(color)) return true
  
  // Check rgb/rgba format
  const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/
  const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
  
  return rgbRegex.test(color) || rgbaRegex.test(color)
}

function isValidFont(font: string): boolean {
  if (!font || typeof font !== 'string') return false
  
  const allowedFonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Source Sans Pro', 'Nunito', 'PT Sans', 'Ubuntu', 'Merriweather',
    'Playfair Display', 'Raleway', 'Oswald', 'Lora'
  ]
  
  return allowedFonts.includes(font)
}

function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  // Remove potentially harmful content and limit length
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .substring(0, 500) // Limit length
    .trim()
}