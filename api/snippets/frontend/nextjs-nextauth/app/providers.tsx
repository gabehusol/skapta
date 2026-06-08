'use client'

import type { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'

// Client-side session context so client components can call useSession().
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
