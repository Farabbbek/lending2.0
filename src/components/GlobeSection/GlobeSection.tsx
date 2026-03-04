import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import styles from './GlobeSection.module.css'
import ContactForm from '../ContactForm/ContactForm'

type ArcConfig = {
	startLat: number
	startLng: number
	endLat: number
	endLng: number
	height: number
	speed: number
	color: string
}

type Coord = [number, number]
type PolygonCoords = Coord[][]
type MultiPolygonCoords = Coord[][][]

type GeoFeature = {
	geometry: {
		type: 'Polygon' | 'MultiPolygon'
		coordinates: PolygonCoords | MultiPolygonCoords
	} | null
}

type GeoFeatureCollection = {
	type: 'FeatureCollection'
	features: GeoFeature[]
}

type ProcessedPolygon = {
	outer: Coord[]
	holes: Coord[][]
	minLat: number
	maxLat: number
	minLng: number
	maxLng: number
}

const WORLD_GEOJSON_URLS = [
	'https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/DATA/world.geojson',
	'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
	'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json',
]

const RADIUS = 1.45
const AXIAL_TILT_DEG = -23.4
const LOGO_CENTER_LAT = -48.8767
const LOGO_CENTER_LNG = -123.3933

const arcsConfig: ArcConfig[] = [
	{ startLat: 40.7128, startLng: -74.006, endLat: 51.5072, endLng: -0.1276, height: 0.52, speed: 0.18, color: '#F4F7FF' },
	{ startLat: 35.6762, startLng: 139.6503, endLat: 22.3193, endLng: 114.1694, height: 0.32, speed: 0.22, color: '#CFD6E4' },
	{ startLat: 1.3521, startLng: 103.8198, endLat: -33.8688, endLng: 151.2093, height: 0.46, speed: 0.2, color: '#AEB8CC' },
	{ startLat: 48.8566, startLng: 2.3522, endLat: 25.2048, endLng: 55.2708, height: 0.4, speed: 0.2, color: '#F4F7FF' },
	{ startLat: -23.5505, startLng: -46.6333, endLat: 37.7749, endLng: -122.4194, height: 0.58, speed: 0.17, color: '#CFD6E4' },
]

const markerPoints = [
	{ lat: 40.7128, lng: -74.006 },
	{ lat: 51.5072, lng: -0.1276 },
	{ lat: 35.6762, lng: 139.6503 },
	{ lat: 22.3193, lng: 114.1694 },
	{ lat: -33.8688, lng: 151.2093 },
	{ lat: 1.3521, lng: 103.8198 },
]

// Fallback only if geojson cannot load at runtime.
const FALLBACK_POLYGONS: Coord[][] = [
	[[-168, 72], [-132, 55], [-118, 35], [-95, 20], [-80, 27], [-63, 48], [-78, 66], [-126, 73]],
	[[-81, 12], [-72, 1], [-75, -23], [-68, -51], [-56, -52], [-47, -24], [-54, 4], [-72, 12]],
	[[-10, 72], [97, 70], [173, 50], [131, 42], [88, 27], [61, 26], [36, 34], [10, 49], [-8, 64]],
	[[-17, 37], [33, 27], [51, 3], [34, -24], [12, -35], [-6, -24], [-15, -3], [-15, 31]],
	[[112, -11], [149, -25], [146, -39], [125, -34], [112, -20]],
	[[-73, 82], [-32, 71], [-45, 60], [-66, 67]],
]

const toVector3 = (lat: number, lng: number, radius: number) => {
	const phi = (90 - lat) * (Math.PI / 180)
	const theta = (lng + 180) * (Math.PI / 180)
	return new THREE.Vector3(
		-radius * Math.sin(phi) * Math.cos(theta),
		radius * Math.cos(phi),
		radius * Math.sin(phi) * Math.sin(theta)
	)
}

const wrapLng = (lng: number) => {
	let value = lng
	while (value > 180) value -= 360
	while (value < -180) value += 360
	return value
}

