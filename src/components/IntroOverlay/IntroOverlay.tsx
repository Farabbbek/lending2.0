import { useEffect, useMemo, useState } from 'react'
import styles from './IntroOverlay.module.css'

type IntroOverlayProps = {
	onComplete: () => void
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*'
const TARGET_TEXT = 'WELCOME TO AETHERIS'
const REVEAL_DELAY_MS = 55
const HOLD_AFTER_REVEAL_MS = 600
const FADE_OUT_MS = 420

const IntroOverlay = ({ onComplete }: IntroOverlayProps) => {
	const chars = useMemo(() => TARGET_TEXT.split(''), [])
	const [revealedCount, setRevealedCount] = useState(0)
	const [tick, setTick] = useState(0)
	const [isFadingOut, setIsFadingOut] = useState(false)

	useEffect(() => {
		const revealTimer = window.setInterval(() => {
			setRevealedCount(prev => {
				if (prev >= chars.length) {
					window.clearInterval(revealTimer)
					return prev
				}
				return prev + 1
			})
			setTick(prev => prev + 1)
		}, REVEAL_DELAY_MS)

		return () => window.clearInterval(revealTimer)
	}, [chars.length])

	useEffect(() => {
		if (revealedCount < chars.length) return

		const holdTimer = window.setTimeout(() => {
			setIsFadingOut(true)
		}, HOLD_AFTER_REVEAL_MS)

		return () => window.clearTimeout(holdTimer)
	}, [revealedCount, chars.length])

	useEffect(() => {
		if (!isFadingOut) return
		const endTimer = window.setTimeout(onComplete, FADE_OUT_MS)
		return () => window.clearTimeout(endTimer)
	}, [isFadingOut, onComplete])

	useEffect(() => {
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = previousOverflow
		}
	}, [])

	return (
		<div className={`${styles.overlay} ${isFadingOut ? styles.fadeOut : ''}`}>
			<div className={styles.center}>
				<p className={styles.text} aria-label={TARGET_TEXT}>
					{chars.map((char, index) => {
						const isSpace = char === ' '
						if (isSpace) return <span key={`sp-${index}`} className={styles.space} />
						if (index < revealedCount) {
							return (
								<span key={`r-${index}`} className={styles.revealed}>
									{char}
								</span>
							)
						}
						const glyph = GLYPHS[(tick + index * 7) % GLYPHS.length]
						return (
							<span key={`e-${index}`} className={styles.encrypted}>
								{glyph}
							</span>
						)
					})}
				</p>
				<p className={styles.sub}>initializing systems...</p>
			</div>
		</div>
	)
}

export default IntroOverlay
