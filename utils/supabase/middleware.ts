// utils/supabase/middleware.ts - VERSION CORRIGÉE

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Éviter toute logique entre createServerClient et getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ✅ MOINS AGRESSIF : Seulement pour les pages qui nécessitent vraiment l'auth
  const protectedPaths = ['/profile', '/inventory', '/battle/create', '/admin']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // ✅ NE PAS rediriger pour les pages publiques
  const publicPaths = ['/', '/login', '/signup', '/boxes', '/auth']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith('/auth')
  )

  if (!user && isProtectedPath && !isPublicPath) {
    // Rediriger seulement si :
    // 1. Pas d'utilisateur ET
    // 2. Path protégé ET  
    // 3. Pas un path public
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // IMPORTANT: Retourner la réponse Supabase telle quelle
  return supabaseResponse
}