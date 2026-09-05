import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT || 4173)

const build = spawnSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})
if (build.status !== 0) process.exit(build.status || 1)

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
])

const safePath = (pathname) => {
  const decoded = decodeURIComponent(pathname)
  const candidate = path.resolve(dist, `.${decoded}`)
  return candidate.startsWith(dist) ? candidate : null
}

const findFile = async (pathname) => {
  const candidate = safePath(pathname)
  if (!candidate) return null
  const choices = [candidate]
  if (pathname.endsWith('/')) choices.push(path.join(candidate, 'index.html'))
  else choices.push(path.join(candidate, 'index.html'), `${candidate}.html`)
  for (const choice of choices) {
    try {
      if ((await stat(choice)).isFile()) return choice
    } catch {
      // Try the next static-file shape.
    }
  }
  return null
}

createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname
    const file = await findFile(pathname)
    if (!file) {
      const body = await readFile(path.join(dist, '404.html'))
      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
      response.end(body)
      return
    }
    const body = await readFile(file)
    response.writeHead(200, {
      'content-type': mime.get(path.extname(file)) || 'application/octet-stream',
      'cache-control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=300',
    })
    response.end(body)
  } catch {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Local static server error.')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`R7 Labs root: http://127.0.0.1:${port}`)
})
