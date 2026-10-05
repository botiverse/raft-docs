import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { useData } from 'vitepress'
import { defineComponent, h, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import { pageTwinPath } from '../config.mjs'
import './custom.css'

/**
 * createDocsTheme(config, options) — the kit's VitePress theme.
 *
 * Extracted from raft-docs so both sites (and any future one) share the
 * chrome: the Markdown-twin link, the "Open Raft"-style CTA, the travelling
 * nav-tab indicator, and per-page language switching whose hrefs only offer
 * a counterpart when a translation actually exists.
 *
 * The translated-path sets come from `themeConfig.docsKit.translated`
 * (computed at build time with `collectLocalePaths`) — derived from the
 * content tree, never hand-maintained.
 *
 * options.initAnalytics: fire-and-forget hook called in enhanceApp.
 */

type LocaleEntry = {
  key: string
  dir: string
  label: string
  chrome?: Record<string, string>
}

function localeForRelativePath(config: any, relativePath: string): LocaleEntry {
  const normalized = normalizePagePath(`/${relativePath}`)
  const match = config.locales.find(
    (locale: LocaleEntry) => locale.dir && normalized.startsWith(`/${locale.dir}/`),
  )
  return match ?? config.defaultLocale
}

function localeForLabel(config: any, label: string): LocaleEntry | undefined {
  return config.locales.find((locale: LocaleEntry) => locale.label === label)
}

function uiCopy(locale: LocaleEntry, config: any) {
  const chrome = locale.chrome ?? {}
  return {
    markdownLink:
      chrome.markdownLink ?? (locale === config.defaultLocale ? 'View as Markdown' : 'Markdown'),
    openRaft: chrome.openRaft ?? 'Open',
    language: chrome.language ?? 'Language',
    languageAria: chrome.languageAria ?? 'Switch language',
  }
}

/** Strip the base path so route math works on site-relative paths. */
function stripBasePath(basePath: string, pathname: string) {
  if (basePath !== '/' && pathname.startsWith(basePath)) {
    return `/${pathname.slice(basePath.length)}`
  }
  return pathname
}

function withBasePath(basePath: string, route: string) {
  return `${basePath}${route}`.replace(/\/{2,}/g, '/')
}

function markdownHref(config: any, relativePath: string) {
  return withBasePath(config.basePath, `/${pageTwinPath(config, relativePath)}`.replace(/\/{2,}/g, '/'))
}

function normalizePagePath(pathname: string) {
  if (pathname.endsWith('/')) return pathname
  return `${pathname}/`
}

/**
 * The counterpart href for `pathname` in `target`, with a fallback: when the
 * page has no translation there, offer the locale's home instead of a dead
 * same-path link (the site is 100% translated today, so the dead-link case
 * would only appear the day a page is added before its translation — exactly
 * when nobody is watching).
 */
function counterpartLocalePath(
  config: any,
  translated: Record<string, string[]>,
  pathname: string,
  target: LocaleEntry,
) {
  const currentPath = normalizePagePath(stripBasePath(config.basePath, pathname))
  const currentLocale = config.locales.find(
    (locale: LocaleEntry) => locale.dir && currentPath.startsWith(`/${locale.dir}/`),
  )
  const relative = currentLocale?.dir
    ? currentPath.slice(`/${currentLocale.dir}`.length)
    : currentPath
  const candidate = target.dir ? `/${target.dir}${relative}` : relative

  const known = translated?.[target.key]
  if (!known || known.includes(candidate)) {
    return withBasePath(config.basePath, candidate)
  }
  return withBasePath(config.basePath, target.dir ? `/${target.dir}/` : '/')
}

function rewriteLocaleLinks(config: any, translated: Record<string, string[]>) {
  // VitePress' built-in translations dropdown renders same-path links for
  // every locale; rewrite them to real counterparts (or locale homes).
  const anchors = document.querySelectorAll<HTMLAnchorElement>(
    '.VPNavBarTranslations a, .VPNavBarExtra a, .VPNavScreen a',
  )
  const currentPath = normalizePagePath(stripBasePath(config.basePath, window.location.pathname))
  const currentLocale =
    config.locales.find(
      (locale: LocaleEntry) => locale.dir && currentPath.startsWith(`/${locale.dir}/`),
    ) ?? config.defaultLocale

  for (const anchor of anchors) {
    const label = anchor.textContent?.trim()
    if (!label) continue

    const target = localeForLabel(config, label)
    if (!target || target.key === currentLocale.key) continue

    anchor.href = counterpartLocalePath(config, translated, window.location.pathname, target)
  }
}

export function createDocsTheme(config: any, options: { initAnalytics?: () => void } = {}) {
  const LocaleLinkRewriter = defineComponent({
    setup() {
      const { page, theme } = useData()
      let observer: MutationObserver | null = null

      function refresh() {
        void nextTick(() => {
          window.requestAnimationFrame(() =>
            rewriteLocaleLinks(config, (theme.value as any)?.docsKit?.translated ?? {}),
          )
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

  // The top nav tabs are separate pages, so VitePress draws the active
  // underline as a per-link ::after: on navigation the old bar disappears and
  // a new one appears, with nothing in between to animate. This measures the
  // active link and drives ONE shared bar on the menu container, so it
  // travels instead.
  //
  // It also stamps data-text on each label, which custom.css uses to reserve
  // the bold width (one letter-spacing value cannot correct every word).
  // Progressive enhancement: the per-link bar stays in the stylesheet and is
  // only hidden once `docs-tabs-ready` is set, so if this never runs the tabs
  // look exactly as before.
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
          menu.classList.remove('docs-tabs-ready')
          return
        }

        const menuBox = menu.getBoundingClientRect()
        const activeBox = active.getBoundingClientRect()
        if (activeBox.width === 0) return

        // 8px each side matches the inset the per-link bar has always used.
        menu.style.setProperty('--docs-tab-x', `${Math.round(activeBox.left - menuBox.left + 8)}px`)
        menu.style.setProperty('--docs-tab-w', `${Math.round(activeBox.width - 16)}px`)
        menu.classList.add('docs-tabs-ready')
      }

      function schedule() {
        window.cancelAnimationFrame(frame)
        frame = window.requestAnimationFrame(() => {
          void nextTick(place)
        })
      }

      onMounted(() => {
        schedule()
        const menu = document.querySelector('.VPNavBar .VPNavBarMenu')
        if (menu) {
          observer = new MutationObserver(schedule)
          observer.observe(menu, { attributes: true, subtree: true, attributeFilter: ['class'] })
        }
        window.addEventListener('resize', schedule)
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
    const { page } = useData()
    const relativePath = String(page.value.relativePath)
    const copy = uiCopy(localeForRelativePath(config, relativePath), config)
    return h('p', { class: 'docs-markdown-link' }, [
      // target=_blank + rel=external so the SPA router doesn't intercept the
      // .md link and rewrite it to .md.html (which 404s).
      h(
        'a',
        { href: markdownHref(config, relativePath), target: '_blank', rel: 'noreferrer external' },
        copy.markdownLink,
      ),
    ])
  }

  function HeaderCta() {
    const { page } = useData()
    const entry = config.brand.headerNav.find((item: any) => item.primary)
    if (!entry) return null
    const copy = uiCopy(localeForRelativePath(config, String(page.value.relativePath)), config)
    return h(
      'a',
      { class: 'docs-open-cta', href: entry.href, rel: 'noreferrer external' },
      copy.openRaft,
    )
  }

  return {
    extends: DefaultTheme,
    Layout() {
      return h(DefaultTheme.Layout, null, {
        'doc-before': () => h(MarkdownLink),
        'nav-bar-content-after': () => h(HeaderCta),
        'layout-bottom': () => [h(LocaleLinkRewriter), h(NavTabIndicator)],
      })
    },
    enhanceApp({ app }: EnhanceAppContext) {
      enhanceAppWithTabs(app)
      // Fire-and-forget; the hook is a no-op during SSR by contract.
      void options.initAnalytics?.()
    },
  }
}
