import {
  Metaballs,
  Warp,
  Swirl,
  GrainGradient,
  MeshGradient,
} from '@paper-design/shaders-react'
import { useTheme } from '../theme/ThemeContext'
import { useBackground } from '../theme/BackgroundContext'

const BACK = '#1a1614'
const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%' }

function renderBackground(id, colors) {
  switch (id) {
    case 'warp':
      return <Warp style={fill} colors={colors} speed={0.6} scale={0.9} />
    case 'swirl':
      return <Swirl style={fill} colors={colors} colorBack={BACK} speed={0.7} />
    case 'grain':
      return <GrainGradient style={fill} colors={colors} colorBack={BACK} speed={0.6} />
    case 'mesh':
      return <MeshGradient style={fill} colors={colors} speed={0.4} />
    case 'none':
      return null
    case 'metaballs':
    default:
      return <Metaballs style={fill} colors={colors} colorBack={BACK} speed={0.5} />
  }
}

/**
 * Full-bleed animated background. The shader is chosen via the background ticker
 * and tinted by the active colour scheme, topped with a legibility scrim.
 */
export default function ForgeBackground() {
  const { scheme } = useTheme()
  const { backgroundId } = useBackground()

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div key={`${backgroundId}-${scheme.id}`} className="absolute inset-0">
        {renderBackground(backgroundId, scheme.metaballs)}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(75% 65% at 50% 42%, rgba(37,32,36,0.55) 0%, rgba(37,32,36,0.85) 65%, rgba(37,32,36,0.96) 100%)',
        }}
      />
    </div>
  )
}
