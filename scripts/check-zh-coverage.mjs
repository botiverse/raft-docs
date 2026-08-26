import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

const repoRoot = resolve(new URL('..', import.meta.url).pathname)
const contentRoot = resolve(repoRoot, 'content')
const reportPath = process.env.ZH_COVERAGE_REPORT
  ? resolve(repoRoot, process.env.ZH_COVERAGE_REPORT)
  : null

const textExtensions = new Set(['.md', '.mdx'])

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
  .filter((path) => !path.startsWith('zh-cn/'))
  .sort()
const zh = new Set(
  allFiles
    .map((path) => relative(contentRoot, path).replaceAll('\\', '/'))
    .filter((path) => path.startsWith('zh-cn/'))
    .map((path) => path.slice('zh-cn/'.length)),
)
const missing = english.filter((path) => !zh.has(path))
const paired = english.length - missing.length

const lines = [
  '# zh-CN documentation coverage',
  '',
  `- English pages: **${english.length}**`,
  `- zh-CN pages: **${zh.size}**`,
  `- Paired pages: **${paired}**`,
  `- Missing zh-CN pages: **${missing.length}**`,
  '',
  'A page is paired when `content/zh-cn/<same relative path>` exists.',
  '',
  '## Missing pages',
  '',
  ...(missing.length ? missing.map((path) => '- `' + path + '`') : ['- None']),
  '',
]
const report = lines.join('\n')
console.log(report)

if (reportPath) {
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, report)
}
