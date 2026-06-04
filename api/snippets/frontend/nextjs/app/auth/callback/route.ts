import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// OAuth / magic-link callback. Supabase redirects here with a `code`, which we
// exchange for a session cookie before forwarding the user on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // No code or exchange failed — bounce home with an error flag.
  return NextResponse.redirect(`${origin}/?error=auth`)
}
