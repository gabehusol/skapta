import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, RotateCcw } from 'lucide-react'

const PLACEHOLDER =
  'Describe what you’re building, its core features, and any constraints. The more detail you give, the sharper the stack.'

export default function DescriptionInput({ onAnalyze, onReset, loading }) {
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef(null)

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
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${
              focused ? 'rgba(199,199,197,0.3)' : 'var(--color-hairline)'
            }`,
            boxShadow: focused
              ? '0 0 0 4px rgba(199,199,197,0.05)'
              : 'none',
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
          }}
        >
          {/* Textarea */}
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
            placeholder={PLACEHOLDER}
            maxLength={2000}
            rows={5}
            className="w-full px-6 pt-6 pb-4 text-base leading-relaxed resize-none bg-transparent focus:outline-none"
            style={{ color: 'var(--color-ink)', caretColor: '#c7c7c5' }}
          />

          {/* Toolbar */}
          <div
            className="flex items-center justify-between gap-4 px-4 py-3"
            style={{ borderTop: '1px solid var(--color-hairline)' }}
          >
            {/* Left side, project name */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                className="font-mono text-xs uppercase tracking-wider shrink-0"
                style={{ color: 'var(--color-faint)' }}
              >
                name
              </span>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-app"
                maxLength={60}
                className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--color-ink)' }}
              />
            </div>

            {/* Right side, count + actions */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="font-mono text-xs tabular-nums mr-1"
                style={{
                  color: charWarn ? '#c7c7c5' : 'var(--color-faint)',
                  transition: 'color 200ms ease',
                }}
              >
                {charCount}/2000
              </span>

              {(description || projectName) && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleReset}
                  title="Clear"
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ color: 'var(--color-muted)' }}
                  whileHover={{
                    backgroundColor: 'var(--color-elevated)',
                    color: '#c7c7c5',
                  }}
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
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold"
                style={{
                  background: ready && !loading ? 'var(--color-cream)' : 'var(--color-elevated)',
                  color: ready && !loading ? '#252024' : 'var(--color-faint)',
                  cursor: loading ? 'not-allowed' : ready ? 'pointer' : 'default',
                  transition: 'background-color 200ms ease, color 200ms ease',
                }}
              >
                {loading ? (
                  <>
                    <Spinner />
                    Analyzing
                  </>
                ) : (
                  <>
                    Analyze
                    <ArrowRight size={15} strokeWidth={2} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Hint */}
        <p
          className="mt-3 px-1 font-mono text-xs"
          style={{ color: 'var(--color-faint)' }}
        >
          Enter to analyze · Shift + Enter for a new line
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
      style={{ borderColor: 'rgba(37,32,36,0.25)', borderTopColor: '#252024' }}
    />
  )
}
