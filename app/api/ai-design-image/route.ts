import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const description = searchParams.get('description') || 'AI Generated Design'
  const product = searchParams.get('product') || 'tshirt'
  const style = searchParams.get('style') || 'modern'
  const seed = searchParams.get('seed') || '12345'

  // Create a more sophisticated SVG design based on AI description
  const colors = [
    '#2C3E50', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', 
    '#9B59B6', '#1ABC9C', '#34495E', '#E67E22', '#16A085'
  ]
  
  const colorIndex = parseInt(seed) % colors.length
  const primaryColor = colors[colorIndex]
  const secondaryColor = colors[(colorIndex + 2) % colors.length]
  const accentColor = colors[(colorIndex + 4) % colors.length]

  // Parse description for keywords to influence design
  const keywords = description.toLowerCase().split(/\s+/)
  const hasCircle = keywords.some(word => ['circle', 'round', 'circular', 'dot'].includes(word))
  const hasText = keywords.some(word => ['text', 'word', 'letter', 'typography', 'font'].includes(word))
  const hasGeometric = keywords.some(word => ['geometric', 'triangle', 'square', 'polygon', 'shape'].includes(word))
  const hasNature = keywords.some(word => ['nature', 'tree', 'leaf', 'flower', 'organic'].includes(word))

  let designElements = ''
  let viewBox = '0 0 400 400'
  
  if (product === 'tshirt') {
    viewBox = '0 0 400 500'
    designElements = `
      <!-- T-shirt outline -->
      <path d="M50 100 L50 120 L40 140 L40 480 L360 480 L360 140 L350 120 L350 100 L320 100 L320 80 L300 60 L100 60 L80 80 L80 100 Z" 
            fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>
      
      <!-- Design area background -->
      <rect x="80" y="140" width="240" height="240" fill="white" rx="15" opacity="0.8"/>
      
      <!-- AI-inspired design content -->
    `
    
    if (hasGeometric) {
      designElements += `
        <polygon points="200,160 240,200 200,240 160,200" fill="${primaryColor}" opacity="0.8"/>
        <polygon points="180,180 220,180 220,220 180,220" fill="${secondaryColor}" opacity="0.6"/>
        <polygon points="190,190 210,190 210,210 190,210" fill="${accentColor}"/>
      `
    } else if (hasNature) {
      designElements += `
        <!-- Organic leaf-like shape -->
        <path d="M200 160 Q240 180 220 220 Q200 240 180 220 Q160 180 200 160" 
              fill="${primaryColor}" opacity="0.8"/>
        <circle cx="200" cy="190" r="15" fill="${secondaryColor}" opacity="0.7"/>
        <path d="M185 175 Q200 165 215 175" stroke="${accentColor}" stroke-width="3" fill="none"/>
      `
    } else if (hasCircle) {
      designElements += `
        <circle cx="200" cy="200" r="60" fill="${primaryColor}" opacity="0.3"/>
        <circle cx="200" cy="200" r="40" fill="${primaryColor}" opacity="0.6"/>
        <circle cx="200" cy="200" r="20" fill="${primaryColor}"/>
        <circle cx="200" cy="200" r="8" fill="${secondaryColor}"/>
      `
    } else {
      // Default abstract design
      designElements += `
        <rect x="160" y="160" width="80" height="80" fill="${primaryColor}" opacity="0.8" rx="8"/>
        <circle cx="180" cy="180" r="12" fill="${secondaryColor}"/>
        <circle cx="220" cy="220" r="12" fill="${accentColor}"/>
        <path d="M160 240 Q200 220 240 240" stroke="${secondaryColor}" stroke-width="4" fill="none"/>
      `
    }
    
    if (hasText) {
      designElements += `
        <text x="200" y="290" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="16" font-weight="bold" fill="${primaryColor}">
          AI DESIGN
        </text>
        <text x="200" y="310" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="10" fill="${secondaryColor}" opacity="0.8">
          ${description.split(' ').slice(0, 3).join(' ')}
        </text>
      `
    }

  } else if (product === 'cap') {
    viewBox = '0 0 400 300'
    designElements = `
      <!-- Cap outline -->
      <ellipse cx="200" cy="150" rx="150" ry="100" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>
      <path d="M50 150 Q 200 50 350 150" fill="none" stroke="#dee2e6" stroke-width="1"/>
      <path d="M350 150 L380 160 L375 180 L345 170" fill="#e9ecef" stroke="#dee2e6"/>
      
      <!-- Design area (front panel) -->
      <ellipse cx="200" cy="130" rx="90" ry="60" fill="white" opacity="0.9"/>
      
      <!-- AI-inspired cap design -->
    `
    
    if (hasGeometric) {
      designElements += `
        <polygon points="200,100 220,120 200,140 180,120" fill="${primaryColor}" opacity="0.8"/>
        <rect x="190" y="145" width="20" height="10" fill="${secondaryColor}"/>
      `
    } else {
      designElements += `
        <circle cx="200" cy="120" r="25" fill="${primaryColor}" opacity="0.7"/>
        <circle cx="200" cy="120" r="15" fill="${secondaryColor}"/>
      `
    }
    
    if (hasText) {
      designElements += `
        <text x="200" y="165" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="10" font-weight="bold" fill="${primaryColor}">
          AI
        </text>
      `
    }

  } else if (product === 'bag' || product === 'tote') {
    viewBox = '0 0 400 400'
    designElements = `
      <!-- Tote bag outline -->
      <rect x="75" y="100" width="250" height="280" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1" rx="5"/>
      <rect x="85" y="110" width="230" height="260" fill="white" rx="5"/>
      <path d="M100 100 L100 80 L130 60 L270 60 L300 80 L300 100" 
            fill="none" stroke="#dee2e6" stroke-width="2"/>
      <ellipse cx="130" cy="90" rx="8" ry="15" fill="#dee2e6"/>
      <ellipse cx="270" cy="90" rx="8" ry="15" fill="#dee2e6"/>
      
      <!-- Design area -->
      <rect x="125" y="150" width="150" height="150" fill="white" opacity="0.9" rx="10"/>
      
      <!-- AI-inspired bag design -->
    `
    
    if (hasNature) {
      designElements += `
        <path d="M200 170 Q230 190 220 220 Q200 240 170 220 Q160 190 200 170" 
              fill="${primaryColor}" opacity="0.8"/>
        <path d="M180 200 Q200 185 220 200" stroke="${secondaryColor}" stroke-width="2" fill="none"/>
      `
    } else if (hasGeometric) {
      designElements += `
        <polygon points="200,170 230,200 200,230 170,200" fill="${primaryColor}" opacity="0.8"/>
        <rect x="185" y="185" width="30" height="30" fill="${secondaryColor}" opacity="0.7"/>
      `
    } else {
      designElements += `
        <circle cx="200" cy="200" r="40" fill="${primaryColor}" opacity="0.6"/>
        <circle cx="200" cy="200" r="20" fill="${secondaryColor}"/>
      `
    }
    
    if (hasText) {
      designElements += `
        <text x="200" y="270" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="12" font-weight="bold" fill="${primaryColor}">
          ${description.split(' ').slice(0, 2).join(' ').toUpperCase()}
        </text>
      `
    }
  }

  // Add style-specific enhancements
  if (style === 'vintage') {
    designElements += `
      <defs>
        <filter id="vintage">
          <feColorMatrix type="sepia" values="0.8"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#vintage)" filter="url(#vintage)" opacity="0.1"/>
    `
  } else if (style === 'modern') {
    designElements += `
      <defs>
        <linearGradient id="modern" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#modern)"/>
    `
  }

  const svg = `
    <svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f8f9fa;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.1"/>
        </filter>
      </defs>
      
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      ${designElements}
      
      <!-- AI-powered watermark -->
      <text x="10" y="${product === 'cap' ? '290' : product === 'tshirt' ? '490' : '390'}" 
            font-family="Arial, sans-serif" font-size="9" fill="#6c757d" opacity="0.6">
        🤖 AI Generated
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}