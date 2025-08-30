# TShop Frontend Technical Specifications

> Last Updated: 2025-08-30
> Version: 1.0.0

## Overview

This document provides comprehensive frontend technical requirements and implementation specifications for the TShop AI-powered custom apparel platform. The architecture prioritizes performance, scalability, mobile-first responsive design, and complex 3D/canvas rendering capabilities.

---

## 1. Project Structure & Architecture

### Recommended Folder Structure

```
tshop/
├── README.md
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.local
├── .env.example
├── .eslintrc.json
├── .gitignore
├── docker-compose.yml (for local dev)
├── playwright.config.ts
├── jest.config.js
├── src/
│   ├── app/                          # Next.js 15 app directory
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/                   # Route groups
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── profile/page.tsx
│   │   │   └── orders/page.tsx
│   │   ├── (shop)/
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   └── checkout/page.tsx
│   │   ├── (design)/
│   │   │   ├── editor/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [productId]/page.tsx
│   │   │   └── gallery/page.tsx
│   │   ├── api/                      # API routes
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── ai/
│   │   │   ├── orders/
│   │   │   └── webhooks/
│   │   └── [locale]/                 # i18n routes
│   ├── components/                   # Reusable components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── design/
│   │   │   ├── DesignEditor/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── Canvas.tsx
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   ├── LayerPanel.tsx
│   │   │   │   └── Properties.tsx
│   │   │   ├── AIGenerator/
│   │   │   └── TemplateLibrary/
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   └── Preview3D.tsx
│   │   ├── ar/
│   │   │   ├── ARViewer.tsx
│   │   │   └── CameraCapture.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── SEOHead.tsx
│   ├── lib/                          # Utilities and configurations
│   │   ├── utils.ts
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── stripe.ts
│   │   ├── ai/
│   │   │   ├── gemini.ts
│   │   │   └── types.ts
│   │   ├── fabric/
│   │   │   ├── canvas.ts
│   │   │   ├── objects.ts
│   │   │   └── serialization.ts
│   │   ├── three/
│   │   │   ├── scene.ts
│   │   │   ├── materials.ts
│   │   │   └── models.ts
│   │   └── i18n/
│   │       ├── config.ts
│   │       └── translations/
│   ├── hooks/                        # Custom React hooks
│   │   ├── useDesignEditor.ts
│   │   ├── useAIGeneration.ts
│   │   ├── useCart.ts
│   │   ├── use3DPreview.ts
│   │   └── useResponsive.ts
│   ├── store/                        # State management
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── cartSlice.ts
│   │   │   ├── designSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── providers/
│   │       ├── StoreProvider.tsx
│   │       └── ThemeProvider.tsx
│   ├── types/                        # TypeScript definitions
│   │   ├── index.ts
│   │   ├── product.ts
│   │   ├── design.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── styles/                       # CSS and styling
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── fabric-overrides.css
│   └── constants/
│       ├── index.ts
│       ├── products.ts
│       └── design.ts
├── public/
│   ├── images/
│   ├── icons/
│   ├── models/                       # 3D models
│   ├── textures/
│   └── fonts/
├── tests/
│   ├── __tests__/
│   ├── e2e/
│   └── fixtures/
└── docs/
    ├── DEPLOYMENT.md
    └── DEVELOPMENT.md
```

### Architecture Principles

- **Feature-First Organization**: Group related components by domain (design, product, ar)
- **Atomic Design Pattern**: Build from atoms → molecules → organisms → templates → pages
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data
- **Performance-First**: Code splitting and lazy loading built into architecture
- **Type Safety**: Comprehensive TypeScript coverage with strict mode

---

## 2. Development Environment Setup

### Required Tools & Versions

