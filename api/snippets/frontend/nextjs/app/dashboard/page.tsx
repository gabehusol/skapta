import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '../auth-buttons'

// Protected page — server-side auth check. The middleware also guards
// /dashboard, but we re-check here so the page is safe on its own and we have
// the user record to render.
export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <main>
      <h1>Welcome, {user.user_metadata?.full_name ?? user.email}</h1>
      <p>{user.email}</p>
      <SignOutButton />
    </main>
  )
}
