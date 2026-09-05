export const site = {
  name: 'R7 Labs',
  host: 'r7labs.dev',
  origin: 'https://r7labs.dev',
  description: 'R7 Labs のプロダクト、ドキュメント、リソースをまとめる静的ハブ。',
  github: 'https://github.com/r7labs',
  year: '2026',
}

export const products = [
  {
    slug: 'campusdeck',
    name: 'CampusDeck',
    category: 'Study',
    summary: '授業、予定、シフトをひとつのカレンダーで管理する学生向けWebアプリ。',
    domain: 'campusdeck.r7labs.dev',
    url: 'https://campusdeck.r7labs.dev/',
    source: 'https://github.com/r7labs/CampusDeck',
    facts: [
      '授業・予定・シフトを同じカレンダーで扱う',
      '時間割と勤務情報を同じサービス内で管理する',
      '共通アカウントは R7 Account と連携する',
    ],
    relatedDocs: ['/docs/account/', '/docs/ecosystem/'],
  },
  {
    slug: 'account',
    name: 'R7 Account',
    category: 'Identity',
    summary: 'R7 Labs 各サービスの認証とプロフィールをまとめる中央アカウント。',
    domain: 'accounts.r7labs.dev',
    url: 'https://accounts.r7labs.dev/',
    source: 'https://github.com/r7labs/accounts',
    facts: [
      'OAuth 2.1 / OpenID Connect の Authorization Code + PKCE を使用',
      'サービスごとのDBと中央identityを分離する',
      'アカウント設定を accounts.r7labs.dev に集約する',
    ],
    relatedDocs: ['/docs/account/', '/docs/ecosystem/'],
  },
  {
    slug: 'drive',
    name: 'R7 Drive',
    category: 'Storage',
    summary: '保存先を抽象化し、ひとつのファイルUIから扱う個人用Drive。',
    domain: 'drive.r7labs.dev',
    url: 'https://drive.r7labs.dev/',
    source: 'https://github.com/r7labs/drive',
    facts: [
      '静的フロントエンドを中心に構成する',
      'ファイルUIとStorage Providerを分離する',
      'フォルダ、検索、移動、ゴミ箱を同じUIで扱う',
    ],
    relatedDocs: ['/docs/ecosystem/', '/docs/hosting/'],
  },
  {
    slug: 'moneyger',
    name: 'Moneyger',
    category: 'Finance',
    summary: '資産、負債、予算、取引をブラウザ内で管理するローカルファースト家計簿。',
    domain: 'moneyger.r7labs.dev',
    url: 'https://moneyger.r7labs.dev/',
    source: 'https://github.com/r7labs/moneyger',
    facts: [
      '初期構成は IndexedDB に保存する',
      '取引、残高、予算、貯金を一つのデータモデルで扱う',
      '将来のHTTP Repositoryへ差し替えられる構造を持つ',
    ],
    relatedDocs: ['/docs/ecosystem/', '/docs/hosting/'],
  },
  {
    slug: 'assets',
    name: 'R7 Assets',
    category: 'Infrastructure',
    summary: 'R7 Labs 各サービスで使う公開用の静的アセットをパス単位で管理する基盤。',
    domain: 'assets.r7labs.dev',
    url: 'https://assets.r7labs.dev/',
    source: null,
    facts: [
      'リポジトリ内パスと公開URLを対応させる',
      '画像、アイコン、動画などの静的ファイルを扱う',
      '管理操作は認証された管理画面に分離する',
    ],
    relatedDocs: ['/docs/ecosystem/', '/resources/source/'],
  },
]

export const docs = [
  {
    path: '/docs/ecosystem/',
    title: 'Ecosystem',
    summary: 'r7labs.dev のパス階層とサブドメインの役割分担。',
    keywords: ['domain', 'subdomain', 'architecture'],
  },
  {
    path: '/docs/hosting/',
    title: 'Root hosting',
    summary: 'rootサイトを静的出力だけで配信するための構成。',
    keywords: ['cloudflare pages', 'github pages', 'static'],
  },
  {
    path: '/docs/account/',
    title: 'Account model',
    summary: 'R7 Account と各サービスの責務境界。',
    keywords: ['account', 'oidc', 'identity'],
  },
]

export const utilityRoutes = [
  { path: '/projects/', title: 'Projects', summary: 'アプリと共通基盤の関係を横断して見る。' },
  { path: '/about/', title: 'About', summary: 'R7 Labs の範囲と設計方針。' },
  { path: '/brand/', title: 'Brand', summary: 'rootサイトの表記とUIルール。' },
  { path: '/status/', title: 'Status', summary: 'サービス入口と監視方針。' },
  { path: '/resources/', title: 'Resources', summary: 'ソース、ドキュメント、関連リンク。' },
  { path: '/legal/', title: 'Legal', summary: 'rootサイトのプライバシーと利用条件。' },
]

export const navGroups = [
  {
    id: 'products',
    label: 'Products',
    columns: [
      {
        title: 'Apps',
        items: products.filter((item) => item.category !== 'Infrastructure').map((item) => ({
          href: `/products/${item.slug}/`,
          title: item.name,
          description: item.summary,
        })),
      },
      {
        title: 'Infrastructure',
        items: products.filter((item) => item.category === 'Infrastructure').map((item) => ({
          href: `/products/${item.slug}/`,
          title: item.name,
          description: item.summary,
        })),
      },
      {
        title: 'Directory',
        items: [
          { href: '/products/', title: 'All products', description: '全プロダクトを一覧する。' },
          { href: '/status/', title: 'Service links', description: '各サービスの入口を確認する。' },
        ],
      },
    ],
  },
  {
    id: 'explore',
    label: 'Explore',
    columns: [
      {
        title: 'Reference',
        items: [
          { href: '/projects/', title: 'Projects', description: 'アプリと基盤の関係を見る。' },
          { href: '/docs/', title: 'Docs', description: '構成と運用の説明。' },
          { href: '/resources/', title: 'Resources', description: 'ソースと関連リンク。' },
        ],
      },
      {
        title: 'R7 Labs',
        items: [
          { href: '/about/', title: 'About', description: 'このドメインが扱う範囲。' },
          { href: '/brand/', title: 'Brand', description: 'rootサイトの表記とUI。' },
        ],
      },
      {
        title: 'Operations',
        items: [
          { href: '/status/', title: 'Status', description: '監視方針とサービス入口。' },
          { href: '/legal/', title: 'Legal', description: 'プライバシーと利用条件。' },
        ],
      },
    ],
  },
]
