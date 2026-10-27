import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
// @ts-expect-error -- plain .mjs helper shared with scripts/check-sitemap-redirects.mjs
import { parseRedirectRules, redirectTargetFor } from '../packages/docs-kit/src/scripts/redirect-rules.mjs'
// @ts-expect-error -- plain .mjs module in the docs-kit workspace package
import { collectLocalePaths } from '../packages/docs-kit/src/content.mjs'
// @ts-expect-error -- plain .mjs module in the docs-kit workspace package
import docsConfig from '../docs.config.mjs'
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
// in packages/docs-kit/src/scripts/redirect-rules.mjs so this filter and the build-time check cannot
// drift apart -- when they were separate, both skipped wildcard rules and the
// check still claimed full coverage.
const REDIRECTS_FILE = resolve(__dirname, '../content/public/_redirects')

function redirectRules() {
  return parseRedirectRules(readFileSync(REDIRECTS_FILE, 'utf-8'))
}

// Derived from the content tree (docs-kit), replacing the hand-maintained
// translatedZhPaths list: the language switcher only offers a counterpart
// that exists, and a page added without its translation falls back to the
// locale home instead of a dead same-path link.
const translatedLocales = Object.fromEntries(
  Object.entries(collectLocalePaths(docsConfig, { root: resolve(__dirname, '..') })).map(
    ([key, paths]) => [key, [...paths].sort()],
  ),
)

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
      description: 'Raft 文档：人类和 Agent 共用频道、消息列和时间的工作空间。',
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
            link: '/zh-cn/features/server/',
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
                { text: '设置你的服务器', link: '/zh-cn/meet-your-onboarding-agent/' },
                { text: '你的第一个任务', link: '/zh-cn/hand-off-your-first-task/' },
                { text: '邀请队友', link: '/zh-cn/bring-in-your-teammates/' },
                { text: '在手机上使用 Raft', link: '/zh-cn/raft-on-every-device/' },
              ],
            },
            {
              text: '与团队一起工作',
              items: [
                { text: '组建你的 Agent 团队', link: '/zh-cn/build-your-agent-team/' },
                { text: '及时掌握进展', link: '/zh-cn/stay-on-top-of-things/' },
                { text: '形成闭环', link: '/zh-cn/close-the-loop/' },
              ],
            },
            {
              text: '示例',
              items: [
                { text: '投资研究团队', link: '/zh-cn/tutorials/investing-research-team/' },
              ],
            },
          ],
          '/zh-cn/features/': [
            {
              text: '服务器与成员',
              items: [
                { text: '服务器', link: '/zh-cn/features/server/' },
                { text: '成员与角色', link: '/zh-cn/features/server/members/' },
              ],
            },
            {
              text: 'Agent',
              items: [
                { text: 'Agent', link: '/zh-cn/features/agents/' },
                { text: '计算机', link: '/zh-cn/features/server/computers/' },
                { text: 'Agent 状态', link: '/zh-cn/features/agents/lifecycle/' },
                { text: '提醒', link: '/zh-cn/features/agents/reminders/' },
                { text: '外部 Agent', link: '/zh-cn/features/agents/external/' },
                { text: 'Agent 故障排查', link: '/zh-cn/features/agents/troubleshooting/' },
              ],
            },
            {
              text: '对话',
              items: [
                { text: '频道与私信', link: '/zh-cn/features/messaging/channels/' },
                { text: '动态与通知', link: '/zh-cn/features/messaging/activity/' },
                { text: '联合频道', link: '/zh-cn/features/messaging/joint-channels/' },
                { text: '搜索', link: '/zh-cn/features/messaging/search/' },
              ],
            },
            {
              text: '工作',
              items: [
                { text: '任务', link: '/zh-cn/features/collaboration/tasks/' },
                { text: '文件', link: '/zh-cn/features/collaboration/files/' },
              ],
            },
            {
              text: '应用',
              items: [
                { text: '应用', link: '/zh-cn/features/apps/' },
                { text: 'MCP 应用', link: '/zh-cn/features/apps/mcp/' },
              ],
            },
            {
              text: '账单与管理',
              items: [
                { text: '套餐与账单', link: '/zh-cn/features/server/plans/' },
                { text: '服务器设置', link: '/zh-cn/features/server/management/' },
                { text: '账户', link: '/zh-cn/features/account/' },
              ],
            },
          ],
          '/zh-cn/developers/': [
            {
              text: 'Raft 应用',
              items: [
                { text: '概览', link: '/zh-cn/developers/raft-apps/' },
                { text: '构建 Raft 应用', link: '/zh-cn/developers/raft-apps/build/' },
                { text: '应用链接预览', link: '/zh-cn/developers/raft-apps/link-previews/' },
                { text: '应用机器人', link: '/zh-cn/developers/raft-apps/bot/' },
                {
                  text: '市场',
                  items: [
                    { text: '发布到市场', link: '/zh-cn/developers/raft-apps/publish/' },
                    { text: '私有分享给其他服务器', link: '/zh-cn/developers/raft-apps/share/' },
                  ],
                },
                { text: 'Login with Raft', link: '/zh-cn/developers/login-with-raft/' },
              ],
            },
            {
              text: 'Raft SDK',
              items: [
                { text: '概览', link: '/zh-cn/developers/sdk/' },
                { text: 'API 客户端用法', link: '/zh-cn/developers/sdk/api-client/' },
                { text: '创建并连接外部 Agent', link: '/zh-cn/developers/sdk/external-agents/' },
                { text: '唤醒、收件箱确认与状态', link: '/zh-cn/developers/sdk/external-agents/wake-and-status/' },
                { text: '从 0.x 客户端迁移', link: '/zh-cn/developers/sdk/migrating/' },
              ],
            },
            {
              text: '最佳实践',
              items: [
                {
                  text: '迁移到服务 CLI',
                  link: '/zh-cn/developers/best-practices/service-cli-migration/',
                },
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
    // raft-ui's tokens follow the system theme unless <html> says `.light` or
    // `.dark`. VitePress only ever sets `.dark`, so a reader who picks light
    // on a dark-mode OS would get dark tokens. Mirror the choice as `.light`,
    // before first paint and on every toggle.
    [
      'script',
      {},
      `;(() => { const el = document.documentElement; const sync = () => el.classList.toggle('light', !el.classList.contains('dark')); sync(); new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ['class'] }) })()`,
    ],
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
    // The Raft Design System's code theme (raft-ui CodeBlock).
    theme: { light: 'vitesse-light', dark: 'vitesse-dark' },
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
    // Consumed by the docs-kit theme: per-locale route sets derived from the
    // content tree (see translatedLocales above).
    docsKit: {
      translated: translatedLocales,
    },
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
      // Features tab — reference tree, grouped by what you're doing.
      '/features/': [
        {
          text: 'Server and people',
          items: [
            { text: 'Servers', link: '/features/server/' },
            { text: 'Members and roles', link: '/features/server/members/' },
          ],
        },
        {
          text: 'Agents',
          items: [
            { text: 'Agents', link: '/features/agents/' },
            { text: 'Computers', link: '/features/server/computers/' },
            { text: 'Agent status', link: '/features/agents/lifecycle/' },
            { text: 'Reminders', link: '/features/agents/reminders/' },
            // Experimental: a colored flask icon is appended after the name via
            // CSS (docs-kit theme/custom.css), keyed by href.
            { text: 'External agents', link: '/features/agents/external/' },
            { text: 'Agent troubleshooting', link: '/features/agents/troubleshooting/' },
          ],
        },
        {
          text: 'Conversations',
          items: [
            { text: 'Channels and DMs', link: '/features/messaging/channels/' },
            { text: 'Activity and notifications', link: '/features/messaging/activity/' },
            { text: 'Joint channels', link: '/features/messaging/joint-channels/' },
            { text: 'Search', link: '/features/messaging/search/' },
          ],
        },
        {
          text: 'Work',
          items: [
            { text: 'Tasks', link: '/features/collaboration/tasks/' },
            { text: 'Files', link: '/features/collaboration/files/' },
          ],
        },
        {
          text: 'Apps',
          items: [
            { text: 'Apps', link: '/features/apps/' },
            { text: 'MCP Apps', link: '/features/apps/mcp/' },
          ],
        },
        {
          text: 'Billing and management',
          items: [
            { text: 'Plans and billing', link: '/features/server/plans/' },
            { text: 'Server settings', link: '/features/server/management/' },
            { text: 'Account', link: '/features/account/' },
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
            { text: 'App link previews', link: '/developers/raft-apps/link-previews/' },
            { text: 'App Bot', link: '/developers/raft-apps/bot/' },
            {
              text: 'Marketplace',
              items: [
                { text: 'Publish to the Marketplace', link: '/developers/raft-apps/publish/' },
                { text: 'Share privately with another server', link: '/developers/raft-apps/share/' },
              ],
            },
            { text: 'Login with Raft', link: '/developers/login-with-raft/' },
          ],
        },
        {
          text: 'Raft SDK',
          items: [
            { text: 'Overview', link: '/developers/sdk/' },
            { text: 'API client usage', link: '/developers/sdk/api-client/' },
            { text: 'Create and connect an external agent', link: '/developers/sdk/external-agents/' },
            { text: 'Wake-ups, inbox acknowledgement, and status', link: '/developers/sdk/external-agents/wake-and-status/' },
            { text: 'Migrating from the 0.x client', link: '/developers/sdk/migrating/' },
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
          text: 'Get started',
          items: [
            { text: 'Welcome', link: '/welcome/' },
            { text: 'Set up your server', link: '/meet-your-onboarding-agent/' },
            { text: 'Your first task', link: '/hand-off-your-first-task/' },
            { text: 'Invite teammates', link: '/bring-in-your-teammates/' },
            { text: 'Raft on your phone', link: '/raft-on-every-device/' },
          ],
        },
        {
          text: 'Work with your team',
          items: [
            { text: 'Build your agent team', link: '/build-your-agent-team/' },
            { text: 'Stay on top of things', link: '/stay-on-top-of-things/' },
            { text: 'Close the loop', link: '/close-the-loop/' },
          ],
        },
        {
          text: 'Examples',
          items: [
            { text: 'Investing research team', link: '/tutorials/investing-research-team/' },
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
