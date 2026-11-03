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
      chrome: {
        markdownLink: '查看 Markdown',
        openRaft: '打开 Raft',
        agentViewHuman: '给人看',
        agentViewAgent: '给 Agent 看',
        agentViewBarTitle: '这是 Agent 读的版本（英文）。',
        agentViewBarText: '{words} 词，写的是命令、限制和各种边界情况。不用自己读，交给你的 Agent。',
        agentViewCopy: '复制给 Agent',
        agentViewBack: '返回',
        agentViewCopied: '链接已复制',
        agentViewCopyText: '开始之前先读这页 Raft 文档：{url}',
        agentViewPeek: '{words} 词 · Agent 读的版本（英文）· 点击切换',
        agentViewLoading: '加载中…',
        agentViewFailed: '没能加载 Agent 版本，可以直接打开 Markdown：',
      },
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
  // Chinese is maintained separately (AGENTS.md, Translations), so a missing
  // translation is reported, not a failure.
  coverage: { baseline: 'scripts/i18n-coverage-baseline.txt', mode: 'report' },
  // For human / For agents: sources in agent-view/ (manual/ is synced from a
  // Raft release by scripts/sync-manual.mjs).
  agentView: { dir: 'agent-view' },
  redirects: { file: 'content/public/_redirects', selfTest: true },
  output: { contentDir: 'content', outDir: 'out' },
})
