import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defineDocsConfig,
  indexTwinPath,
  pageTwinPath,
  pageUrlPath,
} from './config.mjs'

// The two real shapes this factory has to express. Keeping them here as
// fixtures means any breaking change to the surface fails in the kit's own
// tests, before either site has to notice.
const raftDocs = defineDocsConfig({
  siteUrl: 'https://docs.raft.build',
  basePath: '/',
  routing: 'directory',
  locales: [
    { key: 'root', dir: '', label: 'English', htmlLang: 'en' },
    {
      key: 'zh-cn',
      dir: 'zh-cn',
      label: '简体中文',
      htmlLang: 'zh-CN',
      chrome: {
        language: '语言',
        languageAria: '切换语言',
        discoveryContractHeading: '发现入口',
        humanHtmlHeading: '面向人的 HTML 页面',
      },
    },
  ],
  twins: { page: 'collapse-index' },
  nav: { categories: [] },
  brand: { name: 'Raft', logo: '/logo.svg', home: '/', headerNav: [] },
  metadata: 'frontmatter',
  search: true,
  coverage: { baseline: 'scripts/i18n-coverage-baseline.txt', mode: 'enforce' },
  output: { contentDir: 'content', outDir: 'out' },
})

const hands = defineDocsConfig({
  siteUrl: 'https://hands.build',
  basePath: '/docs/',
  routing: 'flat',
  locales: [
    { key: 'en', dir: '', label: 'English', htmlLang: 'en' },
    { key: 'zh', dir: 'zh', label: '中文', htmlLang: 'zh-CN', chrome: { language: '语言' } },
  ],
  twins: {
    page: 'same-dir',
    index: {
      en: { name: 'docs.md', placement: 'out-parent' },
      zh: { name: 'zh.md', placement: 'out-root' },
    },
  },
  nav: {
    categories: ['Start here', 'For agents', 'Console', 'SDKs & API'],
    externals: [{ label: 'API explorer', href: '/api-docs', iconSvg: '<svg/>' }],
  },
  brand: {
    name: 'Hands',
    logo: '/favicon.svg',
    home: '/',
    headerNav: [
      { label: 'Docs', href: '/docs/' },
      { label: 'API explorer', href: '/api-docs' },
      { label: 'Login', href: '/api/auth/login?return=%2F', primary: true },
    ],
  },
  metadata: 'frontmatter',
  search: true,
  coverage: { baseline: 'docs/i18n-coverage-baseline.txt', mode: 'report' },
  output: { contentDir: 'docs/public', outDir: 'admin/public/docs' },
})

test('raft-docs fixture: directory routing, collapse-index twins', () => {
  assert.equal(raftDocs.basePath, '/')
  assert.equal(raftDocs.defaultLocale.key, 'root')
  assert.equal(raftDocs.locales[1].dir, 'zh-cn')
  // Page twins keep nested paths; index files collapse to <dir>.md.
  assert.equal(pageTwinPath(raftDocs, 'developers/raft-apps/publish.md'), 'developers/raft-apps/publish.md')
  assert.equal(pageTwinPath(raftDocs, 'developers/index.md'), 'developers.md')
  assert.equal(pageTwinPath(raftDocs, 'index.md'), 'index.md')
  // URL contract: / and /zh-cn/<slug>/.
  assert.equal(pageUrlPath(raftDocs, 'root', 'welcome'), '/welcome/')
  assert.equal(pageUrlPath(raftDocs, 'zh-cn', 'welcome'), '/zh-cn/welcome/')
  assert.equal(pageUrlPath(raftDocs, 'zh-cn', 'welcome', { twin: true }), '/zh-cn/welcome.md')
})

test('hands fixture: flat routing, explicit index-twins in two placements', () => {
  assert.equal(hands.basePath, '/docs/')
  assert.equal(hands.routing, 'flat')
  assert.equal(pageTwinPath(hands, 'getting-started.md'), 'getting-started.md')
  assert.equal(pageUrlPath(hands, 'en', 'getting-started'), '/docs/getting-started/')
  assert.equal(pageUrlPath(hands, 'zh', 'getting-started'), '/docs/zh/getting-started/')
  // The two placements are carried verbatim: /docs.md above out, /docs/zh.md inside.
  assert.deepEqual(indexTwinPath(hands, 'en'), { parentRelative: 'docs.md' })
  assert.deepEqual(indexTwinPath(hands, 'zh'), { outRelative: 'zh.md' })
})

test('validation: basePath, locales, placements, duplicates', () => {
  assert.throws(() => defineDocsConfig({ basePath: 'docs/', brand: { name: 'X' }, locales: [{ key: 'en', label: 'E' }] }), /basePath must start/)
  assert.throws(() => defineDocsConfig({ brand: { name: 'X' }, locales: [] }), /non-empty array/)
  assert.throws(
    () => defineDocsConfig({ brand: { name: 'X' }, locales: [{ key: 'en', label: 'E' }, { key: 'en', dir: 'zh', label: '中' }] }),
    /duplicate locale key/,
  )
  assert.throws(
    () => defineDocsConfig({ brand: { name: 'X' }, locales: [{ key: 'en', dir: 'shared', label: 'E' }, { key: 'zh', dir: 'shared', label: '中' }] }),
    /duplicate locale dir/,
  )
  assert.throws(
    () =>
      defineDocsConfig({
        brand: { name: 'X' },
        locales: [{ key: 'en', label: 'E' }],
        twins: { index: { en: { name: 'docs.md', placement: 'somewhere' } } },
      }),
    /placement must be one of/,
  )
  assert.throws(
    () =>
      defineDocsConfig({
        brand: { name: 'X' },
        locales: [{ key: 'en', label: 'E' }, { key: 'zh', dir: 'zh', label: '中' }],
        twins: {
          index: {
            en: { name: 'docs.md', placement: 'out-root' },
            zh: { name: 'docs.md', placement: 'out-root' },
          },
        },
      }),
    /duplicate index twin/,
  )
  assert.throws(() => defineDocsConfig({ locales: [{ key: 'en', label: 'E' }] }), /brand.name is required/)
  assert.throws(
    () => defineDocsConfig({ routing: 'spiral', brand: { name: 'X' }, locales: [{ key: 'en', label: 'E' }] }),
    /routing must be/,
  )
})

test('coverage and search defaults are safe', () => {
  const minimal = defineDocsConfig({
    brand: { name: 'X' },
    locales: [{ key: 'en', label: 'English' }],
  })
  assert.equal(minimal.coverage.mode, 'enforce')
  assert.equal(minimal.coverage.baseline, null)
  assert.equal(minimal.search, false)
  assert.equal(minimal.metadata, 'frontmatter')
  assert.equal(minimal.output.contentDir, 'content')
  assert.equal(minimal.output.outDir, 'out')
  // Frozen: consumers cannot corrupt a shared config.
  assert.ok(Object.isFrozen(minimal))
  assert.ok(Object.isFrozen(minimal.locales))
})
