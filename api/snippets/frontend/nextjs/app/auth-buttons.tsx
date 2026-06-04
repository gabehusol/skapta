'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Sign in with a GitHub OAuth flow. Enable the GitHub provider in your Supabase
// dashboard (Authentication → Providers) and add the callback URL printed in the
// README. Swap `github` for any provider you enable.
export function LoginButton() {
  const [loading, setLoading] = useState(false)

  const signIn = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      setLoading(false)
      console.error(error)
    }
  }

  return (
    <button onClick={signIn} disabled={loading}>
      {loading ? 'Redirecting…' : 'Sign in with GitHub'}
    </button>
  )
}

export function SignOutButton() {
  const [loading, setLoading] = useState(false)

  const signOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/')
  }

  return (
    <button onClick={signOut} disabled={loading}>
      {loading ? 'Signing out…' : 'Log out'}
    </button>
  )
}
