import { Metaballs } from '@paper-design/shaders-react'

// Forge palette. Warm molten embers over a dark base.
const BACK = '#1c1714'
const EMBERS = ['#ff7a18', '#e8430c', '#ffce7a']

const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%' }

/**
 * Full-bleed animated background: molten metaballs (paper-design shader),
 * topped with a legibility scrim so hero content stays readable.
 */
export default function ForgeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <Metaballs style={fill} colors={EMBERS} colorBack={BACK} speed={0.5} />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 42%, rgba(37,32,36,0.35) 0%, rgba(37,32,36,0.75) 70%, rgba(37,32,36,0.92) 100%)',
        }}
      />
    </div>
  )
}
