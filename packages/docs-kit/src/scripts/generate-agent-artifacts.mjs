import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadDocsConfig } from '../config.mjs'

// Parameterized for reuse by any docs-kit site; defaults reproduce raft-docs'
// historical run (`node scripts/generate-agent-artifacts.mjs` from the repo
// root, after `vitepress build`).
//
//   --config <path>    site declaration (docs.config.mjs): supplies root,
//                      content dir, out dir and site URL
//   --root <dir>       site root (default: the config file's dir, else cwd)
//   --content <dir>    content directory relative to root (default: content)
//   --out <dir>        build output relative to root (default: out)
//   --site-url <url>   public origin for canonical/alternate URLs
//                      (default: env RAFT_DOCS_SITE_URL, else docs.raft.build)
//   --prod             force production artifact rendering (preview markers
//                      stripped); otherwise true when CF_PAGES_BRANCH matches
//                      --prod-branch.
//   --prod-branch <b>  branch treated as production (default: main)
//   --check            verify existing artifacts match; write nothing
//
// Artifacts emitted for a site:
// - per-page .md twins (always);
// - llms.txt per localeConfigs (default; a site can turn it off with
//   artifacts.llms=false in docs.config.mjs — ties to the Raft docs shape);
// - index twins driven by `twins.index` in docs.config.mjs: one machine
//   index per declared locale, built from frontmatter title/description/
//   category/order, with chrome.markdownIndexTitle / markdownIndexNote /
//   categories supplying the locale's text (Hands: /docs.md + /docs/zh.md);
// - _headers (default; artifacts.headers=false skips it).
const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index > -1 ? args[index + 1] : fallback
}
const configFlag = option('config', null)
let siteConfig = null
let configDir = null
if (configFlag) {
  const configPath = path.resolve(process.cwd(), configFlag)
  const loaded = await loadDocsConfig({ root: path.dirname(configPath), configPath })
  siteConfig = loaded.config
  configDir = loaded.root
}
const root = path.resolve(option('root', configDir ?? process.cwd()))
const contentDir = path.resolve(root, option('content', siteConfig?.output?.contentDir ?? 'content'))
const outDir = path.resolve(root, option('out', siteConfig?.output?.outDir ?? 'out'))
const siteUrl = (
  option('site-url', siteConfig?.siteUrl ?? process.env.RAFT_DOCS_SITE_URL) ??
  'https://docs.raft.build'
).replace(/\/$/, '')
const basePath = siteConfig?.basePath ?? '/'
const withBasePath = (urlPath) => `${basePath}${urlPath}`.replace(/\/{2,}/g, '/')
const isProdDocsBuild =
  args.includes('--prod') ||
  process.env.CF_PAGES_BRANCH === option('prod-branch', 'main')
const checkOnly = args.includes('--check')
const artifactsConfig = {
  llms: siteConfig?.artifacts?.llms ?? true,
  headers: siteConfig?.artifacts?.headers ?? true,
}
const frontmatterKeys = siteConfig?.frontmatterKeys ?? {
  title: 'title',
  description: 'description',
  category: 'category',
  order: 'order',
}
const previewMarkerPatterns = [
  /^\*\*\[Screenshot:[^\]]*\]\*\*$/,
  /^\[\[preview\]\].*$/,
  /^<!--\s*Screenshot:.*-->$/,
]
const privateKnowledgeSummaryPattern =
  /\b(internal\s+Raft\s+Manual|internal\s+Manual|raft\s+manual|Agent Knowledge)\b/i
const localeConfigs = [
  {
    key: 'root',
    llmsPath: 'llms.txt',
    title: 'Raft Docs',
    description:
      'Public docs discovery router for agents, crawlers, and tools that need machine-readable Raft documentation.',
    includePage: (page) => page.locale === 'root',
  },
  {
    key: 'zh-cn',
    llmsPath: 'zh-cn/llms.txt',
    title: 'Raft Docs zh-CN',
    description:
      '简体中文公共文档发现入口，供需要机器可读 Raft 文档的 Agent、爬虫和工具使用。',
    includePage: (page) => page.locale === 'zh-cn',
  },
]

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

