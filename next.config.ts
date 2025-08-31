import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Disable Turbo mode to avoid module parsing errors in containers
  experimental: {
    turbo: undefined,
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.printful.com',
      },
      {
        protocol: 'https',
        hostname: '**.printify.com',
      },
    ],
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Enable bundle analyzer
  env: {
    ANALYZE: process.env.ANALYZE || '',
  },
  
  // Font optimization for container environments
  optimizeFonts: false,
}

export default nextConfig