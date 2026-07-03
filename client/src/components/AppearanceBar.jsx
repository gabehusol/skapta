import { useTheme } from '../theme/ThemeContext'
import { useBackground } from '../theme/BackgroundContext'

/** Floating appearance control: pick a background and an accent scheme. */
export default function AppearanceBar() {
  const { scheme, schemes, setSchemeId } = useTheme()
  const { backgroundId, setBackgroundId, backgrounds } = useBackground()

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 px-4 py-3 rounded-2xl max-w-[94vw]"
      style={{
        background: 'rgba(37,32,36,0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--color-hairline)',
        boxShadow: '0 10px 34px rgba(0,0,0,0.4)',
      }}
    >
      {/* Background row */}
      <div className="flex items-center gap-3">
        <span
          className="w-[68px] shrink-0 font-mono text-[10px]"
          style={{ color: 'var(--color-faint)' }}
        >
          Background
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {backgrounds.map((b) => {
            const active = b.id === backgroundId
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBackgroundId(b.id)}
                className="px-2.5 py-1 rounded-md font-mono text-[11px] cursor-pointer"
                style={{
                  color: active ? 'var(--accent-contrast)' : 'var(--color-muted)',
                  background: active ? 'var(--color-accent)' : 'var(--color-elevated)',
                  border: `1px solid ${active ? 'transparent' : 'var(--color-hairline)'}`,
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                {b.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-px" style={{ background: 'var(--color-hairline)' }} />

      {/* Theme row */}
      <div className="flex items-center gap-3">
        <span
          className="w-[68px] shrink-0 font-mono text-[10px]"
          style={{ color: 'var(--color-faint)' }}
        >
          Theme
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {schemes.map((s) => {
            const active = s.id === scheme.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSchemeId(s.id)}
                title={s.name}
                aria-label={`${s.name} theme`}
                aria-pressed={active}
                className="w-5 h-5 rounded-full cursor-pointer transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${s.soft} 0%, ${s.strong} 100%)`,
                  outline: active ? '2px solid var(--color-ink)' : '2px solid transparent',
                  outlineOffset: '2px',
                  transform: active ? 'scale(1.12)' : 'scale(1)',
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
