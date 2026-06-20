import { useEffect } from 'react'
import { Toaster } from 'sonner'
import Lenis from 'lenis'
import Home from './pages/Home'

function useSmoothScroll() {
  useEffect(() => {
    // Respect users who prefer reduced motion: skip momentum scrolling.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })

    let raf
    const loop = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])
}

export default function App() {
  useSmoothScroll()

  return (
    <>
      <Home />
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
    </>
  )
}
