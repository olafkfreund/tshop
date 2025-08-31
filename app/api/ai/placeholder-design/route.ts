import { NextRequest, NextResponse } from 'next/server'

// Temporary placeholder endpoint that generates SVG designs
// In production, this would be replaced with actual image generation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'tshirt'
    const prompt = searchParams.get('prompt') || 'Custom Design'

    // Generate a simple SVG placeholder based on the category and prompt
    const svg = generatePlaceholderSVG(category, prompt)

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error generating placeholder:', error)
    return NextResponse.json(
      { error: 'Failed to generate placeholder' },
      { status: 500 }
    )
  }
}

function generatePlaceholderSVG(category: string, prompt: string): string {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  
  // Truncate prompt if too long
  const displayText = prompt.length > 20 ? prompt.substring(0, 20) + '...' : prompt
  
  let width = 300
  let height = 400
  let shape = 'rect'
  
  // Adjust dimensions based on category
  switch (category) {
    case 'cap':
      width = 200
      height = 100
      shape = 'ellipse'
      break
    case 'tote-bag':
      width = 250
      height = 300
      break
    default: // tshirt
      width = 300
      height = 400
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${randomColor};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${randomColor};stop-opacity:0.4" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="transparent"/>
  
  <!-- Main shape -->
  ${shape === 'ellipse' 
    ? `<ellipse cx="${width/2}" cy="${height/2}" rx="${width/3}" ry="${height/3}" fill="url(#gradient)" stroke="${randomColor}" stroke-width="2"/>`
    : `<rect x="${width/4}" y="${height/6}" width="${width/2}" height="${height*2/3}" rx="10" fill="url(#gradient)" stroke="${randomColor}" stroke-width="2"/>`
  }
  
  <!-- Decorative elements -->
  <circle cx="${width/4}" cy="${height/4}" r="3" fill="${randomColor}" opacity="0.6"/>
  <circle cx="${width*3/4}" cy="${height/4}" r="3" fill="${randomColor}" opacity="0.6"/>
  <circle cx="${width/2}" cy="${height*3/4}" r="3" fill="${randomColor}" opacity="0.6"/>
  
  <!-- Text -->
  <text x="${width/2}" y="${height/2 - 10}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="14" 
        font-weight="bold" 
        fill="white">
    AI Generated
  </text>
  <text x="${width/2}" y="${height/2 + 10}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="12" 
        fill="white" 
        opacity="0.9">
    ${displayText}
  </text>
  
  <!-- Category indicator -->
  <text x="${width/2}" y="${height - 20}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="10" 
        fill="${randomColor}" 
        opacity="0.7">
    For ${category.charAt(0).toUpperCase() + category.slice(1)}
  </text>
</svg>`
}