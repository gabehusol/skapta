import { handlers } from '@/auth'

// Mounts NextAuth's sign-in/callback/sign-out endpoints under /api/auth/*.
export const { GET, POST } = handlers
