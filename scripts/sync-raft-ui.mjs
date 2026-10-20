// Copies the Raft Design System's tokens and font stack from a published
// @botiverse/raft-ui into .vitepress/theme/raft-ui/, so the docs site reads
// the same colour, type and font values as the design system
// (https://raft-design.botiverse.build) without depending on the React package.
//
//   node scripts/sync-raft-ui.mjs           # the version pinned below
//   node scripts/sync-raft-ui.mjs 0.11.0    # bump: updates the pin too
//
// After a bump, build and look at the site in light and dark: raft-design.css
// maps these tokens onto VitePress, and a renamed token shows up there.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const PINNED = '0.10.4'
const FILES = ['foundation.css', 'fonts.css']

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dest = join(root, '.vitepress/theme/raft-ui')
const version = process.argv[2] ?? PINNED

const work = mkdtempSync(join(tmpdir(), 'raft-ui-'))
try {
  const tarball = execFileSync(
    'npm',
    ['pack', `@botiverse/raft-ui@${version}`, '--silent', '--pack-destination', work],
    { encoding: 'utf8' },
  ).trim()
  execFileSync('tar', ['-xzf', join(work, tarball), '-C', work])
  for (const file of FILES) {
    copyFileSync(join(work, 'package/dist', file), join(dest, file))
  }
  writeFileSync(join(dest, 'VERSION'), `${version}\n`)
  if (version !== PINNED) {
    const self = fileURLToPath(import.meta.url)
    writeFileSync(self, readFileSync(self, 'utf8').replace(`const PINNED = '${PINNED}'`, `const PINNED = '${version}'`))
  }
  console.log(`raft-ui ${version}: ${FILES.join(', ')} → .vitepress/theme/raft-ui/`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
