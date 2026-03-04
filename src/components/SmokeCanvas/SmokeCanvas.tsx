import { useEffect, useRef } from 'react'

type Star = {
	x: number
	y: number
	size: number
	speedX: number
	speedY: number
	alpha: number
	twinkle: number
}

type SmokeCanvasProps = {
	fixed?: boolean
	zIndex?: number
	className?: string
}

const DENSITY_PER_PIXEL = 0.00008
const MIN_STARS = 90
const MAX_STARS = 220
const TARGET_FPS = 45

const SmokeCanvas = ({ fixed = true, zIndex = 1, className }: SmokeCanvasProps) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		let animationId = 0
		let stars: Star[] = []
		let width = 0
		let height = 0
		let dpr = 1
		let resizeRaf = 0
		let lastFrameTime = 0

		const createStar = (spawnAnywhere = true): Star => {
			const x = spawnAnywhere ? Math.random() * width : -8
			const y = spawnAnywhere ? Math.random() * height : Math.random() * height
			return {
				x,
				y,
				size: 0.4 + Math.random() * 1.6,
				speedX: 0.06 + Math.random() * 0.22,
				speedY: -0.03 + Math.random() * 0.06,
				alpha: 0.25 + Math.random() * 0.65,
				twinkle: 0.004 + Math.random() * 0.012,
			}
		}

		const resize = () => {
			const rect = canvas.getBoundingClientRect()
			width = rect.width
			height = rect.height
			dpr = Math.min(window.devicePixelRatio || 1, 1.25)

			canvas.width = Math.max(1, Math.floor(width * dpr))
			canvas.height = Math.max(1, Math.floor(height * dpr))
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

			const nextCount = Math.min(MAX_STARS, Math.max(MIN_STARS, Math.floor(width * height * DENSITY_PER_PIXEL)))
			stars = Array.from({ length: nextCount }, () => createStar(true))
		}

		const scheduleResize = () => {
			if (resizeRaf) return
			resizeRaf = window.requestAnimationFrame(() => {
				resizeRaf = 0
				resize()
			})
		}

		const draw = (time: number) => {
			if (time - lastFrameTime < 1000 / TARGET_FPS) {
				animationId = window.requestAnimationFrame(draw)
				return
			}
			lastFrameTime = time

			ctx.clearRect(0, 0, width, height)

			for (let i = 0; i < stars.length; i += 1) {
				const star = stars[i]

				star.x += star.speedX
				star.y += star.speedY
				star.alpha += star.twinkle

				if (star.alpha >= 1 || star.alpha <= 0.15) {
					star.twinkle *= -1
				}

				if (star.x > width + 8 || star.y < -8 || star.y > height + 8) {
					stars[i] = createStar(false)
					continue
				}

				ctx.beginPath()
				ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
				ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`
				ctx.fill()
			}

			animationId = window.requestAnimationFrame(draw)
		}

		resize()
		animationId = window.requestAnimationFrame(draw)

		window.addEventListener('resize', scheduleResize, { passive: true })
		return () => {
			window.cancelAnimationFrame(animationId)
			if (resizeRaf) window.cancelAnimationFrame(resizeRaf)
			window.removeEventListener('resize', scheduleResize)
		}
	}, [])

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{
				position: fixed ? 'fixed' : 'absolute',
				top: 0,
				left: 0,
				width: fixed ? '100vw' : '100%',
				height: fixed ? '100vh' : '100%',
				zIndex,
				pointerEvents: 'none',
			}}
		/>
	)
}

export default SmokeCanvas
