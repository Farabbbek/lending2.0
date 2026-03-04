import { readFileSync, readdirSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'

const DIST_DIR = resolve(process.cwd(), 'dist')
const ASSETS_DIR = resolve(DIST_DIR, 'assets')
const INDEX_HTML = resolve(DIST_DIR, 'index.html')

const INITIAL_GZIP_BUDGET = 300 * 1024
const THREE_TOTAL_BUDGET = 700 * 1024

const bytesToKb = (bytes) => (bytes / 1024).toFixed(2)

const fail = (message) => {
  console.error(`\n❌ Bundle budget check failed: ${message}`)
  process.exit(1)
}

const html = readFileSync(INDEX_HTML, 'utf-8')

const startupMatches = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)]
const startupAssets = [...new Set(startupMatches.map((m) => m[1]))]

if (!startupAssets.length) {
  fail('Could not detect startup JS assets from dist/index.html')
}

const rootStartupAssetNames = startupAssets.map((assetPath) => assetPath.replace(/^assets\//, ''))

const resolveStartupGraph = (entryFiles) => {
  const visited = new Set()
  const queue = [...entryFiles]
  const staticImportRegex = /import\s*(?:[^'\"]+from\s*)?[\"']\.\/([^\"']+\.js)[\"']/g

  while (queue.length > 0) {
    const fileName = queue.shift()
    if (!fileName || visited.has(fileName)) continue
    visited.add(fileName)

    const source = readFileSync(resolve(ASSETS_DIR, fileName), 'utf-8')
    const imports = [...source.matchAll(staticImportRegex)]
    for (const match of imports) {
      const importedFile = match[1]
      if (!visited.has(importedFile)) queue.push(importedFile)
    }
  }

  return [...visited]
}

const startupAssetNames = resolveStartupGraph(rootStartupAssetNames)

const startupGzipBytes = startupAssetNames.reduce((sum, fileName) => {
  const fullPath = resolve(ASSETS_DIR, fileName)
  const gz = gzipSync(readFileSync(fullPath)).byteLength
  return sum + gz
}, 0)

if (startupGzipBytes > INITIAL_GZIP_BUDGET) {
  fail(
    `Initial startup JS gzip size is ${bytesToKb(startupGzipBytes)}KB, budget is ${bytesToKb(INITIAL_GZIP_BUDGET)}KB`
  )
}

const blockedStartupPatterns = [
  /^three/i,
  /^threeExamples/i,
  /^threeReact/i,
  /^threePostFX/i,
  /postprocessing/i,
]

const blockedStartupChunk = startupAssetNames.find((name) =>
  blockedStartupPatterns.some((pattern) => pattern.test(name))
)

if (blockedStartupChunk) {
  fail(`Startup HTML references Three-related chunk "${blockedStartupChunk}"`) 
}

for (const startupFile of startupAssetNames) {
  const content = readFileSync(resolve(ASSETS_DIR, startupFile), 'utf-8')
  const hasForbiddenToken =
    content.includes('three/examples') ||
    content.includes('@react-three') ||
    content.includes('postprocessing') ||
    /from["']\.\/three-/i.test(content) ||
    /from["']\.\/threeExamples-/i.test(content) ||
    /from["']\.\/threeReact-/i.test(content) ||
    /from["']\.\/threePostFX-/i.test(content)

  if (hasForbiddenToken) {
    fail(`Startup chunk "${startupFile}" contains Three-related module references`)
  }
}

const assetFiles = readdirSync(ASSETS_DIR)
const threeRelatedFiles = assetFiles.filter(
  (file) =>
    file.endsWith('.js') &&
    (/^three/i.test(file) || /^HeroSceneControls/i.test(file) || /^HeroPostEffects/i.test(file) || /^ThreeHeroCanvas/i.test(file) || /^MoonScene/i.test(file))
)

const threeTotalBytes = threeRelatedFiles.reduce((sum, fileName) => {
  const fullPath = resolve(ASSETS_DIR, fileName)
  return sum + statSync(fullPath).size
}, 0)

const threeTotalGzipBytes = threeRelatedFiles.reduce((sum, fileName) => {
  const fullPath = resolve(ASSETS_DIR, fileName)
  return sum + gzipSync(readFileSync(fullPath)).byteLength
}, 0)

if (threeTotalGzipBytes > THREE_TOTAL_BUDGET) {
  fail(
    `Total Three ecosystem JS gzip size is ${bytesToKb(threeTotalGzipBytes)}KB, budget is ${bytesToKb(THREE_TOTAL_BUDGET)}KB`
  )
}

console.log('\n✅ Bundle budgets passed')
console.log(`- Startup JS (gzip): ${bytesToKb(startupGzipBytes)}KB / ${bytesToKb(INITIAL_GZIP_BUDGET)}KB`)
console.log(`- Three ecosystem JS (gzip): ${bytesToKb(threeTotalGzipBytes)}KB / ${bytesToKb(THREE_TOTAL_BUDGET)}KB`)
console.log(`- Three ecosystem JS (raw): ${bytesToKb(threeTotalBytes)}KB`)
console.log(`- Startup assets: ${startupAssetNames.join(', ')}`)
