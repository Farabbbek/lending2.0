import { Suspense, useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import type { Group, Object3D } from 'three'
import { ACESFilmicToneMapping, Box3, DoubleSide, MeshStandardMaterial, PMREMGenerator, SRGBColorSpace, Vector3 } from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

import styles from './LogoModelSection.module.css'

const LogoModel = ({ animated = false }: { animated?: boolean }) => {
	const model = useLoader(OBJLoader, '/models/project-logo.obj')
	const groupRef = useRef<Group | null>(null)
    

	const normalizedModel = useMemo(() => {
		const clone = model.clone()
		// chrome with environment reflections
		const defaultMaterial = new MeshStandardMaterial({
			color: '#ffffff',
			metalness: 1.0,
			roughness: 0.02,
			envMapIntensity: 2.0,
			side: DoubleSide,
		})

		const box = new Box3().setFromObject(clone)
		const size = new Vector3()
		box.getSize(size)

		const maxDimension = Math.max(size.x, size.y, size.z) || 1
		const scale = 4.8 / maxDimension
		clone.scale.set(scale, scale, scale)
		clone.updateMatrixWorld(true)

		const scaledBox = new Box3().setFromObject(clone)
		const scaledCenter = scaledBox.getCenter(new Vector3())
		clone.position.sub(scaledCenter)
		clone.updateMatrixWorld(true)

		clone.traverse((child: Object3D) => {
			// cast to any to avoid TS errors for generic Object3D
			const c: any = child
			if (c.isMesh) {
				c.material = defaultMaterial
				c.material.needsUpdate = true
				c.castShadow = false
				c.receiveShadow = false
				c.frustumCulled = false
			}
		})

		return clone
	}, [model])

	useFrame((state) => {
		if (!animated || !groupRef.current) return
		groupRef.current.rotation.y = state.clock.elapsedTime * 0.35
	})

	return (
		<group ref={groupRef} rotation={[-0.03, 0, 0]}>
			<primitive object={normalizedModel} />
		</group>
	)
}

// Scene will be lit by an HDR environment map

// component responsible for loading hdri and setting environment
const Environment = ({ hdrPath }: { hdrPath: string }) => {
	const { gl, scene } = useThree()
	useEffect(() => {
		const pmremGenerator = new PMREMGenerator(gl)
		pmremGenerator.compileEquirectangularShader()
		new RGBELoader()
			.load(hdrPath, (texture) => {
				const envMap = pmremGenerator.fromEquirectangular(texture).texture
				scene.environment = envMap
				// keep background null for transparency
				scene.background = null
				scene.traverse((o: any) => {
					if (o.isMesh && o.material) {
						o.material.envMap = envMap
						o.material.needsUpdate = true
					}
				})
				texture.dispose()
				pmremGenerator.dispose()
			},
			(undefined),
			(err) => console.error('HDR loading error', err)
			)
	}, [gl, scene, hdrPath])
	return null
}

const LogoModelSection = () => {
	return (
		<section className={styles.section} aria-label='3D logo preview'>
			<div className={`${styles.wrap} container`}>
				<div className={styles.canvasHost}>
					<Canvas
						camera={{ position: [0, 0.1, 13], fov: 25 }}
						gl={{ antialias: true, alpha: true }}
						dpr={[1, 2]}
						onCreated={({ gl }) => {
						gl.toneMapping = ACESFilmicToneMapping
							gl.toneMappingExposure = 1.55
							gl.outputColorSpace = SRGBColorSpace
					gl.setClearColor(0x000000, 0)
						}}
					>
						{/* HDR environment provides lighting reflections */}
						<Suspense fallback={null}>
							<LogoModel animated />
						</Suspense>
						<Environment hdrPath="/hdr/softbox.hdr" />
				</Canvas>
			</div>
		</div>
		</section>
	)
}

export default LogoModelSection