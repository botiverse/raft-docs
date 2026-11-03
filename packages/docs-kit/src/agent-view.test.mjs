import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  assembleAgentView,
  parseAgentViewSources,
  rewriteManualLinks,
  stripMaintainerComments,
} from './agent-view.mjs'

test('parses a space- or comma-separated source list', () => {
  assert.deepEqual(parseAgentViewSources('manual/agent  manual/runtime,x/y'), [
    'manual/agent',
    'manual/runtime',
    'x/y',
  ])
  assert.deepEqual(parseAgentViewSources(undefined), [])
})

test('strips MDX and HTML comments, but not inside code fences', () => {
  const source = [
    '{/*',
    'Verified against: packages/server/x.ts',
    '*/}',
    '',
    '# Topic',
    'Keep {/* inline note */}this.',
    '<!-- maintainer -->',
    '```html',
    '<!-- shown in the example -->',
    '```',
  ].join('\n')
  assert.equal(
    stripMaintainerComments(source),
    ['', '# Topic', 'Keep this.', '```html', '<!-- shown in the example -->', '```'].join('\n'),
  )
})

test('leaves inline code and nested fences alone; throws on an unclosed comment', () => {
  const source = [
    'Use `<!--` to open and `{/* x */}` in MDX.',
    '````md',
    '```html',
    '<!-- inside a nested fence -->',
    '```',
    '',
    '',
    'still code',
    '````',
    'Line break here  ',
  ].join('\n')
  assert.equal(stripMaintainerComments(source), source)
  assert.throws(() => stripMaintainerComments('text\n<!-- never closed\nmore'), /unclosed comment opened on line 2/)
})

test('manual links go to the page carrying the topic, else become text', () => {
  const md = 'See [server](/agent-knowledge/workspace/server#roles) and [voice](/agent-knowledge/x/voice-and-tone).'
  const out = rewriteManualLinks(md, (topic) => (topic === 'server' ? 'https://d/servers.md' : null))
  assert.equal(out, 'See [server](https://d/servers.md#roles) and voice.')
  assert.equal(
    rewriteManualLinks('[a](/agent-knowledge/workspace/server/) [b](/agent-knowledge/server.md "t")', () => 'https://d/s.md'),
    '[a](https://d/s.md) [b](https://d/s.md)',
  )
})

test('assembles sources in order behind one source line', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'agent-view-'))
  mkdirSync(path.join(dir, 'manual'))
  writeFileSync(path.join(dir, 'manual', 'a.md'), '---\ntitle: A\n---\n\n{/* notes */}\n# A\n')
  writeFileSync(path.join(dir, 'manual', 'release.json'), '{"ref":"v1.2.3"}')
  writeFileSync(path.join(dir, 'guide.md'), '# Guide\n')
  const out = assembleAgentView({
    dir,
    sources: ['manual/a', 'guide'],
    title: 'Page',
    humanUrl: 'https://d/page/',
  })
  assert.equal(
    out,
    '<!-- Page: the version for agents. Source: Raft manual: a (v1.2.3) + the full guide. Shorter version for people: https://d/page/ -->\n\n# A\n\n# Guide\n',
  )
})
