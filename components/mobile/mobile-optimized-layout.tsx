'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface MobileOptimizedLayoutProps {
  children: React.ReactNode
  showBottomSheet?: boolean
  bottomSheetContent?: React.ReactNode
  bottomSheetHeight?: 'auto' | 'half' | 'full'
  onBottomSheetChange?: (isOpen: boolean) => void
}

export default function MobileOptimizedLayout({
  children,
  showBottomSheet = false,
  bottomSheetContent,
  bottomSheetHeight = 'auto',
  onBottomSheetChange
}: MobileOptimizedLayoutProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)

  const handleBottomSheetToggle = () => {
    const newState = !isBottomSheetOpen
    setIsBottomSheetOpen(newState)
    onBottomSheetChange?.(newState)
  }

  const getBottomSheetHeight = () => {
    if (!isBottomSheetOpen) return '0px'
    
    switch (bottomSheetHeight) {
      case 'full':
        return '90vh'
      case 'half':
        return '50vh'
      default:
        return 'auto'
    }
  }

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const deltaY = currentY - startY
    const threshold = 50

    if (deltaY > threshold && isBottomSheetOpen) {
      // Swipe down to close
      setIsBottomSheetOpen(false)
      onBottomSheetChange?.(false)
    } else if (deltaY < -threshold && !isBottomSheetOpen) {
      // Swipe up to open
      setIsBottomSheetOpen(true)
      onBottomSheetChange?.(true)
    }

    setIsDragging(false)
    setStartY(0)
    setCurrentY(0)
  }

  return (
    <div className="relative w-full h-full">
      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isBottomSheetOpen ? 'transform -translate-y-2 scale-95 opacity-75' : ''}
      `}>
        {children}
      </div>

      {/* Bottom Sheet */}
      {showBottomSheet && (
        <>
          {/* Backdrop */}
          {isBottomSheetOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity duration-300"
              onClick={() => {
                setIsBottomSheetOpen(false)
                onBottomSheetChange?.(false)
              }}
            />
          )}

          {/* Bottom Sheet Container */}
          <div
            className={`
              fixed bottom-0 left-0 right-0 z-50
              bg-white rounded-t-2xl shadow-2xl
              transform transition-transform duration-300 ease-in-out
              ${isBottomSheetOpen ? 'translate-y-0' : 'translate-y-full'}
            `}
            style={{
              height: getBottomSheetHeight(),
              maxHeight: '90vh'
            }}
          >
            {/* Handle Bar */}
            <div
              className="flex justify-center py-3 cursor-pointer"
              onClick={handleBottomSheetToggle}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Content */}
            <div className="px-4 pb-safe-bottom max-h-full overflow-y-auto">
              {bottomSheetContent}
            </div>
          </div>

          {/* Toggle Button (when closed) */}
          {!isBottomSheetOpen && (
            <button
              onClick={handleBottomSheetToggle}
              className="fixed bottom-20 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
          )}
        </>
      )}
    </div>
  )
}

// Mobile-optimized card component
export function MobileCard({ 
  children, 
  className = '',
  padding = 'normal' 
}: { 
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'small' | 'normal' | 'large'
}) {
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 'p-0'
      case 'small':
        return 'p-3'
      case 'large':
        return 'p-8'
      default:
        return 'p-4'
    }
  }

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border border-gray-200
      ${getPadding()}
      ${className}
    `}>
      {children}
    </div>
  )
}

// Mobile-optimized button component
export function MobileButton({
  children,
  variant = 'primary',
  size = 'normal',
  fullWidth = false,
  disabled = false,
  onClick,
  className = ''
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'small' | 'normal' | 'large'
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 text-gray-900 hover:bg-gray-200'
      case 'ghost':
        return 'bg-transparent text-gray-700 hover:bg-gray-100'
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'py-2 px-3 text-sm'
      case 'large':
        return 'py-4 px-6 text-lg'
      default:
        return 'py-3 px-4 text-base'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg font-semibold transition-all duration-200
        transform active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

// Mobile-optimized input component
export function MobileInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  error,
  className = ''
}: {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  required?: boolean
  error?: string
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg
          text-base placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? 'border-red-300 ring-red-500' : ''}
        `}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}