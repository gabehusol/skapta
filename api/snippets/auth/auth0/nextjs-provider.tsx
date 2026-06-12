'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'

// Frontend half of the auth layer contract for Auth0 (Next.js / App Router).
// Exposes: <AuthProvider>, useAuth(), <RequireAuth>. App code imports only these.
// Wrap your root layout: <AuthProvider>{children}</AuthProvider>
//
// Reads NEXT_PUBLIC_AUTH0_* env vars -- set them in client/.env.local (or .env).

export function AuthProvider({ children }: { children: ReactNode }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID

  if (!domain || !clientId) {
    throw new Error(
      'Missing NEXT_PUBLIC_AUTH0_DOMAIN or NEXT_PUBLIC_AUTH0_CLIENT_ID. ' +
      'Check your .env.local file.',
    )
  }

  // window is only available client-side; safe here because this component
  // is 'use client' and Auth0Provider renders only in the browser.
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: origin + '/dashboard',
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
      }}
    >
      {children}
    </Auth0Provider>
  )
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0()
  return {
    user,
    isAuthenticated,
    isLoading,
    login: () => loginWithRedirect(),
    logout: () =>
      logout({
        logoutParams: {
          returnTo: typeof window !== 'undefined' ? window.location.origin : '/',
        },
      }),
  }
}

function LoadingScreen() {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
    >
      <span>Loading...</span>
    </div>
  )
}

// Protect a route. Redirects to Auth0 login if unauthenticated.
// Convention #9: loginWithRedirect is called inside useEffect, never in render.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: '/dashboard' } })
    }
  }, [isLoading, isAuthenticated, loginWithRedirect])

  if (isLoading || !isAuthenticated) return <LoadingScreen />
  return <>{children}</>
}
