import type { Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'

// Backend half of the auth layer contract for Firebase Auth (Express).
// Exports `requireAuth`, which verifies a Firebase ID token and exposes the user
// id at `req.auth.payload.sub` — the same shape the example routes consume, so the
// routes stay auth-agnostic.

// Initialise the Admin SDK once. Uses Application Default Credentials
// (set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path).
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { payload: { sub: string } }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = header.slice('Bearer '.length)
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.auth = { payload: { sub: decoded.uid } }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
