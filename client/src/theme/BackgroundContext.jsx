import { createContext, useContext, useEffect, useState } from 'react'
import { BACKGROUNDS, DEFAULT_BACKGROUND_ID } from './backgrounds'
import { APPEARANCE_ENABLED, FORCED_BACKGROUND_ID } from './config'

const BackgroundContext = createContext(null)
const STORAGE_KEY = 'skapta-bg'

export function BackgroundProvider({ children }) {
  const [backgroundId, setBackgroundId] = useState(() => {
    if (!APPEARANCE_ENABLED) return FORCED_BACKGROUND_ID
    if (typeof window === 'undefined') return DEFAULT_BACKGROUND_ID
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_BACKGROUND_ID
  })

  useEffect(() => {
    if (APPEARANCE_ENABLED) localStorage.setItem(STORAGE_KEY, backgroundId)
  }, [backgroundId])

  return (
    <BackgroundContext.Provider value={{ backgroundId, setBackgroundId, backgrounds: BACKGROUNDS }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackground() {
  const ctx = useContext(BackgroundContext)
  if (!ctx) throw new Error('useBackground must be used within BackgroundProvider')
  return ctx
}
