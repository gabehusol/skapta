import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import RecommendationCard from './RecommendationCard'
import SectionHeader from './SectionHeader'
import TiltCard from './TiltCard'
import Toggle from './Toggle'
import { useGenerate } from '../hooks/useGenerate'

const MAIN_CATEGORIES = ['frontend', 'backend', 'database', 'auth', 'deployment']

// Bento spans on a 6-col grid: 2 wide cards on top, 3 on the bottom row.
const SPANS = {
  frontend: 'md:col-span-3',
  backend: 'md:col-span-3',
  database: 'md:col-span-2',
  auth: 'md:col-span-2',
  deployment: 'md:col-span-2',
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

// Reveal sections as they scroll into view.
const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-12% 0px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
}

export default function StackGrid({ recommendations, projectName, description }) {
  const [overrides, setOverrides] = useState({})
  const [excluded, setExcluded] = useState(() => new Set())
  const { loading: generating, generate } = useGenerate()

  if (!recommendations) return null

  const { additional = [] } = recommendations

  const handleOverride = (category, value) => {
    setOverrides((prev) => ({ ...prev, [category]: value }))
  }

  const toggleAdditional = (item) => {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })
  }

  const includedAdditional = additional.filter((a) => !excluded.has(a))

  const effectiveFrontend = overrides.frontend ?? recommendations.frontend?.choice ?? ''
  const isNextFrontend = effectiveFrontend.toLowerCase().includes('next')

  const cardData = (cat) => {
    const data = recommendations[cat]
    if (cat === 'backend' && isNextFrontend && data) {
      const alts = data.alternatives ?? []
      const hasNone =
        data.choice?.toLowerCase() === 'none' ||
        alts.some((a) => a?.toLowerCase() === 'none')
      if (!hasNone) return { ...data, alternatives: ['None', ...alts] }
    }
    return data
  }

  const handleGenerate = () => {
    const stack = {}
    for (const cat of MAIN_CATEGORIES) {
      stack[cat] = overrides[cat] ?? recommendations[cat]?.choice ?? ''
    }
    stack.additional = includedAdditional
    generate({ stack, projectName: projectName || 'my-app', description })
  }

  const exportIndex = additional.length > 0 ? '03' : '02'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-7"
    >
      {/* Stack */}
      <section className="flex flex-col gap-4">
        <SectionHeader index="01" title="Recommended stack" meta="swap any before generating" />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          {MAIN_CATEGORIES.map((cat) =>
            recommendations[cat] ? (
              <RecommendationCard
                key={cat}
                category={cat}
                data={cardData(cat)}
                onOverride={handleOverride}
                className={SPANS[cat]}
              />
            ) : null
          )}
        </motion.div>
      </section>

      {/* Also included */}
      {additional.length > 0 && (
        <motion.section {...reveal} className="flex flex-col gap-4">
          <SectionHeader
            index="02"
            title="Also included"
            meta={`${includedAdditional.length} of ${additional.length} on`}
          />
          <TiltCard max={3} className="glass-card grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl p-3">
            {additional.map((item) => {
              const on = !excluded.has(item)
              return (
                <button
                  key={item}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`Include ${item}`}
                  onClick={() => toggleAdditional(item)}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left"
                  style={{ transition: 'background 150ms ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    className="text-sm truncate"
                    style={{
                      color: on ? 'var(--color-ink)' : 'var(--color-faint)',
                      textDecoration: on ? 'none' : 'line-through',
                      transition: 'color 150ms ease',
                    }}
                  >
                    {item}
                  </span>
                  <Toggle on={on} />
                </button>
              )
            })}
          </TiltCard>
        </motion.section>
      )}

      {/* Export */}
      <motion.section {...reveal} className="flex flex-col gap-4">
        <SectionHeader index={exportIndex} title="Export" />
        <TiltCard
          max={3}
          className="glass-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl p-5"
        >
          <div className="flex flex-col gap-1">
            <span
              className="text-base font-semibold"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
            >
              Generate project
            </span>
            <span className="font-mono text-xs" style={{ color: 'var(--color-faint)' }}>
              configured, ready-to-run ZIP for {projectName || 'my-app'}
            </span>
          </div>

          <motion.button
            onClick={handleGenerate}
            disabled={generating}
            className="relative w-full sm:w-auto py-3.5 px-6 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 overflow-hidden shrink-0"
            style={{
              background: generating
                ? 'var(--color-elevated)'
                : 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-strong) 100%)',
              color: generating ? 'var(--color-faint)' : 'var(--accent-contrast)',
              cursor: generating ? 'not-allowed' : 'pointer',
              border: generating ? '1px solid var(--color-hairline)' : 'none',
              fontFamily: 'var(--font-display)',
              transition: 'background 200ms ease, color 200ms ease',
            }}
            whileHover={
              !generating
                ? { scale: 1.02, boxShadow: '0 14px 50px rgba(var(--accent-rgb),0.4)' }
                : undefined
            }
            whileTap={!generating ? { scale: 0.98 } : undefined}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          >
            {!generating && (
              <motion.span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
                  backgroundSize: '200% 100%',
                }}
                initial={{ backgroundPosition: '200% center' }}
                whileHover={{ backgroundPosition: '-200% center' }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
              />
            )}

            {generating ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-4 h-4 border-2 rounded-full"
                  style={{ borderColor: 'var(--color-hairline)', borderTopColor: 'var(--color-muted)' }}
                />
                Generating project
              </>
            ) : (
              <>
                <Download size={16} strokeWidth={2} />
                Generate project
              </>
            )}
          </motion.button>
        </TiltCard>
      </motion.section>
    </motion.div>
  )
}
