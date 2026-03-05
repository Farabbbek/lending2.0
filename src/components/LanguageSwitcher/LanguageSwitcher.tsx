import { useTranslation } from 'react-i18next'
import styles from './LanguageSwitcher.module.css'

const languages = [
	{ code: 'en', label: 'EN' },
	{ code: 'ru', label: 'RU' },
	{ code: 'kz', label: 'KZ' },
	{ code: 'es', label: 'ES' },
	{ code: 'fr', label: 'FR' },
	{ code: 'ar', label: 'AR' },
	{ code: 'zh', label: 'ZH' },
] as const

const LanguageSwitcher = () => {
	const { i18n, t } = useTranslation()

	return (
		<div className={styles.switcher}>
			<select
				className={styles.select}
				value={i18n.language}
				onChange={(event) => {
					void i18n.changeLanguage(event.target.value)
				}}
				aria-label={t('navigation.language')}
				title={t('navigation.language')}
			>
				{languages.map((language) => (
					<option key={language.code} value={language.code}>
						{language.label}
					</option>
				))}
			</select>
			<span className={styles.chevron} aria-hidden='true'>
				▼
			</span>
		</div>
	)
}

export default LanguageSwitcher
