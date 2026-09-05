import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { makePages } from '../src/pages.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(root, 'validation')
const port = Number(process.env.VISUAL_PORT || 4197)
const cdpPort = Number(process.env.CDP_PORT || 9337)
const origin = `http://127.0.0.1:${port}`
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const profile = await mkdtemp(path.join(os.tmpdir(), 'r7-root-cdp-'))
const failures = []
const results = []
const routeResults = []
const { pages } = makePages('/')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForHttp = async (url, attempts = 60) => {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return response
    } catch {
      // The child process is still starting.
    }
    await sleep(100)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

class CdpClient {
  constructor(url) {
    this.url = url
    this.socket = null
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
  }

  async connect() {
    this.socket = new WebSocket(this.url)
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(message.error.message))
        else resolve(message.result)
        return
      }
      if (message.method && this.listeners.has(message.method)) {
        const listeners = this.listeners.get(message.method)
        this.listeners.delete(message.method)
        listeners.forEach((resolve) => resolve(message.params))
      }
    })
  }

  send(method, params = {}) {
    const id = this.nextId
    this.nextId += 1
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  once(method) {
    return new Promise((resolve) => {
      const listeners = this.listeners.get(method) || []
      listeners.push(resolve)
      this.listeners.set(method, listeners)
    })
  }

  close() {
    this.socket?.close()
  }
}

