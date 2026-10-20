import { computed, defineComponent, h } from 'vue'
import { useData, useRoute } from 'vitepress'

// The section label above a page title ("Getting Started", "Agents"), as on the
// Raft Design System site: the sidebar group the current page sits in, so the
// reader knows where they are without scanning the sidebar. Pages outside any
// sidebar group get no label.

type Item = { text?: string; link?: string; items?: Item[] }

function normalize(path: string) {
  return path.replace(/index\.html$/, '').replace(/\.html$/, '/').replace(/\/?$/, '/')
}

function groupFor(items: Item[], path: string, parent?: string): string | undefined {
  for (const item of items) {
    if (item.link && normalize(item.link) === path) return parent
    if (item.items) {
      const found = groupFor(item.items, path, item.text ?? parent)
      if (found) return found
    }
  }
  return undefined
}

export default defineComponent({
  name: 'PageKicker',
  setup() {
    const { theme } = useData()
    const route = useRoute()
    const label = computed(() => {
      const sidebar = theme.value.sidebar
      if (!sidebar) return undefined
      const path = normalize(route.path)
      const roots: Item[][] = Array.isArray(sidebar)
        ? [sidebar]
        : Object.entries(sidebar as Record<string, Item[]>)
            .filter(([base]) => path.startsWith(base))
            .sort(([a], [b]) => b.length - a.length)
            .map(([, items]) => items)
      for (const items of roots) {
        const found = groupFor(items, path)
        if (found) return found
      }
      return undefined
    })
    return () => (label.value ? h('p', { class: 'docs-page-kicker' }, label.value) : null)
  },
})
