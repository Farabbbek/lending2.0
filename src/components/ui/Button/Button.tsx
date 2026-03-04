import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'hoverBorder'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = {
	children: ReactNode
	variant?: Variant
	size?: Size
	className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

const Button = ({ children, variant = 'primary', size = 'md', className, ...props }: ButtonProps) => {
	return (
		<button className={clsx(styles.button, styles[variant], styles[size], className)} {...props}>
			<span className={styles.label}>{children}</span>
		</button>
	)
}

export default Button
