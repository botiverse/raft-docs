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

export default defineConfig({
  title: 'Raft Docs',
  description,
  lang: 'en-US',
  srcDir: 'content',
  outDir: 'out',
  lastUpdated: true,
  sitemap: {
    hostname: siteUrl,
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
    // Separate light/dark marks: the icon is a solid fill, so it needs a
    // light-colored variant in dark mode or it blends into the background.
    logo: {
      light: '/brand/raft-icon.svg',
      dark: '/brand/raft-icon-dark.svg',
    },
    siteTitle: 'Raft Docs',
    // Top tab-switcher (Lovable-style): Introduction + Features + Developers.
    // Features = reference tree (Server/Agents/Messaging/Collaboration/Apps).
    // Developers = integration guides (Login with Raft).
    nav: [
      // Introduction is the default tab: active for anything NOT under the
      // other tabs' roots.
      { text: 'Introduction', link: '/welcome/', activeMatch: '^/(?!features/|developers/)' },
      // Features tab jumps straight to the first reference page (Server Basics);
      // the sidebar carries the section structure, so no intermediate landing.
      { text: 'Features', link: '/features/server/', activeMatch: '^/features/' },
      // Developers tab jumps straight to the only guide for now.
      { text: 'Developers', link: '/developers/login-with-raft/', activeMatch: '^/developers/' },
      // Outbound entry points: a secondary link back to the marketing homepage,
      // then the primary "Open Raft" CTA (styled as a brutal-pink button via
      // custom.css, scoped to the nav). Open Raft sits last so it's rightmost,
      // just before the GitHub social icon.
      { text: 'raft.build', link: 'https://raft.build' },
      { text: 'Open Raft', link: 'https://app.raft.build' },
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
      // Developers tab — integration guides for building on Raft.
      '/developers/': [
        {
          text: 'Integration Guides',
          items: [
            // Experimental: colored flask icon appended via CSS (custom.css),
            // keyed by href — same treatment as the §5 Apps pages.
            { text: 'Login with Raft', link: '/developers/login-with-raft/' },
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
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/botiverse/raft-docs' },
    ],
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
