import { useEffect, useRef } from 'react'

/**
 * A soft ember glow that follows the cursor inside its parent.
 * Drop inside a position:relative, rounded, overflow-hidden container.
 * Smoother and calmer than a rotating border arc.
 */
export default function SpotlightGlow({ size = 360, opacity = 0.14 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return

    const onMove = (e) => {
      const r = parent.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
      el.style.opacity = '1'
    }
    const onLeave = () => {
      el.style.opacity = '0'
    }

    parent.addEventListener('pointermove', onMove)
    parent.addEventListener('pointerleave', onLeave)
    return () => {
      parent.removeEventListener('pointermove', onMove)
      parent.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        zIndex: 0,
        opacity: 0,
        transition: 'opacity 300ms ease',
        background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--accent-rgb), ${opacity}), transparent 65%)`,
      }}
    />
  )
}
