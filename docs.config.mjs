// The site declaration consumed by the docs-kit theme (and, next, the kit's
// scripts via --config). Fields not relevant to raft-docs today (nav
// categories, externals, index twins) are configured in .vitepress/config.mts
// until the migration finishes.
import { defineDocsConfig } from './packages/docs-kit/src/config.mjs'

export default defineDocsConfig({
  siteUrl: 'https://docs.raft.build',
  basePath: '/',
  routing: 'directory',
  locales: [
    {
      key: 'root',
      dir: '',
      label: 'English',
      htmlLang: 'en-US',
      chrome: { markdownLink: 'View as Markdown', openRaft: 'Open Raft' },
    },
    {
      key: 'zh-cn',
      dir: 'zh-cn',
      label: '简体中文',
      htmlLang: 'zh-CN',
      chrome: { markdownLink: '查看 Markdown', openRaft: '打开 Raft' },
    },
  ],
  twins: { page: 'collapse-index' },
  brand: {
    name: 'Raft',
    logo: '/brand/raft-icon.svg',
    home: '/',
    headerNav: [{ label: 'Open Raft', href: 'https://app.raft.build', primary: true }],
  },
  search: true,
  coverage: { baseline: 'scripts/i18n-coverage-baseline.txt', mode: 'enforce' },
  output: { contentDir: 'content', outDir: 'out' },
})
