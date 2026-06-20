import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import DescriptionInput from '../components/DescriptionInput'
import StackGrid from '../components/StackGrid'
import ForgeBackground from '../components/ForgeBackground'
import GithubIcon from '../components/GithubIcon'
import { useRecommend } from '../hooks/useRecommend'

const REPO = 'https://github.com/gabehusol/skapta'

export default function Home() {
  const { loading, error, recommendations, analyze, retry, reset } = useRecommend()
  const [lastInput, setLastInput] = useState({ projectName: 'my-app', description: '' })

  const handleAnalyze = ({ description, projectName }) => {
    setLastInput({ description, projectName })
    analyze(description)
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Full-page animated forge background */}
      <ForgeBackground />

      {/* Top bar */}
      <header
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
      </header>

      {/* Dashboard */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 py-8 md:py-12">
        <div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-6 lg:gap-8 items-start">
          {/* Left: console */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="lg:sticky lg:top-24 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--color-accent)', boxShadow: '0 0 8px rgba(var(--accent-rgb),0.8)' }}
                />
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: 'var(--color-muted)' }}
                >
                  New project
                </span>
              </span>
              <h1
                className="text-3xl md:text-4xl font-semibold leading-[1.08] text-glow"
                style={{
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.02em',
                }}
              >
                Stop guessing your <span className="text-glow-accent">tech stack.</span>
              </h1>
              <p className="text-sm md:text-base" style={{ color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Describe your project. Skapta forges a reasoned stack and a configured,
                ready to run codebase.
              </p>
            </div>

            <DescriptionInput onAnalyze={handleAnalyze} onReset={reset} loading={loading} />
          </motion.div>

          {/* Right: canvas */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {loading ? (
                <LoadingCanvas key="loading" />
              ) : recommendations ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <StackGrid
                    recommendations={recommendations}
                    projectName={lastInput.projectName}
                    description={lastInput.description}
                  />
                </motion.div>
              ) : error ? (
                <ErrorCanvas key="error" onRetry={retry} />
              ) : (
                <EmptyCanvas key="empty" />
              )}
            </AnimatePresence>
          </div>
        </div>
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
    </div>
  )
}

/* Right-pane states ---------------------------------------------------------- */

function CanvasShell({ children }) {
  return (
    <div
      className="rounded-2xl flex flex-col items-center justify-center text-center gap-5 px-8 py-16 min-h-[60vh]"
      style={{ border: '1px dashed var(--color-hairline)', background: 'rgba(43,39,42,0.4)' }}
    >
      {children}
    </div>
  )
}

function EmptyCanvas() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.4 }}
    >
      <CanvasShell>
        <span
          className="flex items-center justify-center w-14 h-14 rounded-2xl"
          style={{
            background: 'rgba(var(--accent-rgb), 0.1)',
            border: '1px solid rgba(var(--accent-rgb), 0.22)',
            color: 'var(--color-accent)',
          }}
        >
          <Sparkles size={24} strokeWidth={1.6} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
          >
            Your stack will appear here
          </h2>
          <p className="text-sm max-w-xs" style={{ color: 'var(--color-muted)' }}>
            Describe your project on the left, then hit Generate to forge a full stack.
          </p>
        </div>
      </CanvasShell>
    </motion.div>
  )
}

function LoadingCanvas() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.3 }}
    >
      <CanvasShell>
        <div className="w-full max-w-xs h-px overflow-hidden rounded-full" style={{ background: 'var(--color-hairline)' }}>
          <motion.div
            className="h-full"
            style={{ width: '35%', background: 'linear-gradient(90deg, transparent, #ff8a3d, transparent)' }}
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.3 }}
    >
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
