import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'

// Frontend half of the auth layer contract for Auth0 (React SPA).
// Exposes: <AuthProvider>, useAuth(), <RequireAuth>. App code imports only these.

export function AuthProvider({ children }: { children: ReactNode }) {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID

  if (!domain || !clientId) {
    throw new Error('Missing Auth0 environment variables. Check your .env file.')
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin + '/dashboard',
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
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
    logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
  }
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span>Loading...</span>
    </div>
  )
}

// Protect a route: wait for Auth0 to finish loading, then redirect to login if
// unauthenticated. The redirect runs in an effect, never during render — see
// Generation Convention #9 (calling loginWithRedirect in render causes a loop).
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
