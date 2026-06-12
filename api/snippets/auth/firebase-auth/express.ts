import type { Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'

// Backend half of the auth layer contract for Firebase Auth (Express).
// Validates a Firebase ID token and attaches req.user.id — the same shape
// the example routes consume, so routes stay auth-agnostic.

// Lazily initialised so the server starts cleanly without credentials at
// import time. The first authenticated request triggers SDK setup.
function _app(): admin.app.App {
  if (!admin.apps.length) {
    admin.initializeApp({
      // Uses GOOGLE_APPLICATION_CREDENTIALS env var pointing at a service-account JSON.
      credential: admin.credential.applicationDefault(),
    })
  }
  return admin.app()
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = header.slice('Bearer '.length)
  try {
    const decoded = await _app().auth().verifyIdToken(token)
    ;(req as Request & { user: { id: string } }).user = { id: decoded.uid }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
