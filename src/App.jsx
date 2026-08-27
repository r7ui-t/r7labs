import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const projects = [
  {
    id: 'campusdeck',
    index: '01',
    name: 'CampusDeck',
    kind: 'Web app',
    status: 'Live',
    href: 'https://campusdeck.r7labs.dev',
    description: '予定、時間割、シフトをひとつの画面で扱うための大学生活向けWebアプリ。',
    points: ['Calendar', 'Timetable', 'Shift'],
  },
  {
    id: 'quotabar',
    index: '02',
    name: 'QuotaBar',
    kind: 'Windows utility',
    status: 'Open source',
    href: 'https://github.com/r7ui-t/Quotabar',
    description: 'ClaudeとCodexの利用状況をWindowsのタスクトレイから確認する常駐ツール。',
    points: ['Tray', 'Claude', 'Codex'],
  },
  {
    id: 'pictdict',
    index: '03',
    name: 'PictDict',
    kind: 'Web experiment',
    status: 'Repository',
    href: 'https://github.com/r7ui-t/PictDict',
    description: '街で見つけたピクトグラムを写真、場所、メモと一緒に記録する小さな図鑑。',
    points: ['Photo', 'Location', 'Memo'],
  },
]

function Arrow({ down = false }) {
  return <span className={`arrow ${down ? 'arrow--down' : ''}`} aria-hidden="true">↗</span>
}

function CampusPreview() {
  return (
    <div className="mock mock--campus" aria-hidden="true">
      <div className="campus-top">
        <span />
        <span />
        <span />
        <i />
      </div>
      <div className="campus-side">
        <b />
        <span />
        <span />
        <span />
      </div>
      <div className="campus-month">
        <div className="campus-month__head"><span>08</span><i /></div>
        <div className="calendar-grid">
          {Array.from({ length: 28 }).map((_, index) => (
            <span
              key={index}
              className={index === 5 || index === 10 || index === 17 || index === 23 ? 'calendar-event' : ''}
            />
          ))}
        </div>
      </div>
      <div className="campus-add">+</div>
    </div>
  )
}

function QuotaPreview() {
  return (
    <div className="mock mock--quota" aria-hidden="true">
      <div className="quota-titlebar">
        <span>QuotaBar</span>
        <i>×</i>
      </div>
      <div className="quota-body">
        <div className="quota-service">
          <div><b>C</b><span>Claude</span></div>
          <i>64%</i>
          <em><span style={{ '--quota': '64%' }} /></em>
        </div>
        <div className="quota-service">
          <div><b>›_</b><span>Codex</span></div>
          <i>38%</i>
          <em><span style={{ '--quota': '38%' }} /></em>
        </div>
        <div className="quota-footer"><span>updated now</span><i>···</i></div>
      </div>
    </div>
  )
}

function PictPreview() {
  return (
    <div className="mock mock--pict" aria-hidden="true">
      <div className="pict-head"><span>PICT / INDEX</span><i>⌕</i></div>
      <div className="pict-grid">
        <span>↗</span><span>♿</span><span>i</span><span>↔</span><span>△</span><span>⌁</span>
      </div>
      <div className="pict-meta"><span>35.1815° N</span><span>136.9066° E</span></div>
    </div>
  )
}

function ProjectPreview({ project }) {
  return (
    <div className="preview-stage" data-project={project.id}>
      <div className="preview-stage__chrome">
        <span>{project.index} / 03</span>
        <span>{project.kind}</span>
      </div>
      <div className="preview-stage__screen">
        {project.id === 'campusdeck' && <CampusPreview />}
        {project.id === 'quotabar' && <QuotaPreview />}
        {project.id === 'pictdict' && <PictPreview />}
      </div>
      <div className="preview-stage__footer">
        <span>{project.name}</span>
        <span>{project.status}</span>
      </div>
    </div>
  )
}

