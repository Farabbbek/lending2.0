import styles from './Header.module.css'
import logo from '../../assets/logo32.svg'
import NavigationDialogs from '../NavigationDialogs/NavigationDialogs'
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher'

const Header = () => {
	return (
		<header className={styles.header}>
			<div className={`${styles.content} container`}>
				   <a href='#' className={styles.homeLink}>
					   <img src={logo} alt='logo' className={styles.logo} />
				   </a>

				<div className={styles.controls}>
					<nav className={styles.nav}>
						<NavigationDialogs
							itemClassName={styles.link}
							triggerClassName={styles.navTrigger}
						/>
					</nav>
					<LanguageSwitcher />
				</div>

			</div>
		</header>
	)
}

export default Header
