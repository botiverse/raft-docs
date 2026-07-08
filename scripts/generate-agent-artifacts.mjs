import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const outDir = path.join(root, 'out')
const siteUrl =
  process.env.RAFT_DOCS_SITE_URL?.replace(/\/$/, '') ??
  'https://docs.raft.build'
const isProdDocsBuild = process.env.CF_PAGES_BRANCH === 'main'
const checkOnly = process.argv.includes('--check')
const previewMarkerPatterns = [
  /^\*\*\[Screenshot:[^\]]*\]\*\*$/,
  /^\[\[preview\]\].*$/,
  /^<!--\s*Screenshot:.*-->$/,
]
const privateKnowledgeSummaryPattern =
  /\b(internal\s+Raft\s+Manual|internal\s+Manual|raft\s+manual|Agent Knowledge)\b/i

async function listMarkdownFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name === 'public' || entry.name.startsWith('.')) continue

    const absolute = path.join(dir, entry.name)
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(absolute, relative)))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relative)
    }
  }

  return files.sort()
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return {}
  const end = markdown.indexOf('\n---', 4)
  if (end === -1) return {}

  const raw = markdown.slice(4, end).trim()
  const data = {}

  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) continue
    data[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }

  return data
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return markdown
  const end = markdown.indexOf('\n---', 4)
  if (end === -1) return markdown
  return markdown.slice(end + '\n---'.length).replace(/^\n/, '')
}

