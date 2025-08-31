// Design template system for TShop
export interface DesignTemplate {
  id: string
  name: string
  description: string
  category: 'TSHIRT' | 'CAP' | 'TOTE_BAG'
  style: 'minimalist' | 'vintage' | 'modern' | 'artistic' | 'cartoon' | 'realistic'
  prompt: string
  tags: string[]
  imageUrl: string
  popularity: number
  isPopular?: boolean
  isFeatured?: boolean
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  // T-SHIRT Templates
  {
    id: 'tshirt-mountain-minimal',
    name: 'Mountain Silhouette',
    description: 'Clean minimalist mountain landscape perfect for nature lovers',
    category: 'TSHIRT',
    style: 'minimalist',
    prompt: 'Minimalist mountain silhouette with sunset gradient, clean lines, simple geometric shapes',
    tags: ['nature', 'mountains', 'minimalist', 'outdoor'],
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    popularity: 95,
    isPopular: true,
    isFeatured: true
  },
  {
    id: 'tshirt-vintage-bike',
    name: 'Vintage Motorcycle',
    description: 'Classic motorcycle design with retro styling and worn textures',
    category: 'TSHIRT',
    style: 'vintage',
    prompt: 'Vintage motorcycle illustration with retro colors, classic bike design, aged texture effects',
    tags: ['vintage', 'motorcycle', 'retro', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    popularity: 88,
    isPopular: true
  },
  {
    id: 'tshirt-geometric-modern',
    name: 'Abstract Geometry',
    description: 'Modern geometric pattern with bold colors and clean shapes',
    category: 'TSHIRT',
    style: 'modern',
    prompt: 'Modern geometric pattern with triangles and circles, bold contrasting colors, abstract composition',
    tags: ['geometric', 'abstract', 'modern', 'pattern'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&crop=center',
    popularity: 82,
  },
  {
    id: 'tshirt-space-cosmic',
    name: 'Cosmic Galaxy',
    description: 'Dreamy space scene with nebula and stars',
    category: 'TSHIRT',
    style: 'artistic',
    prompt: 'Cosmic galaxy scene with colorful nebula, twinkling stars, deep space atmosphere, purple and blue tones',
    tags: ['space', 'galaxy', 'cosmic', 'stars'],
    imageUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=400&fit=crop&crop=center',
    popularity: 91,
    isPopular: true
  },

  // CAP Templates  
  {
    id: 'cap-urban-logo',
    name: 'Urban Badge',
    description: 'Street-style logo perfect for urban fashion',
    category: 'CAP',
    style: 'modern',
    prompt: 'Urban street logo design, bold typography, city elements, modern badge style for cap front panel',
    tags: ['urban', 'street', 'logo', 'badge'],
    imageUrl: 'https://images.unsplash.com/photo-1588117260148-b47818741c74?w=400&h=400&fit=crop&crop=center',
    popularity: 87,
    isPopular: true
  },
  {
    id: 'cap-minimal-icon',
    name: 'Minimal Symbol',
    description: 'Clean, simple icon perfect for minimalist style',
    category: 'CAP',
    style: 'minimalist',
    prompt: 'Minimalist icon design, single symbol, clean lines, perfect for cap embroidery, simple and recognizable',
    tags: ['minimalist', 'icon', 'simple', 'clean'],
    imageUrl: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=400&h=400&fit=crop&crop=center',
    popularity: 79,
  },
  {
    id: 'cap-vintage-patch',
    name: 'Vintage Patch',
    description: 'Classic patch design with retro appeal',
    category: 'CAP',
    style: 'vintage',
    prompt: 'Vintage patch design with classic typography, retro colors, aged effect, traditional badge style',
    tags: ['vintage', 'patch', 'retro', 'classic'],
    imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop&crop=center',
    popularity: 84,
  },

  // TOTE BAG Templates
  {
    id: 'tote-botanical-art',
    name: 'Botanical Garden',
    description: 'Beautiful botanical illustration with leaves and flowers',
    category: 'TOTE_BAG',
    style: 'artistic',
    prompt: 'Botanical illustration with detailed leaves, flowers, and plants, artistic line drawing style, natural green tones',
    tags: ['botanical', 'nature', 'plants', 'artistic'],
    imageUrl: 'https://images.unsplash.com/photo-1493330213553-82a7b9f008ca?w=400&h=400&fit=crop&crop=center',
    popularity: 93,
    isPopular: true,
    isFeatured: true
  },
  {
    id: 'tote-coffee-quote',
    name: 'Coffee Lover',
    description: 'Inspirational coffee-themed design with typography',
    category: 'TOTE_BAG',
    style: 'modern',
    prompt: 'Coffee-themed design with inspirational quote, coffee beans illustration, modern typography, warm brown tones',
    tags: ['coffee', 'quote', 'typography', 'lifestyle'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center',
    popularity: 86,
  },
  {
    id: 'tote-book-lover',
    name: 'Book Worm',
    description: 'Literary-themed design perfect for book enthusiasts',
    category: 'TOTE_BAG',
    style: 'artistic',
    prompt: 'Book-themed illustration with stacked books, reading quotes, literary elements, cozy library atmosphere',
    tags: ['books', 'reading', 'literary', 'education'],
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
    popularity: 81,
  },
  {
    id: 'tote-eco-message',
    name: 'Eco Warrior',
    description: 'Environmental message with earth-friendly design',
    category: 'TOTE_BAG',
    style: 'modern',
    prompt: 'Environmental awareness design with earth elements, eco-friendly message, green and blue natural colors, sustainability theme',
    tags: ['eco', 'environment', 'sustainability', 'earth'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop&crop=center',
    popularity: 78,
  }
]

// Helper functions
export function getTemplatesByCategory(category: 'TSHIRT' | 'CAP' | 'TOTE_BAG'): DesignTemplate[] {
  return DESIGN_TEMPLATES.filter(template => template.category === category)
}

export function getPopularTemplates(limit: number = 6): DesignTemplate[] {
  return DESIGN_TEMPLATES
    .filter(template => template.isPopular)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}

export function getFeaturedTemplates(limit: number = 3): DesignTemplate[] {
  return DESIGN_TEMPLATES
    .filter(template => template.isFeatured)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}

export function getTemplateById(id: string): DesignTemplate | undefined {
  return DESIGN_TEMPLATES.find(template => template.id === id)
}

export function getTemplatesByStyle(style: DesignTemplate['style']): DesignTemplate[] {
  return DESIGN_TEMPLATES.filter(template => template.style === style)
}

export function searchTemplates(query: string): DesignTemplate[] {
  const lowerQuery = query.toLowerCase()
  return DESIGN_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}