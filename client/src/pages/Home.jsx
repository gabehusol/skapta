import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import DescriptionInput from '../components/DescriptionInput'
import StackGrid from '../components/StackGrid'
import ForgeBackground from '../components/ForgeBackground'
import GithubIcon from '../components/GithubIcon'
import { useRecommend } from '../hooks/useRecommend'
import { scrollToEl } from '../lib/scroll'
import { APPEARANCE_ENABLED } from '../theme/config'

const REPO = 'https://github.com/gabehusol/skapta'

const layoutSpring = { duration: 0.65, ease: [0.22, 1, 0.36, 1] }

export default function Home() {
  const { loading, error, recommendations, analyze, retry, reset } = useRecommend()
  const [lastInput, setLastInput] = useState({ projectName: 'my-app', description: '' })
  const canvasRef = useRef(null)

  const handleAnalyze = ({ description, projectName }) => {
    setLastInput({ description, projectName })
    analyze(description)
  }

  // Idle: input sits centered. Once work begins it slides to a left rail and
  // the results canvas opens on the right.
  const active = loading || !!recommendations || !!error

  // On narrow screens the canvas stacks below the input, so bring it into view
  // when work begins.
  useEffect(() => {
    if ((loading || recommendations) && typeof window !== 'undefined' && window.innerWidth < 1024) {
      const t = setTimeout(() => scrollToEl(canvasRef.current), 120)
      return () => clearTimeout(t)
    }
  }, [loading, recommendations])

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      <ForgeBackground />

      {/* Top bar */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5"
        style={{ borderBottom: '1px solid var(--color-hairline)' }}
      >
        <span
          className="text-sm font-bold tracking-[0.22em] uppercase select-none text-glow"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
        >
          Skapta
        </span>
        <motion.a
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ color: 'var(--color-muted)' }}
          whileHover={{ color: '#c7c7c5', backgroundColor: 'var(--color-surface)' }}
          transition={{ duration: 0.15 }}
        >
          <GithubIcon size={18} />
        </motion.a>
      </motion.header>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 py-8 md:py-12">
        <motion.div
          layout
          transition={layoutSpring}
          className={`flex flex-col lg:flex-row gap-8 ${
            active ? 'items-start' : 'items-center justify-center min-h-[58vh] md:min-h-[66vh]'
          }`}
        >
          {/* Console */}
          <motion.div
            layout
            transition={layoutSpring}
            className={
              active
                ? 'w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-24 flex flex-col gap-6'
                : 'w-full max-w-2xl flex flex-col gap-6 items-center text-center'
            }
          >
            <div className="flex flex-col gap-3">
              <h1
                className="text-3xl md:text-4xl font-semibold leading-[1.08] text-glow"
                style={{
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.02em',
                }}
              >
                Start now with the <span className="text-glow-accent">right stack.</span>
              </h1>
              <p
                className="text-sm md:text-base"
                style={{ color: 'var(--color-muted)', lineHeight: 1.6 }}
              >
                Describe your project, and Skapta generates you a configured and ready to
                run codebase. The more details the better the stack.
              </p>
            </div>

            <DescriptionInput onAnalyze={handleAnalyze} onReset={reset} loading={loading} />
          </motion.div>

          {/* Right canvas */}
          <AnimatePresence>
            {active && (
              <motion.div
                key="canvas"
                ref={canvasRef}
                layout
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
                className="flex-1 min-w-0 w-full scroll-mt-24"
              >
                {loading ? (
                  <LoadingCanvas />
                ) : recommendations ? (
                  <StackGrid
                    recommendations={recommendations}
                    projectName={lastInput.projectName}
                    description={lastInput.description}
                  />
                ) : error ? (
                  <ErrorCanvas onRetry={retry} />
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10" style={{ borderTop: '1px solid var(--color-hairline)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <span className="font-mono text-xs" style={{ color: 'var(--color-faint)' }}>
            © 2026 Skapta
          </span>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="transition-colors"
            style={{ color: 'var(--color-faint)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#c7c7c5')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-faint)')}
          >
            <GithubIcon size={16} />
          </a>
        </div>
      </footer>

      {/* Clearance so the floating appearance bar never covers content */}
      {APPEARANCE_ENABLED && <div aria-hidden="true" className="h-28 shrink-0" />}
    </div>
  )
}

/* Right-pane states ---------------------------------------------------------- */

function CanvasShell({ children }) {
  return (
    <div
      className="rounded-2xl flex flex-col items-center justify-center text-center gap-5 px-8 py-16 min-h-[50vh]"
      style={{ border: '1px dashed var(--color-hairline)', background: 'rgba(43,39,42,0.4)' }}
    >
      {children}
    </div>
  )
}

function LoadingCanvas() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <CanvasShell>
        <div
          className="w-full max-w-xs h-px overflow-hidden rounded-full"
          style={{ background: 'var(--color-hairline)' }}
        >
          <motion.div
            className="h-full"
            style={{ width: '35%', background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)' }}
            animate={{ x: ['-120%', '340%'] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <span
          className="font-mono text-xs uppercase tracking-[0.18em]"
          style={{ color: 'var(--color-muted)' }}
        >
          Generating
        </span>
      </CanvasShell>
    </motion.div>
  )
}

function ErrorCanvas({ onRetry }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <CanvasShell>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Could not reach the server. Is the backend running?
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-lg"
          style={{
            border: '1px solid rgba(var(--accent-rgb),0.4)',
            color: 'var(--color-accent)',
            cursor: 'pointer',
          }}
        >
          Retry
        </motion.button>
      </CanvasShell>
    </motion.div>
  )
}
