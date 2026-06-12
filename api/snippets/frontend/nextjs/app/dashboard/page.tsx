import { SignOutButton } from '../auth-buttons'

// Dashboard -- protected page.
// Supabase: this file is replaced by a server-component version that verifies
// the session cookie and redirects unauthenticated users back to /.
// Auth0 / Firebase: wrap this content in <RequireAuth> (from AuthProvider) to
// protect it client-side, or add a redirect inside a useEffect.
export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      <p>You are signed in.</p>
      <SignOutButton />
    </main>
  )
}
