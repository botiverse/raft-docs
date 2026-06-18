import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const outDir = path.join(root, 'out')
const siteUrl =
  process.env.RAFT_DOCS_SITE_URL?.replace(/\/$/, '') ??
  'https://docs.raft.build'
const isProdDocsBuild = process.env.CF_PAGES_BRANCH === 'main'
const previewMarkerPatterns = [
  /^\*\*\[Screenshot:[^\]]*\]\*\*$/,
  /^\[\[preview\]\].*$/,
  /^<!--\s*Screenshot:.*-->$/,
]

async function listMarkdownFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name === 'public' || entry.name.startsWith('.')) continue

    const absolute = path.join(dir, entry.name)
    const relative = path.join(prefix, entry.name)

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

function rawOutputPath(relativePath) {
  if (relativePath === 'index.md') return 'index.md'
  if (relativePath.endsWith(`${path.sep}index.md`)) {
    return `${relativePath.slice(0, -`${path.sep}index.md`.length)}.md`
  }
  return relativePath
}

function humanUrlPath(relativePath) {
  if (relativePath === 'index.md') return '/'
  if (relativePath.endsWith(`${path.sep}index.md`)) {
    return `/${relativePath.slice(0, -'index.md'.length).replaceAll(path.sep, '/')}`
  }
  return `/${relativePath.replace(/\.md$/, '/').replaceAll(path.sep, '/')}`
}

function rawUrlPath(relativePath) {
  return `/${rawOutputPath(relativePath).replaceAll(path.sep, '/')}`
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

async function copyRawMarkdown(relativePath) {
  const source = path.join(contentDir, relativePath)
  const outputRelative = rawOutputPath(relativePath)
  const output = path.join(outDir, outputRelative)
  const markdown = await readFile(source, 'utf8')
  const artifactMarkdown = isProdDocsBuild ? stripPreviewMarkers(markdown) : markdown

  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(output, artifactMarkdown)
}

async function main() {
  const markdownFiles = await listMarkdownFiles(contentDir)

  await Promise.all(markdownFiles.map(copyRawMarkdown))

  const pages = []
  for (const relativePath of markdownFiles) {
    if (relativePath === 'index.md') continue

    const markdown = await readFile(path.join(contentDir, relativePath), 'utf8')
    const frontmatter = parseFrontmatter(markdown)
    pages.push({
      title: frontmatter.title ?? relativePath,
      description: frontmatter.description ?? '',
      humanUrl: `${siteUrl}${humanUrlPath(relativePath)}`,
      markdownUrl: `${siteUrl}${rawUrlPath(relativePath)}`,
    })
  }

  const lines = [
    '# Raft Docs',
    '',
    '> Documentation for Raft: a workspace where humans and agents share channels, threads, and time.',
    '',
    '## Markdown Pages',
    '',
  ]

  for (const page of pages) {
    const description = page.description ? `: ${page.description}` : ''
    lines.push(`- [${page.title}](${page.markdownUrl})${description}`)
  }

  lines.push('')
  lines.push('## Human Pages')
  lines.push('')

  for (const page of pages) {
    lines.push(`- [${page.title}](${page.humanUrl})`)
  }

  lines.push('')
  lines.push('## Notes')
  lines.push('')
  lines.push('- Markdown URLs are the canonical agent-readable form.')
  lines.push('- Human HTML pages have matching Markdown URLs with a `.md` suffix.')

  await writeFile(path.join(outDir, 'llms.txt'), `${lines.join('\n')}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
