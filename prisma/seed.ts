import { PrismaClient } from '@prisma/client'
import { COLORS, TSHIRT_SIZES, CAP_SIZES, TOTE_SIZES, PRINT_AREAS } from '../lib/constants'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create base products
  const tshirt = await prisma.product.create({
    data: {
      name: 'Premium Cotton T-Shirt',
      description: 'High-quality 100% cotton t-shirt perfect for custom designs. Comfortable fit with excellent print quality.',
      category: 'TSHIRT',
      basePrice: 19.99,
      specs: {
        create: {
          material: '100% Cotton',
          care: '["Machine wash cold", "Tumble dry low", "Do not bleach", "Cool iron if needed"]',
          sizing: 'Unisex fit - check size chart for measurements',
          printAreaFront: JSON.stringify(PRINT_AREAS.tshirt.front),
          printAreaBack: JSON.stringify(PRINT_AREAS.tshirt.back),
        },
      },
      images: {
        create: [
          {
            url: '/images/products/tshirt-white-front.jpg',
            altText: 'White T-Shirt Front View',
            isPrimary: true,
            angle: 'front',
          },
          {
            url: '/images/products/tshirt-white-back.jpg',
            altText: 'White T-Shirt Back View',
            isPrimary: false,
            angle: 'back',
          },
        ],
      },
    },
  })

  const cap = await prisma.product.create({
    data: {
      name: 'Classic Baseball Cap',
      description: 'Adjustable baseball cap with structured crown. Perfect for embroidered or printed designs on the front panel.',
      category: 'CAP',
      basePrice: 24.99,
      specs: {
        create: {
          material: '100% Cotton Twill',
          care: '["Spot clean only", "Air dry", "Do not machine wash"]',
          sizing: 'One size fits most - adjustable strap',
          printAreaFront: JSON.stringify(PRINT_AREAS.cap.front),
        },
      },
      images: {
        create: [
          {
            url: '/images/products/cap-black-front.jpg',
            altText: 'Black Baseball Cap Front View',
            isPrimary: true,
            angle: 'front',
          },
          {
            url: '/images/products/cap-black-side.jpg',
            altText: 'Black Baseball Cap Side View',
            isPrimary: false,
            angle: 'side',
          },
        ],
      },
    },
  })

  const toteBag = await prisma.product.create({
    data: {
      name: 'Eco-Friendly Tote Bag',
      description: 'Durable canvas tote bag made from sustainable materials. Great for shopping, books, or everyday carry with custom designs.',
      category: 'TOTE_BAG',
      basePrice: 16.99,
      specs: {
        create: {
          material: '100% Organic Canvas',
          care: '["Machine wash cold", "Air dry recommended", "Iron on reverse side"]',
          sizing: 'Standard: 15"W x 16"H, Large: 18"W x 20"H',
          printAreaFront: JSON.stringify(PRINT_AREAS['tote-bag'].front),
        },
      },
      images: {
        create: [
          {
            url: '/images/products/tote-natural-front.jpg',
            altText: 'Natural Canvas Tote Bag Front View',
            isPrimary: true,
            angle: 'front',
          },
        ],
      },
    },
  })

  console.log('✅ Base products created')

  // Create product variants for T-Shirts
  const tshirtVariants = []
  for (const color of COLORS.slice(0, 6)) { // First 6 colors
    for (const size of TSHIRT_SIZES) {
      tshirtVariants.push({
        productId: tshirt.id,
        name: `${color.name} ${size.name}`,
        sku: `TSHIRT-${color.slug.toUpperCase()}-${size.slug.toUpperCase()}`,
        price: 19.99,
        colorName: color.name,
        colorHex: color.hex,
        colorSlug: color.slug,
        sizeName: size.name,
        sizeSlug: size.slug,
        stock: Math.floor(Math.random() * 100) + 10, // Random stock 10-110
      })
    }
  }

  await prisma.productVariant.createMany({
    data: tshirtVariants,
  })

  // Create product variants for Caps
  const capVariants = []
  for (const color of COLORS.slice(0, 5)) { // First 5 colors
    capVariants.push({
      productId: cap.id,
      name: `${color.name} Cap`,
      sku: `CAP-${color.slug.toUpperCase()}-OS`,
      price: 24.99,
      colorName: color.name,
      colorHex: color.hex,
      colorSlug: color.slug,
      sizeName: 'One Size',
      sizeSlug: 'one-size',
      stock: Math.floor(Math.random() * 50) + 5,
    })
  }

  await prisma.productVariant.createMany({
    data: capVariants,
  })

  // Create product variants for Tote Bags
  const toteVariants = []
  const naturalColors = COLORS.filter(c => ['white', 'black', 'navy', 'gray'].includes(c.slug))
  
  for (const color of naturalColors) {
    for (const size of TOTE_SIZES) {
      toteVariants.push({
        productId: toteBag.id,
        name: `${color.name} ${size.name} Tote`,
        sku: `TOTE-${color.slug.toUpperCase()}-${size.slug.toUpperCase()}`,
        price: size.slug === 'large' ? 19.99 : 16.99,
        colorName: color.name,
        colorHex: color.hex,
        colorSlug: color.slug,
        sizeName: size.name,
        sizeSlug: size.slug,
        stock: Math.floor(Math.random() * 30) + 5,
      })
    }
  }

  await prisma.productVariant.createMany({
    data: toteVariants,
  })

  console.log('✅ Product variants created')

  // Create sample designs
  const sampleDesigns = [
    {
      name: 'Minimalist Circle',
      description: 'Clean geometric design perfect for modern apparel',
      imageUrl: '/images/designs/minimalist-circle.svg',
      category: 'GRAPHIC',
      tags: '["minimalist", "geometric", "modern"]',
      isPublic: true,
    },
    {
      name: 'Vintage Typography',
      description: 'Classic text design with retro styling',
      imageUrl: '/images/designs/vintage-text.svg',
      category: 'TEXT',
      tags: '["vintage", "typography", "retro"]',
      isPublic: true,
    },
    {
      name: 'Mountain Logo',
      description: 'Outdoor adventure logo design',
      imageUrl: '/images/designs/mountain-logo.svg',
      category: 'LOGO',
      tags: '["outdoor", "mountains", "adventure"]',
      isPublic: true,
    },
    {
      name: 'Abstract Art',
      description: 'Creative abstract artwork for unique apparel',
      imageUrl: '/images/designs/abstract-art.svg',
      category: 'ARTWORK',
      tags: '["abstract", "artistic", "creative"]',
      isPublic: true,
    },
  ]

  for (const design of sampleDesigns) {
    await prisma.design.create({
      data: {
        ...design,
        category: design.category as any,
      },
    })
  }

  console.log('✅ Sample designs created')

  const productCount = await prisma.product.count()
  const variantCount = await prisma.productVariant.count()
  const designCount = await prisma.design.count()

  console.log('\n📊 Seed Summary:')
  console.log(`   Products: ${productCount}`)
  console.log(`   Variants: ${variantCount}`)
  console.log(`   Designs: ${designCount}`)
  console.log('\n🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })