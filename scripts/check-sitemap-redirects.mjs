#!/usr/bin/env node
/**
 * Assert the built sitemap contains no URL that `_redirects` sends elsewhere.
 *
 * WHY: a page can exist as real content (so VitePress emits it into the
 * sitemap) while `_redirects` redirects it away. That puts 301 URLs in a file
 * whose entire job is to list canonical, directly-200 ones. Found on
 * docs.raft.build 2026-08-03: `/` and `/features/` were both listed, and both
 * of their destinations were already listed separately.
 *
 * The filter that prevents it lives in `.vitepress/config.mts`. This check
 * exists so that deleting the filter fails the build instead of silently
 * restoring the defect.
 *
 * Run after a build:  node scripts/check-sitemap-redirects.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITEMAP = resolve(root, 'out/sitemap.xml')
const REDIRECTS = resolve(root, 'content/public/_redirects')

function redirectSources() {
  const sources = new Map()
  for (const line of readFileSync(REDIRECTS, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [from, to] = trimmed.split(/\s+/)
    if (!from || !to || from.includes('*')) continue
    // Exact comparison, no slash normalisation: the table contains
    // canonicalisation rules like `/welcome -> /welcome/`, and normalising
    // that source into its own target would flag the real page as an error.
    if (from === to) continue
    sources.set(from, to)
  }
  return sources
}

function sitemapPaths() {
  const xml = readFileSync(SITEMAP, 'utf-8')
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) =>
    m[1].replace(/^https?:\/\/[^/]+/, ''),
  )
}

const sources = redirectSources()
const paths = sitemapPaths()

// Both inputs must be non-empty. A zero on either side would make this check
// pass for the same reason a broken parser does, and a check that cannot fail
// is worse than no check -- it stops anyone looking.
if (sources.size === 0) {
  console.error(`Parsed 0 redirect sources from ${REDIRECTS} — format changed?`)
  process.exit(1)
}
if (paths.length === 0) {
  console.error(`Parsed 0 URLs from ${SITEMAP} — did the build run?`)
  process.exit(1)
}

const offenders = paths.filter((p) => sources.has(p))

if (offenders.length > 0) {
  console.error(
    'Sitemap lists URLs that _redirects sends elsewhere:\n' +
      offenders.map((p) => `  - ${p} -> ${sources.get(p)}`).join('\n') +
      '\n\nA sitemap must contain only canonical, directly-200 URLs.' +
      '\nFix: the transformItems filter in .vitepress/config.mts.',
  )
  process.exit(1)
}

console.log(
  `sitemap-redirects OK — ${paths.length} sitemap URLs checked against ` +
    `${sources.size} redirect sources, no overlap.`,
)
