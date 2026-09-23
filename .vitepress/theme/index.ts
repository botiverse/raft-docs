import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { useData } from 'vitepress'
import { defineComponent, h, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import './custom.css'
import { initAnalytics } from './analytics'

const translatedZhPaths = new Set([
  '/zh-cn/',
  '/zh-cn/bring-in-your-teammates/',
  '/zh-cn/build-your-agent-team/',
  '/zh-cn/catch-up-in-one-place/',
  '/zh-cn/developers/best-practices/service-cli-migration/',
  '/zh-cn/developers/login-with-raft/',
  '/zh-cn/developers/raft-apps/',
  '/zh-cn/developers/raft-apps/build/',
  '/zh-cn/divide-the-work/',
  '/zh-cn/features/',
  '/zh-cn/features/agents/',
  '/zh-cn/features/agents/external/',
  '/zh-cn/features/agents/lifecycle/',
  '/zh-cn/features/agents/reminders/',
  '/zh-cn/features/agents/runtime/',
  '/zh-cn/features/agents/troubleshooting/',
  '/zh-cn/features/agents/workspace/',
  '/zh-cn/features/apps/',
  '/zh-cn/features/apps/login-with-raft/',
  '/zh-cn/features/collaboration/',
  '/zh-cn/features/collaboration/comments/',
  '/zh-cn/features/collaboration/files/',
  '/zh-cn/features/collaboration/tasks/',
  '/zh-cn/features/messaging/',
  '/zh-cn/features/messaging/activity/',
  '/zh-cn/features/messaging/channels/',
  '/zh-cn/features/messaging/dms/',
  '/zh-cn/features/messaging/joint-channels/',
  '/zh-cn/features/messaging/messages/',
  '/zh-cn/features/messaging/threads/',
  '/zh-cn/features/server/',
  '/zh-cn/features/server/computers/',
  '/zh-cn/features/server/management/',
  '/zh-cn/features/server/members/',
  '/zh-cn/get-pinged-when-it-matters/',
  '/zh-cn/hand-off-your-first-task/',
  '/zh-cn/meet-your-onboarding-agent/',
  '/zh-cn/raft-on-every-device/',
  '/zh-cn/search-your-raft/',
  '/zh-cn/tutorials/investing-research-team/',
  '/zh-cn/welcome/',
])

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

function normalizePagePath(pathname: string) {
  if (pathname.endsWith('/')) return pathname
  return `${pathname}/`
}

function counterpartLocalePath(pathname: string, label: string) {
  const currentPath = normalizePagePath(pathname)

  if (label === '简体中文') {
    const zhPath = currentPath.startsWith('/zh-cn/')
      ? currentPath
      : `/zh-cn${currentPath}`
    return translatedZhPaths.has(zhPath) ? zhPath : null
  }

  if (label === 'English' && currentPath.startsWith('/zh-cn/')) {
    return currentPath.replace(/^\/zh-cn/, '')
  }

  return null
}

function rewriteLocaleLinks() {
  const anchors = document.querySelectorAll<HTMLAnchorElement>('.VPNavBarTranslations a, .VPNavBarExtra a, .VPNavScreen a')

  for (const anchor of anchors) {
    const label = anchor.textContent?.trim()
    if (!label) continue

    const href = counterpartLocalePath(window.location.pathname, label)
    if (href) anchor.href = href
  }
}

const LocaleLinkRewriter = defineComponent({
  setup() {
    const { page } = useData()
    let observer: MutationObserver | null = null

    function refresh() {
      void nextTick(() => {
        window.requestAnimationFrame(rewriteLocaleLinks)
      })
    }

    onMounted(() => {
      refresh()
      observer = new MutationObserver(refresh)
      observer.observe(document.body, { childList: true, subtree: true })
    })

    onUnmounted(() => {
      observer?.disconnect()
    })

    watch(() => page.value.relativePath, refresh)

    return () => null
  },
})

// The top nav tabs are separate pages, so VitePress draws the active underline
// as a per-link ::after: on navigation the old bar disappears and a new one
// appears, with nothing in between to animate. This measures the active link
// and drives ONE shared bar on the menu container, so it travels instead.
//
// It also stamps data-text on each label, which custom.css uses to reserve the
// bold width. Measured on production (Inter 14px): Introduction 80.9 -> 83.7,
// Features 58.2 -> 59.8, Developers 75.9 -> 77.8. Each word needs a different
// correction, which is why one letter-spacing value cannot fix the shift and a
// hidden bold copy can.
//
// Progressive enhancement on purpose: the per-link bar stays in the stylesheet
// and is only hidden once `rd-tabs-ready` is set, so if this never runs the
// tabs look exactly as they do today rather than losing their underline.
const NavTabIndicator = defineComponent({
  setup() {
    const { page } = useData()
    let frame = 0
    let observer: MutationObserver | null = null

    function place() {
      const menu = document.querySelector<HTMLElement>('.VPNavBar .VPNavBarMenu')
      if (!menu) return

      for (const label of menu.querySelectorAll<HTMLElement>('.VPNavBarMenuLink > span')) {
        const text = label.textContent?.trim() ?? ''
        if (label.dataset.text !== text) label.dataset.text = text
      }

      const active = menu.querySelector<HTMLElement>('.VPNavBarMenuLink.active')
      if (!active) {
        // No active tab on this route: fall back to no bar rather than leaving
        // one parked under whichever tab was last active.
        menu.classList.remove('rd-tabs-ready')
        return
      }

      const menuBox = menu.getBoundingClientRect()
      const activeBox = active.getBoundingClientRect()
      if (activeBox.width === 0) return // not laid out yet; a later pass will catch it

      // 8px each side matches the inset the per-link bar has always used, so
      // the shared bar lands exactly where the old one did.
      menu.style.setProperty('--rd-tab-x', `${Math.round(activeBox.left - menuBox.left + 8)}px`)
      menu.style.setProperty('--rd-tab-w', `${Math.round(activeBox.width - 16)}px`)
      menu.classList.add('rd-tabs-ready')
    }

    function schedule() {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        void nextTick(place)
      })
    }

    onMounted(() => {
      schedule()
      // VitePress toggles `.active` in place on client-side navigation, so the
      // class change is the signal, not a remount.
      const menu = document.querySelector('.VPNavBar .VPNavBarMenu')
      if (menu) {
        observer = new MutationObserver(schedule)
        observer.observe(menu, { attributes: true, subtree: true, attributeFilter: ['class'] })
      }
      window.addEventListener('resize', schedule)
      // Web fonts change text width after first paint; without this the bar is
      // measured against the fallback face and sits slightly wrong.
      void document.fonts?.ready.then(schedule)
    })

    onUnmounted(() => {
      observer?.disconnect()
      window.removeEventListener('resize', schedule)
      window.cancelAnimationFrame(frame)
    })

    watch(() => page.value.relativePath, schedule)

    return () => null
  },
})

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
      'layout-bottom': () => [h(LocaleLinkRewriter), h(NavTabIndicator)],
    })
  },
  enhanceApp({ app }: EnhanceAppContext) {
    enhanceAppWithTabs(app)
    // Fire-and-forget. initAnalytics is a no-op during SSR, off the production
    // host, and when no PostHog key is configured — so it's safe to call here.
    void initAnalytics()
  },
}
