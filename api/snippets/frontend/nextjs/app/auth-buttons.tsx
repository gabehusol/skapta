'use client'

// Generic auth buttons -- provider-agnostic placeholders.
// Wire these up to your chosen auth provider:
//   Supabase:  use the Supabase client (see lib/supabase/client.ts)
//   Auth0 / Firebase:  import useAuth() from '@/src/providers/AuthProvider'
//     then call login() / logout() in the handlers below.
export function LoginButton() {
  return (
    <button onClick={() => { window.location.href = '/auth/callback' }}>
      Sign in
    </button>
  )
}

export function SignOutButton() {
  return (
    <button onClick={() => { window.location.href = '/' }}>
      Sign out
    </button>
  )
}
