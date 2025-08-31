import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const prompt = searchParams.get('prompt') || 'Sample Design'
  const product = searchParams.get('product') || 'tshirt'
  const style = searchParams.get('style') || 'modern'
  const seed = searchParams.get('seed') || '12345'

  // Create a simple SVG design based on the prompt
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  const colorIndex = parseInt(seed) % colors.length
  const primaryColor = colors[colorIndex]
  const secondaryColor = colors[(colorIndex + 3) % colors.length]

  // Generate design elements based on product type
  let designElements = ''
  let viewBox = '0 0 400 400'
  
  if (product === 'tshirt') {
    viewBox = '0 0 400 500'
    designElements = `
      <!-- T-shirt outline -->
      <path d="M50 100 L50 120 L40 140 L40 480 L360 480 L360 140 L350 120 L350 100 L320 100 L320 80 L300 60 L100 60 L80 80 L80 100 Z" 
            fill="white" stroke="#ddd" stroke-width="2"/>
      
      <!-- Design area -->
      <rect x="100" y="150" width="200" height="200" fill="${primaryColor}" rx="10" opacity="0.1"/>
      
      <!-- Main design content -->
      <circle cx="200" cy="220" r="40" fill="${primaryColor}" opacity="0.8"/>
      <rect x="170" y="250" width="60" height="30" fill="${secondaryColor}" opacity="0.9" rx="5"/>
      <text x="200" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${primaryColor}">
        ${prompt.slice(0, 15)}
      </text>
    `
  } else if (product === 'cap') {
    viewBox = '0 0 400 300'
    designElements = `
      <!-- Cap outline -->
      <ellipse cx="200" cy="150" rx="150" ry="100" fill="white" stroke="#ddd" stroke-width="2"/>
      <path d="M50 150 Q 200 50 350 150" fill="none" stroke="#ddd" stroke-width="2"/>
      
      <!-- Design area (front panel) -->
      <ellipse cx="200" cy="130" rx="80" ry="50" fill="${primaryColor}" opacity="0.1"/>
      
      <!-- Main design content -->
      <circle cx="200" cy="120" r="25" fill="${primaryColor}" opacity="0.8"/>
      <text x="200" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${primaryColor}">
        ${prompt.slice(0, 12)}
      </text>
    `
  } else if (product === 'bag' || product === 'tote') {
    viewBox = '0 0 400 400'
    designElements = `
      <!-- Tote bag outline -->
      <rect x="75" y="100" width="250" height="280" fill="white" stroke="#ddd" stroke-width="2" rx="5"/>
      <path d="M100 100 L100 80 L130 60 L270 60 L300 80 L300 100" fill="none" stroke="#ddd" stroke-width="2"/>
      
      <!-- Design area -->
      <rect x="125" y="150" width="150" height="150" fill="${primaryColor}" opacity="0.1" rx="10"/>
      
      <!-- Main design content -->
      <rect x="160" y="180" width="80" height="80" fill="${primaryColor}" opacity="0.8" rx="10"/>
      <circle cx="200" cy="220" r="20" fill="${secondaryColor}"/>
      <text x="200" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${primaryColor}">
        ${prompt.slice(0, 10)}
      </text>
    `
  }

  // Add style-specific elements
  if (style === 'vintage') {
    designElements += `
      <defs>
        <pattern id="vintage" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="10" cy="10" r="2" fill="${primaryColor}" opacity="0.3"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#vintage)"/>
    `
  } else if (style === 'geometric') {
    designElements += `
      <polygon points="180,200 200,170 220,200 200,230" fill="${secondaryColor}" opacity="0.6"/>
      <polygon points="160,240 180,210 200,240 180,270" fill="${primaryColor}" opacity="0.6"/>
    `
  }

  const svg = `
    <svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      ${designElements}
      
      <!-- Mock watermark -->
      <text x="10" y="${product === 'cap' ? '290' : '490'}" font-family="Arial, sans-serif" font-size="10" fill="#999" opacity="0.5">
        Mock Design
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