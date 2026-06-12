import { auth } from '@/auth'

// Protect /dashboard: unauthenticated requests are redirected to the sign-in page.
// The redirect decision runs in middleware (never in render).
export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    const signInUrl = new URL('/api/auth/signin', req.nextUrl.origin)
    return Response.redirect(signInUrl)
  }
})

export const config = {
  matcher: ['/dashboard/:path*'],
}
