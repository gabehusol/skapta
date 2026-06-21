import { useEffect } from 'react'
import { Toaster } from 'sonner'
import Lenis from 'lenis'
import Home from './pages/Home'
import AppearanceBar from './components/AppearanceBar'
import { ThemeProvider } from './theme/ThemeContext'
import { BackgroundProvider } from './theme/BackgroundContext'
import { APPEARANCE_ENABLED } from './theme/config'
import { setLenis } from './lib/scroll'

function useSmoothScroll() {
  useEffect(() => {
    // Respect users who prefer reduced motion: skip momentum scrolling.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    })
    setLenis(lenis)

    let raf
    const loop = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      setLenis(null)
    }
  }, [])
}

export default function App() {
  useSmoothScroll()

  return (
    <ThemeProvider>
      <BackgroundProvider>
        <Home />
        {APPEARANCE_ENABLED && <AppearanceBar />}
        <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#2b272a',
            border: '1px solid #3c373b',
            color: '#c7c7c5',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: '14px',
          },
          classNames: {
            toast: 'rounded-xl',
          },
        }}
        />
      </BackgroundProvider>
    </ThemeProvider>
  )
}
