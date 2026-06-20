import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, RotateCcw } from 'lucide-react'
import SpotlightGlow from './SpotlightGlow'

const EXAMPLES = [
  'AI movie recommender with ratings and accounts',
  'SaaS dashboard with billing and team roles',
  'Realtime chat app with file sharing',
  'E-commerce store with inventory and checkout',
]

export default function DescriptionInput({ onAnalyze, onReset, loading }) {
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [focused, setFocused] = useState(false)
  const [nameFocused, setNameFocused] = useState(false)
  const textareaRef = useRef(null)

  // Typewriter placeholder: pre-types each example, pauses, deletes, advances.
  useEffect(() => {
    if (description) return
    let exIndex = 0
    let charIndex = 0
    let deleting = false
    let timer

    const tick = () => {
      const current = EXAMPLES[exIndex]
      if (!deleting) {
        charIndex += 1
        setPlaceholder(current.slice(0, charIndex))
        if (charIndex === current.length) {
          deleting = true
          timer = setTimeout(tick, 2200)
          return
        }
        timer = setTimeout(tick, 45)
      } else {
        charIndex -= 1
        setPlaceholder(current.slice(0, charIndex))
        if (charIndex === 0) {
          deleting = false
          exIndex = (exIndex + 1) % EXAMPLES.length
        }
        timer = setTimeout(tick, 22)
      }
    }

    timer = setTimeout(tick, 500)
    return () => clearTimeout(timer)
  }, [description])

  const charCount = description.length
  const charWarn = charCount > 1800
  const ready = description.trim().length >= 10

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault()
      if (loading) return
      if (!ready) {
        toast.error('Add a little more detail (at least 10 characters).')
        return
      }
      onAnalyze({
        description: description.trim(),
        projectName: projectName.trim() || 'my-app',
      })
    },
    [loading, ready, description, projectName, onAnalyze]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleReset = () => {
    setDescription('')
    setProjectName('')
    onReset?.()
    textareaRef.current?.focus()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      <form onSubmit={handleSubmit}>
        <div
          className="relative rounded-2xl overflow-hidden p-2"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${focused ? 'rgba(var(--accent-rgb),0.45)' : 'var(--color-hairline)'}`,
            boxShadow: focused ? '0 0 36px rgba(var(--accent-rgb),0.1)' : 'none',
            transition: 'border-color 250ms ease, box-shadow 250ms ease',
          }}
        >
          {/* Cursor-following ember glow */}
          <SpotlightGlow size={460} opacity={0.08} />

          <div className="relative z-[1] flex flex-col gap-2.5">
            {/* Textarea with corner counter */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  onReset?.()
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                maxLength={2000}
                rows={5}
                className="w-full px-4 pt-3 pb-8 text-base leading-relaxed resize-none bg-transparent"
                style={{ color: 'var(--color-ink)', caretColor: 'var(--color-accent)', outline: 'none' }}
              />
              <span
                className="absolute bottom-2 right-3 font-mono text-xs tabular-nums pointer-events-none"
                style={{
                  color: charWarn ? 'var(--color-accent)' : 'var(--color-faint)',
                  transition: 'color 200ms ease',
                }}
              >
                {charCount}/2000
              </span>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
              {/* Name field */}
              <div
                className="flex items-center gap-2 flex-1 min-w-0 h-10 px-3 rounded-lg"
                style={{
                  background: 'var(--color-elevated)',
                  border: `1px solid ${nameFocused ? 'rgba(var(--ink-rgb),0.28)' : 'var(--color-hairline)'}`,
                  transition: 'border-color 200ms ease',
                }}
              >
                <span
                  className="font-mono text-[11px] uppercase tracking-wider shrink-0"
                  style={{ color: 'var(--color-faint)' }}
                >
                  name
                </span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  placeholder="my-app"
                  maxLength={60}
                  className="min-w-0 flex-1 bg-transparent text-sm"
                  style={{ color: 'var(--color-ink)', outline: 'none' }}
                />
              </div>

              {(description || projectName) && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleReset}
                  title="Clear"
                  className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                  style={{
                    color: 'var(--color-muted)',
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-hairline)',
                  }}
                  whileHover={{ color: '#c7c7c5' }}
                >
                  <RotateCcw size={15} strokeWidth={1.8} />
                </motion.button>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading && ready ? { scale: 1.03 } : undefined}
                whileTap={!loading && ready ? { scale: 0.97 } : undefined}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold shrink-0"
                style={{
                  background:
                    ready && !loading
                      ? 'linear-gradient(135deg, #ff8a3d 0%, #ff6a18 100%)'
                      : 'var(--color-elevated)',
                  color: ready && !loading ? '#211a14' : 'var(--color-faint)',
                  cursor: loading ? 'not-allowed' : ready ? 'pointer' : 'default',
                  boxShadow: ready && !loading ? '0 0 24px rgba(var(--accent-rgb),0.35)' : 'none',
                  border: ready && !loading ? 'none' : '1px solid var(--color-hairline)',
                  transition: 'background 200ms ease, color 200ms ease, box-shadow 200ms ease',
                }}
              >
                {loading ? (
                  <>
                    <Spinner />
                    Generating
                  </>
                ) : (
                  <>
                    Generate
                    <ArrowRight size={15} strokeWidth={2} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Hint */}
        <p className="mt-3 px-1 font-mono text-xs" style={{ color: 'var(--color-faint)' }}>
          Enter to generate · Shift + Enter for a new line
        </p>
      </form>
    </motion.div>
  )
}

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className="inline-block w-3.5 h-3.5 border-2 rounded-full"
      style={{ borderColor: 'rgba(33,26,20,0.3)', borderTopColor: '#211a14' }}
    />
  )
}
