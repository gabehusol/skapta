import { useEffect, useState } from 'react'
import { SCHEMES, DEFAULT_SCHEME_ID, applyScheme } from './schemes'
import { APPEARANCE_ENABLED, FORCED_SCHEME_ID } from './config'
import { ThemeContext } from './contexts'

const STORAGE_KEY = 'skapta-scheme'

export function ThemeProvider({ children }) {
  const [schemeId, setSchemeId] = useState(() => {
    if (!APPEARANCE_ENABLED) return FORCED_SCHEME_ID
    if (typeof window === 'undefined') return DEFAULT_SCHEME_ID
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_SCHEME_ID
  })

  const scheme = SCHEMES.find((s) => s.id === schemeId) || SCHEMES[0]

  useEffect(() => {
    applyScheme(scheme)
    // Don't persist while the picker is off, so the user's saved choice is
    // preserved for when it's re-enabled.
    if (APPEARANCE_ENABLED) localStorage.setItem(STORAGE_KEY, scheme.id)
  }, [scheme])

  return (
    <ThemeContext.Provider value={{ scheme, schemes: SCHEMES, setSchemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}
