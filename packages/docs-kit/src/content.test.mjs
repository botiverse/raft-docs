import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { collectLocalePaths, routeForMarkdownPath } from './content.mjs'
import { defineDocsConfig } from './config.mjs'

function writeTree(root, files) {
  for (const file of files) {
    const target = join(root, file)
    mkdirSync(join(target, '..'), { recursive: true })
    writeFileSync(target, `# ${file}\n`)
  }
}

test('routeForMarkdownPath: index files map to directory routes', () => {
  assert.equal(routeForMarkdownPath('index.md', ''), '/')
  assert.equal(routeForMarkdownPath('welcome/index.md', ''), '/welcome/')
  assert.equal(routeForMarkdownPath('features/agents/index.md', ''), '/features/agents/')
  assert.equal(routeForMarkdownPath('welcome/index.md', 'zh-cn'), '/zh-cn/welcome/')
  assert.equal(routeForMarkdownPath('welcome/index.md', 'zh'), '/zh/welcome/')
  // Non-index files keep clean routes.
  assert.equal(routeForMarkdownPath('developers/raft-apps/publish.md', ''), '/developers/raft-apps/publish/')
  assert.equal(routeForMarkdownPath('getting-started.md', ''), '/getting-started/')
})

test('collectLocalePaths: derives per-locale route sets from the tree', () => {
  const root = mkdtempSync(join(tmpdir(), 'docs-kit-content-'))
  try {
    writeTree(root, [
      'content/index.md',
      'content/welcome/index.md',
      'content/features/agents/index.md',
      'content/developers/raft-apps/publish.md',
      'content/public/_redirects',
      'content/.drafts/skip-me.md',
      'content/zh-cn/index.md',
      'content/zh-cn/welcome/index.md',
    ])

    const config = defineDocsConfig({
      brand: { name: 'X' },
      locales: [
        { key: 'root', dir: '', label: 'English' },
        { key: 'zh-cn', dir: 'zh-cn', label: '简体中文' },
      ],
      output: { contentDir: 'content', outDir: 'out' },
    })

    const paths = collectLocalePaths(config, { root })
    assert.deepEqual([...paths.root].sort(), [
      '/',
      '/developers/raft-apps/publish/',
      '/features/agents/',
      '/welcome/',
    ])
    // public/ and dot dirs are skipped; zh routes carry the locale prefix.
    assert.deepEqual([...paths['zh-cn']].sort(), ['/zh-cn/', '/zh-cn/welcome/'])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('collectLocalePaths: a locale with no directory yields an empty set', () => {
  const root = mkdtempSync(join(tmpdir(), 'docs-kit-content-'))
  try {
    writeTree(root, ['docs/public/getting-started.md'])
    const config = defineDocsConfig({
      brand: { name: 'X' },
      locales: [
        { key: 'en', dir: '', label: 'English' },
        { key: 'zh', dir: 'zh', label: '中文' },
      ],
      output: { contentDir: 'docs/public', outDir: 'admin/public/docs' },
    })
    const paths = collectLocalePaths(config, { root })
    assert.deepEqual([...paths.en], ['/getting-started/'])
    assert.deepEqual([...paths.zh], [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
