import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import AuthSessionProvider from '@/components/providers/session-provider'
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
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}