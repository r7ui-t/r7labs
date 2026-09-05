(() => {
  const base = document.currentScript?.dataset.siteBase || '/'
  const pathWithBase = (path) => {
    const clean = path.replace(/^\/+/, '')
    return base === '/' ? `/${clean}` : `${base}${clean}`
  }

  const dialogs = document.querySelectorAll('dialog')
  const dialogReturnFocus = new WeakMap()
  const closeDialog = (dialog) => {
    if (dialog?.open) dialog.close()
  }

  const openDialog = (dialog, opener) => {
    if (!dialog || dialog.open) return
    if (opener instanceof HTMLElement) dialogReturnFocus.set(dialog, opener)
    dialog.showModal()
  }

  document.querySelectorAll('[data-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => closeDialog(button.closest('dialog')))
  })

  dialogs.forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog)
    })
    dialog.addEventListener('close', () => {
      const opener = dialogReturnFocus.get(dialog)
      dialogReturnFocus.delete(dialog)
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    })
  })

  const mobileMenu = document.querySelector('[data-mobile-menu]')
  const mobileMenuOpen = document.querySelector('[data-menu-open]')
  mobileMenuOpen?.addEventListener('click', () => {
    openDialog(mobileMenu, mobileMenuOpen)
  })

  const shortcutLabel = document.querySelector('[data-search-shortcut]')
  if (shortcutLabel) shortcutLabel.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K'

  const megaTriggers = [...document.querySelectorAll('[data-mega-trigger]')]
  const megaPanels = [...document.querySelectorAll('[data-mega-panel]')]
  const megaScrim = document.querySelector('[data-mega-scrim]')
  let openMega = null

  const closeMega = ({ restoreFocus = false } = {}) => {
    const closingId = openMega
    megaTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'))
    megaPanels.forEach((panel) => { panel.hidden = true })
    if (megaScrim) megaScrim.hidden = true
    openMega = null
    if (restoreFocus && closingId) {
      megaTriggers.find((trigger) => trigger.dataset.megaTrigger === closingId)?.focus({ preventScroll: true })
    }
  }

  const setMega = (id) => {
    const trigger = megaTriggers.find((item) => item.dataset.megaTrigger === id)
    const panel = megaPanels.find((item) => item.dataset.megaPanel === id)
    if (!trigger || !panel) return
    if (openMega === id) {
      closeMega()
      return
    }
    closeMega()
    trigger.setAttribute('aria-expanded', 'true')
    panel.hidden = false
    if (megaScrim) megaScrim.hidden = false
    openMega = id
  }

  megaTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => setMega(trigger.dataset.megaTrigger))
  })
  megaScrim?.addEventListener('click', () => closeMega({ restoreFocus: true }))

  const searchDialog = document.querySelector('[data-search-dialog]')
  const searchInput = document.querySelector('[data-search-input]')
  const searchStatus = document.querySelector('[data-search-status]')
  const searchResults = document.querySelector('[data-search-results]')
  const searchOpeners = [...document.querySelectorAll('[data-search-open]')]
  let searchIndex = null
  let searchLoadError = false
  let selectedIndex = 0
  let renderedResults = []

  const setStatus = (message) => {
    if (searchStatus) searchStatus.textContent = message
  }

  const loadSearch = async () => {
    if (searchIndex || searchLoadError) return
    setStatus('検索インデックスを読み込み中…')
    try {
      const response = await fetch(pathWithBase('/search-index.json'))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      searchIndex = await response.json()
      setStatus(`${searchIndex.length} ページを検索できます。`)
    } catch {
      searchLoadError = true
      setStatus('検索インデックスを読み込めませんでした。ナビゲーションから移動してください。')
    }
  }

  const normalize = (value) => value.toLocaleLowerCase('ja').normalize('NFKC')

  const renderSearch = () => {
    if (!searchResults) return
    const query = normalize(searchInput?.value.trim() || '')
    if (!searchIndex) {
      searchResults.replaceChildren()
      return
    }
    renderedResults = query
      ? searchIndex.filter((item) => normalize(`${item.title} ${item.description} ${item.text}`).includes(query)).slice(0, 8)
      : searchIndex.slice(0, 6)
    selectedIndex = renderedResults.length ? Math.min(selectedIndex, renderedResults.length - 1) : 0
    searchResults.replaceChildren(...renderedResults.map((item, index) => {
      const anchor = document.createElement('a')
      anchor.className = 'search-result'
      anchor.id = `search-result-${index}`
      anchor.href = pathWithBase(item.route)
      anchor.setAttribute('role', 'option')
      anchor.setAttribute('aria-selected', index === selectedIndex ? 'true' : 'false')
      anchor.innerHTML = `<strong></strong><span></span>`
      anchor.querySelector('strong').textContent = item.title
      anchor.querySelector('span').textContent = item.description
      anchor.addEventListener('pointermove', () => {
        selectedIndex = index
        updateSelection()
      })
      return anchor
    }))
    updateSelection()
    setStatus(renderedResults.length
      ? `${renderedResults.length} 件${query ? '見つかりました。' : 'を表示しています。'}`
      : '該当するページはありません。別の語句を試してください。')
  }

  const updateSelection = () => {
    const nodes = [...searchResults?.querySelectorAll('.search-result') || []]
    nodes.forEach((node, index) => node.setAttribute('aria-selected', index === selectedIndex ? 'true' : 'false'))
    const active = nodes[selectedIndex]
    if (active) {
      searchInput?.setAttribute('aria-activedescendant', active.id)
      active.scrollIntoView({ block: 'nearest' })
    } else {
      searchInput?.removeAttribute('aria-activedescendant')
    }
  }

  const openSearch = async (opener = document.activeElement) => {
    closeMega()
    openDialog(searchDialog, opener)
    searchInput?.setAttribute('aria-expanded', 'true')
    searchInput?.focus()
    await loadSearch()
    renderSearch()
  }

  searchOpeners.forEach((button) => button.addEventListener('click', () => openSearch(button)))
  searchDialog?.addEventListener('close', () => {
    searchInput?.setAttribute('aria-expanded', 'false')
    searchInput?.removeAttribute('aria-activedescendant')
  })
  searchInput?.addEventListener('input', () => {
    selectedIndex = 0
    renderSearch()
  })
  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!renderedResults.length) return
      selectedIndex = Math.min(selectedIndex + 1, renderedResults.length - 1)
      updateSelection()
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!renderedResults.length) return
      selectedIndex = Math.max(selectedIndex - 1, 0)
      updateSelection()
    }
    if (event.key === 'Enter' && renderedResults[selectedIndex]) {
      event.preventDefault()
      window.location.assign(pathWithBase(renderedResults[selectedIndex].route))
    }
  })

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
      event.preventDefault()
      const active = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : searchOpeners.find((button) => button.getClientRects().length)
      openSearch(active)
      return
    }
    if (event.key === 'Escape') closeMega({ restoreFocus: true })
  })

  window.addEventListener('resize', () => {
    if (window.matchMedia('(max-width: 59.999rem)').matches) closeMega()
  })
})()