function cleanInlineMarkdown(text) {
  return text
    .replace(/<Badge\b[^>]*\/?>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleFromPath(relativePath) {
  const stem = rawOutputPath(relativePath)
    .replace(/\.md$/, '')
    .split('/')
    .at(-1)
  return stem
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function extractTitle(relativePath, markdown, frontmatter) {
  if (frontmatter.title) return cleanInlineMarkdown(frontmatter.title)

  const body = stripFrontmatter(markdown)
  const h1 = body.match(/^#\s+(.+)$/m)?.[1]
  return h1 ? cleanInlineMarkdown(h1) : titleFromPath(relativePath)
}

function rawOutputPath(relativePath) {
  if (relativePath === 'index.md') return 'index.md'
  if (relativePath.endsWith('/index.md')) {
    return `${relativePath.slice(0, -'/index.md'.length)}.md`
  }
  return relativePath
}

function htmlOutputPath(relativePath) {
  if (relativePath === 'index.md') return 'index.html'
  if (relativePath.endsWith('/index.md')) {
    return `${relativePath.slice(0, -'index.md'.length)}index.html`
  }
  return `${relativePath.replace(/\.md$/, '')}/index.html`
}

function humanUrlPath(relativePath) {
  if (relativePath === 'index.md') return '/'
  if (relativePath.endsWith('/index.md')) {
    return `/${relativePath.slice(0, -'index.md'.length)}`
  }
  return `/${relativePath.replace(/\.md$/, '/')}`
}

function rawUrlPath(relativePath) {
  return `/${rawOutputPath(relativePath)}`
}

function parseLlmsOrder(value) {
  const raw = `${value ?? ''}`.trim()
  return /^\d+$/.test(raw) ? Number(raw) : Number.NaN
}

function sortPages(left, right) {
  const orderDelta = left.order - right.order
  if (orderDelta !== 0) return orderDelta

  return left.relativePath.localeCompare(right.relativePath)
}

function stripPreviewMarkers(markdown) {
  const lines = markdown.split('\n')
  const filtered = []
  let inFence = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence
      filtered.push(line)
      continue
    }

    if (!inFence && previewMarkerPatterns.some((pattern) => pattern.test(trimmed))) {
      continue
    }

    filtered.push(line)
  }

  return filtered.join('\n')
}

function validatePageMetadata(page, failures) {
  if (!page.title) {
    failures.push(`${page.relativePath}: missing readable title`)
  }

  if (!page.summary) {
    failures.push(`${page.relativePath}: missing required llms_summary frontmatter`)
  }

  if (page.summary && page.summary.length > 220) {
    failures.push(`${page.relativePath}: llms_summary should stay under 220 characters`)
  }

  if (page.summary && privateKnowledgeSummaryPattern.test(page.summary)) {
    failures.push(
      `${page.relativePath}: llms_summary must stay public discovery metadata, not internal Manual content`,
    )
  }

  if (!page.section) {
    failures.push(`${page.relativePath}: missing required llms_section frontmatter`)
  }

  if (!Number.isFinite(page.order)) {
    failures.push(`${page.relativePath}: missing numeric llms_order frontmatter`)
  }
}

function validatePageCollection(pages, failures) {
  const pagesByOrder = new Map()

  for (const page of pages) {
    if (!Number.isFinite(page.order)) continue

    const existing = pagesByOrder.get(page.order) ?? []
    existing.push(page.relativePath)
    pagesByOrder.set(page.order, existing)
  }

  for (const [order, paths] of pagesByOrder) {
    if (paths.length > 1) {
      failures.push(`llms_order ${order} is duplicated by ${paths.join(', ')}`)
    }
  }
}

async function loadPages(markdownFiles) {
  const pages = []
  const failures = []

  for (const relativePath of markdownFiles) {
    const markdown = await readFile(path.join(contentDir, relativePath), 'utf8')
    const frontmatter = parseFrontmatter(markdown)
    const page = {
      relativePath,
      title: extractTitle(relativePath, markdown, frontmatter),
      summary: cleanInlineMarkdown(frontmatter.llms_summary ?? ''),
      section: cleanInlineMarkdown(frontmatter.llms_section ?? ''),
      order: parseLlmsOrder(frontmatter.llms_order),
      humanUrl: `${siteUrl}${humanUrlPath(relativePath)}`,
      markdownUrl: `${siteUrl}${rawUrlPath(relativePath)}`,
      rawOutputRelative: rawOutputPath(relativePath),
      htmlOutputRelative: htmlOutputPath(relativePath),
      artifactMarkdown: isProdDocsBuild ? stripPreviewMarkers(markdown) : markdown,
    }

    validatePageMetadata(page, failures)
    pages.push(page)
  }

  validatePageCollection(pages, failures)

  if (failures.length > 0) {
    throw new Error(`Agent docs artifact metadata check failed:\n- ${failures.join('\n- ')}`)
  }

  return pages.sort(sortPages)
}

function renderSectionedList(pages, urlKey) {
  const lines = []
  const sections = []
  const seenSections = new Set()

  for (const page of pages) {
    if (seenSections.has(page.section)) continue
    seenSections.add(page.section)
    sections.push(page.section)
  }

  for (const section of sections) {
    const sectionPages = pages.filter((page) => page.section === section)

    lines.push(`### ${section}`)
    lines.push('')

    for (const page of sectionPages) {
      lines.push(`- [${page.title}](${page[urlKey]}) - ${page.summary}`)
    }

    lines.push('')
  }

  return lines
}

function renderLlmsTxt(pages) {
  const lines = [
    '# Raft Docs',
    '',
    '> Public docs discovery router for agents, crawlers, and tools that need machine-readable Raft documentation.',
    '',
    'This file is generated from the public docs tree. Each route description comes from the page `llms_summary` frontmatter and only explains when an agent should read the public page.',
    '',
    '## Agent-readable Markdown pages',
    '',
    ...renderSectionedList(pages, 'markdownUrl'),
    '## Human HTML pages',
    '',
    ...renderSectionedList(pages, 'humanUrl'),
    '## Discovery contract',
    '',
    '- Every listed HTML page exposes a matching Markdown twin through `<link rel="alternate" type="text/markdown">`.',
    '- Markdown URLs are the canonical agent-readable form for public docs.',
    '- `llms_summary` is public discovery metadata only. It is not an internal Raft Manual summary and must not carry private workflows or deeper behavior semantics.',
  ]

  return `${lines.join('\n')}\n`
}

async function writeArtifacts(pages, llmsTxt) {
  await Promise.all(
    pages.map(async (page) => {
      const output = path.join(outDir, page.rawOutputRelative)

      await mkdir(path.dirname(output), { recursive: true })
      await writeFile(output, page.artifactMarkdown)
    }),
  )

  await writeFile(path.join(outDir, 'llms.txt'), llmsTxt)
}

async function readOutputFile(relativePath) {
  return readFile(path.join(outDir, relativePath), 'utf8')
}

async function checkArtifacts(pages, llmsTxt) {
  const failures = []

  try {
    const actualLlmsTxt = await readOutputFile('llms.txt')
    if (actualLlmsTxt !== llmsTxt) {
      failures.push('out/llms.txt is stale; regenerate agent artifacts')
    }
  } catch (error) {
    failures.push(`out/llms.txt is missing or unreadable: ${error.message}`)
  }

  for (const page of pages) {
    try {
      const actualMarkdown = await readOutputFile(page.rawOutputRelative)
      if (actualMarkdown !== page.artifactMarkdown) {
        failures.push(`${page.rawOutputRelative} is stale; regenerate Markdown twin`)
      }
    } catch (error) {
      failures.push(`${page.rawOutputRelative} is missing or unreadable: ${error.message}`)
    }

    try {
      const html = await readOutputFile(page.htmlOutputRelative)
      if (!html.includes('rel="alternate"')) {
        failures.push(`${page.htmlOutputRelative} is missing rel="alternate"`)
      }
      if (!html.includes('type="text/markdown"')) {
        failures.push(`${page.htmlOutputRelative} is missing type="text/markdown"`)
      }
      if (!html.includes(`href="${page.markdownUrl}"`)) {
        failures.push(`${page.htmlOutputRelative} does not point to ${page.markdownUrl}`)
      }
    } catch (error) {
      failures.push(`${page.htmlOutputRelative} is missing or unreadable: ${error.message}`)
    }
  }

  if (failures.length > 0) {
    throw new Error(`Agent docs artifact check failed:\n- ${failures.join('\n- ')}`)
  }
}

async function main() {
  const markdownFiles = await listMarkdownFiles(contentDir)
  const pages = await loadPages(markdownFiles)
  const llmsTxt = renderLlmsTxt(pages)

  if (!checkOnly) {
    await writeArtifacts(pages, llmsTxt)
  }

  await checkArtifacts(pages, llmsTxt)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
