import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'

type NavigationDialogsProps = {
	listClassName?: string
	itemClassName?: string
	triggerClassName?: string
}

const NavigationDialogs = ({
	listClassName,
	itemClassName,
	triggerClassName,
}: NavigationDialogsProps) => {
	const { t } = useTranslation()

	return (
		<ul className={listClassName}>
			<li className={itemClassName}>
				<Dialog>
					<DialogTrigger asChild>
						<button type='button' className={triggerClassName}>{t('navigation.about')}</button>
					</DialogTrigger>
					<DialogContent className='max-w-xl bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-6'>
						<DialogHeader>
							<DialogTitle>{t('modals.about.title')}</DialogTitle>
							<DialogDescription>
								{t('modals.about.description')}
							</DialogDescription>
						</DialogHeader>

						<div className='dialogBody'>
							<p>{t('modals.about.p1')}</p>
							<p>{t('modals.about.p2')}</p>
							<p>{t('modals.about.p3')}</p>
						</div>
					</DialogContent>
				</Dialog>
			</li>

			<li className={itemClassName}>
				<Dialog>
					<DialogTrigger asChild>
						<button type='button' className={triggerClassName}>{t('navigation.support')}</button>
					</DialogTrigger>
					<DialogContent className='max-w-xl bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-6'>
						<DialogHeader>
							<DialogTitle>{t('modals.support.title')}</DialogTitle>
							<DialogDescription>
								{t('modals.support.description')}
							</DialogDescription>
						</DialogHeader>

						<div className='dialogBody'>
							<p>
								<span className='dialogSectionTitle'>{t('modals.support.emailLabel')}</span>
								<a
									href='mailto:aetherisintelligencestudio@gmail.com'
									className='dialogEmail'
								>
									aetherisintelligencestudio@gmail.com
								</a>
							</p>
							<p>{t('modals.support.response')}</p>
							<p>{t('modals.support.request')}</p>
						</div>
					</DialogContent>
				</Dialog>
			</li>

			<li className={itemClassName}>
				<Dialog>
					<DialogTrigger asChild>
						<button type='button' className={triggerClassName}>{t('navigation.terms')}</button>
					</DialogTrigger>
					<DialogContent className='max-w-xl bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-6'>
						<DialogHeader>
							<DialogTitle>{t('modals.terms.title')}</DialogTitle>
							<DialogDescription>
								{t('modals.terms.acceptanceTitle')}
							</DialogDescription>
						</DialogHeader>

						<div className='dialogBody'>
							<p>{t('modals.terms.acceptanceText')}</p>
							<p>
								<span className='dialogSectionTitle'>{t('modals.terms.useTitle')}</span>
								{t('modals.terms.useText')}
							</p>
							<p>
								<span className='dialogSectionTitle'>{t('modals.terms.ipTitle')}</span>
								{t('modals.terms.ipText')}
							</p>
							<p>
								<span className='dialogSectionTitle'>{t('modals.terms.liabilityTitle')}</span>
								{t('modals.terms.liabilityText')}
							</p>
							<p>
								<span className='dialogSectionTitle'>{t('modals.terms.changesTitle')}</span>
								{t('modals.terms.changesText')}
							</p>
							<p>
								<span className='dialogSectionTitle'>{t('modals.terms.contactTitle')}</span>
								{t('modals.terms.contactText')}{' '}
								<a
									href='mailto:aetherisintelligencestudio@gmail.com'
									className='dialogEmail'
								>
									aetherisintelligencestudio@gmail.com
								</a>
							</p>
						</div>
					</DialogContent>
				</Dialog>
			</li>
		</ul>
	)
}

export default NavigationDialogs
