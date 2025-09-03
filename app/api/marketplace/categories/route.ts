import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/marketplace/categories - Get design categories with counts
export async function GET(request: NextRequest) {
  try {
    // Get all categories from marketplace designs
    const categoriesResult = await prisma.marketplaceDesign.groupBy({
      by: ['category'],
      where: {
        isActive: true,
        category: { not: null }
      },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      }
    })

    // Define category display information
    const categoryInfo: Record<string, { name: string; description: string; emoji: string }> = {
      'business': {
        name: 'Business',
        description: 'Professional logos, corporate designs, and business branding',
        emoji: '💼'
      },
      'lifestyle': {
        name: 'Lifestyle',
        description: 'Everyday designs, quotes, and personal expression',
        emoji: '🌟'
      },
      'art': {
        name: 'Art & Creative',
        description: 'Artistic designs, abstract patterns, and creative expressions',
        emoji: '🎨'
      },
      'sports': {
        name: 'Sports & Fitness',
        description: 'Athletic themes, fitness motivation, and sports teams',
        emoji: '⚽'
      },
      'nature': {
        name: 'Nature & Environment',
        description: 'Natural themes, wildlife, landscapes, and eco-friendly designs',
        emoji: '🌿'
      },
      'technology': {
        name: 'Technology',
        description: 'Tech themes, coding, gaming, and digital culture',
        emoji: '💻'
      },
      'music': {
        name: 'Music & Entertainment',
        description: 'Musical themes, band merch, and entertainment designs',
        emoji: '🎵'
      },
      'fashion': {
        name: 'Fashion & Style',
        description: 'Trendy designs, fashion statements, and style expressions',
        emoji: '👗'
      },
      'food': {
        name: 'Food & Drink',
        description: 'Culinary themes, restaurant designs, and food culture',
        emoji: '🍕'
      },
      'travel': {
        name: 'Travel & Adventure',
        description: 'Travel destinations, adventure themes, and wanderlust',
        emoji: '✈️'
      },
      'vintage': {
        name: 'Vintage & Retro',
        description: 'Retro designs, vintage aesthetics, and nostalgic themes',
        emoji: '📻'
      },
      'minimalist': {
        name: 'Minimalist',
        description: 'Clean, simple designs with minimal elements',
        emoji: '⚪'
      },
      'humor': {
        name: 'Humor & Fun',
        description: 'Funny designs, memes, and humorous expressions',
        emoji: '😄'
      },
      'inspirational': {
        name: 'Inspirational',
        description: 'Motivational quotes, inspirational messages, and positive vibes',
        emoji: '💪'
      },
      'seasonal': {
        name: 'Seasonal & Holidays',
        description: 'Holiday themes, seasonal designs, and special occasions',
        emoji: '🎄'
      }
    }

    const categories = categoriesResult.map(result => ({
      id: result.category,
      name: categoryInfo[result.category!]?.name || result.category,
      description: categoryInfo[result.category!]?.description || '',
      emoji: categoryInfo[result.category!]?.emoji || '🏷️',
      count: result._count._all
    }))

    // Get total design count for percentage calculations
    const totalDesigns = await prisma.marketplaceDesign.count({
      where: { isActive: true }
    })

    const categoriesWithPercentages = categories.map(category => ({
      ...category,
      percentage: totalDesigns > 0 ? Math.round((category.count / totalDesigns) * 100) : 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithPercentages,
        totalCategories: categories.length,
        totalDesigns
      }
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}