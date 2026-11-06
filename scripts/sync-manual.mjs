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
//
// Two copies of each topic:
//   agent-view/upstream/  the release text as it is, never edited by hand
//   agent-view/manual/    what the docs publish: the release text after review
// A sync merges what the release changed (old upstream → new upstream) into the
// reviewed copy, so earlier rewrites survive; clashes are left as conflict
// markers. Lines matching agent-view/not-public.json are listed for review.
// Before opening the PR, read every changed topic: resolve conflicts, remove
// what the public docs don't mention yet, and check that each page's For human
// side still agrees.
//
//   --check   fail if a page names a manual topic that isn't synced, a synced
//             topic no page uses, a reviewed copy still has conflict markers,
//             or it matches not-public.json; write nothing
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
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
const upstreamDir = path.join(root, 'agent-view', 'upstream')
const notPublicFile = path.join(root, 'agent-view', 'not-public.json')
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

function readTopics(dir) {
  const topics = new Map()
  if (!existsSync(dir)) return topics
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.md')) topics.set(name.slice(0, -3), readFileSync(path.join(dir, name), 'utf8'))
  }
  return topics
}

// [{ pattern, why }]: features the public docs don't mention yet
function notPublicHits(topicsByName) {
  const rules = existsSync(notPublicFile) ? JSON.parse(readFileSync(notPublicFile, 'utf8')) : []
  const hits = []
  for (const [topic, body] of topicsByName) {
    body.split('\n').forEach((line, index) => {
      for (const rule of rules) {
        if (new RegExp(rule.pattern, 'i').test(line)) hits.push(`${topic}.md:${index + 1} ${rule.why}`)
      }
    })
  }
  return hits
}

const conflictMarker = /^(<{7}|={7}|>{7})( |$)/m

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
  const reviewed = readTopics(manualDir)
  const synced = [...reviewed.keys()]
  const upstream = readTopics(upstreamDir)
  const failures = [
    ...topics.filter((topic) => !synced.includes(topic)).map((topic) => `not synced: ${topic} (used by ${usage.get(topic).join(', ')})`),
    ...synced.filter((topic) => !usage.has(topic)).map((topic) => `synced but no page uses it: ${topic}`),
    ...synced.filter((topic) => !upstream.has(topic)).map((topic) => `no release copy in agent-view/upstream: ${topic}`),
    ...synced.filter((topic) => conflictMarker.test(reviewed.get(topic))).map((topic) => `unresolved conflict: ${topic}`),
    ...notPublicHits(reviewed).map((hit) => `not public yet: ${hit}`),
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

const previousUpstream = readTopics(upstreamDir)
const previousReviewed = readTopics(manualDir)
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

const previousRef = existsSync(path.join(upstreamDir, 'release.json'))
  ? JSON.parse(readFileSync(path.join(upstreamDir, 'release.json'), 'utf8')).ref
  : 'previous release'
const scratch = mkdtempSync(path.join(tmpdir(), 'sync-manual-'))
// Three-way merge: the release's change since last sync, applied to the reviewed copy.
function merge(reviewed, base, next) {
  const files = ['reviewed', 'base', 'next'].map((name, index) => {
    const file = path.join(scratch, name)
    writeFileSync(file, [reviewed, base, next][index])
    return file
  })
  try {
    return { text: execFileSync('git', ['merge-file', '-p', '-L', 'docs review', '-L', previousRef, '-L', ref, ...files], { encoding: 'utf8' }), conflicts: 0 }
  } catch (error) {
    if (typeof error.status === 'number' && error.status > 0 && error.stdout) return { text: error.stdout, conflicts: error.status }
    throw error
  }
}

const report = { new: [], changed: [], conflicts: [] }
const reviewedNext = new Map()
for (const [topic, body] of bodies) {
  const reviewed = previousReviewed.get(topic)
  const base = previousUpstream.get(topic)
  if (reviewed === undefined || base === undefined) {
    reviewedNext.set(topic, reviewed ?? body)
    if (reviewed === undefined) report.new.push(topic)
    else if (reviewed !== body) report.changed.push(topic)
    continue
  }
  if (base === body) {
    reviewedNext.set(topic, reviewed)
    continue
  }
  const { text, conflicts } = merge(reviewed, base, body)
  reviewedNext.set(topic, text)
  report.changed.push(topic)
  if (conflicts > 0) report.conflicts.push(`${topic} (${conflicts})`)
}
rmSync(scratch, { recursive: true, force: true })

const release = `${JSON.stringify({ ref, commit, topics }, null, 2)}\n`
for (const [dir, contents] of [[upstreamDir, bodies], [manualDir, reviewedNext]]) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  for (const [topic, body] of contents) writeFileSync(path.join(dir, `${topic}.md`), body)
  writeFileSync(path.join(dir, 'release.json'), release)
}
const removed = [...previousReviewed.keys()].filter((topic) => !usage.has(topic))

console.log(`Synced ${topics.length} manual topics from ${ref} (${commit.slice(0, 10)}).`)
const pages = (topic) => usage.get(topic).join(', ')
for (const topic of report.new) console.log(`new: ${topic} → review the whole topic; check ${pages(topic)}`)
for (const topic of report.changed) console.log(`changed: ${topic} → check ${pages(topic)}`)
for (const topic of removed) console.log(`removed: ${topic}`)
if (report.new.length + report.changed.length + removed.length === 0) console.log('No topic changed.')
if (report.conflicts.length > 0) console.log(`\nConflicts with earlier review (resolve in agent-view/manual/): ${report.conflicts.join(', ')}`)
const hits = notPublicHits(reviewedNext)
if (hits.length > 0) console.log(`\nNot public yet, rewrite or remove:\n- ${hits.join('\n- ')}`)