const server = spawn(process.execPath, [path.join(root, 'scripts', 'dev.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
})

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profile}`,
  'about:blank',
], {
  stdio: 'ignore',
  windowsHide: true,
})

let client

try {
  await mkdir(outputDir, { recursive: true })
  await waitForHttp(`${origin}/`)
  const versionResponse = await waitForHttp(`http://127.0.0.1:${cdpPort}/json/version`)
  const version = await versionResponse.json()
  client = new CdpClient(version.webSocketDebuggerUrl)
  await client.connect()

  const created = await client.send('Target.createTarget', { url: 'about:blank' })
  const attached = await client.send('Target.attachToTarget', { targetId: created.targetId, flatten: true })
  const sessionId = attached.sessionId
  let nestedId = 10000
  const nestedPending = new Map()

  client.socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.sessionId !== sessionId || !message.id || !nestedPending.has(message.id)) return
    const { resolve, reject } = nestedPending.get(message.id)
    nestedPending.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  })

  const send = (method, params = {}) => {
    nestedId += 1
    const id = nestedId
    return new Promise((resolve, reject) => {
      nestedPending.set(id, { resolve, reject })
      client.socket.send(JSON.stringify({ id, method, params, sessionId }))
    })
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Network.enable')

  const setViewport = async (width, height) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 960,
      screenWidth: width,
      screenHeight: height,
    })
  }

  const navigate = async (route) => {
    await send('Page.navigate', { url: `${origin}${route}` })
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const state = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true })
      if (state.result.value === 'complete') break
      await sleep(50)
    }
    await sleep(60)
  }

  const cases = [
    { width: 320, height: 720, route: '/products/', name: 'mobile-320' },
    { width: 375, height: 812, route: '/', name: 'mobile-375' },
    { width: 414, height: 896, route: '/projects/', name: 'mobile-414' },
    { width: 768, height: 900, route: '/docs/', name: 'tablet-768' },
    { width: 1280, height: 800, route: '/', name: 'desktop-1280' },
    { width: 1440, height: 1000, route: '/', name: 'desktop-1440' },
  ]

  for (const testCase of cases) {
    await setViewport(testCase.width, testCase.height)
    await navigate(testCase.route)
    await sleep(90)

    const metricsResponse = await send('Runtime.evaluate', {
      expression: `(() => ({
        innerWidth,
        innerHeight,
        htmlScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        desktopNavDisplay: getComputedStyle(document.querySelector('.desktop-nav')).display,
        mobileMenuDisplay: getComputedStyle(document.querySelector('[data-menu-open]')).display,
        firstHeading: document.querySelector('h1')?.textContent?.trim() || ''
      }))()`,
      returnByValue: true,
    })
    const metrics = metricsResponse.result.value
    const expectedDesktop = testCase.width >= 960

    if (metrics.innerWidth !== testCase.width) failures.push(`${testCase.name}: innerWidth ${metrics.innerWidth}, expected ${testCase.width}`)
    if (metrics.htmlScrollWidth > testCase.width) failures.push(`${testCase.name}: html horizontal overflow ${metrics.htmlScrollWidth} > ${testCase.width}`)
    if (metrics.bodyScrollWidth > testCase.width) failures.push(`${testCase.name}: body horizontal overflow ${metrics.bodyScrollWidth} > ${testCase.width}`)
    if (expectedDesktop && metrics.desktopNavDisplay === 'none') failures.push(`${testCase.name}: desktop nav is hidden`)
    if (!expectedDesktop && metrics.desktopNavDisplay !== 'none') failures.push(`${testCase.name}: desktop nav is visible`)
    if (expectedDesktop && metrics.mobileMenuDisplay !== 'none') failures.push(`${testCase.name}: mobile menu trigger is visible`)
    if (!expectedDesktop && metrics.mobileMenuDisplay === 'none') failures.push(`${testCase.name}: mobile menu trigger is hidden`)

    const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile(path.join(outputDir, `${testCase.name}.png`), Buffer.from(screenshot.data, 'base64'))
    results.push({ ...testCase, ...metrics })
  }

  const routeCases = [
    ...pages.flatMap((page) => [
      { route: page.route, width: 320, height: 760, mode: 'mobile' },
      { route: page.route, width: 1280, height: 820, mode: 'desktop' },
    ]),
    { route: '/__missing-route__/', width: 320, height: 760, mode: 'mobile-404' },
    { route: '/__missing-route__/', width: 1280, height: 820, mode: 'desktop-404' },
  ]

  for (const testCase of routeCases) {
    await setViewport(testCase.width, testCase.height)
    await navigate(testCase.route)
    const auditResponse = await send('Runtime.evaluate', {
      expression: `(() => {
        const visible = (node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const nameFor = (node) => (node.getAttribute('aria-label') || node.textContent || node.value || node.placeholder || '').trim();
        const interactive = [...document.querySelectorAll('a[href], button, input, select, textarea')].filter(visible);
        const smallTargets = innerWidth <= 414 ? interactive
          .filter((node) => !node.classList.contains('skip-link'))
          .map((node) => {
            const rect = node.getBoundingClientRect();
            return { tag: node.tagName, text: nameFor(node).slice(0, 40), width: Math.round(rect.width), height: Math.round(rect.height) };
          })
          .filter((item) => item.width < 44 || item.height < 44) : [];
        const unnamed = interactive
          .filter((node) => !nameFor(node))
          .map((node) => node.outerHTML.slice(0, 120));
        const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
        const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
        return {
          title: document.title,
          h1Count: document.querySelectorAll('h1').length,
          lang: document.documentElement.lang,
          main: Boolean(document.querySelector('main#main')),
          skipLink: Boolean(document.querySelector('.skip-link[href="#main"]')),
          htmlScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          unnamed,
          duplicateIds,
          smallTargets,
        };
      })()`,
      returnByValue: true,
    })
    const audit = auditResponse.result.value
    const label = `${testCase.mode} ${testCase.width}px ${testCase.route}`
    if (audit.htmlScrollWidth > testCase.width) failures.push(`${label}: html overflow ${audit.htmlScrollWidth}px`)
    if (audit.bodyScrollWidth > testCase.width) failures.push(`${label}: body overflow ${audit.bodyScrollWidth}px`)
    if (audit.h1Count !== 1) failures.push(`${label}: expected one h1, found ${audit.h1Count}`)
    if (audit.lang !== 'ja') failures.push(`${label}: document language is ${audit.lang || 'missing'}`)
    if (!audit.main || !audit.skipLink) failures.push(`${label}: main landmark or skip link missing`)
    if (audit.unnamed.length) failures.push(`${label}: unnamed interactive controls: ${audit.unnamed.join(' | ')}`)
    if (audit.duplicateIds.length) failures.push(`${label}: duplicate IDs: ${audit.duplicateIds.join(', ')}`)
    if (audit.smallTargets.length) failures.push(`${label}: touch targets below 44px: ${JSON.stringify(audit.smallTargets.slice(0, 6))}`)
    routeResults.push({ ...testCase, ...audit })
  }

  await setViewport(375, 812)
  await navigate('/')
  const mobileInteraction = await send('Runtime.evaluate', {
    expression: `(() => {
      const button = document.querySelector('[data-menu-open]');
      const searchButton = document.querySelector('[data-search-open]');
      button.click();
      const dialog = document.querySelector('[data-mobile-menu]');
      const opened = dialog.open;
      const hrefs = [...dialog.querySelectorAll('a[href]')].map((link) => link.getAttribute('href'));
      const uniqueLinks = hrefs.length === new Set(hrefs).size;
      dialog.querySelector('[data-dialog-close]').click();
      return { opened, closed: !dialog.open, uniqueLinks, searchVisible: getComputedStyle(searchButton).display !== 'none' };
    })()`,
    returnByValue: true,
  })
  if (!mobileInteraction.result.value.opened || !mobileInteraction.result.value.closed) failures.push('mobile menu dialog did not open and close correctly')
  if (!mobileInteraction.result.value.uniqueLinks) failures.push('mobile menu contains duplicate destinations')
  if (!mobileInteraction.result.value.searchVisible) failures.push('mobile search trigger is hidden')

  await sleep(30)
  const mobileFocusReturn = await send('Runtime.evaluate', {
    expression: `(() => ({ menuFocusReturned: document.activeElement === document.querySelector('[data-menu-open]') }))()`,
    returnByValue: true,
  })
  if (!mobileFocusReturn.result.value.menuFocusReturned) failures.push('mobile menu did not restore focus to its opener')

  await setViewport(1440, 1000)
  await navigate('/')
  const desktopInteraction = await send('Runtime.evaluate', {
    expression: `(() => {
      const trigger = document.querySelector('[data-mega-trigger="products"]');
      trigger.click();
      const panel = document.querySelector('[data-mega-panel="products"]');
      const opened = !panel.hidden && trigger.getAttribute('aria-expanded') === 'true';
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return { opened, closed: panel.hidden && trigger.getAttribute('aria-expanded') === 'false', focusReturned: document.activeElement === trigger };
    })()`,
    returnByValue: true,
  })
  if (!desktopInteraction.result.value.opened || !desktopInteraction.result.value.closed) failures.push('desktop mega-menu did not open and close correctly')
  if (!desktopInteraction.result.value.focusReturned) failures.push('desktop mega-menu did not restore focus on Escape')

  const searchInteraction = await send('Runtime.evaluate', {
    expression: `(() => {
      window.__searchReturnTarget = document.activeElement;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
      const dialog = document.querySelector('[data-search-dialog]');
      return { open: dialog.open, focused: document.activeElement === document.querySelector('[data-search-input]') };
    })()`,
    returnByValue: true,
  })
  await sleep(300)
  const searchLoaded = await send('Runtime.evaluate', {
    expression: `(() => ({
      resultCount: document.querySelectorAll('.search-result').length,
      status: document.querySelector('[data-search-status]').textContent
    }))()`,
    returnByValue: true,
  })
  if (!searchInteraction.result.value.open || !searchInteraction.result.value.focused) failures.push('Ctrl+K search dialog did not open with input focus')
  if (searchLoaded.result.value.resultCount < 1) failures.push(`search index produced no results: ${searchLoaded.result.value.status}`)

  const emptySearch = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('[data-search-input]');
      input.value = 'definitely-no-r7-result-zzzz';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      return {
        resultCount: document.querySelectorAll('.search-result').length,
        status: document.querySelector('[data-search-status]').textContent,
        activeDescendant: input.getAttribute('aria-activedescendant'),
      };
    })()`,
    returnByValue: true,
  })
  if (emptySearch.result.value.resultCount !== 0 || !emptySearch.result.value.status.includes('該当するページはありません')) failures.push('search empty state did not render correctly')
  if (emptySearch.result.value.activeDescendant) failures.push('empty search retained a stale active descendant')

  await send('Runtime.evaluate', { expression: `document.querySelector('[data-search-dialog]').close()` })
  await sleep(30)
  const searchFocusReturn = await send('Runtime.evaluate', {
    expression: `(() => ({ returned: document.activeElement === window.__searchReturnTarget }))()`,
    returnByValue: true,
  })
  if (!searchFocusReturn.result.value.returned) failures.push('search dialog did not restore focus to its opener')

  await send('Network.setBlockedURLs', { urls: ['*search-index.json*'] })
  await navigate('/')
  const loadingSearch = await send('Runtime.evaluate', {
    expression: `(() => {
      document.querySelector('[data-search-open]').click();
      return document.querySelector('[data-search-status]').textContent;
    })()`,
    returnByValue: true,
  })
  if (!loadingSearch.result.value.includes('読み込み中')) failures.push(`search loading state missing: ${loadingSearch.result.value}`)
  await sleep(200)
  const errorSearch = await send('Runtime.evaluate', {
    expression: `document.querySelector('[data-search-status]').textContent`,
    returnByValue: true,
  })
  if (!errorSearch.result.value.includes('読み込めませんでした')) failures.push(`search error state missing: ${errorSearch.result.value}`)
  await send('Network.setBlockedURLs', { urls: [] })

  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  await navigate('/')
  const reducedMotion = await send('Runtime.evaluate', {
    expression: `(() => ({
      preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transitionDuration: getComputedStyle(document.querySelector('.row-arrow')).transitionDuration,
    }))()`,
    returnByValue: true,
  })
  if (!reducedMotion.result.value.preference) failures.push('reduced-motion media emulation was not applied')
  if (reducedMotion.result.value.scrollBehavior !== 'auto') failures.push(`reduced motion did not disable smooth scroll: ${reducedMotion.result.value.scrollBehavior}`)
  if (!['0s', '0.000001s', '1e-06s'].includes(reducedMotion.result.value.transitionDuration)) failures.push(`reduced motion left a long transition: ${reducedMotion.result.value.transitionDuration}`)
  await send('Emulation.setEmulatedMedia', { features: [] })

  const report = {
    generatedAt: new Date().toISOString(),
    cases: results,
    routeMatrix: routeResults,
    interactions: {
      mobileMenu: { ...mobileInteraction.result.value, ...mobileFocusReturn.result.value },
      desktopMegaMenu: desktopInteraction.result.value,
      search: {
        ...searchInteraction.result.value,
        ...searchLoaded.result.value,
        empty: emptySearch.result.value,
        focusReturn: searchFocusReturn.result.value,
        loadingStatus: loadingSearch.result.value,
        errorStatus: errorSearch.result.value,
      },
      reducedMotion: reducedMotion.result.value,
    },
    failures,
  }
  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  if (failures.length) {
    console.error(`Visual check failed with ${failures.length} issue(s):`)
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exitCode = 1
  } else {
    console.log(`Visual check passed at ${cases.map((item) => `${item.width}px`).join(', ')}.`)
    console.log(`Full route matrix passed: ${pages.length} routes + 404 at 320px and 1280px.`)
    console.log('Interactions passed: mobile menu, desktop mega-menu, search loading/empty/error, focus return, Ctrl+K, reduced motion.')
  }
} finally {
  client?.close()
  server.kill()
  chrome.kill()
  await sleep(100)
  if (profile.startsWith(os.tmpdir())) await rm(profile, { recursive: true, force: true }).catch(() => {})
}
