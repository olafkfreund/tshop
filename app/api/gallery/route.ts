import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for gallery submission
const GallerySubmissionSchema = z.object({
  designName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url(),
  prompt: z.string().max(500),
  productCategory: z.enum(['TSHIRT', 'CAP', 'TOTE_BAG']),
  style: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().default(true)
})

// Schema for gallery retrieval
const GalleryQuerySchema = z.object({
  category: z.enum(['TSHIRT', 'CAP', 'TOTE_BAG']).optional(),
  style: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0)
})

// Mock gallery storage (in production, this would be a database)
let galleryDesigns: Array<{
  id: string
  designName: string
  description?: string
  imageUrl: string
  prompt: string
  productCategory: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
  style?: string
  tags?: string[]
  isPublic: boolean
  createdAt: Date
  likes: number
  views: number
  authorName?: string
}> = [
  // Seed with some example designs
  {
    id: 'gallery-1',
    designName: 'Sunset Mountains',
    description: 'Beautiful minimalist mountain landscape perfect for outdoor enthusiasts',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    prompt: 'minimalist mountain silhouette with sunset gradient, clean lines, simple geometric shapes',
    productCategory: 'TSHIRT',
    style: 'minimalist',
    tags: ['nature', 'mountains', 'sunset', 'outdoor'],
    isPublic: true,
    createdAt: new Date('2024-01-15'),
    likes: 42,
    views: 156,
    authorName: 'Nature_Lover_23'
  },
  {
    id: 'gallery-2',
    designName: 'Vintage Surf Vibes',
    description: 'Retro surf club design with weathered textures and classic typography',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    prompt: 'vintage surf club logo, retro typography, weathered textures, ocean waves, 1970s style',
    productCategory: 'TSHIRT',
    style: 'vintage',
    tags: ['surf', 'vintage', 'retro', 'ocean'],
    isPublic: true,
    createdAt: new Date('2024-01-10'),
    likes: 38,
    views: 124,
    authorName: 'SurfArt_Creator'
  },
  {
    id: 'gallery-3',
    designName: 'Cosmic Dreams',
    description: 'Deep space galaxy with colorful nebula and twinkling stars',
    imageUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=400&fit=crop&crop=center',
    prompt: 'cosmic galaxy scene with colorful nebula, twinkling stars, deep space atmosphere, purple and blue tones',
    productCategory: 'TSHIRT',
    style: 'artistic',
    tags: ['space', 'galaxy', 'cosmic', 'stars'],
    isPublic: true,
    createdAt: new Date('2024-01-08'),
    likes: 65,
    views: 203,
    authorName: 'CosmicArtist'
  },
  {
    id: 'gallery-4',
    designName: 'Urban Badge',
    description: 'Modern street-style logo perfect for caps and urban fashion',
    imageUrl: 'https://images.unsplash.com/photo-1588117260148-b47818741c74?w=400&h=400&fit=crop&crop=center',
    prompt: 'urban street logo design, bold typography, city elements, modern badge style for cap front panel',
    productCategory: 'CAP',
    style: 'modern',
    tags: ['urban', 'street', 'logo', 'badge'],
    isPublic: true,
    createdAt: new Date('2024-01-05'),
    likes: 29,
    views: 87,
    authorName: 'UrbanDesigner'
  },
  {
    id: 'gallery-5',
    designName: 'Botanical Beauty',
    description: 'Hand-drawn botanical illustration with detailed leaves and flowers',
    imageUrl: 'https://images.unsplash.com/photo-1493330213553-82a7b9f008ca?w=400&h=400&fit=crop&crop=center',
    prompt: 'botanical illustration with detailed leaves, flowers, and plants, artistic line drawing style, natural green tones',
    productCategory: 'TOTE_BAG',
    style: 'artistic',
    tags: ['botanical', 'nature', 'plants', 'artistic'],
    isPublic: true,
    createdAt: new Date('2024-01-03'),
    likes: 51,
    views: 178,
    authorName: 'BotanicalArt'
  }
]

// GET - Retrieve gallery designs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams)
    
    const query = GalleryQuerySchema.parse(params)
    
    // Filter designs based on query parameters
    let filteredDesigns = galleryDesigns.filter(design => design.isPublic)
    
    if (query.category) {
      filteredDesigns = filteredDesigns.filter(design => design.productCategory === query.category)
    }
    
    if (query.style) {
      filteredDesigns = filteredDesigns.filter(design => design.style === query.style)
    }
    
    // Sort by popularity (likes + views) and creation date
    filteredDesigns.sort((a, b) => {
      const aPopularity = a.likes + (a.views * 0.1)
      const bPopularity = b.likes + (b.views * 0.1)
      if (bPopularity !== aPopularity) {
        return bPopularity - aPopularity
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
    
    // Apply pagination
    const paginatedDesigns = filteredDesigns.slice(query.offset, query.offset + query.limit)
    
    return NextResponse.json({
      success: true,
      data: {
        designs: paginatedDesigns,
        total: filteredDesigns.length,
        hasMore: query.offset + query.limit < filteredDesigns.length
      }
    })
    
  } catch (error) {
    console.error('Gallery GET error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve gallery designs' },
      { status: 500 }
    )
  }
}

// POST - Submit new design to gallery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const submissionData = GallerySubmissionSchema.parse(body)
    
    // Generate unique ID
    const id = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Create new gallery design
    const newDesign = {
      id,
      ...submissionData,
      createdAt: new Date(),
      likes: 0,
      views: 0,
      authorName: 'Anonymous' // In production, get from user session
    }
    
    // Add to gallery (in production, save to database)
    galleryDesigns.unshift(newDesign)
    
    // Keep only the most recent 100 designs to prevent memory issues
    if (galleryDesigns.length > 100) {
      galleryDesigns = galleryDesigns.slice(0, 100)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        design: newDesign,
        message: 'Design successfully added to gallery!'
      }
    })
    
  } catch (error) {
    console.error('Gallery POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid design data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to add design to gallery' },
      { status: 500 }
    )
  }
}

// PUT - Like/unlike a design
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { designId, action } = body
    
    if (!designId || !['like', 'unlike', 'view'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
    
    const design = galleryDesigns.find(d => d.id === designId)
    if (!design) {
      return NextResponse.json(
        { success: false, error: 'Design not found' },
        { status: 404 }
      )
    }
    
    switch (action) {
      case 'like':
        design.likes += 1
        break
      case 'unlike':
        design.likes = Math.max(0, design.likes - 1)
        break
      case 'view':
        design.views += 1
        break
    }
    
    return NextResponse.json({
      success: true,
      data: {
        design,
        message: `Design ${action}d successfully`
      }
    })
    
  } catch (error) {
    console.error('Gallery PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update design' },
      { status: 500 }
    )
  }
}