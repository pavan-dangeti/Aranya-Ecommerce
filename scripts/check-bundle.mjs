import { readFileSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'

const dist = path.resolve(import.meta.dirname, '../web/dist')
const assets = path.join(dist, 'assets')
const BUDGET_KB = 250

const read = (file) => readFileSync(path.join(assets, file), 'utf8')
const gzipKb = (file) => gzipSync(readFileSync(path.join(assets, file))).length / 1024

// Static imports only: dynamic import() chunks are not on the critical path.
function closure(entry) {
  const seen = new Set()
  const visit = (file) => {
    if (seen.has(file)) return
    seen.add(file)
    for (const [, dep] of read(file).matchAll(/(?:from|import)\s*"\.\/([\w.-]+\.js)"/g)) visit(dep)
  }
  visit(entry)
  return seen
}

const isThree = (file) => read(file).includes('WebGLRenderer')
const chunk = (prefix) =>
  readdirSync(assets).find((f) => f.startsWith(`${prefix}-`) && f.endsWith('.js'))

const entry = readFileSync(path.join(dist, 'index.html'), 'utf8').match(
  /src="\/assets\/([\w.-]+\.js)"/,
)[1]
const failures = []
const report = []

for (const [label, start] of [
  ['/ (entry + home)', [entry, chunk('HomePage')]],
  ['/products', [entry, chunk('ProductsPage')]],
  ['/admin', [entry, chunk('AdminLayout'), chunk('AdminDashboardPage')]],
]) {
  const files = new Set(start.flatMap((f) => [...closure(f)]))
  const kb = [...files].reduce((sum, f) => sum + gzipKb(f), 0)
  const three = [...files].filter(isThree)
  report.push(
    `${label.padEnd(18)} ${kb.toFixed(1).padStart(7)} KB gzip${three.length ? `  (three: ${three.join(', ')})` : ''}`,
  )
  if (kb > BUDGET_KB) failures.push(`${label} is ${kb.toFixed(1)} KB gzip, budget ${BUDGET_KB} KB`)
  if (three.length) failures.push(`${label} statically loads three.js via ${three.join(', ')}`)
}

console.log(report.join('\n'))
if (failures.length) {
  console.error(`\nBundle budget failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log(`\nWithin the ${BUDGET_KB} KB budget; no route loads three.js up front.`)
