import { navGroups, site } from '../data/site.mjs'

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export const normalizeBase = (base = '/') => {
  if (!base || base === '/') return '/'
  return `/${String(base).replace(/^\/+|\/+$/g, '')}/`
}

export const internalHref = (path, base = '/') => {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path
  const normalizedBase = normalizeBase(base)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return normalizedBase === '/' ? `/${cleanPath}` : `${normalizedBase}${cleanPath}`
}

const externalAttrs = (href) => href.startsWith('http')
  ? ' target="_blank" rel="noopener noreferrer"'
  : ''

const link = ({ href, title, description }, base) => `
  <a class="mega-link" href="${escapeHtml(internalHref(href, base))}"${externalAttrs(href)}>
    <span class="mega-link__title">${escapeHtml(title)}</span>
    <span class="mega-link__description">${escapeHtml(description)}</span>
  </a>`

const navGroup = (group, base) => `
  <div class="mega" data-mega="${escapeHtml(group.id)}">
    <button class="nav-link nav-link--trigger" type="button" data-mega-trigger="${escapeHtml(group.id)}" aria-controls="mega-${escapeHtml(group.id)}" aria-expanded="false">
      ${escapeHtml(group.label)}
      <span class="nav-caret" aria-hidden="true"></span>
    </button>
    <div class="mega-panel" id="mega-${escapeHtml(group.id)}" data-mega-panel="${escapeHtml(group.id)}" hidden>
      <div class="mega-panel__inner page-frame">
        ${group.columns.map((column) => `
          <section class="mega-column" aria-labelledby="mega-${escapeHtml(group.id)}-${escapeHtml(column.title.toLowerCase().replaceAll(' ', '-'))}">
            <p class="mega-column__title" id="mega-${escapeHtml(group.id)}-${escapeHtml(column.title.toLowerCase().replaceAll(' ', '-'))}">${escapeHtml(column.title)}</p>
            <div class="mega-column__links">${column.items.map((item) => link(item, base)).join('')}</div>
          </section>`).join('')}
      </div>
    </div>
  </div>`

export const header = (base = '/') => `
  <header class="site-header" data-site-header>
    <div class="nav-bar page-frame">
      <a class="wordmark" href="${internalHref('/', base)}" aria-label="R7 Labs ホーム">R7<span>Labs</span></a>
      <nav class="desktop-nav" aria-label="メインナビゲーション">
        ${navGroups.map((group) => navGroup(group, base)).join('')}
        <a class="nav-link" href="${internalHref('/projects/', base)}">Projects</a>
        <a class="nav-link" href="${internalHref('/docs/', base)}">Docs</a>
      </nav>
      <div class="nav-actions">
        <button class="search-trigger" type="button" data-search-open aria-haspopup="dialog" aria-controls="search-dialog" aria-keyshortcuts="Control+K Meta+K">
          <span>Search</span><kbd data-search-shortcut aria-hidden="true">Ctrl K</kbd>
        </button>
        <button class="mobile-menu-trigger" type="button" data-menu-open aria-haspopup="dialog" aria-controls="mobile-menu">
          <span>Menu</span>
        </button>
      </div>
    </div>
    <button class="nav-scrim" type="button" data-mega-scrim aria-label="メニューを閉じる" hidden></button>
  </header>`

const mobileGroup = (group, items, base) => `
  <section class="mobile-nav-group">
    <p class="mobile-nav-group__title">${escapeHtml(group.label)}</p>
    ${items.map((item) => `
      <a href="${escapeHtml(internalHref(item.href, base))}"${externalAttrs(item.href)}>
        <span>${escapeHtml(item.title)}</span>
        <small>${escapeHtml(item.description)}</small>
      </a>`).join('')}
  </section>`

const mobileGroups = (base) => {
  const seen = new Set()
  return navGroups.map((group) => {
    const items = group.columns
      .flatMap((column) => column.items)
      .filter((item) => {
        if (seen.has(item.href)) return false
        seen.add(item.href)
        return true
      })
    return mobileGroup(group, items, base)
  }).join('')
}

export const dialogs = (base = '/') => `
  <dialog class="sheet-dialog mobile-menu" id="mobile-menu" data-mobile-menu>
    <div class="dialog-bar">
      <span class="dialog-title">Navigate</span>
      <button class="dialog-close" type="button" data-dialog-close aria-label="メニューを閉じる">Close</button>
    </div>
    <nav class="mobile-nav" aria-label="モバイルナビゲーション">
      <a class="mobile-nav-primary" href="${internalHref('/', base)}">Home</a>
      ${mobileGroups(base)}
    </nav>
  </dialog>

  <dialog class="search-dialog" id="search-dialog" data-search-dialog>
    <div class="search-shell">
      <div class="search-input-row">
        <label class="sr-only" for="site-search">サイト内検索</label>
        <input id="site-search" type="search" inputmode="search" autocomplete="off" placeholder="プロダクト、ドキュメント、ページを検索" role="combobox" aria-autocomplete="list" aria-controls="search-results" aria-expanded="false" data-search-input />
        <button class="dialog-close" type="button" data-dialog-close aria-label="検索を閉じる">Close</button>
      </div>
      <p class="search-status" data-search-status aria-live="polite">検索インデックスを読み込みます。</p>
      <div class="search-results" id="search-results" data-search-results role="listbox" aria-label="検索結果"></div>
      <div class="search-help" aria-hidden="true"><span>↑↓ select</span><span>Enter open</span><span>Esc close</span></div>
    </div>
  </dialog>`

export const breadcrumb = (items, base = '/') => `
  <nav class="breadcrumb" aria-label="パンくずリスト">
    <ol>
      ${items.map((item, index) => {
        const isLast = index === items.length - 1
        return `<li>${isLast
          ? `<span aria-current="page">${escapeHtml(item.label)}</span>`
          : `<a href="${internalHref(item.href, base)}">${escapeHtml(item.label)}</a>`}</li>`
      }).join('')}
    </ol>
  </nav>`

export const footer = (base = '/') => `
  <footer class="site-footer">
    <div class="footer-main page-frame">
      <div>
        <a class="footer-wordmark" href="${internalHref('/', base)}">R7 Labs</a>
        <p class="footer-tagline">Apps, shared services, and the notes that connect them.</p>
      </div>
      <nav class="footer-links" aria-label="フッターナビゲーション">
        <a href="${internalHref('/about/', base)}">About</a>
        <a href="${internalHref('/brand/', base)}">Brand</a>
        <a href="${internalHref('/legal/', base)}">Legal</a>
        <a href="${escapeHtml(site.github)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub（新しいタブで開きます）">GitHub <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
    <div class="footer-meta page-frame">
      <span>© ${escapeHtml(site.year)} R7 Labs</span>
      <span>Static root · no server runtime</span>
    </div>
  </footer>`

export const layout = ({ title, description, body, route, base = '/' }) => {
  const pageTitle = title === site.name ? site.name : `${title} · ${site.name}`
  const canonical = `${site.origin}${route === '/' ? '/' : route}`
  const assetBase = internalHref('/assets/', base)
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="${assetBase}site.css" />
    <script src="${assetBase}site.js" data-site-base="${escapeHtml(normalizeBase(base))}" defer></script>
  </head>
  <body>
    <a class="skip-link" href="#main">本文へ移動</a>
    ${header(base)}
    <main id="main">${body}</main>
    ${footer(base)}
    ${dialogs(base)}
  </body>
</html>`
}
