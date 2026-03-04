import { type ReactElement, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import ParticleScene from './ParticleScene.jsx'
import styles from './HeroSection.module.css'

type QualityTier = 'high' | 'medium' | 'low'

type ThreeHeroCanvasProps = {
	isMobile: boolean
	isInView: boolean
	onFailure: () => void
	onReady: () => void
}

type DeviceProfile = {
	tier: QualityTier
	isWeakGpu: boolean
}

type ParticleSceneProps = {
	qualityTier: QualityTier
	enablePostProcessing: boolean
	progressiveLevel: 'minimal' | 'full'
	onInteractionStart: () => void
	onInteractionEnd: () => void
}

const getQualityTier = (isMobile: boolean): QualityTier => {
	const isMobileUa = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
	const nav = navigator as Navigator & {
		deviceMemory?: number
	}
	const memory = nav.deviceMemory ?? 8
	const cores = nav.hardwareConcurrency ?? 8

	let gpuRenderer = ''
	try {
		const probeCanvas = document.createElement('canvas')
		const probeGl = (probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl')) as WebGLRenderingContext | null
		if (probeGl) {
			const debugInfo = probeGl.getExtension('WEBGL_debug_renderer_info')
			gpuRenderer = String(
				debugInfo
					? probeGl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
					: probeGl.getParameter(probeGl.RENDERER)
			)
		}
	} catch {
		gpuRenderer = ''
	}

	const weakGpuPattern = /mali-4|mali-7|adreno\s*[23]\d{2}|intel\s*uhd|apple\s*a\d{1,2}\s*gpu/i
	const isWeakGpu = weakGpuPattern.test(gpuRenderer)

	if (isMobile || isMobileUa || memory <= 2 || cores <= 2 || isWeakGpu) return 'low'
	if (memory <= 4 || cores <= 4) return 'medium'
	return 'high'
}

const getDeviceProfile = (isMobile: boolean): DeviceProfile => {
	const nav = navigator as Navigator & { deviceMemory?: number }
	const cores = nav.hardwareConcurrency ?? 8
	const memory = nav.deviceMemory ?? 8
	const tier = getQualityTier(isMobile)
	return {
		tier,
		isWeakGpu: tier === 'low' || memory <= 2 || cores <= 2,
	}
}

const ThreeHeroCanvas = ({ isMobile, isInView, onFailure, onReady }: ThreeHeroCanvasProps) => {
	const [progressiveLevel, setProgressiveLevel] = useState<'minimal' | 'full'>('minimal')
	const [isPageVisible, setIsPageVisible] = useState(
		typeof document === 'undefined' ? true : !document.hidden
	)
	const deviceProfile = useMemo(() => getDeviceProfile(isMobile), [isMobile])
	const qualityTier = deviceProfile.tier
	const ParticleSceneComponent = ParticleScene as unknown as (props: ParticleSceneProps) => ReactElement

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsPageVisible(!document.hidden)
		}
		handleVisibilityChange()
		document.addEventListener('visibilitychange', handleVisibilityChange)
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [])

	useEffect(() => {
		const progressiveTimer = window.setTimeout(() => setProgressiveLevel('full'), 1600)
		return () => {
			window.clearTimeout(progressiveTimer)
		}
	}, [])

	const frameloopMode: 'always' | 'demand' = isInView && isPageVisible ? 'always' : 'demand'

	return (
		<Canvas
			/* Pixel ratio clamp limits GPU overdraw on high-DPR displays. */
			className={styles.modelCanvas}
			camera={{ position: [0, 0, qualityTier === 'low' ? 22 : 18], fov: 60 }}
			/* Hybrid mode: animate continuously while visible, demand-render only when hidden/offscreen. */
			frameloop={frameloopMode}
			gl={{
				antialias: !isMobile,
				alpha: true,
				powerPreference: isMobile ? 'low-power' : 'high-performance',
				precision: isMobile ? 'mediump' : 'highp',
				stencil: false,
			}}
			onCreated={({ gl, scene, camera }) => {
				const maxDpr = qualityTier === 'low' ? 0.85 : isMobile ? 1.0 : 1.2
				gl.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr))
				gl.domElement.addEventListener(
					'webglcontextlost',
					(event) => {
						event.preventDefault()
						onFailure()
					},
					{ once: true }
				)

				window.requestAnimationFrame(() => {
					window.requestAnimationFrame(() => {
						try {
							if (typeof gl.compile === 'function') {
								gl.compile(scene, camera)
							}
							gl.render(scene, camera)
						} catch {
							gl.render(scene, camera)
						} finally {
							onReady()
						}
					})
				})
			}}
		>
			<ParticleSceneComponent
				/* Quality tier reduces geometry/effects cost on mid/low devices. */
				qualityTier={qualityTier}
				enablePostProcessing={qualityTier === 'high' && progressiveLevel === 'full' && !deviceProfile.isWeakGpu}
				progressiveLevel={progressiveLevel}
				onInteractionStart={() => {}}
				onInteractionEnd={() => {}}
			/>
		</Canvas>
	)
}

export default ThreeHeroCanvas
