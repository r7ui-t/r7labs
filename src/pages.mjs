import { docs, products, site, utilityRoutes } from './data/site.mjs'
import { breadcrumb, escapeHtml, internalHref } from './lib/html.mjs'

const textLink = (href, label, base = '/', external = false) => `
  <a class="text-link" href="${escapeHtml(external ? href : internalHref(href, base))}"${external ? ` target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(`${label}（新しいタブで開きます）`)}"` : ''}>
    ${escapeHtml(label)} <span aria-hidden="true">${external ? '↗' : '→'}</span>
  </a>`

const pageIntro = ({ label, title, description, meta = '' }) => `
  <header class="page-intro page-frame">
    <div class="page-intro__label">${escapeHtml(label)}</div>
    <div class="page-intro__content">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${meta ? `<p class="page-intro__meta">${escapeHtml(meta)}</p>` : ''}
    </div>
  </header>`

const productRow = (product, base = '/') => `
  <a class="product-row" href="${internalHref(`/products/${product.slug}/`, base)}">
    <span class="product-row__category">${escapeHtml(product.category)}</span>
    <span class="product-row__main"><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.summary)}</small></span>
    <span class="product-row__domain">${escapeHtml(product.domain)}</span>
    <span class="row-arrow" aria-hidden="true">→</span>
  </a>`

const docRow = (doc, base = '/') => `
  <a class="doc-row" href="${internalHref(doc.path, base)}">
    <span><strong>${escapeHtml(doc.title)}</strong><small>${escapeHtml(doc.summary)}</small></span>
    <span class="row-arrow" aria-hidden="true">→</span>
  </a>`

const home = (base) => {
  const apps = products.filter((item) => ['Study', 'Storage', 'Finance'].includes(item.category))
  const shared = products.filter((item) => !apps.includes(item))
  return `
    <section class="home-opening page-frame">
      <p class="home-opening__mark">r7labs.dev</p>
      <div class="home-opening__grid">
        <h1>R7 Labs</h1>
        <div class="home-opening__copy">
          <p>日常のツールと、それを支える基盤の入口。</p>
          <p class="muted-copy">ここではサービス本体を複製せず、使う場所・読む場所・全体のつながりを整理します。</p>
        </div>
      </div>
    </section>

    <section class="discovery-band discovery-band--apps">
      <div class="page-frame">
        <div class="rail-heading"><div><h2>Apps</h2><p>直接使うプロダクト。</p></div>${textLink('/products/', 'All products', base)}</div>
        <div class="product-list">${apps.map((item) => productRow(item, base)).join('')}</div>
      </div>
    </section>

    <section class="discovery-band discovery-band--shared">
      <div class="page-frame split-rail">
        <div class="rail-heading rail-heading--stacked"><div><h2>Shared services</h2><p>アカウントと静的アセット。複数サービスから使う共通層です。</p></div></div>
        <div class="compact-list">${shared.map((item) => productRow(item, base)).join('')}</div>
      </div>
    </section>

    <section class="dark-band">
      <div class="page-frame dark-band__grid">
        <div>
          <h2>One domain,<br />clear layers.</h2>
          <p>root は案内とドキュメント。各アプリはサブドメイン。役割を混ぜず、リンクでつなぎます。</p>
        </div>
        <dl class="path-map">
          <div><dt>r7labs.dev/*</dt><dd>Hub · Docs · Brand · Legal</dd></div>
          <div><dt>*.r7labs.dev</dt><dd>Apps · Accounts · Assets</dd></div>
          <div><dt>github.com/r7labs</dt><dd>Public source where available</dd></div>
        </dl>
      </div>
    </section>

    <section class="discovery-band">
      <div class="page-frame docs-rail">
        <div class="rail-heading rail-heading--stacked"><div><h2>Read the system</h2><p>構成、ホスティング、アカウントの責務を短くまとめています。</p></div>${textLink('/docs/', 'All docs', base)}</div>
        <div class="doc-list">${docs.map((item) => docRow(item, base)).join('')}</div>
      </div>
    </section>

    <section class="closing-index page-frame">
      <h2>More paths</h2>
      <div class="closing-index__links">
        ${utilityRoutes.map((item) => `<a href="${internalHref(item.path, base)}"><span>${escapeHtml(item.title)}</span><small>${escapeHtml(item.summary)}</small></a>`).join('')}
      </div>
    </section>`
}

const productsIndex = (base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { label: 'Products' }], base)}
  ${pageIntro({ label: 'Directory', title: 'Products', description: '使うアプリと、それらを支える共通サービス。サブドメイン本体へ行く前に役割を確認できます。', meta: `${products.length} entries` })}
  <section class="directory-section page-frame">
    <div class="product-list product-list--directory">${products.map((item) => productRow(item, base)).join('')}</div>
  </section>`

const productDetail = (product, base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { href: '/products/', label: 'Products' }, { label: product.name }], base)}
  <article>
    ${pageIntro({ label: product.category, title: product.name, description: product.summary, meta: product.domain })}
    <section class="detail-grid page-frame">
      <div class="detail-actions">
        ${textLink(product.url, 'Open service', base, true)}
        ${product.source ? textLink(product.source, 'View source', base, true) : '<p class="quiet-note">Source repository is not linked publicly from this hub.</p>'}
      </div>
      <div class="fact-list">
        ${product.facts.map((fact) => `<p>${escapeHtml(fact)}</p>`).join('')}
      </div>
    </section>
    <section class="related-section page-frame">
      <h2>Related docs</h2>
      <div class="doc-list">
        ${product.relatedDocs.map((path) => docs.find((doc) => doc.path === path)).filter(Boolean).map((doc) => docRow(doc, base)).join('')}
      </div>
    </section>
  </article>`

const projects = (base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { label: 'Projects' }], base)}
  ${pageIntro({ label: 'Map', title: 'Projects', description: 'プロダクト単体ではなく、R7 Labs 全体でどこが共通し、どこが独立しているかを見るページです。' })}
  <section class="project-map page-frame">
    <div class="project-map__lane">
      <h2>User-facing apps</h2>
      <p>日々の操作とデータは、それぞれのアプリが責任を持ちます。</p>
      ${['campusdeck', 'drive', 'moneyger'].map((slug) => productRow(products.find((item) => item.slug === slug), base)).join('')}
    </div>
    <div class="project-map__connector" aria-hidden="true"><span>shared by</span></div>
    <div class="project-map__lane project-map__lane--shared">
      <h2>Shared layer</h2>
      <p>認証や公開アセットなど、複数サービスで再利用する機能を分離します。</p>
      ${['account', 'assets'].map((slug) => productRow(products.find((item) => item.slug === slug), base)).join('')}
    </div>
  </section>
  <section class="project-source page-frame">
    <div><h2>Source</h2><p>公開リポジトリは GitHub Organization にまとめます。非公開の実装や秘密情報は、このrootサイトから露出しません。</p></div>
    ${textLink(site.github, 'Open GitHub organization', base, true)}
  </section>`

const docsIndex = (base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { label: 'Docs' }], base)}
  ${pageIntro({ label: 'Reference', title: 'Docs', description: 'R7 Labs の構成や責務を、rootサイトから参照できる範囲でまとめます。アプリ固有の操作説明は各サービス側に置きます。' })}
  <section class="docs-index page-frame">
    ${docs.map((doc) => `
      <a class="docs-index__item" href="${internalHref(doc.path, base)}">
        <strong>${escapeHtml(doc.title)}</strong>
        <p>${escapeHtml(doc.summary)}</p>
        <span>${escapeHtml(doc.keywords.join(' · '))}</span>
      </a>`).join('')}
  </section>`

const docArticle = ({ title, description, sections }, base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { href: '/docs/', label: 'Docs' }, { label: title }], base)}
  <article class="prose-page page-frame">
    <header><p class="prose-page__label">Docs</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></header>
    <div class="prose-sections">
      ${sections.map((section) => `<section><h2>${escapeHtml(section.title)}</h2>${section.html}</section>`).join('')}
    </div>
  </article>`

const ecosystemDoc = (base) => docArticle({
  title: 'Ecosystem',
  description: 'r7labs.dev のパス階層とサブドメインを、役割で分けます。',
  sections: [
    {
      title: 'Root domain',
      html: `<p><code>r7labs.dev/*</code> はハブ、ドキュメント、ブランド、法務などの静的コンテンツを担当します。サービス本体の状態やユーザーデータは持ちません。</p>
      <dl class="spec-list"><div><dt>/products/</dt><dd>使えるサービスの案内</dd></div><div><dt>/projects/</dt><dd>アプリと共通基盤の関係</dd></div><div><dt>/docs/</dt><dd>構成と運用の説明</dd></div><div><dt>/resources/</dt><dd>ソースと関連リンク</dd></div></dl>`,
    },
    {
      title: 'Subdomains',
      html: `<p>操作を伴うアプリや専用基盤はサブドメインへ分離します。rootはそれらの入口ですが、画面や認証を複製しません。</p>
      <dl class="spec-list">${products.map((item) => `<div><dt>${escapeHtml(item.domain)}</dt><dd>${escapeHtml(item.name)}</dd></div>`).join('')}</dl>`,
    },
    {
      title: 'Boundary',
      html: '<p>rootから外部サービスの内部状態を推測しません。ライブの稼働監視が必要になった場合は、監視データを持つ専用の仕組みを追加し、静的な「正常」表示を作らない方針です。</p>',
    },
  ],
}, base)

const hostingDoc = (base) => docArticle({
  title: 'Root hosting',
  description: 'rootサイトはビルド後の静的ファイルだけで成立します。',
  sections: [
    {
      title: 'Runtime',
      html: '<p>本番でNode.js、Worker、Function、データベースは必要ありません。ビルド時にHTML、CSS、JavaScript、検索インデックス、サイトマップを生成し、<code>dist/</code> をそのまま配信します。</p>',
    },
    {
      title: 'Cloudflare Pages',
      html: '<dl class="spec-list"><div><dt>Build command</dt><dd><code>npm run build</code></dd></div><div><dt>Output directory</dt><dd><code>dist</code></dd></div><div><dt>Functions</dt><dd>none</dd></div></dl>',
    },
    {
      title: 'GitHub Pages',
      html: '<p>同じ <code>dist/</code> を Pages artifact として公開できます。カスタムドメイン利用時も、アプリ側のサーバールーティングに依存せず、各ルートへ実体の <code>index.html</code> を出力します。</p>',
    },
  ],
}, base)

const accountDoc = (base) => docArticle({
  title: 'Account model',
  description: 'R7 Account は中央identity、各アプリは自分のドメインデータを持ちます。',
  sections: [
    {
      title: 'Central identity',
      html: '<p><code>accounts.r7labs.dev</code> がR7 Labs共通アカウントの正本です。対応サービスは OAuth 2.1 / OpenID Connect の Authorization Code + PKCE で認証情報を受け取ります。</p>',
    },
    {
      title: 'Service data',
      html: '<p>予定、シフト、取引、ファイルなどのサービス固有データまで中央アカウントへ集約しません。アプリは必要なローカル参照を持ちながら、identityの責務をAccountへ戻します。</p>',
    },
    {
      title: 'Root site',
      html: '<p>このrootサイト自体はログインを要求しません。Accountへのリンクと設計説明だけを持ち、セッションやユーザーデータを保存しません。</p>',
    },
  ],
}, base)

const resources = (base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { label: 'Resources' }], base)}
  ${pageIntro({ label: 'Links', title: 'Resources', description: '公開ソース、構成ドキュメント、各サービスへの入口をまとめます。' })}
  <section class="resource-grid page-frame">
    <a class="resource-block resource-block--wide" href="${internalHref('/resources/source/', base)}"><strong>Source directory</strong><p>公開リポジトリと各プロダクトの対応を見る。</p><span>Open →</span></a>
    <a class="resource-block" href="${internalHref('/docs/', base)}"><strong>Docs</strong><p>構成と責務を読む。</p><span>Open →</span></a>
    <a class="resource-block" href="${internalHref('/status/', base)}"><strong>Service links</strong><p>各サブドメインへの入口。</p><span>Open →</span></a>
  </section>`

const sourceDirectory = (base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { href: '/resources/', label: 'Resources' }, { label: 'Source' }], base)}
  ${pageIntro({ label: 'GitHub', title: 'Source directory', description: '公開されているR7 Labsリポジトリへの入口です。非公開リポジトリは一覧に含めません。' })}
  <section class="source-list page-frame">
    ${products.filter((item) => item.source).map((item) => `<div class="source-row"><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.domain)}</span></div>${textLink(item.source, 'Repository', base, true)}</div>`).join('')}
    <div class="source-row source-row--org"><div><strong>R7 Labs</strong><span>GitHub Organization</span></div>${textLink(site.github, 'Organization', base, true)}</div>
  </section>`

const about = (base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { label: 'About' }], base)}
  ${pageIntro({ label: 'R7 Labs', title: 'Small tools, shared foundations.', description: 'R7 Labs は、日常で使う小さなWebアプリと、それらを支える共通基盤を同じドメイン体系で管理するプロジェクトです。' })}
  <section class="about-grid page-frame">
    <div><h2>Build separately</h2><p>各アプリのデータ、UI、リリースは独立させます。共通化そのものを目的にしません。</p></div>
    <div><h2>Share deliberately</h2><p>アカウントや公開アセットのように、複数サービスで本当に共通になるものだけを共有層へ移します。</p></div>
    <div><h2>Keep the root light</h2><p>r7labs.dev は静的ハブです。案内のためだけにサーバーやデータベースを増やしません。</p></div>
  </section>`

const brand = (base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { label: 'Brand' }], base)}
  ${pageIntro({ label: 'Reference', title: 'Brand', description: 'rootサイトの表記とUIの最小ルール。各プロダクト固有のデザインを縛るものではありません。' })}
  <section class="brand-spec page-frame">
    <div class="brand-wordmark-sample" aria-label="R7 Labs wordmark">R7<span>Labs</span></div>
    <dl class="spec-list">
      <div><dt>Name</dt><dd>R7 Labs</dd></div>
      <div><dt>Domain</dt><dd>r7labs.dev</dd></div>
      <div><dt>Root display</dt><dd>Space Grotesk · Inter · JetBrains Mono</dd></div>
      <div><dt>Accent</dt><dd><span class="swatch" aria-hidden="true"></span> Cobalt signal</dd></div>
    </dl>
    <p class="quiet-note">ロゴ画像を必須にせず、テキスト表記を基本にします。サービス名は各プロダクトの正式表記を優先します。</p>
  </section>`

const status = (base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { label: 'Status' }], base)}
  ${pageIntro({ label: 'Service links', title: 'Status', description: 'このページはライブ監視ではありません。静的rootから実際の稼働状態を断定せず、各サービスの入口だけを示します。' })}
  <section class="status-list page-frame">
    <div class="status-note"><strong>Live monitoring</strong><span>Not provided by this static site</span></div>
    ${products.map((item) => `<div class="status-row"><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.domain)}</span></div>${textLink(item.url, 'Open', base, true)}</div>`).join('')}
  </section>`

const legalIndex = (base) => `
  ${breadcrumb([{ href: '/', label: 'Home' }, { label: 'Legal' }], base)}
  ${pageIntro({ label: 'Root site', title: 'Legal', description: 'r7labs.dev の静的rootサイトに関する方針です。各サブドメインの機能や保存データは、サービス側の実装が優先されます。' })}
  <section class="legal-index page-frame">
    ${docRow({ path: '/legal/privacy/', title: 'Privacy', summary: 'rootサイトが扱うデータと外部リクエスト。' }, base)}
    ${docRow({ path: '/legal/terms/', title: 'Terms', summary: 'rootサイトの案内情報と外部サービスへのリンク。' }, base)}
  </section>`

const privacy = (base) => docArticle({
  title: 'Privacy',
  description: 'r7labs.dev のrootサイトに限定したプライバシー方針。',
  sections: [
    { title: 'Data on root', html: '<p>rootサイトにはアカウント作成、問い合わせフォーム、独自解析、サーバーDBはありません。サイト内検索は配信済みの静的検索インデックスをブラウザ内で絞り込みます。</p>' },
    { title: 'External requests', html: '<p>表示用フォントは Google Fonts から読み込むため、ブラウザは <code>fonts.googleapis.com</code> と <code>fonts.gstatic.com</code> へリクエストします。外部サービスやGitHubへのリンクを開いた後は、その移動先の方針が適用されます。</p>' },
    { title: 'Subdomains', html: '<p>各サブドメインで認証やデータ保存を行う場合、その処理はrootサイトとは別です。このページはサブドメインの保存内容を包括的に説明するものではありません。</p>' },
  ],
}, base)

const terms = (base) => docArticle({
  title: 'Terms',
  description: 'r7labs.dev root に掲載する案内情報の扱い。',
  sections: [
    { title: 'Scope', html: '<p>rootサイトはR7 Labsのサービスと資料へ案内する静的ハブです。サービス固有の機能、アカウント、ユーザーデータは各サブドメインの実装範囲です。</p>' },
    { title: 'Availability', html: '<p>掲載リンクや機能は変更、停止されることがあります。Statusページもライブ監視値を提供せず、静的な正常性表示は行いません。</p>' },
    { title: 'External destinations', html: '<p>GitHubや各サブドメインなど、移動先で提供される内容にはその移動先の条件が適用されます。</p>' },
  ],
}, base)

const notFound = (base) => `
  <section class="not-found page-frame">
    <p class="not-found__code">404</p>
    <h1>Path not found.</h1>
    <p>このrootサイトには、そのパスの静的ページがありません。</p>
    ${textLink('/', 'Back home', base)}
  </section>`

export const makePages = (base = '/') => {
  const pages = [
    { route: '/', title: site.name, description: site.description, body: home(base), searchText: 'R7 Labs apps products docs projects account campusdeck drive moneyger assets' },
    { route: '/products/', title: 'Products', description: 'R7 Labs のプロダクトと共通サービス一覧。', body: productsIndex(base) },
    { route: '/projects/', title: 'Projects', description: 'R7 Labs のアプリと共通基盤の関係。', body: projects(base) },
    { route: '/docs/', title: 'Docs', description: 'R7 Labs の構成と運用ドキュメント。', body: docsIndex(base) },
    { route: '/docs/ecosystem/', title: 'Ecosystem', description: 'r7labs.dev のルートとサブドメイン構成。', body: ecosystemDoc(base) },
    { route: '/docs/hosting/', title: 'Root hosting', description: 'rootサイトの完全静的ホスティング構成。', body: hostingDoc(base) },
    { route: '/docs/account/', title: 'Account model', description: 'R7 Account と各サービスの責務分離。', body: accountDoc(base) },
    { route: '/resources/', title: 'Resources', description: 'R7 Labs のソースと関連リンク。', body: resources(base) },
    { route: '/resources/source/', title: 'Source directory', description: '公開されているR7 Labsリポジトリへの入口。', body: sourceDirectory(base) },
    { route: '/about/', title: 'About', description: 'R7 Labs の範囲と設計方針。', body: about(base) },
    { route: '/brand/', title: 'Brand', description: 'R7 Labs rootサイトの表記とUIリファレンス。', body: brand(base) },
    { route: '/status/', title: 'Status', description: 'R7 Labs各サービスの入口と監視方針。', body: status(base) },
    { route: '/legal/', title: 'Legal', description: 'R7 Labs rootサイトの法務情報。', body: legalIndex(base) },
    { route: '/legal/privacy/', title: 'Privacy', description: 'r7labs.dev rootサイトのプライバシー方針。', body: privacy(base) },
    { route: '/legal/terms/', title: 'Terms', description: 'r7labs.dev rootサイトの利用条件。', body: terms(base) },
    ...products.map((product) => ({
      route: `/products/${product.slug}/`,
      title: product.name,
      description: product.summary,
      body: productDetail(product, base),
      searchText: `${product.category} ${product.domain} ${product.facts.join(' ')}`,
    })),
  ]

  return { pages, notFound: { route: '/404.html', title: 'Not found', description: 'Page not found.', body: notFound(base) } }
}
