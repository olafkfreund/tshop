import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import AuthSessionProvider from '@/components/providers/session-provider'
import { ThemeProvider } from '@/components/theme-provider'
import CartProviderWrapper from '@/components/cart/cart-provider-wrapper'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'TShop - AI-Powered Custom Apparel Platform',
    template: '%s | TShop',
  },
  description: 'Create professional-quality personalized apparel with AI-powered design generation. Custom t-shirts, caps, and tote bags with integrated fulfillment.',
  keywords: [
    'custom apparel',
    'AI design',
    't-shirts',
    'caps',
    'tote bags',
    'personalized clothing',
    'print on demand',
  ],
  authors: [{ name: 'TShop Development Team' }],
  creator: 'TShop',
  publisher: 'TShop',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'TShop',
    title: 'TShop - AI-Powered Custom Apparel Platform',
    description: 'Create professional-quality personalized apparel with AI-powered design generation.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TShop - AI-Powered Custom Apparel Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TShop - AI-Powered Custom Apparel Platform',
    description: 'Create professional-quality personalized apparel with AI-powered design generation.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TShop',
    startupImage: [
      '/icons/icon-512x512.png',
    ],
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TShop" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          <ThemeProvider>
            <AuthSessionProvider>
              <CartProviderWrapper>
                {children}
              </CartProviderWrapper>
            </AuthSessionProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}