import { createClient } from '@supabase/supabase-js'

// Lazily initialised so the server starts cleanly without env vars at import time.
let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your .env file.',
      )
    }
    _supabase = createClient(url, key, { auth: { persistSession: false } })
  }
  return _supabase
}
