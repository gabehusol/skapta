import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginButton } from './auth-buttons'

// Home page — server component. Already-authenticated users are sent straight
// to the dashboard; everyone else gets a sign-in button.
export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main>
      <h1>{{PROJECT_NAME}}</h1>
      <p>Sign in to continue.</p>
      <LoginButton />
    </main>
  )
}
