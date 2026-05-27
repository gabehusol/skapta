import { useState } from 'react'
import { motion } from 'framer-motion'
import RecommendationCard, { cardVariants } from './RecommendationCard'

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

export default function StackGrid({ recommendations, onGenerate }) {
  const [overrides, setOverrides] = useState({})

  if (!recommendations) return null

  const { additional = [] } = recommendations

  const handleOverride = (category, value) => {
    setOverrides(prev => ({ ...prev, [category]: value }))
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
        <button
          disabled
          title="Coming soon"
          className="w-full py-4 rounded-md text-base font-semibold cursor-not-allowed"
          style={{
            background: '#f97316',
            color: '#080808',
            opacity: 0.35,
          }}
        >
          Generate Project →
        </button>
        <p className="text-center text-xs" style={{ color: '#444444' }}>
          Coming soon — project ZIP generation is not yet implemented
        </p>
      </motion.div>
    </motion.div>
  )
}
