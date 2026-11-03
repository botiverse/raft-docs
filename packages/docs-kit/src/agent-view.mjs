/**
 * The "For agents" side of a page (the For human / For agents switch).
 *
 * A page opts in with one frontmatter line naming its agent sources, files
 * under the site's `agentView.dir` (without `.md`), in reading order:
 *
 *   agent_view: manual/agent manual/agent-profile manual/runtime
 *
 * The agent side is those sources joined. It is what the page's Markdown twin
 * serves (so "View as Markdown" and llms.txt hand agents the full version)
 * and what the switch shows. A page without the line has no agent side: its
 * twin stays the page source and no switch is drawn.
 *
 * Sources under `manual/` are snapshots of Raft manual topics, synced from a
 * release (raft-docs scripts/sync-manual.mjs); their cross-topic links point
 * at `/agent-knowledge/<group>/<topic>` and are rewritten here to the twin of
 * the page that carries that topic, or unwrapped to plain text when no page
 * does.
 *
 * Node-only (reads the filesystem); the theme gets the facts it needs (word
 * count, source label) through page data.
 */
import { readFileSync } from 'node:fs'
import nodePath from 'node:path'

export const AGENT_VIEW_KEY = 'agent_view'

/** `"manual/agent manual/runtime"` → `['manual/agent', 'manual/runtime']`. */
export function parseAgentViewSources(value) {
  if (value == null) return []
  const list = Array.isArray(value) ? value : String(value).split(/[\s,]+/)
  return list.map((entry) => String(entry).trim()).filter(Boolean)
}

export function stripFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return markdown
  const end = markdown.indexOf('\n---', 4)
  if (end === -1) return markdown
  return markdown.slice(end + '\n---'.length).replace(/^\n/, '')
}

/**
 * Maintainer notes never reach the public site: MDX comments (`{/* … *\/}`)
 * and HTML comments. Code fences and inline code are left alone. An
 * unclosed comment throws rather than silently dropping the rest of the file.
 */
