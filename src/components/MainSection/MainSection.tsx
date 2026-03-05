import Logo from '../Logo/Logo'
import Button from '../ui/Button/Button'
import { useTranslation } from 'react-i18next'
import styles from './MainSection.module.css'

const MainSection = () => {
	const { t } = useTranslation()

	const scrollToContact = () => {
		const section = document.getElementById('contact')
		if (!section) return

		const headerOffset = 84
		const top = section.getBoundingClientRect().top + window.scrollY - headerOffset
		window.scrollTo({ top, behavior: 'smooth' })
	}

	return (
		<section className={styles.mainSection} id='home'>
			<div className='container'>
				<div className={styles.content}>
					<div className={styles.left}>
						<div className={styles.header}>
							   <div className={styles.mainLogo}>
								   <Logo />
							   </div>
							<h1 className={styles.title}>Aetheris</h1>
							<div className={styles.lightLine} aria-hidden='true' />
							<p className={styles.text}>{t('main.tagline')}</p>
						</div>
						<div className={styles.subtitle}>
							<span>{t('main.pillars.0')}</span>
							<span>{t('main.pillars.1')}</span>
							<span>{t('main.pillars.2')}</span>
						</div>
						<Button size='lg' variant='hoverBorder' onClick={scrollToContact}>
							{t('main.cta')}
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}

export default MainSection
