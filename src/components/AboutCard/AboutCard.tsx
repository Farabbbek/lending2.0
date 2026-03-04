import { useRef } from 'react'
import styles from './AboutCard.module.css'

type AboutCardProps = {
	title: string
	texts: string[]
	links?: { href: string; label: string }[]
	logo?: string
}

const AboutCard = ({ title, texts, links, logo }: AboutCardProps) => {
	const cardRef = useRef<HTMLDivElement | null>(null)
	const rectRef = useRef<DOMRect | null>(null)
	const rafRef = useRef<number | null>(null)
	const pointerRef = useRef({ x: 0, y: 0 })

	const applyTilt = () => {
		const card = cardRef.current
		const rect = rectRef.current
		if (!card || !rect) return

		const px = (pointerRef.current.x - rect.left) / rect.width
		const py = (pointerRef.current.y - rect.top) / rect.height

		const rotateY = (px - 0.5) * 12
		const rotateX = (0.5 - py) * 12
		const innerRotateY = rotateY * 0.8
		const innerRotateX = rotateX * 0.8
		const moveX = (px - 0.5) * 26
		const moveY = (py - 0.5) * 20

		card.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`)
		card.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`)
		card.style.setProperty('--irx', `${innerRotateX.toFixed(2)}deg`)
		card.style.setProperty('--iry', `${innerRotateY.toFixed(2)}deg`)
		card.style.setProperty('--mx', `${moveX.toFixed(2)}px`)
		card.style.setProperty('--my', `${moveY.toFixed(2)}px`)
		card.style.setProperty('--tz', '20px')

		rafRef.current = null
	}

	const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
		if (!rectRef.current) return
		pointerRef.current.x = event.clientX
		pointerRef.current.y = event.clientY
		if (rafRef.current !== null) return
		rafRef.current = window.requestAnimationFrame(applyTilt)
	}

	const handleMouseEnter = () => {
		const card = cardRef.current
		if (!card) return
		rectRef.current = card.getBoundingClientRect()
	}

	const handleMouseLeave = () => {
		const card = cardRef.current
		if (!card) return

		rectRef.current = null
		if (rafRef.current !== null) {
			window.cancelAnimationFrame(rafRef.current)
			rafRef.current = null
		}

		card.style.setProperty('--rx', '0deg')
		card.style.setProperty('--ry', '0deg')
		card.style.setProperty('--irx', '0deg')
		card.style.setProperty('--iry', '0deg')
		card.style.setProperty('--mx', '0px')
		card.style.setProperty('--my', '0px')
		card.style.setProperty('--tz', '0px')
	}

	return (
		<div
			ref={cardRef}
			className={styles.content}
			onMouseEnter={handleMouseEnter}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			<div className={styles.header}>
				<img src={logo} alt='logoAboutCard' loading='lazy' decoding='async' />
				<span className={styles.title}>{title}</span>
			</div>
			<div className={styles.description}>
				{texts.map((text, i) => (
					<p key={i} className={styles.text}>
						{text}
					</p>
				))}

				{links?.map((link, i) => (
					<a key={i} target='_blank' href={link.href} className={styles.link}>
						{link.label}
					</a>
				))}
			</div>
		</div>
	)
}

export default AboutCard
