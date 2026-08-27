import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
// @ts-expect-error -- plain .mjs helper shared with scripts/check-sitemap-redirects.mjs
import { parseRedirectRules, redirectTargetFor } from '../scripts/redirect-rules.mjs'
import { defineConfig } from 'vitepress'
import taskLists from 'markdown-it-task-lists'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

const siteUrl = 'https://docs.raft.build'
const description =
  'Documentation for Raft: a workspace where humans and agents share channels, threads, and time.'
const isProdDocsBuild = process.env.CF_PAGES_BRANCH === 'main'
const pagesDeployUrl = process.env.CF_PAGES_URL?.replace(/\/$/, '')
const socialImageBaseUrl = isProdDocsBuild ? siteUrl : pagesDeployUrl || siteUrl

// Keep screenshot / preview-review markers visible in Raft + branch previews,
// but strip them from the production docs build so unfinished placeholders
// never leak to docs.raft.build.
const previewMarkerPatterns = [
  /^\*\*\[Screenshot:[^\]]*\]\*\*$/,
  /^\[\[preview\]\].*$/,
  /^<!--\s*Screenshot:.*-->$/,
]

function stripPreviewMarkers(source: string): string {
  const lines = source.split('\n')
  const filtered: string[] = []
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

function rawMarkdownPath(relativePath: string): string {
  if (relativePath === 'index.md') return '/index.md'
  if (relativePath.endsWith('/index.md')) {
    return `/${relativePath.slice(0, -'/index.md'.length)}.md`
  }
  return `/${relativePath}`
}

function humanUrlPath(relativePath: string): string {
  if (relativePath === 'index.md') return '/'
  if (relativePath.endsWith('/index.md')) {
    return `/${relativePath.slice(0, -'index.md'.length)}`
  }
  return `/${relativePath.replace(/\.md$/, '/')}`
}

// A page can exist as real content (so VitePress emits it into the sitemap)
// while `_redirects` sends it somewhere else, which puts 301/302 URLs in a file
// that should only contain canonical, directly-200 ones. Parsing/matching lives
// in scripts/redirect-rules.mjs so this filter and the build-time check cannot
// drift apart -- when they were separate, both skipped wildcard rules and the
// check still claimed full coverage.
const REDIRECTS_FILE = resolve(__dirname, '../content/public/_redirects')

function redirectRules() {
  return parseRedirectRules(readFileSync(REDIRECTS_FILE, 'utf-8'))
}

export default defineConfig({
  title: 'Raft Docs',
  description,
  lang: 'en-US',
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      link: '/welcome/',
    },
    'zh-cn': {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'Raft Docs',
      description: 'Raft 文档：人类和 Agent 共享频道、线程和时间的工作空间。',
      link: '/zh-cn/welcome/',
      markdown: {
        container: {
          infoLabel: '信息',
          tipLabel: '提示',
          warningLabel: '警告',
        },
        codeCopyButton: {
          copiedText: '已复制',
          tooltipText: '复制代码',
        },
      },
      themeConfig: {
        nav: [
          { text: '开始', link: '/zh-cn/welcome/', activeMatch: '^/zh-cn/(?!features/|developers/)' },
          {
            text: '功能',
            link: '/zh-cn/features/server/computers/',
            activeMatch: '^/zh-cn/features/',
          },
          { text: '开发者', link: '/zh-cn/developers/raft-apps/', activeMatch: '^/zh-cn/developers/' },
        ],
        sidebar: {
          '/zh-cn/': [
            {
              text: '开始',
              items: [
                { text: 'Raft Docs', link: '/zh-cn/' },
                { text: '欢迎使用 Raft', link: '/zh-cn/welcome/' },
              ],
            },
          ],
          '/zh-cn/features/': [
            {
              text: '服务器',
              items: [
                { text: '服务器基础', link: '/zh-cn/features/server/' },
                { text: 'Computers', link: '/zh-cn/features/server/computers/' },
                { text: '成员', link: '/zh-cn/features/server/members/' },
                { text: '服务器管理', link: '/zh-cn/features/server/management/' },
              ],
            },
            {
              text: 'Agent',
              items: [
                { text: 'Agent 基础', link: '/zh-cn/features/agents/' },
                { text: 'Runtime', link: '/zh-cn/features/agents/runtime/' },
                { text: 'Workspace', link: '/zh-cn/features/agents/workspace/' },
                { text: 'Lifecycle', link: '/zh-cn/features/agents/lifecycle/' },
                { text: 'Reminders', link: '/zh-cn/features/agents/reminders/' },
                { text: 'Troubleshooting', link: '/zh-cn/features/agents/troubleshooting/' },
                { text: '外部 Agent', link: '/zh-cn/features/agents/external/' },
              ],
            },
            {
              text: 'Connected Apps',
              items: [
                { text: '概览', link: '/zh-cn/features/apps/' },
                { text: 'Login with Raft', link: '/zh-cn/features/apps/login-with-raft/' },
              ],
            },
            {
              text: 'Collaboration',
              items: [
                { text: '概览', link: '/zh-cn/features/collaboration/' },
                { text: 'Tasks', link: '/zh-cn/features/collaboration/tasks/' },
                { text: 'Files', link: '/zh-cn/features/collaboration/files/' },
                { text: 'Comments on files', link: '/zh-cn/features/collaboration/comments/' },
              ],
            },
          ],
          '/zh-cn/developers/': [
            {
              text: 'Raft Apps',
              items: [
                { text: '概览', link: '/zh-cn/developers/raft-apps/' },
                { text: '构建 Raft App', link: '/zh-cn/developers/raft-apps/build/' },
                { text: 'Login with Raft', link: '/zh-cn/developers/login-with-raft/' },
              ],
            },
          ],
        },
        search: {
          provider: 'local',
          options: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索',
              },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '清除搜索',
                backButtonTitle: '关闭搜索',
                noResultsText: '没有找到结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '回车',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '向上',
                  navigateDownKeyAriaLabel: '向下',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'Esc',
                },
              },
            },
          },
        },
        outline: {
          label: '本页目录',
          level: [2, 3],
        },
        i18nRouting: false,
        lastUpdated: {
          text: '最后更新',
          formatOptions: {
            forceLocale: true,
          },
        },
        docFooter: {
          prev: '上一页',
          next: '下一页',
        },
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色主题',
        darkModeSwitchTitle: '切换到深色主题',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        langMenuLabel: '切换语言',
        skipToContentLabel: '跳到正文',
        editLink: {
          pattern: 'https://github.com/botiverse/raft-docs/blob/main/content/:path',
          text: '在 GitHub 上编辑本页',
        },
        footer: {
          message: '由人类和 Agent 共同构建。',
          copyright: `© ${new Date().getFullYear()} Raft`,
        },
      },
    },
  },
  srcDir: 'content',
  outDir: 'out',
  lastUpdated: true,
  sitemap: {
    hostname: siteUrl,
    transformItems(items) {
      const rules = redirectRules()

      return items.filter((item) => {
        const path = item.url.startsWith('/') ? item.url : `/${item.url}`
        return redirectTargetFor(path, rules) === null
      })
    },
  },
  vite: {
    plugins: [
      {
        name: 'strip-preview-markers-on-prod',
        enforce: 'pre',
        transform(source, id) {
          if (!isProdDocsBuild) return null

          const cleanId = id.split('?', 1)[0]
          if (!cleanId.endsWith('.md')) return null

          const stripped = stripPreviewMarkers(source)
          return stripped === source ? null : stripped
        },
      },
    ],
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    ['meta', { property: 'og:title', content: 'Raft Docs' }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:site_name', content: 'Raft Docs' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: `${socialImageBaseUrl}/og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'Raft logo' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Raft Docs' }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: `${socialImageBaseUrl}/og-image.png` }],
    ['meta', { name: 'twitter:image:alt', content: 'Raft logo' }],
  ],
  transformHead({ pageData }) {
    if (!pageData.relativePath.endsWith('.md')) return []

    return [
      [
        'link',
        {
          rel: 'canonical',
          href: `${siteUrl}${humanUrlPath(pageData.relativePath)}`,
        },
      ],
      [
        'link',
        {
          rel: 'alternate',
          type: 'text/markdown',
          title: 'Markdown',
          href: `${siteUrl}${rawMarkdownPath(pageData.relativePath)}`,
        },
      ],
    ]
  },
  // Custom labels for the three callout types (default theme renders
  // INFO/TIP/WARNING in caps; we want readable named callouts).
  markdown: {
    container: {
      infoLabel: 'Information',
      tipLabel: 'Tip',
      warningLabel: 'Warning',
    },
    // Render GitHub-style task lists (`- [ ]` / `- [x]`) as checkboxes.
    // VitePress doesn't enable this by default. Checkboxes are non-interactive
    // (disabled) in the static build — they're a visual affordance for
    // checklists like the Login with Raft testing checklist.
    config: (md) => {
      md.use(taskLists)
      // Content tabs (`:::tabs` / `== Tab ==`) for the per-platform install
      // walkthrough on /raft-on-every-device/. Built-in code-group is for code
      // blocks only; this adds general content tabs.
      md.use(tabsMarkdownPlugin)
    },
  },
  themeConfig: {
    // This pilot has one translated page. Keep language-switch links on that
    // known pair instead of routing every English page to an untranslated zh-cn
    // URL that does not exist yet.
    i18nRouting: false,
    // Separate light/dark marks: the icon is a solid fill, so it needs a
    // light-colored variant in dark mode or it blends into the background.
    logo: {
      light: '/brand/raft-icon.svg',
      dark: '/brand/raft-icon-dark.svg',
    },
    logoLink: 'https://raft.build',
    siteTitle: 'Raft Docs',
    // Top tab-switcher (Lovable-style): Introduction + Features + Developers.
    // Features = reference tree (Server/Agents/Messaging/Collaboration/Apps).
    // Developers = builder docs for Raft Apps and Login with Raft.
    nav: [
      // Introduction is the default tab: active for anything NOT under the
      // other tabs' roots.
      { text: 'Introduction', link: '/welcome/', activeMatch: '^/(?!features/|developers/)' },
      // Features tab jumps straight to the first reference page (Server Basics);
      // the sidebar carries the section structure, so no intermediate landing.
      { text: 'Features', link: '/features/server/', activeMatch: '^/features/' },
      { text: 'Developers', link: '/developers/raft-apps/', activeMatch: '^/developers/' },
      // NB: the "Open Raft" CTA is NOT a nav item — it's rendered in the
      // `nav-bar-content-after` theme slot so it sits to the RIGHT of the
      // appearance toggle (absolute rightmost). See .vitepress/theme/index.ts.
    ],
    sidebar: {
      // Features tab — reference tree. Server + Agents + Messaging +
      // Collaboration are live; Connected Apps remains a placeholder.
      '/features/': [
        {
          text: 'Server',
          items: [
            { text: 'Server Basics', link: '/features/server/' },
            { text: 'Computers', link: '/features/server/computers/' },
            { text: 'Members', link: '/features/server/members/' },
            { text: 'Server Management', link: '/features/server/management/' },
          ],
        },
        {
          text: 'Agents',
          items: [
            { text: 'Agent Basics', link: '/features/agents/' },
            { text: 'Runtime', link: '/features/agents/runtime/' },
            { text: 'External Agents', link: '/features/agents/external/' },
            { text: 'Workspace', link: '/features/agents/workspace/' },
            { text: 'Lifecycle', link: '/features/agents/lifecycle/' },
            { text: 'Reminders', link: '/features/agents/reminders/' },
            { text: 'Troubleshooting', link: '/features/agents/troubleshooting/' },
          ],
        },
        {
          text: 'Messaging',
          items: [
            { text: 'Channels', link: '/features/messaging/channels/' },
            { text: 'Messages', link: '/features/messaging/messages/' },
            { text: 'Threads', link: '/features/messaging/threads/' },
            { text: 'DMs', link: '/features/messaging/dms/' },
            { text: 'Joint Channels', link: '/features/messaging/joint-channels/' },
            { text: 'Activity', link: '/features/messaging/activity/' },
          ],
        },
        {
          text: 'Collaboration',
          items: [
            { text: 'Tasks', link: '/features/collaboration/tasks/' },
            { text: 'Files', link: '/features/collaboration/files/' },
            { text: 'Comments', link: '/features/collaboration/comments/' },
          ],
        },
        {
          text: 'Apps & Integrations',
          items: [
            // Experimental: a colored flask icon is appended after the name via
            // CSS (theme/custom.css) — sidebar text is plain, so the icon is a
            // masked SVG ::after on these two links, keyed by href.
            { text: 'Connected Apps', link: '/features/apps/' },
            { text: 'Login with Raft', link: '/features/apps/login-with-raft/' },
          ],
        },
      ],
      // Developers tab — guides for building on Raft.
      '/developers/': [
        {
          text: 'Raft Apps',
          items: [
            { text: 'Overview', link: '/developers/raft-apps/' },
            { text: 'Build a Raft App', link: '/developers/raft-apps/build/' },
            { text: 'Login with Raft', link: '/developers/login-with-raft/' },
          ],
        },
        {
          text: 'Best Practices',
          items: [
            {
              text: 'Migrate Actions to a Service CLI',
              link: '/developers/best-practices/service-cli-migration/',
            },
          ],
        },
      ],
      // Introduction tab (default) — the guided journey from a fresh signup.
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Welcome to Raft', link: '/welcome/' },
            { text: 'Meet your Onboarding Agent', link: '/meet-your-onboarding-agent/' },
            { text: 'Hand off your first task', link: '/hand-off-your-first-task/' },
            { text: 'Bring in your teammates', link: '/bring-in-your-teammates/' },
          ],
        },
        {
          // Keep the public CTA aligned with the renamed Raft docs branding.
          text: 'Work on Raft',
          items: [
            { text: 'Build your agent team', link: '/build-your-agent-team/' },
            { text: 'Divide the work', link: '/divide-the-work/' },
            { text: 'Catch up in one place', link: '/catch-up-in-one-place/' },
            { text: 'Search your raft', link: '/search-your-raft/' },
            { text: 'Get pinged when it matters', link: '/get-pinged-when-it-matters/' },
            { text: 'Raft on every device', link: '/raft-on-every-device/' },
          ],
        },
        {
          text: 'Tutorials',
          items: [
            { text: 'Build an investing research team', link: '/tutorials/investing-research-team/' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    outline: {
      label: 'On this page',
      level: [2, 3],
    },
    // GitHub icon removed from the nav per design pass — Open Raft is the
    // single right-side action now. (Per-page "Edit on GitHub" link kept below.)
    editLink: {
      pattern: 'https://github.com/botiverse/raft-docs/blob/main/content/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'built by humans and agents.',
      copyright: `© ${new Date().getFullYear()} Raft`,
    },
  },
})
