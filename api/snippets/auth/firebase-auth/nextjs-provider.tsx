'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth'

// Frontend half of the auth layer contract for Firebase Auth (Next.js / App Router).
// Exposes: <AuthProvider>, useAuth(), <RequireAuth>. App code imports only these.
// Wrap your root layout: <AuthProvider>{children}</AuthProvider>
//
// Reads NEXT_PUBLIC_FIREBASE_* env vars -- set them in client/.env.local (or .env).

function _getFirebaseAuth() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      'Missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID. ' +
      'Check your .env.local file.',
    )
  }
  // Re-use existing app if already initialised (hot-reload safety).
  const app = getApps().length === 0 ? initializeApp(config) : getApps()[0]
  return getAuth(app)
}

type AuthState = {
  user: { name: string | null; email: string | null } | undefined
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
  // The Firebase ID token to send as `Authorization: Bearer <token>` to the API.
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const auth = _getFirebaseAuth()
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setIsLoading(false)
    })
  }, [])

  const value: AuthState = {
    user: user ? { name: user.displayName, email: user.email } : undefined,
    isAuthenticated: Boolean(user),
    isLoading,
    login: () => {
      const auth = _getFirebaseAuth()
      void signInWithPopup(auth, new GoogleAuthProvider())
    },
    logout: () => {
      const auth = _getFirebaseAuth()
      void signOut(auth)
    },
    getToken: () => {
      const auth = _getFirebaseAuth()
      return auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return ctx
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

// Protect a route. Firebase uses popup sign-in (needs a user gesture) so an
// unauthenticated visitor is shown a sign-in button rather than auto-redirected.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) {
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
      >
        <button onClick={login}>Sign in with Google</button>
      </div>
    )
  }
  return <>{children}</>
}