```json
{
  "engines": {
    "node": "22.x",
    "npm": "10.x"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

### Core Dependencies

```json
{
  "dependencies": {
    // Framework & Core
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.6.0",

    // Styling
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@tailwindcss/typography": "^0.5.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",

    // UI Components
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "lucide-react": "^0.400.0",

    // Design Editor
    "fabric": "^6.0.0",
    "@types/fabric": "^5.3.0",

    // 3D Visualization
    "three": "^0.167.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "@react-three/xr": "^6.2.0",
    "@types/three": "^0.167.0",

    // State Management
    "@reduxjs/toolkit": "^2.2.0",
    "react-redux": "^9.1.0",
    "zustand": "^4.5.0",

    // Forms & Validation
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.7.0",

    // Auth
    "next-auth": "5.0.0-beta.20",
    "@auth/prisma-adapter": "^2.4.0",

    // Database
    "prisma": "^5.17.0",
    "@prisma/client": "^5.17.0",

    // AI Integration
    "@google/generative-ai": "^0.16.0",

    // Internationalization
    "next-i18next": "^15.3.0",
    "react-i18next": "^15.0.0",

    // Payments
    "stripe": "^16.8.0",
    "@stripe/stripe-js": "^4.1.0",

    // Image Processing
    "sharp": "^0.33.0",
    "cloudinary": "^2.4.0",

    // Performance
    "@vercel/analytics": "^1.3.0",
    "@vercel/speed-insights": "^1.0.0",

    // Utils
    "date-fns": "^3.6.0",
    "lodash": "^4.17.21",
    "@types/lodash": "^4.17.0"
  },
  "devDependencies": {
    // Testing
    "jest": "^29.7.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@playwright/test": "^1.45.0",
    
    // Linting & Formatting
    "eslint": "^9.8.0",
    "eslint-config-next": "^15.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",

    // Development Tools
    "@storybook/react-vite": "^8.2.0",
    "chromatic": "^11.5.0",
    "cross-env": "^7.0.3"
  }
}
```

### Development Workflow Configuration

#### Next.js Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Performance optimizations
  images: {
    domains: ['res.cloudinary.com', 'printful.com', 'printify.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // i18n configuration
  i18n: {
    locales: ['en', 'es', 'fr', 'de'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  // Bundle analyzer
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: false,
          analyzerPort: isServer ? 8888 : 8889,
        })
      );
    }
    return config;
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

#### TailwindCSS 4.0 Configuration (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom breakpoints for mobile-first design
      screens: {
        'xs': '400px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      // Design system colors
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          900: '#0f172a',
        },
      },
      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      // Animation for smooth interactions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
  darkMode: 'class',
}

export default config
```

---

## 3. Component Architecture

### Design System Implementation

#### Base Component Pattern

```typescript
// src/components/ui/Button.tsx
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

#### Complex Component Example: Design Editor

```typescript
// src/components/design/DesignEditor/index.tsx
import React, { Suspense, lazy } from 'react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { DesignEditorProvider } from '@/store/providers/DesignEditorProvider'

// Lazy load heavy components
const Canvas = lazy(() => import('./Canvas'))
const Toolbar = lazy(() => import('./Toolbar'))
const LayerPanel = lazy(() => import('./LayerPanel'))
const Properties = lazy(() => import('./Properties'))

interface DesignEditorProps {
  productId: string
  initialDesign?: Design
  onSave: (design: Design) => Promise<void>
  onExport: (design: Design) => Promise<string>
}