const normalizeLngAround = (lng: number, referenceLng: number) => {
	let normalized = lng
	while (normalized - referenceLng > 180) normalized -= 360
	while (normalized - referenceLng < -180) normalized += 360
	return normalized
}

const pointInRing = (lat: number, lng: number, ring: Coord[]) => {
	const x = lng
	const y = lat
	let inside = false

	for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
		const xi = normalizeLngAround(ring[i][0], x)
		const yi = ring[i][1]
		const xj = normalizeLngAround(ring[j][0], x)
		const yj = ring[j][1]
		const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
		if (intersects) inside = !inside
	}

	return inside
}

const pointInPolygon = (lat: number, lng: number, polygon: Coord[]) => pointInRing(lat, lng, polygon)

const ringBBox = (ring: Coord[]) => {
	let minLat = 90
	let maxLat = -90
	let minLng = 180
	let maxLng = -180

	for (let i = 0; i < ring.length; i += 1) {
		const [lng, lat] = ring[i]
		if (lat < minLat) minLat = lat
		if (lat > maxLat) maxLat = lat
		if (lng < minLng) minLng = lng
		if (lng > maxLng) maxLng = lng
	}

	return { minLat, maxLat, minLng, maxLng }
}

const preprocessWorld = (world: GeoFeatureCollection): ProcessedPolygon[] => {
	const polygons: ProcessedPolygon[] = []

	for (let f = 0; f < world.features.length; f += 1) {
		const feature = world.features[f]
		if (!feature?.geometry) continue

		if (feature.geometry.type === 'Polygon') {
			const coords = feature.geometry.coordinates as PolygonCoords
			if (!coords?.length) continue
			const outer = coords[0]
			const holes = coords.slice(1)
			polygons.push({ outer, holes, ...ringBBox(outer) })
		}

		if (feature.geometry.type === 'MultiPolygon') {
			const multi = feature.geometry.coordinates as MultiPolygonCoords
			for (let p = 0; p < multi.length; p += 1) {
				const coords = multi[p]
				if (!coords?.length) continue
				const outer = coords[0]
				const holes = coords.slice(1)
				polygons.push({ outer, holes, ...ringBBox(outer) })
			}
		}
	}

	return polygons
}

const pointOnLandGeo = (lat: number, lng: number, polygons: ProcessedPolygon[]) => {
	for (let i = 0; i < polygons.length; i += 1) {
		const poly = polygons[i]

		if (!pointInRing(lat, lng, poly.outer)) continue

		let insideHole = false
		for (let h = 0; h < poly.holes.length; h += 1) {
			if (pointInRing(lat, lng, poly.holes[h])) {
				insideHole = true
				break
			}
		}

		if (!insideHole) return true
	}

	return false
}

const pointOnLandFallback = (lat: number, lng: number) => {
	for (let i = 0; i < FALLBACK_POLYGONS.length; i += 1) {
		if (pointInPolygon(lat, lng, FALLBACK_POLYGONS[i])) return true
	}
	return false
}

const inLogoArea = (lat: number, lng: number) => {
	const u = wrapLng(lng - LOGO_CENTER_LNG) / 20
	const v = (lat - LOGO_CENTER_LAT) / 20
	return u * u + v * v <= 1
}