function localeForPath(relativePath) {
  if (siteConfig) {
    for (const locale of siteConfig.locales) {
      if (locale.dir && relativePath.startsWith(`${locale.dir}/`)) return locale.key
    }
    return siteConfig.defaultLocale.key
  }
  // Historical raft-docs shape when run without a site declaration.
  if (relativePath.startsWith('zh-cn/')) return 'zh-cn'
  return 'root'
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

function validatePageMetadata(page, failures, requirements) {
  if (!page.title) {
    failures.push(`${page.relativePath}: missing readable title`)
  }

  if (requirements.llms) {
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
  }

  if (requirements.index) {
    // Index twins are built from frontmatter — navigation metadata is never
    // derived from the H1, which carries prose ("Getting started: connect …")
    // rather than the sidebar label ("Getting Started").
    if (!page.description) {
      failures.push(
        `${page.relativePath}: missing required ${frontmatterKeys.description} frontmatter (index twin)`,
      )
    }

    if (!page.category) {
      failures.push(
        `${page.relativePath}: missing required ${frontmatterKeys.category} frontmatter (index twin)`,
      )
    }
  }

  if ((requirements.llms || requirements.index) && !Number.isFinite(page.order)) {
    failures.push(
      `${page.relativePath}: missing numeric ${frontmatterKeys.order} frontmatter`,
    )
  }
}

function validatePageCollection(pages, failures) {
  // Per locale: an EN page and its translation may share an order (each index
  // sorts within its own locale); two pages in the SAME locale may not.
  const pagesByOrder = new Map()

  for (const page of pages) {
    if (!Number.isFinite(page.order)) continue

    const key = `${page.locale}\u0000${page.order}`
    const existing = pagesByOrder.get(key) ?? []
    existing.push(page.relativePath)
    pagesByOrder.set(key, existing)
  }

  for (const [key, paths] of pagesByOrder) {
    if (paths.length > 1) {
      const [locale, order] = key.split('\u0000')
      failures.push(`order ${order} is duplicated within locale '${locale}' by ${paths.join(', ')}`)
    }
  }
}

async function loadPages(markdownFiles) {
  const pages = []
  const failures = []
  const indexLocales = new Set(Object.keys(siteConfig?.twins?.index ?? {}))

  for (const relativePath of markdownFiles) {
    const markdown = await readFile(path.join(contentDir, relativePath), 'utf8')
    const frontmatter = parseFrontmatter(markdown)
    const page = {
      relativePath,
      locale: localeForPath(relativePath),
      title: extractTitle(relativePath, markdown, frontmatter),
      summary: cleanInlineMarkdown(frontmatter.llms_summary ?? ''),
      section: cleanInlineMarkdown(frontmatter.llms_section ?? ''),
      description: cleanInlineMarkdown(frontmatter[frontmatterKeys.description] ?? ''),
      category: cleanInlineMarkdown(frontmatter[frontmatterKeys.category] ?? ''),
      order: parseLlmsOrder(frontmatter[frontmatterKeys.order] ?? frontmatter.llms_order),
      humanUrl: `${siteUrl}${withBasePath(humanUrlPath(relativePath))}`,
      markdownUrl: `${siteUrl}${withBasePath(rawUrlPath(relativePath))}`,
      rawOutputRelative: rawOutputPath(relativePath),
      htmlOutputRelative: htmlOutputPath(relativePath),
      artifactMarkdown: isProdDocsBuild ? stripPreviewMarkers(markdown) : markdown,
    }

    validatePageMetadata(page, failures, {
      llms: artifactsConfig.llms,
      index: indexLocales.has(page.locale),
    })
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

function renderLlmsTxt(pages, config) {
  const lines = [
    `# ${config.title}`,
    '',
    `> ${config.description}`,
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
    '- HTML URLs are the canonical human and search pages; Markdown URLs are public agent-readable alternates.',
    '- `llms.txt` and Markdown twin responses are served with `X-Robots-Tag: noindex, follow` so search engines keep the HTML page as the indexable route.',
    '- `llms_summary` is public discovery metadata only. It is not an internal Raft Manual summary and must not carry private workflows or deeper behavior semantics.',
  ]

  return `${lines.join('\n')}\n`
}

function renderRawArtifactHeaders(pages, llmsPaths) {
  const paths = [
    ...llmsPaths.map(withBasePath),
    ...pages.map((page) => withBasePath(rawUrlPath(page.relativePath))),
  ]
  const uniquePaths = [...new Set(paths)].sort()
  const lines = [
    '# Generated by packages/docs-kit/src/scripts/generate-agent-artifacts.mjs. Do not edit manually.',
    '# Keep machine-readable docs public and followable, but out of Google Search results.',
  ]

  for (const urlPath of uniquePaths) {
    lines.push('', urlPath, '  X-Robots-Tag: noindex, follow')
  }

  return `${lines.join('\n')}\n`
}

/**
 * A locale's machine index twin (Hands' /docs.md + /docs/zh.md): heading and
 * note text come from the locale's chrome verbatim; items are grouped by
 * frontmatter category, ordered by frontmatter order, and link to each
 * page's raw twin.
 */
function renderIndexTwin(pages, locale) {
  const chrome = locale?.chrome ?? {}
  const heading = chrome.markdownIndexTitle
  const note = chrome.markdownIndexNote
  if (!locale) {
    throw new Error('docs.config: twins.index names a locale that does not exist')
  }
  if (!heading || !note) {
    throw new Error(
      `docs.config: locale '${locale.key}' declares an index twin; ` +
        'chrome.markdownIndexTitle and chrome.markdownIndexNote are required',
    )
  }

  const lines = [heading, '', note, '']
  const groups = new Map()
  for (const page of pages) {
    const category = page.category || 'Other'
    if (!groups.has(category)) groups.set(category, [])
    groups.get(category).push(page)
  }

  const configured = siteConfig?.nav?.categories ?? []
  const ordered = [
    ...configured.filter((category) => groups.has(category)),
    ...[...groups.keys()].filter((category) => !configured.includes(category)).sort(),
  ]

  for (const category of ordered) {
    const label = chrome.categories?.[category] ?? category
    lines.push(`## ${label}`, '')
    for (const page of [...groups.get(category)].sort(sortPages)) {
      const link = `${siteConfig?.basePath ?? '/'}${page.rawOutputRelative}`.replace(/\/{2,}/g, '/')
      lines.push(`- [${page.title}](${link}) — ${page.description}`)
    }
    lines.push('')
  }

  return `${lines.join('\n').trimEnd()}\n`
}

async function writeArtifacts(pages, agentArtifacts, headers) {
  await Promise.all(
    pages.map(async (page) => {
      const output = path.join(outDir, page.rawOutputRelative)

      await mkdir(path.dirname(output), { recursive: true })
      await writeFile(output, page.artifactMarkdown)
    }),
  )

  await Promise.all(
    agentArtifacts.map(async (artifact) => {
      await mkdir(path.dirname(artifact.outputPath), { recursive: true })
      await writeFile(artifact.outputPath, artifact.content)
    }),
  )
  if (headers != null) {
    await writeFile(path.join(outDir, '_headers'), headers)
  }
}

async function readOutputFile(relativePath) {
  return readFile(path.join(outDir, relativePath), 'utf8')
}

async function checkArtifacts(pages, agentArtifacts, headers) {
  const failures = []

  for (const artifact of agentArtifacts) {
    try {
      const actual = await readFile(artifact.outputPath, 'utf8')
      if (actual !== artifact.content) {
        failures.push(`${artifact.label} is stale; regenerate agent artifacts`)
      }
    } catch (error) {
      failures.push(`${artifact.label} is missing or unreadable: ${error.message}`)
    }
  }

  if (headers != null) {
    try {
      const actualHeaders = await readOutputFile('_headers')
      if (actualHeaders !== headers) {
        failures.push('out/_headers is stale; regenerate agent artifacts')
      }
    } catch (error) {
      failures.push(`out/_headers is missing or unreadable: ${error.message}`)
    }
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
      if (!html.includes('rel="canonical"')) {
        failures.push(`${page.htmlOutputRelative} is missing rel="canonical"`)
      }
      if (!html.includes(`href="${page.humanUrl}"`)) {
        failures.push(`${page.htmlOutputRelative} does not canonicalize to ${page.humanUrl}`)
      }
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

  const agentArtifacts = []
  const llmsPaths = []
  if (artifactsConfig.llms) {
    for (const config of localeConfigs) {
      llmsPaths.push(`/${config.llmsPath}`)
      agentArtifacts.push({
        outputPath: path.join(outDir, config.llmsPath),
        label: config.llmsPath,
        content: renderLlmsTxt(pages.filter(config.includePage), config),
      })
    }
  }

  for (const [localeKey, entry] of Object.entries(siteConfig?.twins?.index ?? {})) {
    const locale = siteConfig.locales.find((candidate) => candidate.key === localeKey)
    const outputPath =
      entry.placement === 'out-parent'
        ? path.resolve(outDir, '..', entry.name)
        : path.join(outDir, entry.name)
    agentArtifacts.push({
      outputPath,
      label: entry.placement === 'out-parent' ? `../${entry.name}` : entry.name,
      content: renderIndexTwin(
        pages.filter((page) => page.locale === localeKey),
        locale,
      ),
    })
  }

  const headers = artifactsConfig.headers ? renderRawArtifactHeaders(pages, llmsPaths) : null

  if (!checkOnly) {
    await writeArtifacts(pages, agentArtifacts, headers)
  }

  await checkArtifacts(pages, agentArtifacts, headers)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
