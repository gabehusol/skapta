import { useState } from 'react'
import { motion } from 'framer-motion'
import { cardVariants } from '../lib/variants'

export default function RecommendationCard({ category, data, onOverride }) {
  const [selected, setSelected] = useState(data.choice)
  const [hovered, setHovered] = useState(false)
  const isOverridden = selected !== data.choice

  const handleChange = (e) => {
    setSelected(e.target.value)
    onOverride?.(category, e.target.value)
  }

  return (
    <motion.div
      variants={cardVariants}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="relative flex flex-col gap-4 p-6 rounded-xl"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${
          hovered ? 'rgba(199,199,197,0.28)' : 'var(--color-hairline)'
        }`,
        transition: 'border-color 200ms ease',
      }}
    >
      {/* Override accent bar (cream) */}
      <motion.div
        className="absolute left-0 top-5 bottom-5 w-[2px] rounded-r-full"
        animate={{
          opacity: isOverridden ? 1 : 0,
          scaleY: isOverridden ? 1 : 0.3,
        }}
        transition={{ duration: 0.2 }}
        style={{ background: 'var(--color-cream)', originY: 0.5 }}
      />

      {/* Category */}
      <span
        className="font-mono text-xs uppercase tracking-[0.16em]"
        style={{ color: 'var(--color-faint)' }}
      >
        {category}
      </span>

      {/* Choice + override flag */}
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <h3
          className="text-xl font-semibold leading-snug"
          style={{ color: 'var(--color-ink)', letterSpacing: '-0.3px' }}
        >
          {selected}
        </h3>
        {isOverridden && (
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              color: 'var(--color-ink)',
              border: '1px solid rgba(199,199,197,0.35)',
            }}
          >
            override
          </motion.span>
        )}
      </div>

      {/* Reason */}
      <p
        className="text-sm leading-relaxed flex-1"
        style={{ color: 'var(--color-muted)' }}
      >
        {data.reason}
      </p>

      {/* Override select */}
      {data.alternatives?.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <label
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: 'var(--color-faint)' }}
          >
            swap
          </label>
          <div className="relative">
            <select
              value={selected}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-lg appearance-none cursor-pointer focus:outline-none"
              style={{
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-hairline)',
                color: 'var(--color-ink)',
              }}
            >
              <option value={data.choice}>{data.choice} · recommended</option>
              {data.alternatives.map((alt) => (
                <option key={alt} value={alt}>
                  {alt}
                </option>
              ))}
            </select>
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
              style={{ color: 'var(--color-muted)' }}
            >
              ▾
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
