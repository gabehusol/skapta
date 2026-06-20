/** Dashboard section header: numbered chip + title + meta + a hairline rule. */
export default function SectionHeader({ index, title, meta }) {
  return (
    <div className="flex items-center gap-3">
      {index != null && (
        <span
          className="flex items-center justify-center w-6 h-6 rounded-md font-mono text-[11px] shrink-0"
          style={{
            color: 'var(--color-accent)',
            background: 'rgba(var(--accent-rgb), 0.1)',
            border: '1px solid rgba(var(--accent-rgb), 0.22)',
          }}
        >
          {index}
        </span>
      )}
      <h2
        className="text-base font-semibold shrink-0"
        style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
      >
        {title}
      </h2>
      {meta && (
        <span className="font-mono text-xs shrink-0 hidden sm:inline" style={{ color: 'var(--color-faint)' }}>
          {meta}
        </span>
      )}
      <div className="flex-1 h-px ml-1" style={{ background: 'var(--color-hairline)' }} />
    </div>
  )
}
