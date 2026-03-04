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
console.log('TG_TOKEN_LEN=' + (env.TG_TOKEN ? env.TG_TOKEN.length : 'MISSING'))
console.log('TG_CHAT_ID_LEN=' + (env.TG_CHAT_ID ? env.TG_CHAT_ID.length : 'MISSING'))
console.log('TG_TOKEN_PREVIEW=' + (env.TG_TOKEN ? env.TG_TOKEN.slice(0,10) : ''))
console.log('TG_CHAT_PREVIEW=' + (env.TG_CHAT_ID ? env.TG_CHAT_ID.slice(0,10) : ''))
