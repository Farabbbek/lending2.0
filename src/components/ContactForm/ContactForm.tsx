import React, { useState } from 'react'
import styles from './ContactForm.module.css'

const ContactForm: React.FC = () => {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, description: message }),
      })
      const json = await res.json()
      if (res.ok && json?.success) {
        setStatus('success')
        setName('')
        setContact('')
        setMessage('')
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h3 className={styles.title}>Свяжитесь с нами</h3>

        <label className={styles.label}>
          Имя
          <input
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Ваше имя"
          />
        </label>

        <label className={styles.label}>
          Контакт (email или тел)
          <input
            className={styles.input}
            value={contact}
            onChange={e => setContact(e.target.value)}
            required
            placeholder="email или телефон"
          />
        </label>

        <label className={styles.label}>
          Сообщение
          <textarea
            className={styles.textarea}
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            placeholder="Краткое описание"
            rows={6}
          />
        </label>

        <div className={styles.actions}>
          <button className={styles.button} type='submit' disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>

        {status === 'success' && <div className={styles.success}>Сообщение отправлено — спасибо!</div>}
        {status === 'error' && <div className={styles.error}>Ошибка отправки. Попробуйте позже.</div>}
      </form>
    </div>
  )
}

export default ContactForm
