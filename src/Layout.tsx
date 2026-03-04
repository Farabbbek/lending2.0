import type { ReactNode } from 'react'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import './Layout.css'
import SmokeCanvas from './components/SmokeCanvas/SmokeCanvas'

type LayoutProps = {
	children?: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
	return (
		<main className='layout'>
			<SmokeCanvas />
			<Header />
			<div className='layoutMain'>{children}</div>

			<Footer />
		</main>
	)
}

export default Layout
