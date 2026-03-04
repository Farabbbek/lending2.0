const fs = require('fs')
const path = require('path')

const envPath = path.resolve(__dirname, '..', '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found')
  process.exit(2)
}
const content = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '')
const env = content.split(/\r?\n/).reduce((acc, line) => {
  const m = line.match(/^([^=]+)=(.*)$/)
  if (m) acc[m[1]] = m[2]
  return acc
}, {})

const token = env.TG_TOKEN
const chat = env.TG_CHAT_ID
if (!token || !chat) {
  console.error('TG_TOKEN or TG_CHAT_ID missing in .env.local')
  process.exit(2)
}

const body = { chat_id: chat, text: 'Aetheris dev test: contact form integration — node cjs script' }

(async () => {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    fs.writeFileSync(path.resolve(__dirname, '..', 'telegram-test-response.json'), JSON.stringify(json, null, 2), 'utf8')
    console.log('SAVED: telegram-test-response.json')
    console.log(JSON.stringify(json))
  } catch (err) {
    console.error('ERROR', err)
    process.exit(3)
  }
})()
