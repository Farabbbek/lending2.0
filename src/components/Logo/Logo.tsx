import { useState, useRef } from 'react'
import styles from './Logo.module.css'

const paths = [
	'M33.1181 3.38462L30.8828 1V63L33.1181 60.6154V3.38462Z',
	'M24.1767 24.846L21.9414 27.2307V58.2306H24.1767V24.846Z',
	'M19.7058 32L17.4705 33.8736V58.2308H19.7058V32Z',
	'M28.647 12.9232L26.4117 15.3077V58.2309H28.647V12.9232Z',
	'M15 43.0714L13 45.6547V58.2436H15V43.0714Z',
	'M37.5883 12.9843L35.353 10.5385V58.2309H37.5883V12.9843Z',
	'M42.0591 22.4614L39.8238 20.0768V58.2307H42.0591V22.4614Z',
	'M46.5292 32L44.2939 29.6154V58.2307H46.5292V32Z',
	'M51 43.9231L48.7647 41.5385V58.2308H51V43.9231Z',
]

const Logo = () => {
	const [activeIndexes, setActiveIndexes] = useState<number[]>([])
	const hoveredSet = useRef(new Set<number>())

	const handleMouseEnter = (index: number) => {
		hoveredSet.current.add(index)
		if (!activeIndexes.includes(index)) {
			setActiveIndexes(prev => [...prev, index])
		}
	}

	const handleMouseLeave = (index: number) => {
		hoveredSet.current.delete(index)

		setTimeout(() => {
			if (!hoveredSet.current.has(index)) {
				setActiveIndexes(prev => prev.filter(i => i !== index))
			}
		}, 300)
	}

	return (
		<svg className={styles.mainLogo} viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<g>
				{paths.map((d, i) => (
					<path
						key={i}
						d={d}
						fill='#d9d9d9'
						style={{
							transform: activeIndexes.includes(i) ? 'translateY(-1px)' : 'translateY(0)',
							transition: 'transform 0.3s ease',
						}}
						onMouseEnter={() => handleMouseEnter(i)}
						onMouseLeave={() => handleMouseLeave(i)}
					/>
				))}
			</g>
		</svg>
	)
}

export default Logo
