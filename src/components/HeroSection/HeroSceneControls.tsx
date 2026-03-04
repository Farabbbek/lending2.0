import { OrbitControls } from '@react-three/drei'
import { TOUCH } from 'three'

type QualityTier = 'high' | 'medium' | 'low'

type HeroSceneControlsProps = {
	qualityTier: QualityTier
	onInteractionStart?: () => void
	onInteractionEnd?: () => void
}

const HeroSceneControls = ({ qualityTier, onInteractionStart, onInteractionEnd }: HeroSceneControlsProps) => {
	return (
		<OrbitControls
			enableDamping
			dampingFactor={qualityTier === 'low' ? 0.06 : 0.08}
			enablePan={false}
			autoRotate={false}
			autoRotateSpeed={0.15}
			minDistance={8.5}
			maxDistance={120}
			enableZoom
			rotateSpeed={qualityTier === 'low' ? 0.65 : 0.8}
			zoomSpeed={qualityTier === 'low' ? 0.3 : 0.35}
			touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
			onStart={onInteractionStart}
			onEnd={onInteractionEnd}
			onChange={onInteractionStart}
		/>
	)
}

export default HeroSceneControls
