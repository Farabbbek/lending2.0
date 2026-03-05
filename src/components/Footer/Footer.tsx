import styles from './Footer.module.css'
import logo from '../../assets/logo64.svg'
import NavigationDialogs from '../NavigationDialogs/NavigationDialogs'

const Footer = () => {
	return (
		<footer className={styles.footer}>
			<div className={`${styles.content} container`}>
				<div className={styles.top}>
					<a href='#' className={styles.logoLink}>
						<img src={logo} alt='logo' className={styles.logo} loading='lazy' decoding='async' />
					</a>

					<nav className={styles.nav}>
						<NavigationDialogs
							itemClassName={styles.link}
							triggerClassName={styles.navTrigger}
						/>
					</nav>
				</div>

				{/* <div className={styles.copy}>&copy; 2025 Aetheris</div> */}
			</div>
		</footer>
	)
}

export default Footer
