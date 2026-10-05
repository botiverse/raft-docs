import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

// Parameterized for reuse by any docs-kit site. Defaults reproduce raft-docs'
// historical invocation (`node scripts/check-i18n-coverage.mjs` from the repo
// root) byte for byte: content/, zh-cn/, scripts/i18n-coverage-baseline.txt.
//
//   --root <dir>        site root (default: cwd)
//   --content <dir>     content directory relative to root (default: content)
//   --locale <dir>      translation directory (default: zh-cn)
//   --locale-label <s>  display label for the translation locale (default: zh-CN)
//   --baseline <path>   exemption list relative to root
//                       (default: scripts/i18n-coverage-baseline.txt)
//   --check             exit non-zero when coverage regresses
//
// ZH_COVERAGE_REPORT env var: write the markdown report to this path (root-relative).
const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index > -1 ? args[index + 1] : fallback
}
const repoRoot = resolve(option('root', process.cwd()))
const contentRoot = resolve(repoRoot, option('content', 'content'))
const localeDir = option('locale', 'zh-cn')
const localeLabel = option('locale-label', 'zh-CN')
const contentDirLabel = option('content', 'content')
const reportPath = process.env.ZH_COVERAGE_REPORT
  ? resolve(repoRoot, process.env.ZH_COVERAGE_REPORT)
  : null

const textExtensions = new Set(['.md', '.mdx'])
const shouldFail = args.includes('--check')
const baselinePath = resolve(repoRoot, option('baseline', 'scripts/i18n-coverage-baseline.txt'))
const baseline = new Set(
  (await readFile(baselinePath, 'utf8'))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#')),
)

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === 'public' || entry.name.startsWith('.')) continue
    const path = resolve(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(path)))
    else if (textExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase())) files.push(path)
  }
  return files
}

const allFiles = await walk(contentRoot)
const english = allFiles
  .map((path) => relative(contentRoot, path).replaceAll('\\', '/'))
  .filter((path) => !path.startsWith(`${localeDir}/`))
  .sort()
const zh = new Set(
  allFiles
    .map((path) => relative(contentRoot, path).replaceAll('\\', '/'))
    .filter((path) => path.startsWith(`${localeDir}/`))
    .map((path) => path.slice(localeDir.length + 1)),
)
const missing = english.filter((path) => !zh.has(path))
const paired = english.length - missing.length
const englishSet = new Set(english)
const extraZh = [...zh].filter((path) => !englishSet.has(path)).sort()
const newMissing = missing.filter((path) => !baseline.has(path))
const staleBaseline = [...baseline].filter((path) => !missing.includes(path)).sort()

const lines = [
  `# ${localeLabel} documentation coverage`,
  '',
  `- English pages: **${english.length}**`,
  `- ${localeLabel} pages: **${zh.size}**`,
  `- Paired pages: **${paired}**`,
  `- Missing ${localeLabel} pages: **${missing.length}**`,
  `- ${localeLabel}-only pages: **${extraZh.length}**`,
  `- New missing pages (not in baseline): **${newMissing.length}**`,
  '',
  `A page is paired when \`${contentDirLabel}/${localeDir}/<same relative path>\` exists.`,
  '',
  `## Missing pages`,
  '',
  ...(missing.length ? missing.map((path) => '- `' + path + '`') : ['- None']),
  '',
  `## ${localeLabel}-only pages`,
  '',
  ...(extraZh.length ? extraZh.map((path) => '- `' + path + '`') : ['- None']),
  '',
  '## New missing pages (enforced)',
  '',
  ...(newMissing.length ? newMissing.map((path) => '- `' + path + '`') : ['- None']),
  '',
  '## Baseline entries no longer missing',
  '',
  ...(staleBaseline.length ? staleBaseline.map((path) => '- `' + path + '`') : ['- None']),
  '',
]
const report = lines.join('\n')
console.log(report)

if (reportPath) {
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, report)
}

if (shouldFail && (newMissing.length > 0 || extraZh.length > 0)) {
  process.exitCode = 1
}
