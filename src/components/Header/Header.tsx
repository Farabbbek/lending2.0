import styles from './Header.module.css'
import logo from '../../assets/logo32.svg'
import { links } from '../../routes/links'

const Header = () => {
	return (
		<header className={styles.header}>
			<div className={`${styles.content} container`}>
				   <a href='#' className={styles.homeLink}>
					   <img src={logo} alt='logo' className={styles.logo} />
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
		</header>
	)
}

export default Header
