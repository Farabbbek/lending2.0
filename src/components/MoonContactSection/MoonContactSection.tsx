import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import styles from './MoonContactSection.module.css'
import ContactForm from '../ContactForm/ContactForm'

const LazyMoonScene = lazy(() => import('../MoonScene'))

const MoonContactSection = () => {
    const sectionRef = useRef<HTMLElement | null>(null)
    const [shouldLoadMoon, setShouldLoadMoon] = useState(false)

    useEffect(() => {
        const target = sectionRef.current
        if (!target) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setShouldLoadMoon(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.15, rootMargin: '200px' }
        )

        observer.observe(target)
        return () => observer.disconnect()
    }, [])

    return (
        <section className={styles.section} id="contact" ref={sectionRef}>
            <div className='container'>
                <div className={styles.wrap}>
                    <div className={styles.left}>
                        <div className={styles.canvasHost}>
                            {shouldLoadMoon ? (
                                <Suspense fallback={<div className={styles.moonPreview} aria-hidden='true' />}>
                                    <LazyMoonScene />
                                </Suspense>
                            ) : (
                                <div className={styles.moonPreview} aria-hidden='true' />
                            )}
                        </div>
                    </div>
                    <div className={styles.form}>
                        <ContactForm />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default MoonContactSection
