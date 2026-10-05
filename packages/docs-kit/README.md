# @botiverse/docs-kit

Reusable documentation-site kit, extracted from **raft-docs** (docs.raft.build).
Goal: a new product docs site is content plus a small config — not a fork of
another site's plumbing.

Status: **skeleton**. raft-docs consumes it (dogfood); the **Hands docs site is
the pilot** for the full migration (artin, #proj-hands b529da37 / e1183d38).

## Layout

```text
packages/docs-kit/
  src/scripts/          shared build scripts (importable and runnable)
  src/config.mts        planned: defineDocsConfig() factory   [not yet moved]
  src/theme/            planned: kit theme (index.ts + tokens) [not yet moved]
```

Moved so far:

- `src/scripts/redirect-rules.mjs` — `_redirects` parser/matcher, the single
  source of truth shared by the sitemap filter (`.vitepress/config.mts`) and
  `scripts/check-sitemap-redirects.mjs`. Pure functions, no root assumptions.
- `src/scripts/check-i18n-coverage.mjs` — translation coverage gate (per locale), parameterized
  by `--root` / `--content` / `--locale` / `--locale-label` / `--baseline`
  (defaults reproduce raft-docs' original invocation byte for byte; raft-docs
  runs it via `pnpm check:i18n-coverage -- --check`).

- `src/scripts/check-sitemap-redirects.mjs` — post-build sitemap/redirect
  overlap check (`--root`, `--out`, `--sitemap`, `--redirects`, `--self-test`).
- `src/scripts/generate-agent-artifacts.mjs` — per-page `.md` twins, plus
  config-driven artifacts: `llms.txt` (`artifacts.llms`, default on) and
  index twins from `twins.index` (heading/note text per locale from
  `chrome.markdownIndexTitle` / `markdownIndexNote`, items grouped by
  frontmatter category + order, links built on `basePath`); `_headers`
  (`artifacts.headers`, default on). Options: `--config`, `--root`,
  `--content`, `--out`, `--site-url`, `--prod`, `--prod-branch`, `--check`.
- `src/content.mjs` — content-tree facts: `collectLocalePaths()` derives each
  locale's route set from the Markdown tree (the language switcher consumes
  it via `themeConfig.docsKit.translated`); `routeForMarkdownPath()`.
- `src/theme/` — `createDocsTheme(config, options)`: the VitePress theme
  (Markdown-twin link, header CTA, travelling nav-tab indicator, per-page
  language hrefs that only offer existing counterparts), plus `custom.css`.

## `defineDocsConfig()`

One declaration per docs site (`docs.config.mjs` at the site root); the kit's
theme and scripts read from it instead of per-site wiring. Pure and validated;
`loadDocsConfig({ root })` locates and loads the file.

```js
import { defineDocsConfig } from '@botiverse/docs-kit/config'

export default defineDocsConfig({
  siteUrl: 'https://hands.build',
  basePath: '/docs/',
  routing: 'flat', // slug = file name (Hands); 'directory' is raft-docs
  locales: [
    { key: 'en', dir: '', label: 'English' },
    { key: 'zh', dir: 'zh', label: '中文', chrome: { language: '语言' } },
  ],
  twins: {
    page: 'same-dir',
    index: {
      en: { name: 'docs.md', placement: 'out-parent' },
      zh: { name: 'zh.md', placement: 'out-root' },
    },
  },
  nav: { categories: ['Start here'], externals: [{ label: 'API explorer', href: '/api-docs' }] },
  brand: { name: 'Hands', logo: '/favicon.svg', home: '/', headerNav: [] },
  search: true,
  coverage: { baseline: 'docs/i18n-coverage-baseline.txt', mode: 'report' },
  output: { contentDir: 'docs/public', outDir: 'admin/public/docs' },
})
```

Contracts kept explicit on purpose: locale `dir` doubles as the URL segment;
index-twin placement is `out-root` or `out-parent` (never implicitly joined);
navigation title/description/category/order come from frontmatter, not the
H1. Both real shapes (raft-docs, Hands) are pinned in `src/config.test.mjs`.

Frontmatter `order` is **unique per locale** (not per category): an EN page
and its translation may share an order, two pages in the same locale may not
— the generator rejects duplicates by name at build time. Index twins are
generated after the site build (the artifact check reads the built HTML), so
wire `vite build` before the generator.

Planned moves, in order (each one PR, behavior-preserving):

1. Hands migration: flatten its 16-page generator onto the kit, preserving
   the 8 URL contracts (`/docs/<slug>/`, `.md` twins, `/docs/zh/…`,
   `/docs.md`, `/docs/zh.md`).

## `--config` adoption

Every script accepts `--config <path>` (a site's `docs.config.mjs`) and takes
its defaults from the declaration: root (the config file's dir), content/out
dirs, site URL, coverage baseline + mode, the locale list, and the
`_redirects` table (`redirects.file`, with the matcher teeth opted in per site
via `redirects.selfTest`). Explicit flags still win over the config; raft-docs
runs everything through `--config docs.config.mjs` with byte-identical output.
`coverage.mode: 'report'` lists regressions without failing the build.

## Content conventions (agreed with gzj, #proj-hands e1183d38)

- A page is `content/<slug>/index.md`; images live beside the Markdown.
- Locales are directories, fully configurable: `locales[].dir` +
  `locales[].pathPrefix` (raft: `zh-cn/` → `/zh-cn/…`; hands: `zh/` →
  `/docs/zh/…`). Translation pairing is **derived by scanning for the same
  relative path**, never declared by hand.
- URL compatibility is configuration: raft keeps `/welcome/` + `/<page>.md`;
  hands keeps `/docs/<slug>/` + `/docs/<slug>.md`.
- Internal links are written as source filenames (`permissions.md`); the build
  resolves them to the target language's page when translated, else falls back
  to the reference-language page.
- Page `description` should come from frontmatter (single source), not a
  parallel config list.
- Optional: strip preview markers (`[Screenshot:]` / `[[preview]]`) from
  production output.

## Gates the kit owns

- i18n coverage / translation coverage per locale (missing translations need explicit baseline entries) —
  `pnpm check:i18n-coverage -- --check`.
- sitemap ↔ `_redirects` consistency (no redirected URL in the sitemap) —
  `pnpm check:sitemap-redirects`; matcher self-test:
  `pnpm check:redirect-matcher` (`--self-test`, 10 cases).
- Markdown twin completeness for every page (agent-artifacts check, planned).

## Ownership

- Site engineering, build scripts, deploy wiring: @Kirby.
- Content model, directory conventions, visual spec: @gzj.

## Publishing

The kit ships to public npm as `@botiverse/docs-kit` (precedents:
`@botiverse/hands-cli`, `@botiverse/hands-feedback-react`), so other repos —
the Hands docs site first — consume it with a pinned version. VitePress,
vitepress-plugin-tabs and Vue are **peer dependencies**: each site installs
them itself and controls the major version (VitePress themes are
version-sensitive).

Release flow (`.github/workflows/publish-docs-kit.yml`, trusted publishing,
no long-lived token; the job runs in the dedicated `npm-docs-kit`
environment):

1. Bump `version` in this package.json, merge to main.
2. Tag `docs-kit-v<version>` (or `workflow_dispatch` with the version; the
   workflow refuses a mismatch) — dispatch with `dry_run: true` first when in
   doubt.
3. The workflow uses **staged publishing** (`npm stage publish`): the version
   lands in npm's staging area and goes live only after a maintainer confirms
   it on npmjs.com. Until then the registry keeps showing the previous
   version.
4. Consumers pin the exact version (e.g. `"@botiverse/docs-kit": "0.1.0"`).
