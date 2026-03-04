import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'

const HeroPostEffects = () => {
	return (
		<EffectComposer multisampling={0}>
			<Bloom luminanceThreshold={0.45} luminanceSmoothing={0.75} intensity={0.45} />
			<Vignette offset={0.3} darkness={0.75} />
		</EffectComposer>
	)
}

export default HeroPostEffects
