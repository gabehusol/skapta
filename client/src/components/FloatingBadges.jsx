import { motion } from 'framer-motion'

/**
 * Full-page floating technology badge constellation.
 *
 * Architecture
 * ────────────
 * • position: fixed — covers the entire viewport behind all other content
 * • opacity: 0.035  — watermark-level subtlety; you notice it after a moment
 * • mask-image      — radial vignette that hides the centre (where page
 *                     content sits) and lets badges show at the edges/corners
 * • pointer-events: none — the layer is completely invisible to mouse events
 *
 * Badge zones (viewport %)
 * ─────────────────────────
 *   Left column   x  3–14%    full height   (outside vignette = clearly visible)
 *   Right column  x 82–95%    full height   (outside vignette = clearly visible)
 *   Top row       y  3–11%    full width    (partially visible depending on x)
 *   Bottom row    y 84–95%    full width    (partially visible depending on x)
 *   Scattered     mid-zone    partially faded by mask, adds depth
 *
 * Animation: each badge drifts to start+{dx,dy} and back (repeatType:'mirror')
 * using durations of 35–60 s so the movement is barely perceptible.
 */

const BADGES = [
  // ── Left column ────────────────────────────────────────────────────────────
  { label: 'React',       left:  '4%',  top:  '9%',  dx:  20, dy:  14, dur: 42 },
  { label: 'Supabase',    left:  '6%',  top: '24%',  dx:  16, dy:  22, dur: 55 },
  { label: 'FastAPI',     left:  '3%',  top: '42%',  dx:  24, dy: -18, dur: 48 },
  { label: 'Django',      left:  '7%',  top: '60%',  dx:  18, dy:  20, dur: 38 },
  { label: 'MongoDB',     left:  '5%',  top: '78%',  dx:  22, dy: -14, dur: 52 },

  // ── Right column ───────────────────────────────────────────────────────────
  { label: 'Docker',      left: '87%',  top: '11%',  dx: -20, dy:  18, dur: 45 },
  { label: 'Vercel',      left: '91%',  top: '30%',  dx: -16, dy: -22, dur: 58 },
  { label: 'Railway',     left: '85%',  top: '48%',  dx: -22, dy:  16, dur: 40 },
  { label: 'Socket.io',   left: '89%',  top: '65%',  dx: -18, dy: -20, dur: 50 },
  { label: 'Stripe',      left: '86%',  top: '82%',  dx: -24, dy:  18, dur: 36 },

  // ── Top row ────────────────────────────────────────────────────────────────
  { label: 'Node.js',     left: '22%',  top:  '4%',  dx: -18, dy:  24, dur: 44 },
  { label: 'TypeScript',  left: '46%',  top:  '6%',  dx:  22, dy:  20, dur: 60 },
  { label: 'Vue',         left: '68%',  top:  '3%',  dx: -16, dy:  22, dur: 39 },

  // ── Bottom row ─────────────────────────────────────────────────────────────
  { label: 'Next.js',     left: '18%',  top: '87%',  dx:  20, dy: -18, dur: 47 },
  { label: 'Auth0',       left: '44%',  top: '92%',  dx: -18, dy: -22, dur: 56 },
  { label: 'GraphQL',     left: '70%',  top: '89%',  dx:  16, dy: -20, dur: 43 },

  // ── Scattered mid-zone (faded by mask — subtle depth layer) ────────────────
  { label: 'PostgreSQL',  left: '28%',  top: '21%',  dx: -22, dy:  18, dur: 53 },
  { label: 'Redis',       left: '72%',  top: '34%',  dx:  20, dy: -24, dur: 46 },
  { label: 'Prisma',      left: '33%',  top: '68%',  dx:  18, dy:  22, dur: 57 },
  { label: 'Tailwind',    left: '63%',  top: '73%',  dx: -20, dy: -18, dur: 41 },
]

export default function FloatingBadges() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        // Watermark-level opacity — barely there until you look for it
        opacity: 0.035,
        // Vignette mask: transparent at centre (hides badges behind content),
        // opaque at the outer third of the viewport (badges clearly visible).
        // White = show  /  transparent = hide  (alpha masking)
        maskImage: [
          'radial-gradient(',
          '  ellipse 40% 52% at 50% 46%,',
          '  rgba(255,255,255,0)   0%,',
          '  rgba(255,255,255,0.2) 35%,',
          '  rgba(255,255,255,1)   58%,',
          '  rgba(255,255,255,1)   100%',
          ')',
        ].join(''),
        WebkitMaskImage: [
          'radial-gradient(',
          '  ellipse 40% 52% at 50% 46%,',
          '  rgba(255,255,255,0)   0%,',
          '  rgba(255,255,255,0.2) 35%,',
          '  rgba(255,255,255,1)   58%,',
          '  rgba(255,255,255,1)   100%',
          ')',
        ].join(''),
      }}
    >
      {BADGES.map(({ label, left, top, dx, dy, dur }) => (
        <motion.span
          key={label}
          style={{
            position: 'absolute',
            left,
            top,
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '9999px',
            border: '1px solid rgba(249,115,22,0.55)',
            background: 'rgba(255,255,255,0.06)',
            color: '#f97316',
            fontSize: '12px',
            fontFamily: '"JetBrains Mono","SFMono-Regular",Menlo,monospace',
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            willChange: 'transform',
          }}
          animate={{ x: dx, y: dy }}
          transition={{
            duration: dur,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        >
          {label}
        </motion.span>
      ))}
    </div>
  )
}
