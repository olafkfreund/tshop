import type { Color, Size } from '@/types'

// Product categories and their display names
export const PRODUCT_CATEGORIES = {
  'TSHIRT': 'T-Shirts',
  'CAP': 'Caps',
  'TOTE_BAG': 'Tote Bags',
} as const

// Available colors for products
export const COLORS: Color[] = [
  { name: 'White', hex: '#FFFFFF', slug: 'white' },
  { name: 'Black', hex: '#000000', slug: 'black' },
  { name: 'Navy', hex: '#1F2937', slug: 'navy' },
  { name: 'Gray', hex: '#6B7280', slug: 'gray' },
  { name: 'Red', hex: '#DC2626', slug: 'red' },
  { name: 'Blue', hex: '#2563EB', slug: 'blue' },
  { name: 'Green', hex: '#059669', slug: 'green' },
  { name: 'Purple', hex: '#7C3AED', slug: 'purple' },
  { name: 'Yellow', hex: '#EAB308', slug: 'yellow' },
  { name: 'Pink', hex: '#EC4899', slug: 'pink' },
]

// T-Shirt sizes
export const TSHIRT_SIZES: Size[] = [
  { name: 'XS', slug: 'xs', measurements: { chest: 16, length: 26 } },
  { name: 'S', slug: 's', measurements: { chest: 18, length: 28 } },
  { name: 'M', slug: 'm', measurements: { chest: 20, length: 29 } },
  { name: 'L', slug: 'l', measurements: { chest: 22, length: 30 } },
  { name: 'XL', slug: 'xl', measurements: { chest: 24, length: 31 } },
  { name: '2XL', slug: '2xl', measurements: { chest: 26, length: 32 } },
  { name: '3XL', slug: '3xl', measurements: { chest: 28, length: 33 } },
]

// Cap sizes (one size fits most, but keeping structure for consistency)
export const CAP_SIZES: Size[] = [
  { name: 'One Size', slug: 'one-size' },
]

// Tote bag sizes
export const TOTE_SIZES: Size[] = [
  { name: 'Standard', slug: 'standard', measurements: { width: 15, length: 16 } },
  { name: 'Large', slug: 'large', measurements: { width: 18, length: 20 } },
]