const isLogoPoint = (lat: number, lng: number) => {
	const u = wrapLng(lng - LOGO_CENTER_LNG) / 16.5
	const v = (lat - LOGO_CENTER_LAT) / 16.5

	const barCenters = [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
	const barHeights = [0.34, 0.5, 0.66, 0.82, 1.0, 0.82, 0.66, 0.5, 0.34]
	const barWidth = 0.062

	for (let i = 0; i < barCenters.length; i += 1) {
		if (Math.abs(u - barCenters[i]) <= barWidth && v >= 0 && v <= barHeights[i]) return true
	}
	return Math.abs(u) <= 0.08 && v < 0 && v >= -0.28
}

const GlobeSection = () => {
	const mountRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const host = mountRef.current
		if (!host) return

		const scene = new THREE.Scene()
		const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
		camera.position.set(0, 0.05, 5.2)

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
		renderer.setSize(host.clientWidth, host.clientHeight)
		host.appendChild(renderer.domElement)

		const ambient = new THREE.AmbientLight('#c7d0df', 0.9)
		const dirTop = new THREE.DirectionalLight('#ffffff', 0.72)
		dirTop.position.set(1.8, 2.5, 2)
		const dirLeft = new THREE.DirectionalLight('#dce4f1', 0.48)
		dirLeft.position.set(-2.2, 0.8, 1.5)
		scene.add(ambient, dirTop, dirLeft)

		const worldGroup = new THREE.Group()
		worldGroup.rotation.z = THREE.MathUtils.degToRad(AXIAL_TILT_DEG)

		// nudge the globe slightly left to make room for the contact form
		worldGroup.position.x = -0.55
		scene.add(worldGroup)

		const globe = new THREE.Mesh(
			new THREE.SphereGeometry(RADIUS, 96, 96),
			new THREE.MeshStandardMaterial({
				color: '#050505',
				emissive: '#0d0f15',
				emissiveIntensity: 0.18,
				roughness: 0.62,
				metalness: 0.12,
			})
		)
		worldGroup.add(globe)

		const atmosphere = new THREE.Mesh(
			new THREE.SphereGeometry(RADIUS * 1.07, 96, 96),
			new THREE.MeshBasicMaterial({
				color: '#E8ECF2',
				transparent: true,
				opacity: 0.038,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
			})
		)
		worldGroup.add(atmosphere)

		const landGeometry = new THREE.BufferGeometry()
		const landDots = new THREE.Points(
			landGeometry,
			new THREE.PointsMaterial({
				color: '#E8ECF2',
				size: 0.0092,
				sizeAttenuation: true,
				transparent: true,
				opacity: 0.93,
			})
		)
		worldGroup.add(landDots)

		const logoGeometry = new THREE.BufferGeometry()
		const logoDots = new THREE.Points(
			logoGeometry,
			new THREE.PointsMaterial({
				color: '#F8FBFF',
				size: 0.011,
				sizeAttenuation: true,
				transparent: true,
				opacity: 0.99,
			})
		)
		worldGroup.add(logoDots)

		const buildDots = (isLand: (lat: number, lng: number) => boolean) => {
			const landPositions: number[] = []
			const logoPositions: number[] = []

			for (let lat = -86; lat <= 86; lat += 1.4) {
				for (let lng = -180; lng <= 180; lng += 1.4) {
					const jitterLat = lat + (Math.random() - 0.5) * 0.24
					const jitterLng = lng + (Math.random() - 0.5) * 0.24

					// Reserve a clear patch in the largest ocean for the Aetheris logo.
					if (inLogoArea(jitterLat, jitterLng)) {
						if (isLogoPoint(jitterLat, jitterLng)) {
							const lv = toVector3(jitterLat, jitterLng, RADIUS + 0.01)
							logoPositions.push(lv.x, lv.y, lv.z)
						}
						continue
					}

					if (!isLand(jitterLat, jitterLng)) continue
					const v = toVector3(jitterLat, jitterLng, RADIUS + 0.008)
					landPositions.push(v.x, v.y, v.z)
				}
			}

			landGeometry.setAttribute('position', new THREE.Float32BufferAttribute(landPositions, 3))
			logoGeometry.setAttribute('position', new THREE.Float32BufferAttribute(logoPositions, 3))
		}

		let disposed = false
		void (async () => {
			let loaded = false

			for (let i = 0; i < WORLD_GEOJSON_URLS.length; i += 1) {
				try {
					const response = await fetch(WORLD_GEOJSON_URLS[i])
					if (!response.ok) continue
					const world = (await response.json()) as GeoFeatureCollection
					if (disposed) return
					const polygons = preprocessWorld(world)
					buildDots((lat, lng) => pointOnLandGeo(lat, lng, polygons))
					loaded = true
					break
				} catch {
					// try next source
				}
			}

			if (!loaded && !disposed) {
				buildDots(pointOnLandFallback)
			}
		})()

		const arcsGroup = new THREE.Group()
		worldGroup.add(arcsGroup)

		const travelers: { curve: THREE.QuadraticBezierCurve3; dot: THREE.Mesh; speed: number; phase: number }[] = []
		const pulsingRings: { mesh: THREE.Mesh; phase: number }[] = []

		for (let i = 0; i < arcsConfig.length; i += 1) {
			const arc = arcsConfig[i]
			const start = toVector3(arc.startLat, arc.startLng, RADIUS + 0.01)
			const end = toVector3(arc.endLat, arc.endLng, RADIUS + 0.01)
			const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(RADIUS + arc.height)

			const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
			const points = curve.getPoints(90)
			const geometry = new THREE.BufferGeometry().setFromPoints(points)
			const material = new THREE.LineBasicMaterial({
				color: arc.color,
				transparent: true,
				opacity: 0.7,
			})
			const line = new THREE.Line(geometry, material)
			arcsGroup.add(line)

			const dot = new THREE.Mesh(
				new THREE.SphereGeometry(0.019, 10, 10),
				new THREE.MeshBasicMaterial({ color: '#ffffff' })
			)
			arcsGroup.add(dot)

			travelers.push({
				curve,
				dot,
				speed: arc.speed,
				phase: i * 0.22,
			})
		}

		for (let i = 0; i < markerPoints.length; i += 1) {
			const marker = markerPoints[i]
			const p = toVector3(marker.lat, marker.lng, RADIUS + 0.015)
			const normal = p.clone().normalize()

			const core = new THREE.Mesh(
				new THREE.SphereGeometry(0.028, 10, 10),
				new THREE.MeshBasicMaterial({ color: '#f7f9ff' })
			)
			core.position.copy(p)
			arcsGroup.add(core)

			const ring = new THREE.Mesh(
				new THREE.TorusGeometry(0.078, 0.0055, 8, 50),
				new THREE.MeshBasicMaterial({
					color: '#dfe7f6',
					transparent: true,
					opacity: 0.85,
				})
			)
			ring.position.copy(normal.clone().multiplyScalar(RADIUS + 0.02))
			ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
			arcsGroup.add(ring)
			pulsingRings.push({ mesh: ring, phase: i * 0.7 })
		}

		const clock = new THREE.Clock()
		let frameId = 0

		const render = () => {
			const t = clock.getElapsedTime()
			worldGroup.rotation.y += 0.0015

			for (let i = 0; i < travelers.length; i += 1) {
				const traveler = travelers[i]
				const p = (t * traveler.speed + traveler.phase) % 1
				traveler.dot.position.copy(traveler.curve.getPoint(p))
			}

			for (let i = 0; i < pulsingRings.length; i += 1) {
				const pulse = pulsingRings[i]
				const s = 1 + Math.sin(t * 2.2 + pulse.phase) * 0.1
				pulse.mesh.scale.setScalar(s)
			}

			renderer.render(scene, camera)
			frameId = window.requestAnimationFrame(render)
		}

		render()

		const onResize = () => {
			const width = host.clientWidth
			const height = host.clientHeight
			camera.aspect = width / height
			camera.updateProjectionMatrix()
			renderer.setSize(width, height)
		}
		window.addEventListener('resize', onResize)

		return () => {
			disposed = true
			window.removeEventListener('resize', onResize)
			window.cancelAnimationFrame(frameId)
			renderer.dispose()
			scene.traverse(object => {
				const target = object as { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }
				if (target.geometry) target.geometry.dispose()
				if (target.material) {
					if (Array.isArray(target.material)) {
						target.material.forEach(material => material.dispose())
					} else {
						target.material.dispose()
					}
				}
			})
			host.removeChild(renderer.domElement)
		}
	}, [])

	return (
		<section className={styles.section}>
			<div className='container'>
				<div className={styles.wrap}>
					<div className={styles.left}>
						<div ref={mountRef} className={styles.canvasHost} />
					</div>
					<div className={styles.form}>
						<ContactForm />
					</div>
				</div>
			</div>
		</section>
	)
}

export default GlobeSection
