import { updateSession } from '@/utils/supabase/middleware'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server';

export const runtime = "nodejs"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export async function isUserAdmin(userId: string) {
const supabase = createClient();
}