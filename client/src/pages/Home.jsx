import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  // Empty state gets a full viewport hero. Once work begins, the hero collapses
  // so results sit close to the input instead of far below the fold.
  const active = loading || !!recommendations || !!error

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>

      {/* Full-page animated forge background */}
      <ForgeBackground />

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5">
        <span
          className="text-sm font-bold tracking-[0.22em] uppercase select-none"
          style={{ color: 'var(--color-ink)' }}
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

      <main className="relative z-10 flex-1 flex flex-col">

        {/* Hero */}
        <section
          className={`relative flex items-center justify-center overflow-hidden transition-[min-height,padding] duration-500 ${
            active ? 'min-h-0 pt-6 pb-2' : 'min-h-[86vh] pb-12'
          }`}
        >
          {/* Hero content */}
          <div className="relative z-10 w-full max-w-2xl mx-auto px-6 flex flex-col items-center text-center gap-8">

            {/* Headline (only in the idle hero state) */}
            <AnimatePresence initial={false}>
              {!active && (
                <motion.div
                  key="headline"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-5"
                >
                  <h1
                    className="text-4xl md:text-6xl font-medium leading-[1.05]"
                    style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}
                  >
                    Stop guessing
                    <br />
                    your tech stack.
                  </h1>
                  <p
                    className="text-base md:text-lg max-w-md"
                    style={{ color: 'var(--color-muted)', lineHeight: 1.6 }}
                  >
                    Tell Skapta what you are building. Get a reasoned stack and a
                    configured, ready to run project in seconds.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="w-full text-left">
              <DescriptionInput onAnalyze={handleAnalyze} onReset={reset} loading={loading} />
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-20 flex flex-col gap-8">

          {/* Error */}
          <AnimatePresence>
            {error && !loading && !recommendations && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                className="flex items-center justify-between px-5 py-4 rounded-xl"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-hairline)',
                }}
              >
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Something went wrong.
                </span>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={retry}
                  className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg"
                  style={{
                    border: '1px solid rgba(199,199,197,0.35)',
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading, minimal indeterminate line */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                className="flex flex-col items-center gap-4 py-16"
              >
                <div
                  className="w-full max-w-xs h-px overflow-hidden rounded-full"
                  style={{ background: 'var(--color-hairline)' }}
                >
                  <motion.div
                    className="h-full"
                    style={{ width: '35%', background: 'var(--color-cream)' }}
                    animate={{ x: ['-120%', '340%'] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <span
                  className="font-mono text-xs uppercase tracking-[0.18em]"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Analyzing
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recommendations */}
          <AnimatePresence>
            {!loading && recommendations && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <StackGrid
                  recommendations={recommendations}
                  projectName={lastInput.projectName}
                  description={lastInput.description}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10"
        style={{ borderTop: '1px solid var(--color-hairline)' }}
      >
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
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