export const DesignEditor: React.FC<DesignEditorProps> = ({
  productId,
  initialDesign,
  onSave,
  onExport,
}) => {
  return (
    <ErrorBoundary>
      <DesignEditorProvider 
        productId={productId} 
        initialDesign={initialDesign}
      >
        <div className="h-screen flex flex-col lg:flex-row">
          {/* Mobile-first responsive layout */}
          <div className="flex-1 flex flex-col">
            <Suspense fallback={<LoadingSpinner />}>
              <Toolbar onSave={onSave} onExport={onExport} />
            </Suspense>
            
            <div className="flex-1 flex flex-col lg:flex-row">
              <Suspense fallback={<LoadingSpinner />}>
                <Canvas className="flex-1" />
              </Suspense>
              
              {/* Responsive side panels */}
              <div className="w-full lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l">
                <Suspense fallback={<LoadingSpinner />}>
                  <LayerPanel className="flex-1 lg:flex-none lg:h-1/2 border-b" />
                </Suspense>
                <Suspense fallback={<LoadingSpinner />}>
                  <Properties className="flex-1 lg:flex-none lg:h-1/2" />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </DesignEditorProvider>
    </ErrorBoundary>
  )
}
```

### Component Performance Patterns

```typescript
// src/hooks/useResponsive.ts
import { useState, useEffect } from 'react'

interface BreakpointConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

const breakpoints: BreakpointConfig = {
  xs: 400,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowSize.width < breakpoints.md
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg
  const isDesktop = windowSize.width >= breakpoints.lg

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints,
  }
}
```

---

## 4. State Management Strategy

### Redux Toolkit with RTK Query Setup

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import authSlice from './slices/authSlice'
import cartSlice from './slices/cartSlice'
import designSlice from './slices/designSlice'
import uiSlice from './slices/uiSlice'
import { apiSlice } from './api/apiSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cart: cartSlice,
    design: designSlice,
    ui: uiSlice,
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['design/setFabricCanvas'],
        ignoredPaths: ['design.canvas'],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### Design Editor State Management

```typescript
// src/store/slices/designSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { fabric } from 'fabric'

interface DesignState {
  canvas: fabric.Canvas | null
  currentDesign: Design | null
  history: DesignHistoryItem[]
  historyIndex: number
  isLoading: boolean
  isDirty: boolean
  activeObject: fabric.Object | null
  tools: {
    activeTool: 'select' | 'text' | 'shape' | 'image' | 'draw'
    brushSize: number
    brushColor: string
    fontSize: number
    fontFamily: string
  }
}

const initialState: DesignState = {
  canvas: null,
  currentDesign: null,
  history: [],
  historyIndex: -1,
  isLoading: false,
  isDirty: false,
  activeObject: null,
  tools: {
    activeTool: 'select',
    brushSize: 10,
    brushColor: '#000000',
    fontSize: 24,
    fontFamily: 'Arial',
  },
}

const designSlice = createSlice({
  name: 'design',
  initialState,
  reducers: {
    setCanvas: (state, action: PayloadAction<fabric.Canvas>) => {
      state.canvas = action.payload
    },
    setCurrentDesign: (state, action: PayloadAction<Design>) => {
      state.currentDesign = action.payload
      state.isDirty = false
    },
    addToHistory: (state, action: PayloadAction<DesignHistoryItem>) => {
      state.history = state.history.slice(0, state.historyIndex + 1)
      state.history.push(action.payload)
      state.historyIndex = state.history.length - 1
      state.isDirty = true
    },
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex -= 1
      }
    },
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex += 1
      }
    },
    setActiveTool: (state, action: PayloadAction<DesignState['tools']['activeTool']>) => {
      state.tools.activeTool = action.payload
    },
    setActiveObject: (state, action: PayloadAction<fabric.Object | null>) => {
      state.activeObject = action.payload
    },
    updateToolProperty: (state, action: PayloadAction<{ key: string; value: any }>) => {
      const { key, value } = action.payload
      ;(state.tools as any)[key] = value
    },
  },
})

export const {
  setCanvas,
  setCurrentDesign,
  addToHistory,
  undo,
  redo,
  setActiveTool,
  setActiveObject,
  updateToolProperty,
} = designSlice.actions

export default designSlice.reducer
```

### Zustand for Local Component State

```typescript
// src/hooks/useDesignEditor.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { fabric } from 'fabric'

