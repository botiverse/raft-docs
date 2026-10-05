import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

const here = dirname(fileURLToPath(import.meta.url))
const kitConfigUrl = pathToFileURL(join(here, '..', 'config.mjs')).href
const generator = join(here, 'generate-agent-artifacts.mjs')

// A Hands-shaped site: flat slugs, frontmatter metadata, two index twins in
// different placements, llms.txt/_headers off.
function makeSite() {
  const root = mkdtempSync(join(tmpdir(), 'docs-kit-twins-'))
  const write = (rel, content) => {
    const target = join(root, rel)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  const page = (title, description, category, order) =>
    `---\ntitle: "${title}"\ndescription: "${description}"\ncategory: "${category}"\norder: ${order}\n---\n\n# ${title} prose\n`

  write(
    'docs.config.mjs',
    `import { defineDocsConfig } from '${kitConfigUrl}'
export default defineDocsConfig({
  siteUrl: 'https://x.test',
  basePath: '/d/',
  routing: 'flat',
  locales: [
    { key: 'en', dir: '', label: 'English', htmlLang: 'en', chrome: {
      markdownIndexTitle: '# X Documentation',
      markdownIndexNote: 'Machine-readable index.',
    } },
    { key: 'zh', dir: 'zh', label: '中文', htmlLang: 'zh-CN', chrome: {
      markdownIndexTitle: '# X 文档',
      markdownIndexNote: '机器可读索引。',
      categories: { 'Start here': '起' },
    } },
  ],
  twins: {
    page: 'same-dir',
    index: {
      en: { name: 'docs.md', placement: 'out-parent' },
      zh: { name: 'zh.md', placement: 'out-root' },
    },
  },
  nav: { categories: ['Start here', 'Console'], externals: [] },
  brand: { name: 'X' },
  artifacts: { llms: false, headers: false },
  output: { contentDir: 'content', outDir: 'out' },
})
`,
  )
  write('content/a.md', page('A', 'desc A', 'Start here', 1))
  write('content/b.md', page('B', 'desc B', 'Console', 2))
  write('content/zh/a.md', page('A 中文', 'desc A', 'Start here', 1))

  // Stub built HTML: the artifact check requires canonical + alternate links.
  for (const [dir, slug, locale] of [
    ['out', 'a', ''],
    ['out', 'b', ''],
    ['out', 'zh', 'zh/'],
  ]) {
    const target = locale
      ? join(root, dir, slug, 'a/index.html') // zh page lives at out/zh/a/
      : join(root, 'out', slug, 'index.html')
    mkdirSync(dirname(target), { recursive: true })
    const route = slug === 'zh' ? 'zh/a' : slug
    writeFileSync(
      target,
      `<!doctype html><html><head>` +
        `<link rel="canonical" href="https://x.test/d/${route}/">` +
        `<link rel="alternate" type="text/markdown" href="https://x.test/d/${route}.md">` +
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

test('index twins: per-locale chrome, basePath links, correct placements', () => {
  const root = makeSite()
  try {
    const res = run(root)
    assert.equal(res.status, 0, res.stderr)

    const en = spawnSync('cat', [join(root, 'docs.md')], { encoding: 'utf8' }).stdout
    assert.equal(
      en,
      '# X Documentation\n\nMachine-readable index.\n\n## Start here\n\n- [A](/d/a.md) — desc A\n\n## Console\n\n- [B](/d/b.md) — desc B\n',
    )

    const zh = spawnSync('cat', [join(root, 'out', 'zh.md')], { encoding: 'utf8' }).stdout
    assert.equal(zh, '# X 文档\n\n机器可读索引。\n\n## 起\n\n- [A 中文](/d/zh/a.md) — desc A\n')

    // artifacts toggles honoured
    assert.ok(!existsSync(join(root, 'out', 'llms.txt')))
    assert.ok(!existsSync(join(root, 'out', '_headers')))
    // page twins written
    assert.ok(existsSync(join(root, 'out', 'a.md')))
    assert.ok(existsSync(join(root, 'out', 'zh', 'a.md')))

    // --check passes when fresh, fails when an index twin drifts
    assert.equal(run(root, ['--check']).status, 0)
    writeFileSync(join(root, 'docs.md'), 'tampered\n')
    const stale = run(root, ['--check'])
    assert.equal(stale.status, 1)
    assert.match(stale.stderr + stale.stdout, /docs\.md is stale/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('contentExclude skips draft trees; the home page stays out of index twins', () => {
  const root = makeSite()
  try {
    const cfg = join(root, 'docs.config.mjs')
    writeFileSync(
      cfg,
      readFileSync(cfg, 'utf8').replace(
        "output: { contentDir: 'content', outDir: 'out' }",
        "output: { contentDir: 'content', outDir: 'out', contentExclude: ['drafts'] }",
      ),
    )
    // Home page: navigation metadata is optional for index.md.
    writeFileSync(join(root, 'content', 'index.md'), '---\ntitle: "Home"\ndescription: "Home page"\n---\n\n# xdocs home\n')
    // Draft tree: must be skipped entirely (no validation, no twins).
    mkdirSync(join(root, 'content', 'drafts'), { recursive: true })
    writeFileSync(join(root, 'content', 'drafts', 'wip.md'), '# Work in progress\n')
    // Stub HTML for the home page (canonical + alternate required by the check).
    writeFileSync(
      join(root, 'out', 'index.html'),
      '<!doctype html><html><head>' +
        '<link rel="canonical" href="https://x.test/d/">' +
        '<link rel="alternate" type="text/markdown" href="https://x.test/d/index.md">' +
        '</head></html>',
    )

    const res = run(root)
    assert.equal(res.status, 0, res.stderr)

    const en = readFileSync(join(root, 'docs.md'), 'utf8')
    assert.ok(!en.includes('Home'), 'home page must not be listed in the index twin')
    assert.ok(en.includes('- [A](/d/a.md)'), 'regular pages still listed')
    assert.ok(existsSync(join(root, 'out', 'index.md')), 'home page twin still written')
    assert.ok(!existsSync(join(root, 'out', 'drafts', 'wip.md')), 'draft twins not written')
    assert.equal(run(root, ['--check']).status, 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
