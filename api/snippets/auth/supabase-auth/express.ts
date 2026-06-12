import { createClient } from '@supabase/supabase-js'
import type { NextFunction, Request, Response } from 'express'

// Lazily initialised so the process starts cleanly without env vars set.
let _supabase: ReturnType<typeof createClient> | null = null

function _client() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.',
      )
    }
    _supabase = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return _supabase
}

// Validates the Supabase JWT from the Authorization header and attaches
// req.user.id for use in downstream route handlers.
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) {
    res.status(401).json({ error: 'No token provided.' })
    return
  }
  try {
    const {
      data: { user },
      error,
    } = await _client().auth.getUser(token)
    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token.' })
      return
    }
    ;(req as Request & { user: { id: string } }).user = { id: user.id }
    next()
  } catch {
    res.status(401).json({ error: 'Token validation failed.' })
  }
}
