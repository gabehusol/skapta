/** Visual on/off switch. Interaction is handled by the parent (role=switch). */
export default function Toggle({ on }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block w-9 h-5 rounded-full shrink-0"
      style={{
        background: on ? 'var(--color-accent)' : 'var(--color-elevated)',
        border: `1px solid ${on ? 'transparent' : 'var(--color-hairline)'}`,
        transition: 'background 200ms ease, border-color 200ms ease',
      }}
    >
      <span
        className="absolute left-0.5 top-1/2 w-3.5 h-3.5 rounded-full"
        style={{
          background: on ? 'var(--accent-contrast)' : 'var(--color-muted)',
          transform: `translateY(-50%) translateX(${on ? 16 : 0}px)`,
          transition: 'transform 200ms ease, background 200ms ease',
        }}
      />
    </span>
  )
}
