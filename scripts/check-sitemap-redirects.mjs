#!/usr/bin/env node
/**
 * Assert the built sitemap contains no URL that `_redirects` sends elsewhere.
 *
 * WHY: a page can exist as real content (so VitePress emits it into the
 * sitemap) while `_redirects` redirects it away. That puts 301/302 URLs in a
 * file whose entire job is to list canonical, directly-200 ones. Found on
 * docs.raft.build 2026-08-03: `/` and `/features/` were both listed, and both
 * of their destinations were already listed separately.
 *
 * The filter that prevents it lives in `.vitepress/config.mts`. This check
 * exists so that deleting the filter fails the build instead of silently
 * restoring the defect. Both share scripts/redirect-rules.mjs: the first
 * version of this pair had two separate implementations that each skipped
 * wildcard rules, so the check reported "no URL is redirected away" while
 * `/agent-knowledge/*` went unexamined -- a claim wider than its coverage.
 *
 * Run after a build:  node scripts/check-sitemap-redirects.mjs
 * Matcher self-test:  node scripts/check-sitemap-redirects.mjs --self-test
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseRedirectRules, redirectTargetFor } from './redirect-rules.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITEMAP = resolve(root, 'out/sitemap.xml')
const REDIRECTS = resolve(root, 'content/public/_redirects')

function sitemapPaths() {
  const xml = readFileSync(SITEMAP, 'utf-8')
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) =>
    m[1].replace(/^https?:\/\/[^/]+/, ''),
  )
}

/**
 * Regression teeth for the matcher, run against the REAL redirect table.
 *
 * These exist because the two defects found so far were both in matching, not
 * in plumbing: slash-normalising a canonicalisation source onto its own target
 * (which deleted /welcome/), and skipping wildcard rules (which let
 * /agent-knowledge/<anything>/ through). Neither is visible in a URL count.
 */
function selfTest() {
  const rules = parseRedirectRules(readFileSync(REDIRECTS, 'utf-8'))
  const cases = [
    // [path, should be treated as redirected away]
    ['/', true], //                       exact rule -> /welcome/
    ['/features/', true], //              exact rule -> /features/server/
    ['/welcome/', false], //              destination; the `/welcome -> /welcome/`
    //                                    canonicalisation rule must not hit it
    ['/features/server/', false], //      destination
    ['/agent-knowledge/review-probe/', true], // terminal wildcard, the case
    //                                    @meichen proved was leaking
    ['/agent-knowledge/', true], //       wildcard prefix boundary
    ['/features/agents/', false], //      real page under a redirected parent
    ['/developers/login-with-raft/', false], // destination of /developers
  ]

  const failures = []
  for (const [path, expected] of cases) {
    const got = redirectTargetFor(path, rules) !== null
    if (got !== expected) {
      failures.push(
        `  ${path} -> treated as ${got ? 'redirected' : 'canonical'}, expected ` +
          `${expected ? 'redirected' : 'canonical'}`,
      )
    }
  }

  if (failures.length > 0) {
    console.error('redirect matcher self-test FAILED:\n' + failures.join('\n'))
    process.exit(1)
  }
  console.log(`redirect matcher self-test OK — ${cases.length} cases.`)
}

selfTest()

if (process.argv.includes('--self-test')) process.exit(0)

const rules = parseRedirectRules(readFileSync(REDIRECTS, 'utf-8'))
const paths = sitemapPaths()

// Both inputs must be non-empty. A zero on either side would make this check
// pass for the same reason a broken parser does, and a check that cannot fail
// is worse than no check -- it stops anyone looking. (parseRedirectRules
// throws on an empty table, so only the sitemap side needs asserting here.)
if (paths.length === 0) {
  console.error(`Parsed 0 URLs from ${SITEMAP} — did the build run?`)
  process.exit(1)
}

const offenders = paths
  .map((p) => [p, redirectTargetFor(p, rules)])
  .filter(([, target]) => target !== null)

if (offenders.length > 0) {
  console.error(
    'Sitemap lists URLs that _redirects sends elsewhere:\n' +
      offenders.map(([p, t]) => `  - ${p} -> ${t}`).join('\n') +
      '\n\nA sitemap must contain only canonical, directly-200 URLs.' +
      '\nFix: the transformItems filter in .vitepress/config.mts.',
  )
  process.exit(1)
}

console.log(
  `sitemap-redirects OK — ${paths.length} sitemap URLs checked against ` +
    `${rules.length} redirect rules, no overlap.`,
)
