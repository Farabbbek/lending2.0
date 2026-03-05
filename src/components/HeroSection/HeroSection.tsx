import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './HeroSection.module.css'

const LazyThreeHeroCanvas = lazy(() => import('./ThreeHeroCanvas.tsx'))

const canUseWebGL = () => {
	try {
		const canvas = document.createElement('canvas')
		return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
	} catch {
		return false
	}
}

const isUltraLowTierDevice = () => {
	const nav = navigator as Navigator & {
		deviceMemory?: number
		connection?: { saveData?: boolean }
	}
	const cores = nav.hardwareConcurrency ?? 8
	const memory = nav.deviceMemory ?? 8
	const saveData = Boolean(nav.connection?.saveData)
	return cores <= 2 || memory <= 2 || saveData
}

const HeroSection = () => {
	const { t } = useTranslation()
	const sectionRef = useRef<HTMLElement | null>(null)
	const idleHandleRef = useRef<number | null>(null)
	const timeoutHandleRef = useRef<number | null>(null)
	const [isVisible, setIsVisible] = useState(false)
	const [interacted, setInteracted] = useState(false)
	const [threeFailed, setThreeFailed] = useState(false)
	const [canRender3D, setCanRender3D] = useState(false)
	const [shouldInitThree, setShouldInitThree] = useState(false)
	const [isThreeReady, setIsThreeReady] = useState(false)

	const isMobile = useMemo(() => window.matchMedia?.('(max-width: 768px)').matches ?? false, [])

	useEffect(() => {
		setCanRender3D(canUseWebGL() && !isUltraLowTierDevice())
	}, [])

	useEffect(() => {
		const target = sectionRef.current
		if (!target) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setIsVisible(true)
					observer.disconnect()
				}
			},
			{ threshold: 0.2, rootMargin: '120px' }
		)

		observer.observe(target)
		return () => observer.disconnect()
	}, [])

	useEffect(() => {
		const markInteracted = () => setInteracted(true)
		window.addEventListener('pointerdown', markInteracted, { passive: true, once: true })
		window.addEventListener('touchstart', markInteracted, { passive: true, once: true })
		window.addEventListener('keydown', markInteracted, { once: true })
		window.addEventListener('scroll', markInteracted, { passive: true, once: true })

		return () => {
			window.removeEventListener('pointerdown', markInteracted)
			window.removeEventListener('touchstart', markInteracted)
			window.removeEventListener('keydown', markInteracted)
			window.removeEventListener('scroll', markInteracted)
		}
	}, [])

	const shouldLoad3D = canRender3D && (isVisible || interacted) && !threeFailed

	useEffect(() => {
		if (!shouldLoad3D || shouldInitThree) return

		const win = window as Window & {
			requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
			cancelIdleCallback?: (handle: number) => void
		}

		const startThree = () => {
			setShouldInitThree(true)
		}

		if (typeof win.requestIdleCallback === 'function') {
			idleHandleRef.current = win.requestIdleCallback(startThree, { timeout: 900 })
		} else {
			timeoutHandleRef.current = window.setTimeout(startThree, 200)
		}

		return () => {
			if (idleHandleRef.current !== null && typeof win.cancelIdleCallback === 'function') {
				win.cancelIdleCallback(idleHandleRef.current)
				idleHandleRef.current = null
			}
			if (timeoutHandleRef.current !== null) {
				window.clearTimeout(timeoutHandleRef.current)
				timeoutHandleRef.current = null
			}
		}
	}, [shouldLoad3D, shouldInitThree])

	useEffect(() => {
		if (!shouldInitThree || isThreeReady) return
		const failOpenTimer = window.setTimeout(() => {
			setIsThreeReady(true)
		}, 2200)
		return () => {
			window.clearTimeout(failOpenTimer)
		}
	}, [shouldInitThree, isThreeReady])

	return (
		<section className={styles.heroBlock} id='hero' ref={sectionRef}>
			<div className={styles.modelViewport}>
				{/* Lightweight static preview for fast first meaningful paint. */}
				<div
					className={styles.heroPreview}
					aria-hidden='true'
					style={{
						opacity: isThreeReady ? 0 : 1,
						transition: 'opacity 480ms ease',
					}}
				/>
				{shouldInitThree && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							opacity: isThreeReady ? 1 : 0,
							transition: 'opacity 480ms ease',
						}}
					>
						<Suspense fallback={null}>
							<LazyThreeHeroCanvas
								isMobile={isMobile}
								isInView={isVisible}
								onFailure={() => {
									setThreeFailed(true)
									setShouldInitThree(false)
								}}
								onReady={() => setIsThreeReady(true)}
							/>
						</Suspense>
					</div>
				)}
				{/* Fail-safe mode if WebGL is unavailable or context is lost. */}
				{(!canRender3D || threeFailed) && <div className={styles.heroFallbackNote}>{t('hero.staticMode')}</div>}
				<div className={styles.modelTriggerMaskLeft} aria-hidden='true' />
				<div className={styles.modelTriggerMaskBottom} aria-hidden='true' />
			</div>
			<div className='container'>
				<div className={styles.content}>
					<div className={styles.heroSection}>
						<h1 className={styles.title}>
							Aetheris,
							<br />
							<span className={styles.titleAccent}>{t('hero.titleAccent')}</span>
						</h1>

						<p className={styles.subtitle}>{t('hero.subtitle')}</p>

						<div className={styles.ctaSection}>
							<p className={styles.ctaText} aria-hidden='true'>
								&nbsp;
							</p>
						</div>

						<div className={styles.buttons}>
							<a href='#about' className={`${styles.btn} ${styles.btnPrimary}`}>
								{t('hero.getStarted')}
								<svg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
									<path
										d='M6 1L6 11M6 11L11 6M6 11L1 6'
										stroke='currentColor'
										strokeWidth='1.5'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								</svg>
							</a>
						</div>
					</div>
				</div>

				<div className={styles.coordinates} aria-hidden='true' />
			</div>
		</section>
	)
}

export default HeroSection
