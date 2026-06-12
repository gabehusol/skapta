import { NextResponse } from 'next/server'

// Generic auth callback -- forwards the user to the `next` param (default /dashboard).
// For Supabase: this file is replaced by the supabase-auth snippet which exchanges
// the OAuth code for a session cookie before redirecting.
// For Auth0 / Firebase: the redirect is handled by the client-side SDK; this
// route just acts as a landing page.
export function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  return NextResponse.redirect(`${origin}${next}`)
}
