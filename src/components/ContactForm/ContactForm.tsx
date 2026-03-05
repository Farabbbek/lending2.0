import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './ContactForm.module.css'

const SUPPORT_EMAIL = 'aetherisintelligencestudio@gmail.com'

const ContactForm: React.FC = () => {
	const { t } = useTranslation()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'fallback'>('idle')
  const [fallbackHref, setFallbackHref] = useState('')
  const [fallbackGmailHref, setFallbackGmailHref] = useState('')
  const [copied, setCopied] = useState(false)

  const buildMailtoHref = () => {
    const subject = encodeURIComponent(`Aetheris contact request: ${name || 'No name'}`)
    const body = encodeURIComponent([
      `Name: ${name || '-'}`,
      `Contact: ${contact || '-'}`,
      '',
      'Message:',
      message || '-',
    ].join('\n'))
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
  }

  const buildGmailHref = () => {
    const subject = encodeURIComponent(`Aetheris contact request: ${name || 'No name'}`)
    const body = encodeURIComponent([
      `Name: ${name || '-'}`,
      `Contact: ${contact || '-'}`,
      '',
      'Message:',
      message || '-',
    ].join('\n'))
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${subject}&body=${body}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setFallbackHref('')
    setFallbackGmailHref('')
    setCopied(false)

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 12000)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, description: message }),
        signal: controller.signal,
      })

      let json: { success?: boolean; error?: string } = {}
      try {
        json = await res.json()
      } catch {
        json = {}
      }

      if (res.ok && json?.success) {
        setStatus('success')
        setName('')
        setContact('')
        setMessage('')
      } else {
        throw new Error(json?.error || 'send_failed')
      }
    } catch {
      const href = buildMailtoHref()
      const gmailHref = buildGmailHref()
      setFallbackHref(href)
      setFallbackGmailHref(gmailHref)
      setStatus('fallback')

      try {
        window.location.href = href
      } catch {
        // no-op: user can use fallback actions below
      }
    } finally {
      window.clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h3 className={styles.title}>{t('contactForm.title')}</h3>

        <label className={styles.label}>
          {t('contactForm.nameLabel')}
          <input
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder={t('contactForm.namePlaceholder')}
          />
        </label>

        <label className={styles.label}>
          {t('contactForm.contactLabel')}
          <input
            className={styles.input}
            value={contact}
            onChange={e => setContact(e.target.value)}
            required
            placeholder={t('contactForm.contactPlaceholder')}
          />
        </label>

        <label className={styles.label}>
          {t('contactForm.messageLabel')}
          <textarea
            className={styles.textarea}
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            placeholder={t('contactForm.messagePlaceholder')}
            rows={6}
          />
        </label>

        <div className={styles.actions}>
          <button className={styles.button} type='submit' disabled={loading}>
            {loading ? t('contactForm.sending') : t('contactForm.submit')}
          </button>
        </div>

        {status === 'success' && <div className={styles.success}>{t('contactForm.success')}</div>}
        {status === 'error' && <div className={styles.error}>{t('contactForm.error')}</div>}
        {status === 'fallback' && (
          <div className={styles.error}>
            <p>{t('contactForm.fallback')}</p>
            <div className={styles.fallbackActions}>
              <a href={fallbackHref} className={styles.fallbackLink}>
                {t('contactForm.fallbackAction')}
              </a>
              <a href={fallbackGmailHref} target='_blank' rel='noreferrer' className={styles.fallbackLink}>
                {t('contactForm.fallbackGmail')}
              </a>
              <button
                type='button'
                className={styles.fallbackCopyButton}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(SUPPORT_EMAIL)
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1800)
                  } catch {
                    setCopied(false)
                  }
                }}
              >
                {copied ? t('contactForm.fallbackCopied') : t('contactForm.fallbackCopy')}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default ContactForm
