import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth'

// Frontend half of the auth layer contract for Firebase Auth (React SPA).
// Exposes: <AuthProvider>, useAuth(), <RequireAuth>. App code imports only these.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Missing Firebase environment variables. Check your .env file.')
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

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
      void signInWithPopup(auth, new GoogleAuthProvider())
    },
    logout: () => {
      void signOut(auth)
    },
    getToken: () => (auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null)),
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span>Loading...</span>
    </div>
  )
}

// Protect a route. Firebase uses popup sign-in (needs a user gesture), so an
// unauthenticated visitor is shown a sign-in button rather than auto-redirected.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <button onClick={login}>Sign in with Google</button>
      </div>
    )
  }
  return <>{children}</>
}
