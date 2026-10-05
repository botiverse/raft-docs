/**
 * Content-tree helpers: facts the build needs that come from reading the
 * Markdown tree (as opposed to `config.mjs`, which is pure).
 *
 * The first consumer: the language switcher. Its per-page hrefs must only
 * offer a counterpart when that counterpart actually exists, and the set of
 * existing translations must be derived from the tree — the hand-maintained
 * `translatedZhPaths` list it replaces drifted silently whenever a page was
 * added, and the drift was invisible on a 100%-translated site.
 */
import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Walk `<root>/<contentDir>/[<localeDir>/]**\/*.md` for every locale and
 * return `{ [localeKey]: Set<urlPath> }` where urlPath is the site-root
 * relative route WITHOUT the base path: '/welcome/', '/zh-cn/welcome/'.
 *
 * - `index.md` files map to their directory route ('/x/index.md' → '/x/').
 * - Non-index files map to their clean route ('/x/guide.md' → '/x/guide/').
 * - `public/` and dot-directories are skipped, mirroring the artifacts
 *   generator's walk.
 */
export function collectLocalePaths(config, { root }) {
  const result = {}
  const contentRoot = resolve(root, config.output.contentDir)

  for (const locale of config.locales) {
    const dir = resolve(contentRoot, locale.dir)
    // A locale directory is a top-level segment; when walking another
    // locale's tree, skip its siblings' segments or they leak in (the root
    // locale would otherwise claim every /zh/... route as its own).
    const skip = new Set(
      config.locales
        .filter((other) => other.key !== locale.key && other.dir)
        .map((other) => other.dir.split('/')[0]),
    )
    const paths = new Set()
    for (const file of listMarkdownFiles(dir, { prefix: '', skip })) {
      paths.add(routeForMarkdownPath(file, locale.dir))
    }
    result[locale.key] = paths
  }

  return result
}

function listMarkdownFiles(dir, { prefix = '', skip = new Set() } = {}) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const files = []
  for (const entry of entries) {
    if (entry.name === 'public' || entry.name.startsWith('.') || skip.has(entry.name)) continue
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(join(dir, entry.name), { prefix: relative, skip }))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relative)
    }
  }
  return files.sort()
}

/**
 * `localeDir` is prepended to the route when non-empty, matching the URL
 * layout (locale dir doubles as the URL segment; see config.mjs).
 */
export function routeForMarkdownPath(relativePath, localeDir) {
  let route
  if (relativePath === 'index.md') {
    route = '/'
  } else if (relativePath.endsWith('/index.md')) {
    route = `/${relativePath.slice(0, -'/index.md'.length)}/`
  } else {
    route = `/${relativePath.replace(/\.md$/, '/')}`
  }
  return localeDir ? `/${localeDir}${route}` : route
}
