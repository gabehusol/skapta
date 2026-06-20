import { useState } from 'react'
import { motion } from 'framer-motion'
import { Layout, Server, Database, ShieldCheck, Rocket, Boxes } from 'lucide-react'
import TiltCard from './TiltCard'
import { cardVariants } from '../lib/variants'

const ICONS = {
  frontend: Layout,
  backend: Server,
  database: Database,
  auth: ShieldCheck,
  deployment: Rocket,
}

export default function RecommendationCard({ category, data, onOverride, className = '' }) {
  const [selected, setSelected] = useState(data.choice)
  const isOverridden = selected !== data.choice
  const Icon = ICONS[category] || Boxes

  const handleChange = (e) => {
    setSelected(e.target.value)
    onOverride?.(category, e.target.value)
  }

  return (
    <motion.div variants={cardVariants} className={`h-full ${className}`}>
      <TiltCard
        max={9}
        className="glass-card relative flex flex-col gap-4 h-full rounded-2xl p-5 md:p-6 overflow-hidden"
      >
        {/* Override accent bar */}
        <motion.div
          className="absolute left-0 top-5 bottom-5 w-[2px] rounded-r-full"
          animate={{ opacity: isOverridden ? 1 : 0, scaleY: isOverridden ? 1 : 0.3 }}
          transition={{ duration: 0.2 }}
          style={{ background: 'var(--color-accent)', originY: 0.5 }}
        />

        {/* Icon + category (popped forward in 3D) */}
        <div className="flex items-center justify-between gap-3" style={{ transform: 'translateZ(40px)' }}>
          <span
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{
              background: 'rgba(var(--accent-rgb), 0.1)',
              border: '1px solid rgba(var(--accent-rgb), 0.22)',
              color: 'var(--color-accent)',
            }}
          >
            <Icon size={18} strokeWidth={1.8} />
          </span>
          <span
            className="font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: 'var(--color-faint)' }}
          >
            {category}
          </span>
        </div>

        {/* Choice */}
        <div className="flex items-baseline gap-2 flex-wrap" style={{ transform: 'translateZ(28px)' }}>
          <h3
            className="text-2xl font-semibold leading-tight"
            style={{
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.3px',
            }}
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
                color: 'var(--color-accent)',
                border: '1px solid rgba(var(--accent-rgb), 0.4)',
              }}
            >
              override
            </motion.span>
          )}
        </div>

        {/* Reason */}
        <p
          className="text-sm leading-relaxed flex-1"
          style={{ color: 'var(--color-muted)', transform: 'translateZ(16px)' }}
        >
          {data.reason}
        </p>

        {/* Swap select */}
        {data.alternatives?.length > 0 && (
          <div className="relative mt-1" style={{ transform: 'translateZ(24px)' }}>
            <select
              value={selected}
              onChange={handleChange}
              aria-label={`Swap ${category}`}
              className="w-full pl-3 pr-8 py-2.5 text-sm rounded-lg appearance-none cursor-pointer focus:outline-none"
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
        )}
      </TiltCard>
    </motion.div>
  )
}
