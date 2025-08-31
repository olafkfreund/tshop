import { redirect } from 'next/navigation'

// Map URL-friendly category slugs to database categories
const CATEGORY_MAPPINGS = {
  't-shirts': 'TSHIRT',
  'tshirt': 'TSHIRT',
  'tshirts': 'TSHIRT',
  'caps': 'CAP',
  'cap': 'CAP', 
  'hats': 'CAP',
  'tote-bags': 'TOTE_BAG',
  'tote-bag': 'TOTE_BAG',
  'totes': 'TOTE_BAG',
  'bags': 'TOTE_BAG'
} as const

interface CategoryPageProps {
  params: { category: string }
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { category } = params
  const normalizedCategory = category.toLowerCase()
  
  // Map the URL category to database category
  const dbCategory = CATEGORY_MAPPINGS[normalizedCategory as keyof typeof CATEGORY_MAPPINGS]
  
  if (!dbCategory) {
    // If category not found, redirect to all products
    redirect('/products')
  }
  
  // Redirect to the query parameter version
  redirect(`/products?category=${dbCategory}`)
}