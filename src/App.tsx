import { useEffect, useState } from 'react'
import AboutSection from './components/AboutSection/AboutSection'
import HeroSection from './components/HeroSection/HeroSection'
import IntroOverlay from './components/IntroOverlay/IntroOverlay'
import MainSection from './components/MainSection/MainSection'
import MoonContactSection from './components/MoonContactSection/MoonContactSection'
import Layout from './Layout'

const App = () => {
	const [showIntro, setShowIntro] = useState(true)

	useEffect(() => {
		document.documentElement.classList.add('dark')
		window.localStorage.setItem('theme', 'dark')
	}, [])

	return (
		<>
			{showIntro ? <IntroOverlay onComplete={() => setShowIntro(false)} /> : null}
			{!showIntro ? (
				<Layout>
					<HeroSection />
					<MainSection />
					<AboutSection />
					<MoonContactSection />
				</Layout>
			) : null}
		</>
	)
}

export default App
