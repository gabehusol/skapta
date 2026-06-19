import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import RecommendationCard from './RecommendationCard'
import SectionLabel from './SectionLabel'
import { cardVariants } from '../lib/variants'
import { useGenerate } from '../hooks/useGenerate'

const MAIN_CATEGORIES = ['frontend', 'backend', 'database', 'auth', 'deployment']

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

export default function StackGrid({ recommendations, projectName, description }) {
  const [overrides, setOverrides] = useState({})
  const { loading: generating, generate } = useGenerate()

  if (!recommendations) return null

  const { additional = [] } = recommendations

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8"
    >
      <SectionLabel>Recommended stack</SectionLabel>

      {/* Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {MAIN_CATEGORIES.map((cat) =>
          recommendations[cat] ? (
            <RecommendationCard
              key={cat}
              category={cat}
              data={cardData(cat)}
              onOverride={handleOverride}
            />
          ) : null
        )}
      </motion.div>

      {/* Also included */}
      {additional.length > 0 && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          <span
            className="font-mono text-xs uppercase tracking-[0.16em]"
            style={{ color: 'var(--color-faint)' }}
          >
            also included
          </span>
          <div className="flex flex-wrap gap-2">
            {additional.map((item) => (
              <span
                key={item}
                className="px-3 py-1.5 text-xs font-medium rounded-full"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-hairline)',
                  color: 'var(--color-muted)',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Generate, inverted solid-cream CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex flex-col items-stretch gap-3 pt-2"
      >
        <motion.button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2.5"
          style={{
            background: generating ? 'var(--color-elevated)' : 'var(--color-cream)',
            color: generating ? 'var(--color-faint)' : '#252024',
            cursor: generating ? 'not-allowed' : 'pointer',
            border: generating ? '1px solid var(--color-hairline)' : 'none',
            transition: 'background-color 200ms ease, color 200ms ease',
          }}
          whileHover={
            !generating
              ? { scale: 1.01, boxShadow: '0 12px 40px rgba(199,199,197,0.14)' }
              : undefined
          }
          whileTap={!generating ? { scale: 0.99 } : undefined}
          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
        >
          {generating ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-4 h-4 border-2 rounded-full"
                style={{
                  borderColor: 'var(--color-hairline)',
                  borderTopColor: 'var(--color-muted)',
                }}
              />
              Generating project
            </>
          ) : (
            <>
              <Download size={17} strokeWidth={2} />
              Generate project
            </>
          )}
        </motion.button>
        <p
          className="text-center font-mono text-xs"
          style={{ color: 'var(--color-faint)' }}
        >
          downloads a configured, ready-to-run project ZIP
        </p>
      </motion.div>
    </motion.div>
  )
}
