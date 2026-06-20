import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Check } from 'lucide-react'
import RecommendationCard from './RecommendationCard'
import SectionHeader from './SectionHeader'
import { cardVariants } from '../lib/variants'
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

const PANEL = { background: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }

export default function StackGrid({ recommendations, projectName, description }) {
  const [overrides, setOverrides] = useState({})
  const { loading: generating, generate } = useGenerate()

  if (!recommendations) return null

  const { additional = [] } = recommendations
  const count = MAIN_CATEGORIES.filter((c) => recommendations[c]).length
  const overrideCount = Object.keys(overrides).filter(
    (k) => overrides[k] !== recommendations[k]?.choice
  ).length

  const handleOverride = (category, value) => {
    setOverrides((prev) => ({ ...prev, [category]: value }))
  }

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
    stack.additional = additional
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
      {/* Overview strip */}
      <div className="grid grid-cols-3 rounded-2xl overflow-hidden" style={PANEL}>
        <Stat label="Project" value={projectName || 'my-app'} />
        <Stat label="Layers" value={String(count)} bordered />
        <Stat
          label={overrideCount > 0 ? 'Overrides' : 'Status'}
          value={overrideCount > 0 ? `${overrideCount} swapped` : 'Ready'}
          dot={overrideCount === 0}
          bordered
        />
      </div>

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
        <section className="flex flex-col gap-4">
          <SectionHeader index="02" title="Also included" meta={`${additional.length} extras`} />
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 rounded-2xl p-5"
            style={PANEL}
          >
            {additional.map((item) => (
              <span
                key={item}
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--color-ink)' }}
              >
                <Check size={14} strokeWidth={2.4} style={{ color: 'var(--color-accent)' }} />
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Export */}
      <section className="flex flex-col gap-4">
        <SectionHeader index={exportIndex} title="Export" />
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl p-5"
          style={PANEL}
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
                : 'linear-gradient(135deg, #ff8a3d 0%, #ff6a18 100%)',
              color: generating ? 'var(--color-faint)' : '#211a14',
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
        </div>
      </section>
    </motion.div>
  )
}

function Stat({ label, value, bordered, dot }) {
  return (
    <div
      className="flex flex-col gap-1 px-4 sm:px-5 py-4 min-w-0"
      style={{ borderLeft: bordered ? '1px solid var(--color-hairline)' : 'none' }}
    >
      <span
        className="font-mono text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--color-faint)' }}
      >
        {label}
      </span>
      <span
        className="flex items-center gap-2 text-base font-semibold truncate"
        style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
      >
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: 'var(--color-accent)', boxShadow: '0 0 8px rgba(var(--accent-rgb),0.8)' }}
          />
        )}
        <span className="truncate">{value}</span>
      </span>
    </div>
  )
}
