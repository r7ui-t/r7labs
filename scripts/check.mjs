import { access, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { makePages } from '../src/pages.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const { pages, notFound } = makePages('/')
const failures = []

const exists = async (target) => {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

const routeFile = (route) => route === '/'
  ? path.join(dist, 'index.html')
  : path.join(dist, route.replace(/^\//, ''), 'index.html')

const resolveHref = (href) => {
  const clean = href.split('#')[0].split('?')[0]
  if (!clean || clean === '/') return path.join(dist, 'index.html')
  if (clean.endsWith('/')) return path.join(dist, clean.replace(/^\//, ''), 'index.html')
  return path.join(dist, clean.replace(/^\//, ''))
}

for (const page of pages) {
  const output = routeFile(page.route)
  if (!(await exists(output))) failures.push(`Missing route output: ${page.route}`)
}

for (const required of ['404.html', 'assets/site.css', 'assets/site.js', 'assets/tokens.css', 'search-index.json', 'sitemap.xml', 'CNAME']) {
  if (!(await exists(path.join(dist, required)))) failures.push(`Missing build artifact: ${required}`)
}

for (const page of pages) {
  const file = routeFile(page.route)
  if (!(await exists(file))) continue
  const html = await readFile(file, 'utf8')
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1]
    if (/^(https?:|mailto:|tel:|#)/.test(href)) continue
    const target = resolveHref(href)
    if (!(await exists(target))) failures.push(`${page.route} -> broken internal href ${href}`)
  }
  if (!html.includes('name="viewport"')) failures.push(`${page.route} -> missing viewport meta`)
  if (!html.includes('class="skip-link"')) failures.push(`${page.route} -> missing skip link`)
  if (!html.includes('data-search-dialog')) failures.push(`${page.route} -> missing search dialog`)
  if (!html.includes('<html lang="ja">')) failures.push(`${page.route} -> missing Japanese document language`)

  const h1Count = [...html.matchAll(/<h1(?:\s|>)/g)].length
  if (h1Count !== 1) failures.push(`${page.route} -> expected exactly one h1, found ${h1Count}`)
  const firstHeading = html.match(/<h([1-6])(?:\s|>)/)
  if (!firstHeading || firstHeading[1] !== '1') failures.push(`${page.route} -> first document heading must be h1`)

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicateIds.length) failures.push(`${page.route} -> duplicate ids: ${[...new Set(duplicateIds)].join(', ')}`)

  for (const tag of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener[^"]*"/.test(tag[0])) failures.push(`${page.route} -> external new-tab link missing noopener`)
    if (!/rel="[^"]*noreferrer[^"]*"/.test(tag[0])) failures.push(`${page.route} -> external new-tab link missing noreferrer`)
    if (!/aria-label="[^"]+"/.test(tag[0])) failures.push(`${page.route} -> external new-tab link missing accessible destination hint`)
  }
}

const notFoundFile = path.join(dist, '404.html')
if (await exists(notFoundFile)) {
  const notFoundHtml = await readFile(notFoundFile, 'utf8')
  const h1Count = [...notFoundHtml.matchAll(/<h1(?:\s|>)/g)].length
  if (h1Count !== 1) failures.push(`${notFound.route} -> expected exactly one h1, found ${h1Count}`)
  if (!notFoundHtml.includes('<html lang="ja">')) failures.push(`${notFound.route} -> missing Japanese document language`)
}

const css = await readFile(path.join(root, 'public', 'assets', 'site.css'), 'utf8')
const tokenCss = await readFile(path.join(root, 'tokens.css'), 'utf8')
const js = await readFile(path.join(root, 'public', 'assets', 'site.js'), 'utf8')
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))

const bannedCss = [
  ['overflow-x: hidden', 'Use overflow-x: clip instead of hidden.'],
  ['width: 100vw', 'Do not use 100vw.'],
  ['transition: all', 'Do not use transition-all.'],
  ['#000000', 'Do not use pure black.'],
  ['#ffffff', 'Do not use pure white.'],
  ['font-style: italic', 'Headings/system should not introduce italic display styling.'],
]
for (const [needle, message] of bannedCss) {
  if (css.toLowerCase().includes(needle.toLowerCase())) failures.push(`CSS: ${message}`)
}

if (!css.startsWith('/* Hallmark')) failures.push('site.css is missing the Hallmark stamp on line 1.')
if (!tokenCss.startsWith('/* Hallmark')) failures.push('tokens.css is missing the Hallmark stamp on line 1.')
if (!css.includes('@media (prefers-reduced-motion: reduce)')) failures.push('CSS is missing reduced-motion handling.')
if (!css.includes('overflow-x: clip')) failures.push('CSS is missing horizontal overflow clipping.')
if (!css.includes(':focus-visible')) failures.push('CSS is missing focus-visible styling.')
if (!js.includes('Ctrl') && !js.includes('ctrlKey')) failures.push('Search script is missing keyboard shortcut handling.')
if (!js.includes('検索インデックスを読み込み中')) failures.push('Search script is missing a loading state.')
if (!js.includes('検索インデックスを読み込めませんでした')) failures.push('Search script is missing an error state.')
if (!js.includes('該当するページはありません')) failures.push('Search script is missing an empty state.')
if (!js.includes('aria-activedescendant')) failures.push('Search script is missing active-result accessibility semantics.')

const generated = makePages('/repository-preview/')
for (const page of generated.pages) {
  const internalHrefs = [...page.body.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => !/^(https?:|mailto:|tel:|#)/.test(href))
  if (internalHrefs.some((href) => !href.startsWith('/repository-preview/'))) {
    failures.push(`${page.route} -> SITE_BASE preview contains a root-relative internal link`)
  }
}

if (packageJson.dependencies && Object.keys(packageJson.dependencies).length) failures.push('Root site must not require runtime npm dependencies.')
if (packageJson.devDependencies && Object.keys(packageJson.devDependencies).length) failures.push('Root site build intentionally stays dependency-free; devDependencies found.')

const indexSize = (await stat(path.join(dist, 'index.html'))).size
const cssSize = (await stat(path.join(dist, 'assets', 'site.css'))).size
const jsSize = (await stat(path.join(dist, 'assets', 'site.js'))).size

if (failures.length) {
  console.error(`Check failed with ${failures.length} issue(s):`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Check passed: ${pages.length} routes, internal links, static assets, Hallmark safeguards.`)
console.log(`Core payload: index ${(indexSize / 1024).toFixed(1)} KiB · CSS ${(cssSize / 1024).toFixed(1)} KiB · JS ${(jsSize / 1024).toFixed(1)} KiB (fonts excluded).`)
