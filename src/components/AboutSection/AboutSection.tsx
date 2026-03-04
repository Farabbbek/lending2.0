import AboutCard from '../AboutCard/AboutCard'
import styles from './AboutSection.module.css'
import BotIcon from '../../assets/bot.svg'
import ChartIcon from '../../assets/chart-spline.svg'
import MonitorIcon from '../../assets/monitor.svg'
import SmartphoneIcon from '../../assets/smartphone.svg'
import type { AboutCardType } from '../../types'

const aboutCards: AboutCardType[] = [
	{
		title: 'Автоматизация бизнеса',
		texts: [
			'Автоматизируем ключевые процессы компании - от обработки заявок до внутренних операций.',
			'Автоматическая обработка лидов и заявок',
			'Внедрение CRM и workflow-систем',
			'AI-ассистенты для бизнеса',
			'Сокращение ручной работы сотрудников',
			'Оптимизация процессов и нагрузки команды',
		],
		logo: ChartIcon,
	},
	{
		title: 'Клиентские коммуникации',
		texts: [
			'Создаём системы общения с клиентами, которые работают автоматически 24/7.',
			'WhatsApp, Telegram и web-чаты',
			'Умные чат-боты и AI-операторы',
			'Автоматические воронки продаж',
			'Уведомления и follow-up сообщения',
			'Системы поддержки клиентов',
		],
		logo: BotIcon,
	},
	{
		title: 'Веб-платформы и лендинги',
		texts: [
			'Разработка современных веб-решений как части единой бизнес-системы.',
			'Продающие лендинги',
			'Корпоративные сайты',
			'Веб-приложения',
			'Личные кабинеты и админ-панели',
			'Интеграции с сервисами и CRM',
		],
		logo: MonitorIcon,
	},
	{
		title: 'Интеграции и AI-решения',
		texts: [
			'Объединяем сервисы, данные и искусственный интеллект в единую инфраструктуру бизнеса.',
			'API и системные интеграции',
			'AI-автоматизация процессов',
			'Аналитические панели и отчётность',
			'Синхронизация платформ и сервисов',
			'Кастомные технические решения',
		],
		logo: SmartphoneIcon,
	},
]

const AboutSection = () => {
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
