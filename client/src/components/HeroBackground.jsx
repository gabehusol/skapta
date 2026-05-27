import { useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

/**
 * Hero background — three layered effects:
 *  1. Dot grid  — CSS radial-gradient repeating pattern, shifts opposite
 *                 to cursor for a subtle parallax (max ±8 px). Direct DOM
 *                 transform via useRef so it never causes a React re-render.
 *  2. Static bloom — fixed soft glow anchored top-center, always present.
 *  3. Dynamic bloom — larger, dimmer glow that drifts toward the cursor
 *                     with a spring (stiffness 40 / damping 25), so it
 *                     lags behind and feels atmospheric rather than sticky.
 */
export default function HeroBackground() {
  const dotGridRef = useRef(null)

  // ── Spring-driven cursor tracker (normalised 0–1) ─────────────────────────
  const rawX = useMotionValue(0.5)  // starts centred
  const rawY = useMotionValue(0.0)  // starts at top

  const springCfg = { stiffness: 40, damping: 25, mass: 1.2 }
  const bloomX = useSpring(rawX, springCfg)
  const bloomY = useSpring(rawY, springCfg)

  // Map 0–1 → "calc(X% - 450px)" so the 900 px bloom div centres on cursor
  const bloomLeft = useTransform(bloomX, v => `calc(${v * 100}% - 450px)`)
  const bloomTop  = useTransform(bloomY, v => `calc(${v * 100}% - 450px)`)

  // ── Mouse listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth   // 0 → 1  (left → right)
      const ny = e.clientY / window.innerHeight  // 0 → 1  (top  → bottom)

      // Update spring targets — bloom will drift toward new position
      rawX.set(nx)
      rawY.set(ny)

      // Dot-grid parallax: opposite direction, max ±8 px
      // nx=0 → +8 px, nx=0.5 → 0, nx=1 → -8 px
      if (dotGridRef.current) {
        const ox = -(nx - 0.5) * 16
        const oy = -(ny - 0.5) * 16
        dotGridRef.current.style.transform = `translate(${ox}px, ${oy}px)`
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [rawX, rawY])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* ── Layer 1: Dot grid ─────────────────────────────────────────────── */}
      {/* Extends 20 px beyond bounds on every side so the ±8 px parallax
          shift never exposes a bare edge inside the hero. */}
      <div
        ref={dotGridRef}
        style={{
          position: 'absolute',
          inset: '-20px',
          backgroundImage:
            'radial-gradient(circle, rgba(249,115,22,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          willChange: 'transform',
        }}
      />

      {/* ── Layer 2: Static bloom — anchored top-center ───────────────────── */}
      <div
        style={{
          position: 'absolute',
          top:  '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width:  '800px',
          height: '800px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%)',
        }}
      />

      {/* ── Layer 3: Dynamic bloom — follows cursor with spring lag ───────── */}
      <motion.div
        style={{
          position: 'absolute',
          left:   bloomLeft,
          top:    bloomTop,
          width:  '900px',
          height: '900px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 65%)',
        }}
      />

      {/* ── Bottom edge: horizontal glow line ─────────────────────────────── */}
      <div
        style={{
          position:   'absolute',
          bottom:     0,
          left:       '50%',
          transform:  'translateX(-50%)',
          width:      '60%',
          height:     '1px',
          background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.18), transparent)',
        }}
      />
    </div>
  )
}
