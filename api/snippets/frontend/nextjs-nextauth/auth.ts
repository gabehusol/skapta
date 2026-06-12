import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

// NextAuth (Auth.js v5) configuration. Reads AUTH_SECRET, AUTH_GITHUB_ID and
// AUTH_GITHUB_SECRET from the environment automatically. JWT session strategy --
// no database adapter required, so this Next.js app is self-contained.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' },
})
