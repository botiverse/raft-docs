import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { useData } from 'vitepress'
import { h } from 'vue'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import './custom.css'

function markdownHref(relativePath: string) {
  if (relativePath === 'index.md') return '/index.md'
  if (relativePath.endsWith('/index.md')) {
    return `/${relativePath.slice(0, -'/index.md'.length)}.md`
  }
  return `/${relativePath}`
}

function MarkdownLink() {
  const { page } = useData()
  return h('p', { class: 'raft-markdown-link' }, [
    // target=_blank + rel=external so the SPA router doesn't intercept the .md
    // link and rewrite it to .md.html (which 404s). Opens the raw Markdown file.
    h('a', { href: markdownHref(page.value.relativePath), target: '_blank', rel: 'noreferrer external' }, 'View as Markdown'),
  ])
}

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(MarkdownLink),
    })
  },
  enhanceApp({ app }: EnhanceAppContext) {
    enhanceAppWithTabs(app)
  },
}
