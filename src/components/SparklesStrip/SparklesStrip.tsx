import { useEffect, useRef } from 'react'
import styles from './SparklesStrip.module.css'

type Particle = {
	x: number
	y: number
	size: number
	speedX: number
	speedY: number
	alpha: number
}

const PARTICLE_COUNT = 180

const SparklesStrip = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const context = canvas.getContext('2d')
		if (!context) return

		let rafId = 0
		const dpr = Math.min(window.devicePixelRatio || 1, 2)

		const particles: Particle[] = []

		const createParticle = (width: number, height: number): Particle => ({
			x: Math.random() * width,
			y: Math.random() * height,
			size: 0.4 + Math.random() * 1.2,
			speedX: (Math.random() - 0.5) * 0.15,
			speedY: (Math.random() - 0.5) * 0.1,
			alpha: 0.3 + Math.random() * 0.7,
		})

		const resize = () => {
			const rect = canvas.getBoundingClientRect()
			canvas.width = Math.max(1, Math.floor(rect.width * dpr))
			canvas.height = Math.max(1, Math.floor(rect.height * dpr))
			context.setTransform(dpr, 0, 0, dpr, 0, 0)

			const width = rect.width
			const height = rect.height

			particles.length = 0
			for (let i = 0; i < PARTICLE_COUNT; i += 1) {
				particles.push(createParticle(width, height))
			}
		}

		const draw = () => {
			const rect = canvas.getBoundingClientRect()
			const width = rect.width
			const height = rect.height

			context.clearRect(0, 0, width, height)

			for (let i = 0; i < particles.length; i += 1) {
				const p = particles[i]
				p.x += p.speedX
				p.y += p.speedY

				if (p.x < 0) p.x = width
				if (p.x > width) p.x = 0
				if (p.y < 0) p.y = height
				if (p.y > height) p.y = 0

				context.beginPath()
				context.fillStyle = `rgba(255, 255, 255, ${p.alpha})`
				context.arc(p.x, p.y, p.size, 0, Math.PI * 2)
				context.fill()
			}

			rafId = window.requestAnimationFrame(draw)
		}

		const observer = new ResizeObserver(resize)
		observer.observe(canvas)
		resize()
		draw()

		return () => {
			window.cancelAnimationFrame(rafId)
			observer.disconnect()
		}
	}, [])

	return (
		<div className={styles.root} aria-hidden='true'>
			<div className={styles.lineWide} />
			<div className={styles.lineThin} />
			<div className={styles.lineAccentWide} />
			<div className={styles.lineAccentThin} />
			<canvas ref={canvasRef} className={styles.canvas} />
		</div>
	)
}

export default SparklesStrip