interface DesignEditorStore {
  canvas: fabric.Canvas | null
  isInitialized: boolean
  selectedObjects: fabric.Object[]
  clipboardData: any
  
  // Actions
  initializeCanvas: (canvasElement: HTMLCanvasElement) => void
  destroyCanvas: () => void
  copySelection: () => void
  pasteFromClipboard: () => void
  deleteSelection: () => void
}

export const useDesignEditor = create<DesignEditorStore>()(
  subscribeWithSelector((set, get) => ({
    canvas: null,
    isInitialized: false,
    selectedObjects: [],
    clipboardData: null,

    initializeCanvas: (canvasElement: HTMLCanvasElement) => {
      const canvas = new fabric.Canvas(canvasElement, {
        width: 800,
        height: 600,
        backgroundColor: 'white',
        preserveObjectStacking: true,
      })

      // Setup canvas event listeners
      canvas.on('selection:created', (e) => {
        set({ selectedObjects: e.selected || [] })
      })

      canvas.on('selection:updated', (e) => {
        set({ selectedObjects: e.selected || [] })
      })

      canvas.on('selection:cleared', () => {
        set({ selectedObjects: [] })
      })

      set({ canvas, isInitialized: true })
    },

    destroyCanvas: () => {
      const { canvas } = get()
      if (canvas) {
        canvas.dispose()
        set({ canvas: null, isInitialized: false, selectedObjects: [] })
      }
    },

    copySelection: () => {
      const { canvas } = get()
      if (canvas && canvas.getActiveObject()) {
        canvas.getActiveObject().clone((cloned: fabric.Object) => {
          set({ clipboardData: cloned })
        })
      }
    },

    pasteFromClipboard: () => {
      const { canvas, clipboardData } = get()
      if (canvas && clipboardData) {
        clipboardData.clone((cloned: fabric.Object) => {
          cloned.set({
            left: cloned.left! + 10,
            top: cloned.top! + 10,
            evented: true,
          })
          canvas.add(cloned)
          canvas.setActiveObject(cloned)
          canvas.requestRenderAll()
        })
      }
    },

    deleteSelection: () => {
      const { canvas } = get()
      if (canvas) {
        const activeObjects = canvas.getActiveObjects()
        canvas.discardActiveObject()
        activeObjects.forEach((obj) => canvas.remove(obj))
        canvas.requestRenderAll()
      }
    },
  }))
)
```

---

## 5. Performance Optimization

### Code Splitting & Lazy Loading Strategy

```typescript
// src/app/design/editor/page.tsx - Route-based splitting
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

// Lazy load heavy 3D and design components
const DesignEditor = dynamic(
  () => import('@/components/design/DesignEditor'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Disable SSR for canvas-heavy components
  }
)

const Preview3D = dynamic(
  () => import('@/components/product/Preview3D'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export default function DesignEditorPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-screen">
          <DesignEditor />
          <Preview3D />
        </div>
      </Suspense>
    </div>
  )
}
```

### Image Optimization Configuration

```typescript
// src/components/common/OptimizedImage.tsx
import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string
  className?: string
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  className,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={imgSrc}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => setImgSrc(fallbackSrc)}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        priority={props.priority}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}
```

### Bundle Analysis & Optimization

```javascript
// webpack.config.js additions for performance monitoring
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // Existing Next.js config...
  
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          fabric: {
            test: /[\\/]node_modules[\\/]fabric[\\/]/,
            name: 'fabric',
            priority: 20,
            chunks: 'all',
          },
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'three',
            priority: 20,
            chunks: 'all',
          },
        },
      }
    }

    return config
  },
})
```

---

## 6. 3D/AR Implementation

### Three.js Scene Setup

```typescript
// src/lib/three/scene.ts
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

