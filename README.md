# R7 Labs root

`https://r7labs.dev/` 用の静的ハブです。各サブドメインのアプリをrootへ複製せず、**プロダクト探索・プロジェクト構成・ドキュメント・ブランド・ステータス案内・法務・公開リソース**を `r7labs.dev/*` のパス階層で提供します。

## Architecture

本番ランタイムは静的ファイルだけです。

```text
src/data + src/pages + src/lib
              │
              ▼
       node scripts/build.mjs
              │
              ▼
            dist/
      ┌───────┴────────┐
      ▼                ▼
Cloudflare Pages   GitHub Pages
```

- Node.js は**ビルド時だけ**使用します。
- npm runtime / build dependencies はありません。
- Cloudflare Workers / Pages Functions は使いません。
- サーバー / API / DB / KV / R2 はrootサイトのコア機能に不要です。
- 各ルートへ実体の `index.html` を生成するため、SPA fallbackやサーバールーティングに依存しません。
- サイト内検索はビルド済み `search-index.json` をブラウザ内で絞り込みます。
- `_headers` はCloudflare Pagesでセキュリティヘッダーを追加します。GitHub Pagesでは無視されてもサイト本体は動作します。

## Route map

| Route | Role |
| --- | --- |
| `/` | R7 Labs ecosystem index |
| `/products/` | 全プロダクト / 共通サービス |
| `/products/campusdeck/` | CampusDeck案内 |
| `/products/account/` | R7 Account案内 |
| `/products/drive/` | R7 Drive案内 |
| `/products/moneyger/` | Moneyger案内 |
| `/products/assets/` | R7 Assets案内 |
| `/projects/` | user-facing apps と shared layer の関係 |
| `/docs/` | rootドキュメント入口 |
| `/docs/ecosystem/` | root path / subdomainの責務 |
| `/docs/hosting/` | 完全静的ホスティング構成 |
| `/docs/account/` | R7 Accountと各サービスの責務分離 |
| `/resources/` | 関連リソース入口 |
| `/resources/source/` | 公開ソース一覧 |
| `/about/` | R7 Labsの範囲 / 設計方針 |
| `/brand/` | rootサイトの表記 / UIリファレンス |
| `/status/` | サービス入口と監視方針（ライブ監視値は捏造しない） |
| `/legal/` | root法務入口 |
| `/legal/privacy/` | rootプライバシー方針 |
| `/legal/terms/` | root利用条件 |
| `/404.html` | 静的404 |

## Design system

- UI/UX Pro Max の検索結果は `design-system/r7-labs-root/MASTER.md` に保存しています。検索時の分類にある「API Developer Portal」はデザイン探索用の推論で、サイト自体のプロダクト定義ではありません。
- 実サイトはR7 Labs全体の consumer/user-facing apps + shared services + projects + docs/resources を扱います。
- Hallmark: `Ecosystem Index` macrostructure / `Cobalt` visual discipline / `N11 Mega-menu` / `Ft1 Mast-headed`。
- `tokens.css` が色、書体、間隔、motion、z-indexの正本です。
- UIはmobile-first。320 / 375 / 414 / 768 pxを最低検証幅とします。

## Local development

Node.js 20以上が必要です。

```powershell
npm run build
npm run check
npm run dev
npm run visual-check
```

`npm run dev` は先に静的ビルドを行い、`http://127.0.0.1:4173` で `dist/` を配信します。別ポートは `PORT=xxxx` で変更できます。

`npm run visual-check` はローカルChromeをheadless/CDPで起動します。代表画面は320 / 375 / 414 / 768 / 1280 / 1440 CSS pxでスクリーンショットを残し、さらに**全20 route + 404を320pxと1280pxの両方**で巡回します。横overflow、見出し/landmark/lang、重複ID、表示中コントロールのaccessible name、モバイル44px touch targetを検査し、mobile menu、desktop mega-menu、focus return、Ctrl+K検索、検索のloading / empty / error state、reduced motionも実操作します。結果はgit管理外の `validation/report.json` とPNGへ保存します。Chromeが標準パス以外の場合は `CHROME_PATH` を指定してください。

## Cloudflare Pages

Cloudflare PagesのGit連携またはDirect Uploadで、次を設定します。

```text
Build command: npm run build
Build output directory: dist
Node.js: 20+
Functions: none
```

カスタムドメインを `r7labs.dev` に設定します。`public/_headers` はビルド時に `dist/_headers` へコピーされます。

## GitHub Pages

`.github/workflows/pages.yml` を同梱しています。GitHub PagesのSourceを **GitHub Actions** に設定すると、`main` pushまたは手動実行で次を行います。

1. `npm run build`
2. `npm run check`
3. `dist/` をPages artifactとしてupload
4. GitHub Pagesへdeploy

`public/CNAME` は `r7labs.dev` です。GitHub Pagesをサブパスでプレビューしたい場合だけ、ビルド時に `SITE_BASE=/repository-name/` を指定できます。本番のカスタムドメインでは既定の `/` のままです。

ゼロコスト前提でGitHub Pagesを使う場合は、Pagesを無料利用できるpublic repository構成にします。repositoryを非公開のまま維持する必要がある場合は、root配信先としてCloudflare Pagesの無料枠を使う構成を優先します。

## Content maintenance

プロダクト一覧・navの正本は `src/data/site.mjs` です。サービスを追加する場合は、まずここへ公開情報だけを追加し、必要なら個別 `/products/<slug>/` の内容を `src/pages.mjs` で拡張します。

rootサイトから次は行いません。

- サービスの認証UIを複製する
- アプリ固有データを読む / 保存する
- 非公開repository URLやsecretを掲載する
- 静的ページだけで「サービス正常」などのライブ状態を断定する

## Validation

`npm run check` は次を検査します。

- 全routeの実ファイル生成
- 内部リンクの静的解決
- 404 / CSS / JS / tokens / search index / sitemap / CNAME
- viewport / document language / 単一h1 / skip link / search dialog / 重複ID
- 外部new-tabリンクの `noopener noreferrer` と移動先ヒント
- 検索のloading / empty / error文言とactive-result semantics
- `SITE_BASE` を使うGitHub Pagesサブパス向け内部リンク生成
- Hallmark stamp、`overflow-x: clip`、focus-visible、reduced motion
- `100vw`、`overflow-x: hidden`、`transition: all`、純黒/純白などの禁止パターン
- dependency-free buildの維持