// AI generation styles
export const AI_STYLES = [
  { value: 'realistic', label: 'Realistic', description: 'Photorealistic designs' },
  { value: 'cartoon', label: 'Cartoon', description: 'Fun and playful illustrations' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean and simple designs' },
  { value: 'vintage', label: 'Vintage', description: 'Retro and classic looks' },
  { value: 'modern', label: 'Modern', description: 'Contemporary and trendy' },
  { value: 'artistic', label: 'Artistic', description: 'Creative and expressive' },
] as const

// AI usage limits
export const AI_USAGE_LIMITS = {
  FREE: {
    daily: 2,
    monthly: 10,
    name: 'Free Tier',
  },
  REGISTERED: {
    daily: 10,
    monthly: 50,
    name: 'Registered User',
  },
  PREMIUM: {
    daily: 50,
    monthly: 200,
    name: 'Premium User',
  },
} as const

// Print areas for different products (in pixels for design canvas)
export const PRINT_AREAS = {
  tshirt: {
    front: { width: 300, height: 400, x: 0, y: 0 },
    back: { width: 300, height: 400, x: 0, y: 0 },
  },
  cap: {
    front: { width: 200, height: 100, x: 0, y: 0 },
  },
  'tote-bag': {
    front: { width: 250, height: 300, x: 0, y: 0 },
  },
} as const

// Order status flow
export const ORDER_STATUS_FLOW = [
  'pending',
  'processing', 
  'printed',
  'shipped',
  'delivered',
] as const

// Font families for text editing
export const FONT_FAMILIES = [
  { name: 'Arial', family: 'Arial, sans-serif', category: 'Sans-serif' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif', category: 'Sans-serif' },
  { name: 'Times New Roman', family: 'Times New Roman, Times, serif', category: 'Serif' },
  { name: 'Georgia', family: 'Georgia, serif', category: 'Serif' },
  { name: 'Verdana', family: 'Verdana, sans-serif', category: 'Sans-serif' },
  { name: 'Courier New', family: 'Courier New, Courier, monospace', category: 'Monospace' },
  { name: 'Impact', family: 'Impact, Arial Black, sans-serif', category: 'Display' },
  { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive', category: 'Casual' },
  { name: 'Trebuchet MS', family: 'Trebuchet MS, sans-serif', category: 'Sans-serif' },
  { name: 'Palatino', family: 'Palatino, serif', category: 'Serif' },
] as const

// Font sizes for text editing
export const FONT_SIZES = [
  8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96
] as const

// Text alignment options
export const TEXT_ALIGNMENTS = [
  { value: 'left', label: 'Left', icon: 'AlignLeft' },
  { value: 'center', label: 'Center', icon: 'AlignCenter' },
  { value: 'right', label: 'Right', icon: 'AlignRight' },
] as const

// Company branding settings
export const COMPANY_BRANDING = {
  logo: {
    url: '/images/branding/tshop-logo.svg',
    altText: 'TShop Logo',
    placement: {
      TSHIRT: { back: { x: 'center', y: 'top', width: 60, height: 20, offsetY: 40 } },
      CAP: { back: { x: 'center', y: 'center', width: 40, height: 12 } },
      TOTE_BAG: { back: { x: 'center', y: 'bottom', width: 50, height: 16, offsetY: -30 } },
    }
  }
} as const

// Fulfillment providers
export const FULFILLMENT_PROVIDERS = {
  printful: {
    name: 'Printful',
    type: 'premium',
    description: 'Premium quality with higher costs',
  },
  printify: {
    name: 'Printify',
    type: 'cost-effective',
    description: 'Cost-effective option with good quality',
  },
} as const

// Design categories
export const DESIGN_CATEGORIES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'graphic', label: 'Graphic', icon: '🎨' },
  { value: 'logo', label: 'Logo', icon: '🏷️' },
  { value: 'artwork', label: 'Artwork', icon: '🖼️' },
  { value: 'pattern', label: 'Pattern', icon: '🔷' },
] as const

// Canvas settings for design editor
export const CANVAS_SETTINGS = {
  width: 800,
  height: 600,
  backgroundColor: '#f8fafc',
  selection: true,
  preserveObjectStacking: true,
}

// Supported file types for uploads
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// API endpoints
export const API_ENDPOINTS = {
  auth: '/api/auth',
  products: '/api/products',
  designs: '/api/designs',
  ai: '/api/ai',
  orders: '/api/orders',
  cart: '/api/cart',
  users: '/api/users',
} as const

// Social media platforms for sharing
export const SOCIAL_PLATFORMS = [
  { name: 'Facebook', icon: '📘', shareUrl: 'https://www.facebook.com/sharer/sharer.php?u=' },
  { name: 'Twitter', icon: '🐦', shareUrl: 'https://twitter.com/intent/tweet?url=' },
  { name: 'Instagram', icon: '📷', shareUrl: 'https://www.instagram.com/' },
  { name: 'Pinterest', icon: '📌', shareUrl: 'https://pinterest.com/pin/create/button/?url=' },
] as const

// Gamification points system
export const POINTS_SYSTEM = {
  designShare: 10,
  designUsedByOther: 25,
  firstPurchase: 50,
  reviewLeft: 15,
  referralSignup: 100,
  dailyLogin: 5,
} as const

// Achievement badges
export const ACHIEVEMENTS = [
  { id: 'first-design', name: 'First Design', description: 'Create your first design', points: 25, icon: '🎨' },
  { id: 'social-sharer', name: 'Social Sharer', description: 'Share 5 designs on social media', points: 50, icon: '📱' },
  { id: 'popular-designer', name: 'Popular Designer', description: 'Have 10 designs used by others', points: 100, icon: '⭐' },
  { id: 'loyal-customer', name: 'Loyal Customer', description: 'Make 5 purchases', points: 150, icon: '👑' },
] as const