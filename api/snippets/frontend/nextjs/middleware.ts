import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pass-through middleware -- a real implementation is injected by your auth provider.
// Supabase: refreshes the session cookie via lib/supabase/middleware.ts
// NextAuth: handled by the nextjs-nextauth frontend variant
// Auth0 / Firebase: client-side SDKs -- no server middleware required
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
