import { auth } from 'express-oauth2-jwt-bearer'
import type { NextFunction, Request, Response } from 'express'

// express-oauth2-jwt-bearer checks the JWT and populates req.auth.
const _jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
})

// Wrapper so route handlers can use req.user.id regardless of auth provider.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  _jwtCheck(req, res, (err?: unknown) => {
    if (err) return next(err)
    ;(req as Request & { user: { id: string } }).user = {
      id: req.auth!.payload.sub as string,
    }
    next()
  })
}
