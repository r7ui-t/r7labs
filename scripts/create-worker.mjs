import { mkdir, writeFile } from 'node:fs/promises'

await mkdir('dist/server', { recursive: true })
await writeFile(
  'dist/server/index.js',
  "export default { fetch(request, env) { const url = new URL(request.url); if (url.pathname === '/') url.pathname = '/index.html'; return env.ASSETS.fetch(new Request(url, request)) } }\n",
  'utf8',
)
