import { LoginButton } from './auth-buttons'

// Home page -- shows a sign-in prompt.
// Supabase: this file is replaced by a server-component version that checks the
// session cookie and auto-redirects authenticated users to /dashboard.
// Auth0 / Firebase: auth is client-side; the AuthProvider + RequireAuth in
// dashboard/page.tsx handles the redirect after sign-in.
export default function HomePage() {
  return (
    <main>
      <h1>{{PROJECT_NAME}}</h1>
      <p>Sign in to continue.</p>
      <LoginButton />
    </main>
  )
}
