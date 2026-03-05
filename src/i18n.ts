import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import kz from './locales/kz.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'

const STORAGE_KEY = 'language'
const supportedLanguages = ['en', 'ru', 'kz', 'es', 'fr', 'ar', 'zh'] as const

const getInitialLanguage = () => {
	if (typeof window === 'undefined') return 'en'
	const saved = window.localStorage.getItem(STORAGE_KEY)
	return saved && supportedLanguages.includes(saved as (typeof supportedLanguages)[number]) ? saved : 'en'
}

void i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		ru: { translation: ru },
		kz: { translation: kz },
		es: { translation: es },
		fr: { translation: fr },
		ar: { translation: ar },
		zh: { translation: zh },
	},
	lng: getInitialLanguage(),
	fallbackLng: 'en',
	interpolation: {
		escapeValue: false,
	},
})

if (typeof window !== 'undefined') {
	const applyDocumentLanguage = (language: string) => {
		document.documentElement.lang = language
		document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
	}

	applyDocumentLanguage(i18n.language)
	i18n.on('languageChanged', (language) => {
		window.localStorage.setItem(STORAGE_KEY, language)
		applyDocumentLanguage(language)
	})
}

export default i18n
