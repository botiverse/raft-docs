import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

const here = dirname(fileURLToPath(import.meta.url))
const kitConfigUrl = pathToFileURL(join(here, '..', 'config.mjs')).href
const coverageScript = join(here, 'check-i18n-coverage.mjs')
const sitemapScript = join(here, 'check-sitemap-redirects.mjs')

function makeSite({ coverageMode = 'report', sitemap = null, redirects = '' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'docs-kit-adopt-'))
  const write = (rel, content) => {
    const target = join(root, rel)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  write(
    'docs.config.mjs',
    `import { defineDocsConfig } from '${kitConfigUrl}'
export default defineDocsConfig({
  siteUrl: 'https://example.test',
  locales: [
    { key: 'en', dir: '', label: 'English', htmlLang: 'en' },
    { key: 'zh', dir: 'zh', label: '中文', htmlLang: 'zh-CN' },
  ],
  brand: { name: 'X' },
  coverage: { baseline: 'baseline.txt', mode: '${coverageMode}' },
  output: { contentDir: 'content', outDir: 'out' },
})
`,
  )
  write('content/a.md', '# A\n')
  write('content/b.md', '# B\n') // untranslated, and not in the baseline
  write('content/zh/a.md', '# A zh\n')
  write('baseline.txt', '')
  write('content/public/_redirects', redirects)
  if (sitemap) {
    write('out/sitemap.xml', sitemap)
    // The check verifies each sitemap URL has a built page (and no meta refresh).
    write('out/welcome/index.html', '<!doctype html><html><body>ok</body></html>')
  }
  return root
}

function run(script, root, extra = []) {
  return spawnSync(process.execPath, [script, '--config', join(root, 'docs.config.mjs'), ...extra], {
    cwd: root,
    encoding: 'utf8',
  })
}

test('report mode lists regressions without failing the build', () => {
  const root = makeSite({ coverageMode: 'report' })
  try {
    const res = run(coverageScript, root, ['--check'])
    assert.equal(res.status, 0)
    assert.match(res.stdout, /# zh-CN documentation coverage/)
    assert.match(res.stdout, /New missing pages \(not in baseline\): \*\*1\*\*/)
    assert.match(res.stderr, /report/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('enforce mode fails on the same regressions', () => {
  const root = makeSite({ coverageMode: 'enforce' })
  try {
    const res = run(coverageScript, root, ['--check'])
    assert.equal(res.status, 1)
    assert.match(res.stdout, /New missing pages \(not in baseline\): \*\*1\*\*/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('sitemap check resolves root and out dir from the config', () => {
  const clean = makeSite({
    sitemap: `<?xml version="1.0"?><urlset><url><loc>https://example.test/welcome/</loc></url></urlset>`,
    // One valid rule elsewhere: an empty table is rejected by design.
    redirects: '/old/ /new/ 302\n',
  })
  try {
    const res = run(sitemapScript, clean)
    assert.equal(res.status, 0)
    assert.match(res.stdout, /1 sitemap URLs checked/)
  } finally {
    rmSync(clean, { recursive: true, force: true })
  }

  const overlapping = makeSite({
    sitemap: `<?xml version="1.0"?><urlset><url><loc>https://example.test/welcome/</loc></url></urlset>`,
    redirects: '/welcome/ /other/ 302\n',
  })
  try {
    const res = run(sitemapScript, overlapping)
    assert.equal(res.status, 1)
    assert.match(res.stderr + res.stdout, /welcome/)
  } finally {
    rmSync(overlapping, { recursive: true, force: true })
  }
})