export class TShirtScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private tshirtMesh: THREE.Mesh | null = null
  private designTexture: THREE.Texture | null = null

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance' // Better for mobile GPUs
    })
    
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    
    container.appendChild(this.renderer.domElement)
    
    this.setupLighting()
    this.loadTShirtModel()
  }

  private setupLighting() {
    // Environment lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    this.scene.add(ambientLight)

    // Key light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 0, 2)
    this.scene.add(fillLight)
  }

  private async loadTShirtModel() {
    const loader = new GLTFLoader()
    
    // Setup DRACO compression for better performance
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    loader.setDRACOLoader(dracoLoader)

    try {
      const gltf = await loader.loadAsync('/models/tshirt-optimized.glb')
      this.tshirtMesh = gltf.scene.children[0] as THREE.Mesh
      
      // Setup material for design application
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.1,
      })
      
      this.tshirtMesh.material = material
      this.scene.add(this.tshirtMesh)
      
      // Position camera
      this.camera.position.set(0, 0, 5)
      this.camera.lookAt(0, 0, 0)
      
    } catch (error) {
      console.error('Error loading T-shirt model:', error)
    }
  }

  public applyDesign(designDataURL: string) {
    if (!this.tshirtMesh) return

    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(designDataURL, (texture) => {
      texture.flipY = false
      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      
      const material = this.tshirtMesh!.material as THREE.MeshStandardMaterial
      material.map = texture
      material.needsUpdate = true
      
      this.designTexture = texture
    })
  }

  public animate = () => {
    requestAnimationFrame(this.animate)
    
    // Subtle rotation animation
    if (this.tshirtMesh) {
      this.tshirtMesh.rotation.y += 0.005
    }
    
    this.renderer.render(this.scene, this.camera)
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  public dispose() {
    this.renderer.dispose()
    if (this.designTexture) {
      this.designTexture.dispose()
    }
  }
}
```

### React Three Fiber Component

```typescript
// src/components/product/Preview3D.tsx
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, useTexture } from '@react-three/drei'
import { Suspense, useRef, useEffect } from 'react'
import * as THREE from 'three'

interface TShirtModelProps {
  designUrl?: string
  color?: string
}

function TShirtModel({ designUrl, color = '#ffffff' }: TShirtModelProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { scene } = useGLTF('/models/tshirt-optimized.glb')
  const designTexture = useTexture(designUrl || '/images/placeholder-design.png')

  useEffect(() => {
    if (meshRef.current && designUrl) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.map = designTexture
      material.color = new THREE.Color(color)
      material.needsUpdate = true
    }
  }, [designUrl, color, designTexture])

  useFrame((state) => {
    // Gentle floating animation
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1
    }
  })

  return (
    <mesh ref={meshRef} geometry={scene.children[0].geometry}>
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        metalness={0.1}
        map={designTexture}
      />
    </mesh>
  )
}

interface Preview3DProps {
  design?: Design
  product?: Product
  className?: string
}

