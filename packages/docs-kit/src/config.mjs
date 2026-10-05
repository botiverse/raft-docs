/**
 * defineDocsConfig() — one declaration per docs site.
 *
 * The kit's scripts and the VitePress theme all read from this object instead
 * of hard-coding paths, locales and chrome. Two shapes are proven today:
 *
 *   raft-docs  directory routing, content/, zh-cn/, llms.txt agent artifacts,
 *              site at the origin root.
 *   hands      flat routing (slug = file name), content at docs/public/,
 *              locales en + zh, /docs base path, docs.md + zh.md index twins
 *              (the /docs.md index sits one level ABOVE the out dir).
 *
 * This module is pure: it validates and normalizes. `loadDocsConfig()` (below)
 * adds the one filesystem fact a factory call cannot know — the site root —
 * by locating the config file itself. It is public so any site can expose a
 * `docs.config.mjs` and any consumer can read it.
 *
 * Design notes (agreed with the reviewers before implementation):
 * - Locale `dir` doubles as the URL segment: '' for the default locale, 'zh'
 *   for Hands, 'zh-cn' for raft-docs. No hidden prefix logic.
 * - Index-twin placement is always explicit, never concatenated implicitly:
 *   `out-root` means inside the build output, `out-parent` means the sibling
 *   level above it (Hands' /docs.md is served from docs/.. — the Worker maps
 *   it; see the Hands migration notes).
 * - Navigation title/description/category/order come from frontmatter (or a
 *   future manifest); they are never derived from the H1, which carries prose
 *   ("Getting started: connect …") rather than the sidebar label.
 */

const PLACEMENTS = new Set(['out-root', 'out-parent'])
const ROUTINGS = new Set(['directory', 'flat'])
const METADATA_MODES = new Set(['frontmatter', 'manifest'])
const COVERAGE_MODES = new Set(['report', 'enforce'])
const TWIN_PAGE_MODES = new Set(['collapse-index', 'same-dir'])

function fail(message) {
  throw new Error(`docs.config: ${message}`)
}

function normalizeBasePath(value) {
  const raw = String(value ?? '/')
  if (raw === '' || raw === '/') return '/'
  if (!raw.startsWith('/')) fail(`basePath must start with "/": ${raw}`)
  return raw.endsWith('/') ? raw : `${raw}/`
}

function normalizeLocales(locales) {
  if (!Array.isArray(locales) || locales.length === 0) {
    fail('locales must be a non-empty array; the first entry is the default')
  }

  const keys = new Set()
  const dirs = new Set()
  return locales.map((locale, index) => {
    const { key, dir = '', label, htmlLang, chrome = {} } = locale ?? {}
    if (!key) fail(`locales[${index}] needs a key`)
    if (keys.has(key)) fail(`duplicate locale key: ${key}`)
    keys.add(key)
    if (dirs.has(dir)) fail(`duplicate locale dir: ${JSON.stringify(dir)}`)
    dirs.add(dir)
    if (dir.startsWith('/') || dir.endsWith('/')) {
      fail(`locale dir must be a bare segment or empty, got ${JSON.stringify(dir)}`)
    }
    if (!label) fail(`locale ${key} needs a label (shown in the language control)`)
    return Object.freeze({
      key,
      dir,
      label,
      htmlLang: htmlLang ?? key,
      chrome: Object.freeze({ ...chrome }),
      isDefault: index === 0,
    })
  })
}

function normalizeTwins(twins, locales) {
  const { page = 'collapse-index', index } = twins ?? {}
  if (!TWIN_PAGE_MODES.has(page)) {
    fail(`twins.page must be one of ${[...TWIN_PAGE_MODES].join(', ')}: ${page}`)
  }

  let indexResolved
  if (index != null) {
    indexResolved = {}
    const names = new Set()
    for (const locale of locales) {
      const entry = index[locale.key]
      if (!entry) continue
      const { name, placement } = entry
      if (!name || !name.endsWith('.md')) {
        fail(`twins.index.${locale.key}.name must be a .md file name`)
      }
      if (!PLACEMENTS.has(placement)) {
        fail(
          `twins.index.${locale.key}.placement must be one of ${[...PLACEMENTS].join(', ')}: ${placement}`,
        )
      }
      const qualified = `${placement}/${name}`
      if (names.has(qualified)) fail(`duplicate index twin: ${qualified}`)
      names.add(qualified)
      indexResolved[locale.key] = Object.freeze({ name, placement })
    }
    if (Object.keys(indexResolved).length === 0) {
      fail('twins.index must name at least one locale')
    }
    indexResolved = Object.freeze(indexResolved)
  }

  return Object.freeze({ page, ...(indexResolved ? { index: indexResolved } : {}) })
}

function normalizeNav(nav) {
  const categories = (nav?.categories ?? []).map(String)
  const externals = (nav?.externals ?? []).map((entry, i) => {
    if (!entry?.label || !entry?.href) {
      fail(`nav.externals[${i}] needs label and href`)
    }
    return Object.freeze({
      label: String(entry.label),
      href: String(entry.href),
      iconSvg: entry.iconSvg != null ? String(entry.iconSvg) : null,
    })
  })
  return Object.freeze({ categories: Object.freeze(categories), externals: Object.freeze(externals) })
}

