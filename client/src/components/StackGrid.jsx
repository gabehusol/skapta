import { useState } from 'react'
import { motion } from 'framer-motion'
import RecommendationCard from './RecommendationCard'
import { cardVariants } from '../lib/variants'
import { useGenerate } from '../hooks/useGenerate'

const MAIN_CATEGORIES = ['frontend', 'backend', 'database', 'auth', 'deployment']

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
}

export default function StackGrid({ recommendations, projectName, description }) {
  const [overrides, setOverrides] = useState({})
  const { loading: generating, generate } = useGenerate()

  if (!recommendations) return null

  const { additional = [] } = recommendations

  const handleOverride = (category, value) => {
    setOverrides(prev => ({ ...prev, [category]: value }))
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
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-10"
    >
      {/* Section label */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold tracking-widest uppercase text-muted">
          Recommended Stack
        </span>
        <div className="flex-1 h-px" style={{ background: '#1a1a1a' }} />
      </div>

      {/* Cards grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {MAIN_CATEGORIES.map(cat =>
          recommendations[cat] ? (
            <RecommendationCard
              key={cat}
              category={cat}
              data={recommendations[cat]}
              onOverride={handleOverride}
            />
          ) : null
        )}
      </motion.div>

      {/* Additional chips */}
      {additional.length > 0 && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-muted">
            Also Included
          </span>
          <div className="flex flex-wrap gap-2">
            {additional.map(item => (
              <span
                key={item}
                className="px-3 py-1.5 text-xs font-medium rounded-full"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  color: '#aaaaaa',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Divider */}
      <div className="h-px" style={{ background: '#1a1a1a' }} />

      {/* Generate CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="flex flex-col items-stretch gap-3"
      >
        <motion.button
          whileHover={!generating ? { scale: 1.01 } : undefined}
          whileTap={!generating ? { scale: 0.985 } : undefined}
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-4 rounded-md text-base font-semibold"
          style={{
            background: '#f97316',
            color: '#080808',
            opacity: generating ? 0.55 : 1,
            cursor: generating ? 'not-allowed' : 'pointer',
            boxShadow: generating ? 'none' : '0 0 40px rgba(249,115,22,0.22)',
          }}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2.5">
              <GeneratingSpinner />
              Generating...
            </span>
          ) : (
            'Generate Project →'
          )}
        </motion.button>
        <p className="text-center text-xs text-faint">
          Downloads a configured, ready-to-run project ZIP
        </p>
      </motion.div>
    </motion.div>
  )
}

function GeneratingSpinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      className="inline-block w-4 h-4 border-2 rounded-full"
      style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#080808' }}
    />
  )
}
