import Link from 'next/link'
import { auth, signIn, signOut } from '@/auth'

export default async function Home() {
  const session = await auth()

  return (
    <main>
      <h1>{{PROJECT_NAME}}</h1>
      {session?.user ? (
        <>
          <p>Signed in as {session.user.email}</p>
          <Link href="/dashboard">Go to dashboard</Link>
          <form
            action={async () => {
              'use server'
              await signOut()
            }}
          >
            <button type="submit">Sign out</button>
          </form>
        </>
      ) : (
        <form
          action={async () => {
            'use server'
            await signIn('github')
          }}
        >
          <button type="submit">Sign in with GitHub</button>
        </form>
      )}
    </main>
  )
}