function normalizeBrand(brand) {
  if (!brand?.name) fail('brand.name is required')
  const headerNav = (brand.headerNav ?? []).map((entry, i) => {
    if (!entry?.label || !entry?.href) fail(`brand.headerNav[${i}] needs label and href`)
    return Object.freeze({
      label: String(entry.label),
      href: String(entry.href),
      primary: Boolean(entry.primary),
    })
  })
  return Object.freeze({
    name: String(brand.name),
    logo: brand.logo != null ? String(brand.logo) : null,
    home: brand.home != null ? String(brand.home) : '/',
    headerNav: Object.freeze(headerNav),
  })
}

function normalizeCoverage(coverage) {
  const { baseline = null, mode = 'enforce' } = coverage ?? {}
  if (!COVERAGE_MODES.has(mode)) {
    fail(`coverage.mode must be 'report' or 'enforce': ${mode}`)
  }
  return Object.freeze({ baseline, mode })
}

/**
 * Validate and normalize one site declaration. Throws on invalid input; the
 * returned object is frozen and safe to pass around.
 */
export function defineDocsConfig(options = {}) {
  const {
    siteUrl,
    basePath = '/',
    routing = 'directory',
    locales,
    twins,
    nav,
    brand,
    metadata = 'frontmatter',
    frontmatterKeys,
    search = false,
    coverage,
    output,
  } = options

  if (siteUrl != null && String(siteUrl).endsWith('/')) {
    fail(`siteUrl must not end with "/": ${siteUrl}`)
  }
  if (!ROUTINGS.has(routing)) {
    fail(`routing must be 'directory' or 'flat': ${routing}`)
  }
  if (!METADATA_MODES.has(metadata)) {
    fail(`metadata must be 'frontmatter' or 'manifest': ${metadata}`)
  }

  const normalizedLocales = normalizeLocales(locales)
  const normalizedTwins = normalizeTwins(twins, normalizedLocales)
  const normalizedNav = normalizeNav(nav)
  const normalizedBrand = normalizeBrand(brand)
  const normalizedCoverage = normalizeCoverage(coverage)

  const keys = {
    title: 'title',
    description: 'description',
    category: 'category',
    order: 'order',
    ...(frontmatterKeys ?? {}),
  }

  return Object.freeze({
    siteUrl: siteUrl != null ? String(siteUrl) : null,
    basePath: normalizeBasePath(basePath),
    routing,
    locales: Object.freeze(normalizedLocales),
    defaultLocale: normalizedLocales[0],
    twins: normalizedTwins,
    nav: normalizedNav,
    brand: normalizedBrand,
    metadata,
    frontmatterKeys: Object.freeze(keys),
    search: Boolean(search),
    coverage: normalizedCoverage,
    output: Object.freeze({
      contentDir: output?.contentDir ?? 'content',
      outDir: output?.outDir ?? 'out',
    }),
  })
}

/**
 * Load the `docs.config.mjs` a site keeps at its root (or at `configPath`)
 * and return `{ config, root, configPath }` — `root` being the directory the
 * config file lives in, which every kit script can use as its `--root`.
 */
export async function loadDocsConfig({ root, configPath } = {}) {
  const { default: nodePath } = await import('node:path')
  const { pathToFileURL } = await import('node:url')
  const { accessSync } = await import('node:fs')

  const siteRoot = root ?? process.cwd()
  const file = configPath ?? nodePath.join(siteRoot, 'docs.config.mjs')
  try {
    accessSync(file)
  } catch {
    fail(`no config file found at ${file}`)
  }
  const module = await import(pathToFileURL(file).href)
  const config = module.default
  if (!config || typeof config !== 'object') {
    fail(`${file} must default-export the result of defineDocsConfig()`)
  }
  return { config, root: siteRoot, configPath: file }
}

/**
 * The URL path of a page in a locale: basePath + locale dir + slug (+ '/'
 * for HTML routes, '.md' for twins). Pure; used by scripts and tests to pin
 * the URL contract of a site.
 */
export function pageUrlPath(config, localeKey, slug, { twin = false } = {}) {
  const locale = config.locales.find((entry) => entry.key === localeKey)
  if (!locale) fail(`unknown locale: ${localeKey}`)
  const segments = [config.basePath, locale.dir ? `${locale.dir}/` : '', String(slug)]
  const joined = segments.join('').replace(/\/{2,}/g, '/')
  return twin ? `${joined}.md` : `${joined}/`
}

/**
 * Out-relative location of a page's markdown twin.
 * `collapse-index` (raft-docs): x/index.md -> x.md, index.md -> index.md.
 * `same-dir`: keep the path as authored (Hands' flat pages: slug.md).
 */
export function pageTwinPath(config, relativePath) {
  const file = relativePath.replace(/\.md$/, '')
  if (config.twins.page === 'same-dir') return `${file}.md`
  if (file === 'index') return 'index.md'
  if (file.endsWith('/index')) return `${file.slice(0, -'/index'.length)}.md`
  return `${file}.md`
}

/**
 * Where a locale's index twin lands: `{ outRelative }` for `out-root`
 * placement, `{ parentRelative }` for `out-parent` (Hands' /docs.md).
 */
export function indexTwinPath(config, localeKey) {
  const entry = config.twins.index?.[localeKey]
  if (!entry) fail(`no index twin declared for locale: ${localeKey}`)
  return entry.placement === 'out-root'
    ? { outRelative: entry.name }
    : { parentRelative: entry.name }
}
