import styles from './Footer.module.css'
import logo from '../../assets/logo64.svg'
import { links } from '../../routes/links'

const Footer = () => {
	return (
		<footer className={styles.footer}>
			<div className={`${styles.content} container`}>
				<div className={styles.top}>
					<a href='#' className={styles.logoLink}>
						<img src={logo} alt='logo' className={styles.logo} loading='lazy' decoding='async' />
					</a>

					<nav className={styles.nav}>
						<ul>
							{links.map((link, i) => (
								<li className={styles.link} key={i}>
									<a href={link.href}>{link.label}</a>
								</li>
							))}
						</ul>
					</nav>
				</div>

				{/* <div className={styles.copy}>&copy; 2025 Aetheris</div> */}
			</div>
		</footer>
	)
}

export default Footer