export const Preview3D: React.FC<Preview3DProps> = ({ 
  design, 
  product, 
  className = ''
}) => {
  return (
    <div className={`w-full h-96 lg:h-full relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        performance={{ min: 0.5 }} // Throttle for mobile performance
        dpr={[1, 2]} // Limit pixel ratio for performance
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          {/* 3D Model */}
          <TShirtModel 
            designUrl={design?.previewUrl}
            color={product?.color || '#ffffff'}
          />
          
          {/* Environment & Controls */}
          <Environment preset="studio" />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={3}
            maxDistance={8}
          />
        </Suspense>
      </Canvas>
      
      {/* Performance overlay for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 text-xs bg-black/50 text-white p-1 rounded">
          3D Preview Active
        </div>
      )}
    </div>
  )
}

// Preload the model for better performance
useGLTF.preload('/models/tshirt-optimized.glb')
```

### AR Camera Implementation

```typescript
// src/components/ar/ARViewer.tsx
import { useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ARButton, XR } from '@react-three/xr'

interface ARViewerProps {
  design?: Design
  productType: 'cap' | 'tshirt'
}

export const ARViewer: React.FC<ARViewerProps> = ({ design, productType }) => {
  const [isARSupported, setIsARSupported] = useState(false)

  useEffect(() => {
    // Check AR support
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-ar').then(setIsARSupported)
    }
  }, [])

  if (!isARSupported) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600">AR not supported on this device</p>
        <p className="text-sm text-gray-400 mt-2">
          Try on a compatible mobile device
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-96">
      <ARButton
        sessionInit={{
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay', 'light-estimation'],
          domOverlay: { root: document.body },
        }}
        className="absolute top-4 right-4 z-10 bg-blue-500 text-white px-4 py-2 rounded"
      />
      
      <Canvas>
        <XR>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          {productType === 'cap' && (
            <CapModel design={design} />
          )}
          {productType === 'tshirt' && (
            <TShirtModel design={design} />
          )}
        </XR>
      </Canvas>
    </div>
  )
}

function CapModel({ design }: { design?: Design }) {
  // 3D cap model implementation
  return (
    <mesh position={[0, 0, -1]}>
      <cylinderGeometry args={[1, 1, 0.5, 8]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  )
}
```

---

## 7. Internationalization Setup

### Next.js i18n Configuration

```typescript
// src/lib/i18n/config.ts
import { use } from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-fs-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    ns: ['common', 'product', 'design', 'checkout'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false,
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['path', 'cookie', 'localStorage', 'navigator'],
      caches: ['cookie'],
    },
  })

export default use
```

### Translation Hook

```typescript
// src/hooks/useTranslation.ts
import { useTranslation as useI18next } from 'react-i18next'
import { useRouter } from 'next/router'

export const useTranslation = (namespace?: string) => {
  const { t, i18n } = useI18next(namespace)
  const router = useRouter()

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng)
    
    // Update URL with new locale
    const { pathname, asPath, query } = router
    router.push({ pathname, query }, asPath, { locale: lng })
  }

  const formatCurrency = (amount: number) => {
    const locale = i18n.language
    const currencyMap: Record<string, string> = {
      en: 'USD',
      es: 'EUR',
      fr: 'EUR',
      de: 'EUR',
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyMap[locale] || 'USD',
    }).format(amount)
  }

  return {
    t,
    i18n,
    changeLanguage,
    formatCurrency,
    currentLanguage: i18n.language,
  }
}
```

### Localized Component Example

```typescript
// src/components/product/ProductCard.tsx
import { useTranslation } from '@/hooks/useTranslation'
import { OptimizedImage } from '@/components/common/OptimizedImage'
import { Button } from '@/components/ui/Button'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart 
}) => {
  const { t, formatCurrency } = useTranslation('product')

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <div className="aspect-square relative">
        <OptimizedImage
          src={product.imageUrl}
          alt={t('productImageAlt', { name: product.name })}
          fill
          className="object-cover"
        />
        {product.isNew && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
            {t('newBadge')}
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-3">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
          
          <Button 
            onClick={() => onAddToCart(product)}
            size="sm"
          >
            {t('addToCart')}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 8. Mobile-First Responsive Implementation

### Responsive Breakpoint Strategy

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Mobile-first responsive utilities */
@layer utilities {
  /* Touch-friendly interactive elements */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Mobile-optimized spacing */
  .mobile-padding {
    @apply px-4 py-3;
  }
  
  .desktop-padding {
    @apply lg:px-8 lg:py-6;
  }
  
  /* Responsive typography */
  .responsive-text-sm {
    @apply text-sm lg:text-base;
  }
  
  .responsive-text-lg {
    @apply text-lg lg:text-xl xl:text-2xl;
  }
  
  /* Mobile-first grid layouts */
  .responsive-grid {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
  }
  
  /* Design editor responsive layout */
  .design-editor-layout {
    @apply flex flex-col h-screen lg:flex-row;
  }
  
  .design-canvas-area {
    @apply flex-1 min-h-0 order-2 lg:order-1;
  }
  
  .design-panels {
    @apply h-80 lg:h-auto lg:w-80 order-1 lg:order-2 border-b lg:border-b-0 lg:border-l;
  }
}

/* Mobile-specific optimizations */
@media (max-width: 768px) {
  /* Improve tap targets on mobile */
  button, 
  [role="button"],
  input[type="checkbox"],
  input[type="radio"] {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Optimize select dropdowns */
  select {
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  /* Canvas optimizations for mobile */
  canvas {
    touch-action: none;
    max-width: 100%;
    height: auto;
  }
}

/* High DPI display optimizations */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .high-dpi-image {
    image-rendering: -webkit-optimize-contrast;
  }
}
```

### Touch Interaction Components

```typescript
// src/components/common/TouchOptimizedButton.tsx
import React from 'react'
import { Button, ButtonProps } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface TouchOptimizedButtonProps extends ButtonProps {
  hapticFeedback?: boolean
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  className,
  hapticFeedback = false,
  onClick,
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Provide haptic feedback on supported devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    onClick?.(event)
  }

  return (
    <Button
      className={cn(
        // Touch-optimized sizing
        'touch-target',
        // Better touch feedback
        'active:scale-95 transition-transform duration-75',
        // Improved focus for keyboard navigation
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  )
}
```

### PWA Configuration

```typescript
// src/lib/pwa/config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'cloudinary-images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /\.(?:js|css|woff2?)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      }
    }
  ]
})

module.exports = withPWA
```

---

## 9. Testing Strategy

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Component Testing Examples

```typescript
// tests/__tests__/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/components/product/ProductCard'
import { mockProduct } from '../fixtures/products'

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'productImageAlt': `Product image for ${params?.name}`,
        'newBadge': 'New',
        'addToCart': 'Add to Cart',
      }
      return translations[key] || key
    },
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

describe('ProductCard', () => {
  const mockAddToCart = jest.fn()
  
  beforeEach(() => {
    mockAddToCart.mockClear()
  })

  it('renders product information correctly', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockAddToCart} 
      />
    )
    
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
    expect(screen.getByText(mockProduct.description)).toBeInTheDocument()
    expect(screen.getByText('$19.99')).toBeInTheDocument()
  })

  it('calls onAddToCart when button is clicked', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockAddToCart} 
      />
    )
    
    const addButton = screen.getByText('Add to Cart')
    fireEvent.click(addButton)
    
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct)
  })

  it('shows new badge for new products', () => {
    const newProduct = { ...mockProduct, isNew: true }
    
    render(
      <ProductCard 
        product={newProduct} 
        onAddToCart={mockAddToCart} 
      />
    )
    
    expect(screen.getByText('New')).toBeInTheDocument()
  })
})
```

### Playwright E2E Testing

```typescript
// tests/e2e/design-editor.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Design Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design/editor/tshirt-basic')
  })

  test('should load design editor interface', async ({ page }) => {
    // Wait for canvas to load
    await page.waitForSelector('canvas', { timeout: 10000 })
    
    // Check toolbar is present
    await expect(page.locator('[data-testid="design-toolbar"]')).toBeVisible()
    
    // Check panels are present
    await expect(page.locator('[data-testid="layer-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="properties-panel"]')).toBeVisible()
  })

  test('should add text to canvas', async ({ page }) => {
    // Click text tool
    await page.click('[data-testid="text-tool"]')
    
    // Click on canvas to add text
    const canvas = page.locator('canvas')
    await canvas.click({ position: { x: 400, y: 300 } })
    
    // Type text
    await page.keyboard.type('Test Design')
    
    // Verify text appears in layer panel
    await expect(page.locator('[data-testid="layer-item"]').first()).toContainText('Test Design')
  })

  test('should generate AI design', async ({ page }) => {
    // Open AI generator
    await page.click('[data-testid="ai-generator-button"]')
    
    // Enter prompt
    await page.fill('[data-testid="ai-prompt-input"]', 'Cool mountain landscape')
    
    // Generate design
    await page.click('[data-testid="generate-button"]')
    
    // Wait for generation to complete
    await page.waitForSelector('[data-testid="generated-design"]', { timeout: 30000 })
    
    // Apply design to canvas
    await page.click('[data-testid="apply-design-button"]')
    
    // Verify design is applied
    const layerItems = page.locator('[data-testid="layer-item"]')
    await expect(layerItems).toHaveCountGreaterThan(0)
  })

  test('should save design', async ({ page }) => {
    // Add some content first
    await page.click('[data-testid="text-tool"]')
    await page.locator('canvas').click({ position: { x: 400, y: 300 } })
    await page.keyboard.type('My Design')
    
    // Save design
    await page.click('[data-testid="save-button"]')
    
    // Wait for save confirmation
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible()
  })
})
```

### Visual Regression Testing

```typescript
// tests/visual/components.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('ProductCard component', async ({ page }) => {
    await page.goto('/storybook/?path=/story/components-productcard--default')
    
    // Wait for component to fully load
    await page.waitForLoadState('networkidle')
    
    // Take screenshot
    await expect(page.locator('[data-testid="product-card"]')).toHaveScreenshot('product-card-default.png')
  })

  test('Design Editor layout', async ({ page }) => {
    await page.goto('/design/editor/tshirt-basic')
    
    // Wait for editor to load
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000) // Allow for animations
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('design-editor-layout.png', {
      fullPage: true,
    })
  })

  test('Responsive design - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
    })
  })
})
```

---

## 10. Build & Deployment

### Vercel Deployment Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production",
    "NEXT_TELEMETRY_DISABLED": "1"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_VERCEL_URL": "@vercel-url",
      "DATABASE_URL": "@database-url",
      "STRIPE_SECRET_KEY": "@stripe-secret-key",
      "GEMINI_API_KEY": "@gemini-api-key"
    }
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=0, stale-while-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/design",
      "destination": "/design/editor",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/webhooks/stripe",
      "destination": "/api/webhooks/stripe"
    }
  ]
}
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Lint code
        run: npm run lint
        
      - name: Type check
        run: npm run type-check
        
      - name: Run unit tests
        run: npm run test:ci
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  deploy:
    needs: [lint-and-test, e2e-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
        
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }} --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Build Project Artifacts
        run: vercel build ${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Deploy Project Artifacts
        run: vercel deploy --prebuilt ${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --token=${{ secrets.VERCEL_TOKEN }}
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --fix",
    "lint:check": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest --watch",
    "test:ci": "jest --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "analyze": "ANALYZE=true next build",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}
```

---

## Summary

This comprehensive technical specification provides:

1. **Scalable Architecture**: Feature-first organization with clear separation of concerns
2. **Performance-Optimized**: Code splitting, lazy loading, and mobile-first approach
3. **Type-Safe Development**: Comprehensive TypeScript coverage with strict mode
4. **Modern React Patterns**: Hooks, context, and performance optimizations
5. **3D/AR Integration**: Optimized Three.js setup with mobile GPU considerations
6. **Internationalization**: Complete i18n setup for 4 languages
7. **Mobile-First Design**: Touch-optimized interactions and PWA capabilities
8. **Comprehensive Testing**: Unit, integration, E2E, and visual regression testing
9. **Production-Ready Deployment**: Vercel optimization with CI/CD pipeline

The architecture supports all TShop features while maintaining excellent performance across devices and providing a foundation for rapid feature development.

Key files created:
- `/home/olafkfreund/Source/tshop/FRONTEND_TECHNICAL_SPECS.md` - Complete technical specification document

This specification can be used as a blueprint for implementing the TShop frontend with confidence in scalability, performance, and maintainability.