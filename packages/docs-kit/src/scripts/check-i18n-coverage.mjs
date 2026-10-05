import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { loadDocsConfig } from '../config-node.mjs'

// Translation coverage gate, parameterized for reuse by any docs-kit site.
// Defaults reproduce raft-docs' historical invocation
// (`node scripts/check-i18n-coverage.mjs` from the repo root) byte for byte:
// content/, zh-cn/, scripts/i18n-coverage-baseline.txt.
//
//   --config <path>     site declaration (docs.config.mjs): supplies root,
//                       content dir, baseline, mode and the locale list
//                       (every non-default locale is checked)
//   --root <dir>        site root (default: the config file's dir, else cwd)
//   --content <dir>     content directory relative to root (default: content)
//   --locale <dir>      check a single translation directory (overrides the
//                       config's locale list; default: zh-cn)
//   --locale-label <s>  display label for --locale (default: zh-CN)
//   --baseline <path>   exemption list relative to root
//                       (default: scripts/i18n-coverage-baseline.txt)
//   --mode <m>          'enforce' (default) fails --check on regressions;
//                       'report' only reports them
//   --check             exit non-zero when coverage regresses
//
// ZH_COVERAGE_REPORT env var: write the markdown report to this path (root-relative).
const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index > -1 ? args[index + 1] : fallback
}

const configFlag = option('config', null)
let siteConfig = null
let configDir = null
if (configFlag) {
  const configPath = resolve(process.cwd(), configFlag)
  const loaded = await loadDocsConfig({ root: dirname(configPath), configPath })
  siteConfig = loaded.config
  configDir = loaded.root
}

const repoRoot = resolve(option('root', configDir ?? process.cwd()))
const contentRoot = resolve(repoRoot, option('content', siteConfig?.output.contentDir ?? 'content'))
const contentDirLabel = option('content', siteConfig?.output.contentDir ?? 'content')
const coverageMode = option('mode', siteConfig?.coverage.mode ?? 'enforce')
const reportPath = process.env.ZH_COVERAGE_REPORT
  ? resolve(repoRoot, process.env.ZH_COVERAGE_REPORT)
  : null

const textExtensions = new Set(['.md', '.mdx'])
const shouldFail = args.includes('--check') && coverageMode !== 'report'
const baselinePath = resolve(
  repoRoot,
  option('baseline', siteConfig?.coverage.baseline ?? 'scripts/i18n-coverage-baseline.txt'),
)

let baseline = new Set()
try {
  baseline = new Set(
    (await readFile(baselinePath, 'utf8'))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#')),
  )
} catch {
  console.warn(`no baseline file at ${baselinePath}; treating it as empty`)
}

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

function reportForLocale(localeDir, localeLabel, allFiles) {
  const reference = allFiles
    .map((path) => relative(contentRoot, path).replaceAll('\\', '/'))
    .filter((path) => !path.startsWith(`${localeDir}/`))
    .sort()
  const translated = new Set(
    allFiles
      .map((path) => relative(contentRoot, path).replaceAll('\\', '/'))
      .filter((path) => path.startsWith(`${localeDir}/`))
      .map((path) => path.slice(localeDir.length + 1)),
  )
  const missing = reference.filter((path) => !translated.has(path))
  const paired = reference.length - missing.length
  const referenceSet = new Set(reference)
  const extraTranslated = [...translated].filter((path) => !referenceSet.has(path)).sort()
  const newMissing = missing.filter((path) => !baseline.has(path))
  const staleBaseline = [...baseline].filter((path) => !missing.includes(path)).sort()

  const lines = [
    `# ${localeLabel} documentation coverage`,
    '',
    `- English pages: **${reference.length}**`,
    `- ${localeLabel} pages: **${translated.size}**`,
    `- Paired pages: **${paired}**`,
    `- Missing ${localeLabel} pages: **${missing.length}**`,
    `- ${localeLabel}-only pages: **${extraTranslated.length}**`,
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
    ...(extraTranslated.length ? extraTranslated.map((path) => '- `' + path + '`') : ['- None']),
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
  return { report: lines.join('\n'), newMissing, extraTranslated }
}

// Which locales to check: an explicit --locale wins; otherwise every
// non-default locale in the config (htmlLang is the report label — a display
// label like 简体中文 belongs to UI chrome, not a technical report).
const localesToCheck = []
if (option('locale', null) != null) {
  localesToCheck.push({ dir: option('locale'), label: option('locale-label', 'zh-CN') })
} else if (siteConfig) {
  for (const locale of siteConfig.locales) {
    if (locale.isDefault) continue
    localesToCheck.push({ dir: locale.dir, label: locale.htmlLang })
  }
} else {
  localesToCheck.push({ dir: 'zh-cn', label: 'zh-CN' })
}

const allFiles = await walk(contentRoot)
const reports = []
let failed = false
for (const locale of localesToCheck) {
  const result = reportForLocale(locale.dir, locale.label, allFiles)
  reports.push(result.report)
  if (result.newMissing.length > 0 || result.extraTranslated.length > 0) failed = true
}
const report = reports.join('\n')
console.log(report)
if (coverageMode === 'report') {
  console.warn('coverage mode: report — regressions are listed but do not fail the build')
}

if (reportPath) {
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, report)
}

if (shouldFail && failed) {
  process.exitCode = 1
}
