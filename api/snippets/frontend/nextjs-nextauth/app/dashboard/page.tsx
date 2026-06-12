import { redirect } from 'next/navigation'
import { auth } from '@/auth'

// Protected page. The middleware redirects anonymous users, and this server-side
// check is a defense-in-depth guard (and gives us the typed session).
export default async function Dashboard() {
  const session = await auth()
  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  return (
    <main>
      <h1>Welcome, {session.user.name}</h1>
      <p>{session.user.email}</p>
    </main>
  )
}
