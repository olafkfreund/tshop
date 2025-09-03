'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  ShoppingBag, 
  Palette, 
  User, 
  Search,
  Menu,
  X,
  Heart,
  ShoppingCart
} from 'lucide-react'
import { useCart } from '@/lib/cart'

interface MobileNavigationProps {
  className?: string
}

export default function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { items } = useCart()

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0)

  const navigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
    },
    {
      name: 'Products',
      href: '/products',
      icon: ShoppingBag,
    },
    {
      name: 'Design',
      href: '/editor',
      icon: Palette,
    },
    {
      name: 'Gallery',
      href: '/gallery',
      icon: Search,
    },
    {
      name: 'Account',
      href: '/dashboard',
      icon: User,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={`
        fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 
        z-50 safe-area-pb block md:hidden ${className}
      `}>
        <div className="flex justify-around items-center py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors
                  ${active 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
                {active && (
                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40 block md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-lg text-gray-900">TShop</span>
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Wishlist */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Heart className="h-5 w-5 text-gray-600" />
            </button>

            {/* Cart */}
            <Link 
              href="/cart" 
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-3 space-y-3">
              <Link
                href="/orders"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingBag className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">My Orders</span>
              </Link>

              <Link
                href="/gallery"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Design Gallery</span>
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Account Settings</span>
              </Link>

              {/* Quick Actions */}
              <div className="pt-3 border-t border-gray-200">
                <Link
                  href="/editor"
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Palette className="h-5 w-5" />
                  <span>Create Design</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30 block md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Safe area spacing for bottom navigation */}
      <div className="h-20 block md:hidden"></div>
    </>
  )
}

// Safe area utilities for iPhone notches and Android navigation bars
export function SafeAreaTop({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`pt-safe-top ${className}`}>
      {children}
    </div>
  )
}

export function SafeAreaBottom({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`pb-safe-bottom ${className}`}>
      {children}
    </div>
  )
}