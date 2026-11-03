// Sync the Raft manual topics that docs pages show on their "For agents" side.
//
//   node scripts/sync-manual.mjs --slock <path to a botiverse/slock clone> --ref v1.21.49
//
// Always sync from a production release tag, never staging, so the docs never
// describe something that hasn't shipped. slock is private and the Cloudflare
// build can't read it, so the snapshots are committed here: run this after
// each server release and open the result as a PR.
//
// Only topics that some page lists in its `agent_view` frontmatter are copied,
// with maintainer comments stripped (they hold code paths and review notes).
// The output names what changed and which pages show it: on review, check that
// each page's For human side still agrees with the new manual text.
//
//   --check   fail if a page names a manual topic that isn't synced, or a
//             synced topic no page uses; write nothing
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AGENT_VIEW_KEY,
  parseAgentViewSources,
  stripMaintainerComments,
} from '../packages/docs-kit/src/agent-view.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = path.join(root, 'content')
const manualDir = path.join(root, 'agent-view', 'manual')
const args = process.argv.slice(2)
const option = (name) => {
  const index = args.indexOf(`--${name}`)
  return index > -1 ? args[index + 1] : null
}
const checkOnly = args.includes('--check')

function listPages(dir, prefix = '') {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'public' || entry.name.startsWith('.')) continue
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...listPages(path.join(dir, entry.name), relative))
    else if (entry.name.endsWith('.md')) files.push(relative)
  }
  return files.sort()
}

function frontmatterValue(markdown, key) {
  if (!markdown.startsWith('---\n')) return null
  const end = markdown.indexOf('\n---', 4)
  const line = markdown
    .slice(4, end)
    .split('\n')
    .find((candidate) => candidate.startsWith(`${key}:`))
  return line ? line.slice(key.length + 1).trim().replace(/^['"]|['"]$/g, '') : null
}

// topic -> pages that show it
const usage = new Map()
for (const page of listPages(contentDir)) {
  const sources = parseAgentViewSources(
    frontmatterValue(readFileSync(path.join(contentDir, page), 'utf8'), AGENT_VIEW_KEY),
  )
  for (const id of sources) {
    if (!id.startsWith('manual/')) continue
    const topic = id.slice('manual/'.length)
    if (!usage.has(topic)) usage.set(topic, [])
    usage.get(topic).push(page)
  }
}
const topics = [...usage.keys()].sort()

if (checkOnly) {
  const synced = existsSync(manualDir)
    ? readdirSync(manualDir)
        .filter((name) => name.endsWith('.md'))
        .map((name) => name.slice(0, -3))
    : []
  const failures = [
    ...topics.filter((topic) => !synced.includes(topic)).map((topic) => `not synced: ${topic} (used by ${usage.get(topic).join(', ')})`),
    ...synced.filter((topic) => !usage.has(topic)).map((topic) => `synced but no page uses it: ${topic}`),
  ]
  if (failures.length > 0) {
    console.error(`Manual snapshot check failed:\n- ${failures.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`Manual snapshot OK: ${topics.length} topics.`)
  process.exit(0)
}

const slock = option('slock')
const ref = option('ref')
if (!slock || !ref) {
  console.error('usage: node scripts/sync-manual.mjs --slock <slock clone> --ref <release tag>')
  process.exit(1)
}
if (!/^v\d+\.\d+\.\d+$/.test(ref)) {
  console.error(`--ref must be a release tag like v1.21.49, got ${ref}`)
  process.exit(1)
}
const git = (...gitArgs) => execFileSync('git', ['-C', slock, ...gitArgs], { encoding: 'utf8' })
const commit = git('rev-parse', `${ref}^{commit}`).trim()

const before = new Map()
if (existsSync(manualDir)) {
  for (const name of readdirSync(manualDir)) {
    if (name.endsWith('.md')) before.set(name.slice(0, -3), readFileSync(path.join(manualDir, name), 'utf8'))
  }
}
// Fetch everything first, so a failed fetch leaves the snapshot as it was.
const bodies = new Map()
for (const topic of topics) {
  const source = git('show', `${commit}:manual/agent-knowledge/${topic}.md`)
  try {
    bodies.set(topic, `${stripMaintainerComments(source).trim()}\n`)
  } catch (error) {
    throw new Error(`${topic}: ${error.message}`)
  }
}

rmSync(manualDir, { recursive: true, force: true })
mkdirSync(manualDir, { recursive: true })
const changed = []
for (const [topic, body] of bodies) {
  writeFileSync(path.join(manualDir, `${topic}.md`), body)
  if (before.get(topic) !== body) changed.push(topic)
}
const removed = [...before.keys()].filter((topic) => !usage.has(topic))
writeFileSync(
  path.join(manualDir, 'release.json'),
  `${JSON.stringify({ ref, commit, topics }, null, 2)}\n`,
)

console.log(`Synced ${topics.length} manual topics from ${ref} (${commit.slice(0, 10)}).`)
if (changed.length === 0 && removed.length === 0) {
  console.log('No topic changed.')
} else {
  for (const topic of changed) console.log(`changed: ${topic} → check ${usage.get(topic).join(', ')}`)
  for (const topic of removed) console.log(`removed: ${topic}`)
}
