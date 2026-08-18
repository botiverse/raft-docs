import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { useData } from 'vitepress'
import { h } from 'vue'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import './custom.css'
import { initAnalytics } from './analytics'

function markdownHref(relativePath: string) {
  if (relativePath === 'index.md') return '/index.md'
  if (relativePath.endsWith('/index.md')) {
    return `/${relativePath.slice(0, -'/index.md'.length)}.md`
  }
  return `/${relativePath}`
}

function uiCopy(lang: string) {
  return lang.toLowerCase().startsWith('zh')
    ? {
        markdownLink: '查看 Markdown',
        openRaft: '打开 Raft',
      }
    : {
        markdownLink: 'View as Markdown',
        openRaft: 'Open Raft',
      }
}

function MarkdownLink() {
  const { page, lang } = useData()
  const copy = uiCopy(lang.value)
  return h('p', { class: 'raft-markdown-link' }, [
    // target=_blank + rel=external so the SPA router doesn't intercept the .md
    // link and rewrite it to .md.html (which 404s). Opens the raw Markdown file.
    h(
      'a',
      { href: markdownHref(page.value.relativePath), target: '_blank', rel: 'noreferrer external' },
      copy.markdownLink,
    ),
  ])
}

// "Open Raft" CTA rendered at the end of the nav bar (after the appearance
// toggle) so it's the absolute rightmost action. Styled as the brutal-pink
// btn-brutal-sm in custom.css via the .raft-open-cta class.
function OpenRaftCta() {
  const { lang } = useData()
  const copy = uiCopy(lang.value)

  return h(
    'a',
    { class: 'raft-open-cta', href: 'https://app.raft.build', rel: 'noreferrer external' },
    copy.openRaft,
  )
}

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(MarkdownLink),
      'nav-bar-content-after': () => h(OpenRaftCta),
    })
  },
  enhanceApp({ app }: EnhanceAppContext) {
    enhanceAppWithTabs(app)
    // Fire-and-forget. initAnalytics is a no-op during SSR, off the production
    // host, and when no PostHog key is configured — so it's safe to call here.
    void initAnalytics()
  },
}
