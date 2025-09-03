'use client'

import { CartProvider } from '@/lib/contexts/cart-context'

interface CartProviderWrapperProps {
  children: React.ReactNode
}

export default function CartProviderWrapper({ children }: CartProviderWrapperProps) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  )
}