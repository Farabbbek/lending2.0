import Logo from '../Logo/Logo'
import Button from '../ui/Button/Button'
import styles from './MainSection.module.css'

const MainSection = () => {
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
							<p className={styles.text}>Интеллектуальные digital-инструменты для современного бизнеса</p>
						</div>
						<div className={styles.subtitle}>
							<span>Интеллект</span>
							<span>Эстетика</span>
							<span>Технологии</span>
						</div>
						<Button size='lg' variant='hoverBorder'>
							Начать проект с Aetheris
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}

export default MainSection
