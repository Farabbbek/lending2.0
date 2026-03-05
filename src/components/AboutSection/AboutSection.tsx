import AboutCard from '../AboutCard/AboutCard'
import styles from './AboutSection.module.css'
import { useTranslation } from 'react-i18next'
import BotIcon from '../../assets/bot.svg'
import ChartIcon from '../../assets/chart-spline.svg'
import MonitorIcon from '../../assets/monitor.svg'
import SmartphoneIcon from '../../assets/smartphone.svg'
import type { AboutCardType } from '../../types'

const AboutSection = () => {
	const { t } = useTranslation()
	const icons = [ChartIcon, BotIcon, MonitorIcon, SmartphoneIcon]
	const aboutCards: AboutCardType[] = [0, 1, 2, 3].map((index) => ({
		title: t(`about.cards.${index}.title`),
		texts: [0, 1, 2, 3, 4, 5].map((textIndex) => t(`about.cards.${index}.texts.${textIndex}`)),
		logo: icons[index],
	}))

	return (
		<section className={`${styles.aboutSection} container`} id='about'>
			<div className={styles.grid}>
				{aboutCards.map((card, idx) => (
					<AboutCard key={idx} {...card} />
				))}
			</div>
		</section>
	)
}

export default AboutSection
