// The contexts live apart from their providers so each provider module exports
// nothing but a component. React Fast Refresh can only hot-reload a module whose
// exports are all components, and co-locating the context or its hook here would
// silently break that for the whole provider tree.
import { createContext } from 'react'

export const ThemeContext = createContext(null)
export const BackgroundContext = createContext(null)
