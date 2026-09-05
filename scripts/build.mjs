import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { makePages } from '../src/pages.mjs'
import { layout, normalizeBase } from '../src/lib/html.mjs'
import { site } from '../src/data/site.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const publicDir = path.join(root, 'public')
const base = normalizeBase(process.env.SITE_BASE || '/')

const routeFile = (route) => {
  if (route === '/') return path.join(dist, 'index.html')
  if (route.endsWith('.html')) return path.join(dist, route.replace(/^\//, ''))
  return path.join(dist, route.replace(/^\//, ''), 'index.html')
}

const stripHtml = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(?:amp|lt|gt|quot|#039);/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const { pages, notFound } = makePages(base)
const routes = pages.map((page) => page.route)
if (new Set(routes).size !== routes.length) throw new Error('Duplicate route detected.')

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })
await cp(publicDir, dist, { recursive: true })
await mkdir(path.join(dist, 'assets'), { recursive: true })
await cp(path.join(root, 'tokens.css'), path.join(dist, 'assets', 'tokens.css'))

for (const page of pages) {
  const output = routeFile(page.route)
  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(output, layout({ ...page, base }), 'utf8')
}

await writeFile(routeFile(notFound.route), layout({ ...notFound, base }), 'utf8')

const searchIndex = pages.map((page) => ({
  route: page.route,
  title: page.title,
  description: page.description,
  text: `${page.searchText || ''} ${stripHtml(page.body)}`.slice(0, 6000),
}))
await writeFile(path.join(dist, 'search-index.json'), `${JSON.stringify(searchIndex, null, 2)}\n`, 'utf8')

const sitemapUrls = pages
  .map((page) => `  <url><loc>${site.origin}${page.route}</loc></url>`)
  .join('\n')
await writeFile(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`,
  'utf8',
)

const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8')
if (!robots.includes(site.origin)) throw new Error('robots.txt is missing the production sitemap URL.')

console.log(`Built ${pages.length} routes + 404 to ${path.relative(root, dist)} (base: ${base})`)
