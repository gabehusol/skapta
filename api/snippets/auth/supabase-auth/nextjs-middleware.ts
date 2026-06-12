import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Supabase session middleware for Next.js App Router.
// Refreshes the Supabase session cookie on every request so server components
// always see an up-to-date user. The updateSession helper is generated from the
// supabase database snippet at client/lib/supabase/middleware.ts.
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
