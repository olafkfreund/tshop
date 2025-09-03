import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/designs', '/orders']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/auth/signin', '/auth/signup']

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check for NextAuth session token
  const sessionToken = request.cookies.get('authjs.session-token') || 
                      request.cookies.get('__Secure-authjs.session-token') // Production cookie name
  
  const isAuthenticated = !!sessionToken
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // If accessing a protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  // If accessing auth routes while already authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match only specific protected routes, excluding all API routes and static files:
     */
    '/dashboard/:path*',
    '/profile/:path*',
    '/designs/:path*',
    '/orders/:path*',
    '/auth/signin',
    '/auth/signup',
  ],
}