export function stripMaintainerComments(markdown) {
  const out = []
  let fence = null
  let inComment = null
  let openedAt = 0
  const lines = markdown.split('\n')
  const push = (line) => {
    // No runs of blank lines where a comment block was removed.
    if (line.trim() === '' && out.length > 0 && out[out.length - 1].trim() === '') return
    out.push(line)
  }
  lines.forEach((line, index) => {
    if (!inComment) {
      const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]
      if (fence) {
        // A fence closes only with the same character, at least as long.
        if (marker && marker[0] === fence[0] && marker.length >= fence.length && /^\s*[`~]+\s*$/.test(line)) {
          fence = null
        }
        out.push(line)
        return
      }
      if (marker) {
        fence = marker
        out.push(line)
        return
      }
    }
    let rest = line
    let kept = ''
    while (rest.length > 0) {
      if (inComment) {
        const close = rest.indexOf(inComment)
        if (close === -1) {
          rest = ''
          break
        }
        rest = rest.slice(close + inComment.length)
        inComment = null
        continue
      }
      const tick = rest.indexOf('`')
      const mdx = rest.indexOf('{/*')
      const html = rest.indexOf('<!--')
      const candidates = [mdx, html].filter((i) => i > -1)
      const start = candidates.length > 0 ? Math.min(...candidates) : -1
      if (tick > -1 && (start === -1 || tick < start)) {
        // Inline code: copy it through untouched.
        const run = rest.slice(tick).match(/^`+/)[0]
        const close = rest.indexOf(run, tick + run.length)
        const endAt = close === -1 ? tick + run.length : close + run.length
        kept += rest.slice(0, endAt)
        rest = rest.slice(endAt)
        continue
      }
      if (start === -1) {
        kept += rest
        break
      }
      kept += rest.slice(0, start)
      inComment = start === mdx ? '*/}' : '-->'
      openedAt = index + 1
      rest = rest.slice(start + (inComment === '*/}' ? 3 : 4))
    }
    // A line that only held a comment disappears instead of leaving a gap.
    if (kept.trim() === '' && line.trim() !== '') return
    push(kept === line ? line : kept.replace(/\s+$/, ''))
  })
  if (inComment) {
    throw new Error(`unclosed comment opened on line ${openedAt} (expected "${inComment}")`)
  }
  return out.join('\n')
}

const MANUAL_LINK =
  /\[((?:[^\]\\]|\\.)+)\]\(\/agent-knowledge\/(?:[a-z0-9-]+\/)*([a-z0-9-]+?)(?:\.md)?\/?(#[^)\s]*)?(?:\s+"[^"]*")?\)/g

/**
 * Rewrite manual cross-links: to `linkFor(topic)` (+ anchor) when a page
 * carries the topic, else to the bare link text.
 */
export function rewriteManualLinks(markdown, linkFor) {
  return markdown.replace(MANUAL_LINK, (_match, text, topic, anchor) => {
    const target = linkFor(topic)
    return target ? `[${text}](${target}${anchor ?? ''})` : text
  })
}

export function countWords(markdown) {
  return (markdown.match(/\S+/g) ?? []).length
}

export function readAgentViewSource(dir, id) {
  const file = nodePath.join(dir, `${id}.md`)
  try {
    return readFileSync(file, 'utf8')
  } catch {
    throw new Error(`agent_view: source "${id}" not found (expected ${file})`)
  }
}

/** The manual release the `manual/` snapshots come from, if synced. */
export function readManualRelease(dir) {
  try {
    return JSON.parse(readFileSync(nodePath.join(dir, 'manual', 'release.json'), 'utf8'))
  } catch {
    return null
  }
}

/** One line naming where the agent side comes from. */
export function describeAgentViewSources(sources, release) {
  const manual = sources.filter((id) => id.startsWith('manual/')).map((id) => id.slice(7))
  const other = sources.filter((id) => !id.startsWith('manual/'))
  const parts = []
  if (manual.length > 0) {
    parts.push(
      `Raft manual: ${manual.join(', ')}${release?.ref ? ` (${release.ref})` : ''}`,
    )
  }
  if (other.length > 0) parts.push('the full guide')
  return parts.join(' + ')
}

/**
 * The agent side of one page, as Markdown.
 *
 * `title`: the page title; `humanUrl`: the page's human version;
 * `linkFor(topic)`: URL of the page carrying a manual topic, or null.
 */
export function assembleAgentView({ dir, sources, title, humanUrl, linkFor = () => null }) {
  const release = readManualRelease(dir)
  const bodies = sources.map((id) => {
    const body = stripMaintainerComments(stripFrontmatter(readAgentViewSource(dir, id))).trim()
    return id.startsWith('manual/') ? rewriteManualLinks(body, linkFor) : body
  })
  const header = [
    `<!-- ${title}: the version for agents. Source: ${describeAgentViewSources(sources, release)}. Shorter version for people: ${humanUrl} -->`,
  ]
  return `${[...header, ...bodies].join('\n\n')}\n`
}

/**
 * For VitePress `transformPageData`: the facts the switch shows before the
 * agent side is fetched (`pageData.agentView = { words, source }`), or null
 * for a page without one. Throws on a missing source so a broken page fails
 * the build instead of shipping a switch to nothing.
 */
export function agentViewPageData(config, root, frontmatter) {
  const sources = parseAgentViewSources(frontmatter?.[AGENT_VIEW_KEY])
  if (sources.length === 0) return null
  if (!config.agentView) {
    throw new Error(`${AGENT_VIEW_KEY} frontmatter needs agentView in docs.config`)
  }
  const dir = nodePath.resolve(root, config.agentView.dir)
  const markdown = assembleAgentView({ dir, sources, title: '', humanUrl: '' })
  return {
    words: countWords(markdown),
    source: describeAgentViewSources(sources, readManualRelease(dir)),
  }
}
