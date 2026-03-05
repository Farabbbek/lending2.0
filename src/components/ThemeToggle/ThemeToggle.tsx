import { useEffect, useState } from 'react'
import styles from './ThemeToggle.module.css'

const THEME_STORAGE_KEY = 'theme'

type Theme = 'light' | 'dark'

const getInitialTheme = (): Theme => {
	if (typeof window === 'undefined') return 'light'
	const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
	return savedTheme === 'dark' ? 'dark' : 'light'
}

const ThemeToggle = () => {
	const [theme, setTheme] = useState<Theme>(getInitialTheme)

	useEffect(() => {
		const root = document.documentElement
		root.classList.toggle('dark', theme === 'dark')
		window.localStorage.setItem(THEME_STORAGE_KEY, theme)
	}, [theme])

	return (
		<label className={styles.themeToggle} aria-label='Toggle dark mode'>
			<span className={styles.themeLabel}>Theme</span>
			<input
				type='checkbox'
				className='theme-checkbox'
				checked={theme === 'dark'}
				onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
				aria-label='Dark mode'
			/>
		</label>
	)
}

export default ThemeToggle
