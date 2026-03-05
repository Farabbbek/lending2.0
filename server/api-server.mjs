import { createServer } from 'http'
import fs from 'fs'
import path from 'path'

const readEnv = () => {
  const p = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return {}
  const content = fs.readFileSync(p, 'utf8').replace(/^[\uFEFF]/, '')
  return content.split(/\r?\n/).reduce((acc, line) => {
    const m = line.match(/^([^=]+)=(.*)$/)
    if (m) acc[m[1]] = m[2]
    return acc
  }, {})
}

const env = readEnv()
const TG_TOKEN = env.TG_TOKEN
const TG_CHAT_ID = env.TG_CHAT_ID

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' })
    res.end()
    return
  }

  if (req.url === '/api/contact' && req.method === 'POST') {
    try {
      let body = ''
      for await (const chunk of req) body += chunk
      const data = JSON.parse(body || '{}')
      const { name, contact, description } = data
      if (!name || !contact) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, error: 'missing_fields' }))
        return
      }

      if (!TG_TOKEN || !TG_CHAT_ID) {
        const line = `[${new Date().toISOString()}] DEV CONTACT | name=${name} | contact=${contact} | message=${description || ''}\n`
        fs.appendFileSync(path.resolve(process.cwd(), 'dev-output.txt'), line, 'utf8')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, mode: 'local-log' }))
        return
      }

      const text = `New contact from site:\nName: ${name}\nContact: ${contact}\nMessage: ${description || ''}`
      const resp = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text }),
      })
      const json = await resp.json()
      if (!json.ok) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, error: 'telegram_failed', details: json }))
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: 'server_error', details: String(err) }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ success: false, error: 'not_found' }))
})

const port = 5174
server.listen(port, () => console.log(`API server listening on http://localhost:${port}`))