function ProjectRow({ project, active, onActivate }) {
  return (
    <a
      className={`project-row ${active ? 'is-active' : ''}`}
      href={project.href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={onActivate}
      onFocus={onActivate}
    >
      <span className="project-row__index">{project.index}</span>
      <div className="project-row__main">
        <div className="project-row__titleline">
          <h2>{project.name}</h2>
          <span className="project-row__kind">{project.kind}</span>
        </div>
        <div className="project-row__details">
          <p>{project.description}</p>
        </div>
      </div>
      <div className="project-row__end">
        <span>{project.status}</span>
        <Arrow />
      </div>
    </a>
  )
}

function Showcase({ project, reverse = false }) {
  return (
    <section
      className={`showcase showcase--${project.id}${reverse ? ' showcase--reverse' : ''}`}
      id={project.id}
      data-showcase={project.id}
    >
      <div className="showcase__sticky">
        <div className="showcase__topline">
          <span>{project.index} / 03</span>
          <span>{project.kind}</span>
          <span>{project.status}</span>
        </div>

        <div className="showcase__heading" data-reveal>
          <h2>{project.name}</h2>
          <a href={project.href} target="_blank" rel="noreferrer">
            Open project <Arrow />
          </a>
        </div>

        <div className="showcase__stage">
          <div className="showcase__copy" data-reveal>
            <p>{project.description}</p>
            <div className="showcase__points" aria-label={`${project.name} の主な機能`}>
              {project.points.map((point, index) => (
                <span key={point}>
                  <i>{String(index + 1).padStart(2, '0')}</i>
                  {point}
                </span>
              ))}
            </div>
          </div>

          <div className="showcase__visual" aria-hidden="true">
            <div className="showcase__orbit showcase__orbit--one" />
            <div className="showcase__orbit showcase__orbit--two" />
            <div className="showcase__preview-shell">
              <ProjectPreview project={project} />
            </div>
            <span className="showcase__coord showcase__coord--a">{project.index}.A</span>
            <span className="showcase__coord showcase__coord--b">{project.index}.B</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [activeId, setActiveId] = useState(projects[0].id)
  const [currentSection, setCurrentSection] = useState('projects')
  const [theme, setTheme] = useState('dark')
  const previewRef = useRef(null)

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeId) ?? projects[0],
    [activeId],
  )

  useEffect(() => {
    const root = document.documentElement
    let pointerFrame = 0
    let scrollFrame = 0

    const updatePointer = (event) => {
      if (pointerFrame) return
      pointerFrame = requestAnimationFrame(() => {
        root.style.setProperty('--pointer-x', `${event.clientX}px`)
        root.style.setProperty('--pointer-y', `${event.clientY}px`)
        pointerFrame = 0
      })
    }

    const updateScroll = () => {
      if (scrollFrame) return
      scrollFrame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const progress = max > 0 ? window.scrollY / max : 0
        root.style.setProperty('--scroll-progress', progress.toFixed(4))

        document.querySelectorAll('[data-showcase]').forEach((section) => {
          const rect = section.getBoundingClientRect()
          const travel = rect.height + window.innerHeight
          const local = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / travel))
          const centered = (local - 0.5) * 2
          section.style.setProperty('--showcase-progress', local.toFixed(4))
          section.style.setProperty('--showcase-shift', `${(centered * -34).toFixed(2)}px`)
          section.style.setProperty('--showcase-rotate', `${(centered * 1.8).toFixed(2)}deg`)
          section.style.setProperty('--showcase-scale', (0.94 + local * 0.06).toFixed(4))
        })

        scrollFrame = 0
      })
    }

    window.addEventListener('pointermove', updatePointer, { passive: true })
    window.addEventListener('scroll', updateScroll, { passive: true })
    updateScroll()

    return () => {
      window.removeEventListener('pointermove', updatePointer)
      window.removeEventListener('scroll', updateScroll)
      if (pointerFrame) cancelAnimationFrame(pointerFrame)
      if (scrollFrame) cancelAnimationFrame(scrollFrame)
    }
  }, [])

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          revealObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.14 },
    )

    document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element))
    return () => revealObserver.disconnect()
  }, [])

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible?.target?.id) setCurrentSection(visible.target.id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.05, 0.2, 0.45] },
    )

    document.querySelectorAll('#projects, [data-showcase]').forEach((section) => sectionObserver.observe(section))
    return () => sectionObserver.disconnect()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const movePreview = (event) => {
    const element = previewRef.current
    if (!element || window.matchMedia('(pointer: coarse)').matches) return
    const rect = element.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    element.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`)
    element.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`)
    element.style.setProperty('--shine-x', `${((x + 0.5) * 100).toFixed(1)}%`)
    element.style.setProperty('--shine-y', `${((y + 0.5) * 100).toFixed(1)}%`)
  }

  const resetPreview = () => {
    const element = previewRef.current
    if (!element) return
    element.style.setProperty('--tilt-x', '0deg')
    element.style.setProperty('--tilt-y', '0deg')
    element.style.setProperty('--shine-x', '50%')
    element.style.setProperty('--shine-y', '50%')
  }

  return (
    <div className="site-shell">
      <div className="pointer-light" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true" />

      <header className="site-header">
        <a className="quiet-brand" href="#projects">r7labs</a>
        <nav className="site-nav" aria-label="ページ内ナビゲーション">
          <a className={currentSection === 'projects' ? 'is-current' : ''} href="#projects">Index</a>
          <a className={currentSection !== 'projects' ? 'is-current' : ''} href={`#${currentSection === 'projects' ? 'campusdeck' : currentSection}`}>Project</a>
        </nav>
        <div className="header-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'ライトテーマに切り替える' : 'ダークテーマに切り替える'}
          >
            <span className="theme-toggle__track"><i /></span>
          </button>
          <a className="github-link" href="https://github.com/r7ui-t" target="_blank" rel="noreferrer">
            GitHub <Arrow />
          </a>
        </div>
      </header>

      <nav className="project-rail" aria-label="プロジェクトナビゲーション">
        <a className={currentSection === 'projects' ? 'is-current' : ''} href="#projects" aria-label="Projects index"><span>00</span></a>
        {projects.map((project) => (
          <a
            key={project.id}
            className={currentSection === project.id ? 'is-current' : ''}
            href={`#${project.id}`}
            aria-label={project.name}
          >
            <span>{project.index}</span>
          </a>
        ))}
      </nav>

      <main>
        <section className="projects" id="projects">
          <div className="section-intro" data-reveal>
            <div>
              <span className="micro-label">INDEX / 01—03</span>
              <h1>Projects</h1>
            </div>
          </div>

          <div className="project-layout">
            <div className="project-list">
              {projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  active={project.id === activeId}
                  onActivate={() => setActiveId(project.id)}
                />
              ))}
            </div>

            <div
              className="preview-wrap"
              ref={previewRef}
              onPointerMove={movePreview}
              onPointerLeave={resetPreview}
              data-reveal
            >
              <ProjectPreview key={activeProject.id} project={activeProject} />
            </div>
          </div>

          <div className="continue-marker" data-reveal>
            <span>Scroll</span>
            <i />
            <span>01</span>
          </div>
        </section>

        <div className="section-divider" aria-hidden="true">
          <span>01</span>
          <i />
          <span>03</span>
        </div>

        {projects.map((project, index) => (
          <Showcase key={project.id} project={project} reverse={index % 2 === 1} />
        ))}

        <section className="end-panel" id="end">
          <div className="end-panel__inner" data-reveal>
            <span>03 / 03</span>
            <div className="end-panel__line">
              <strong>End of index</strong>
              <a href="#projects">Back to top ↑</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>© 2026</span>
        <div className="site-footer__links">
          <a href="https://github.com/r7ui-t" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
          <a href="#projects">Back to index ↑</a>
        </div>
      </footer>
    </div>
  )
}

export default App
