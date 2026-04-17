import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Allowed origins for CSRF protection
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'https://reveelbox.com',
  'https://www.reveelbox.com',
  'http://localhost:3000',
].filter(Boolean)

export async function middleware(request: NextRequest) {
  // Update Supabase session (refresh tokens etc)
  const response = await updateSession(request)

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  const { pathname } = request.nextUrl

  // CSRF protection for state-changing API requests
  if (pathname.startsWith('/api/') && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    // Skip CSRF for webhook endpoints (they use signature verification)
    if (!pathname.includes('/webhook')) {
      const origin = request.headers.get('origin')
      if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
