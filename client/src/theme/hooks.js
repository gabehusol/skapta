import { useContext } from 'react'
import { ThemeContext, BackgroundContext } from './contexts'

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export function useBackground() {
  const ctx = useContext(BackgroundContext)
  if (!ctx) throw new Error('useBackground must be used within BackgroundProvider')
  return ctx
}
