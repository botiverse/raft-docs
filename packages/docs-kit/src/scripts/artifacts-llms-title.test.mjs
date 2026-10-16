import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

const here = dirname(fileURLToPath(import.meta.url))
const kitConfigUrl = pathToFileURL(join(here, '..', 'config.mjs')).href
const generator = join(here, 'generate-agent-artifacts.mjs')

// A two-locale site with llms.txt on. `locales` is the docs.config locales
// array source; one page per locale, with stub built HTML carrying the
// canonical + alternate links the artifact check requires.
function makeSite(locales) {
  const root = mkdtempSync(join(tmpdir(), 'docs-kit-llms-'))
  const write = (rel, content) => {
    const target = join(root, rel)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }

  write(
    'docs.config.mjs',
    `import { defineDocsConfig } from '${kitConfigUrl}'
export default defineDocsConfig({
  siteUrl: 'https://x.test',
  basePath: '/',
  routing: 'directory',
  locales: ${locales},
  brand: { name: 'X' },
  artifacts: { headers: false },
  output: { contentDir: 'content', outDir: 'out' },
})
`,
  )
  const page = (title) =>
    `---\ntitle: "${title}"\nllms_summary: "Read for ${title}."\nllms_section: "Start"\norder: 1\n---\n\n# ${title}\n`
  for (const route of ['a', 'zh/a']) {
    write(`content/${route}.md`, page(route))
    write(
      `out/${route}/index.html`,
      `<!doctype html><html><head>` +
        `<link rel="canonical" href="https://x.test/${route}/">` +
        `<link rel="alternate" type="text/markdown" href="https://x.test/${route}.md">` +
        `</head></html>`,
    )
  }
  return root
}

function run(root, extra = []) {
  return spawnSync(process.execPath, [generator, '--config', join(root, 'docs.config.mjs'), ...extra], {
    cwd: root,
    encoding: 'utf8',
  })
}

test('llms.txt: title/description come from each locale chrome', () => {
  const root = makeSite(`[
    { key: 'en', dir: '', label: 'English', chrome: {
      llmsTitle: 'Stamp Docs', llmsDescription: 'Stamp docs router.' } },
    { key: 'zh', dir: 'zh', label: '中文', chrome: {
      llmsTitle: 'Stamp 文档', llmsDescription: 'Stamp 中文文档入口。' } },
  ]`)
  try {
    const res = run(root)
    assert.equal(res.status, 0, res.stderr)

    const en = readFileSync(join(root, 'out', 'llms.txt'), 'utf8')
    assert.ok(en.startsWith('# Stamp Docs\n\n> Stamp docs router.\n'), en)
    assert.ok(en.includes('(https://x.test/a.md)'), 'en llms.txt lists the en page')
    assert.ok(!en.includes('zh/a'), 'en llms.txt excludes the zh page')

    const zh = readFileSync(join(root, 'out', 'zh', 'llms.txt'), 'utf8')
    assert.ok(zh.startsWith('# Stamp 文档\n\n> Stamp 中文文档入口。\n'), zh)
    assert.ok(zh.includes('(https://x.test/zh/a.md)'), 'zh llms.txt lists the zh page')
    assert.ok(!en.includes('Raft Docs') && !zh.includes('Raft Docs'))

    assert.equal(run(root, ['--check']).status, 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('llms.txt: without chrome keys, locale root keeps the Raft title', () => {
  const root = makeSite(`[
    { key: 'root', dir: '', label: 'English' },
    { key: 'zh-cn', dir: 'zh', label: '简体中文' },
  ]`)
  try {
    const res = run(root)
    assert.equal(res.status, 0, res.stderr)

    const en = readFileSync(join(root, 'out', 'llms.txt'), 'utf8')
    assert.ok(
      en.startsWith(
        '# Raft Docs\n\n> Public docs discovery router for agents, crawlers, and tools that need machine-readable Raft documentation.\n',
      ),
      en,
    )
    const zh = readFileSync(join(root, 'out', 'zh', 'llms.txt'), 'utf8')
    assert.ok(zh.startsWith('# Raft Docs zh-CN\n'), zh)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
