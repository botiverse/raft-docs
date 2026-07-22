// PostHog analytics for the Raft docs site.
//
// Scope + rationale (see #proj-landing task #46 / thread 38807de9):
// - Client-side only, and only on the production host docs.raft.build. Preview
//   builds and local dev stay inert (wrong host or no key => no-op), so nothing
//   is tracked outside production.
// - Env contract mirrors raft-landing PR #120 so the two sites share one schema
//   and their events join cleanly: VITE_POSTHOG_PROJECT_API_KEY (fallback
//   VITE_POSTHOG_KEY), VITE_POSTHOG_API_HOST (fallback VITE_POSTHOG_HOST),
//   default host https://us.i.posthog.com. The public project key is injected
//   at build time in Cloudflare Pages and never committed, so this file is inert
//   until that env var is set.
// - Measurement model: named KPI events are the reporting口径 (source of truth);
//   autocapture is left ON only as a raw/exploration layer. Docs has fewer
//   conversion surfaces than landing, so DOM-level noise is acceptable as long
//   as the KPIs read from named events. Session replay (if wanted) is a separate
//   PostHog project toggle, independent of this file.
//
// KPI events:
// - docs_external_link_clicked: an outbound link click, tagged with
//   destination_product_surface=app|signup|landing when recognizable. This is
//   the "did docs drive people to the product" signal.
// - docs_search: a search query (+ results_count when readable). Doubles as a
//   docs/Manual gap signal — what people search for and whether docs answered it.
// - docs_code_copied: a code-block copy-button click (+ language). autocapture
//   already records the raw click; this is the stable named口径 for it.
//
// Note: every button/link click and SPA navigation is also captured broadly by
// autocapture + capture_pageview ("别漏" layer); the named events above are the
// "好分析" KPI layer on top.

const PROD_HOST = 'docs.raft.build'

function readEnv(...names: string[]): string | undefined {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env
  if (!env) return undefined
  for (const name of names) {
    const value = env[name]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return undefined
}

function classifyProductSurface(url: URL): string | undefined {
  const host = url.hostname
  if (host === 'app.raft.build') {
    return /^\/sign[-_]?up/i.test(url.pathname) ? 'signup' : 'app'
  }
  if (host === 'raft.build' || host === 'www.raft.build') return 'landing'
  return undefined
}

function anchorLocation(anchor: Element): string {
  if (anchor.closest('.VPNavBar, .VPNav')) return 'nav'
  if (anchor.closest('.VPSidebar')) return 'sidebar'
  if (anchor.closest('.VPDocFooter')) return 'doc_footer'
  if (anchor.closest('.VPFooter, footer')) return 'footer'
  return 'content'
}

// VitePress local search renders an input inside the VPLocalSearchBox modal.
// Selectors are defensive (class + aria-label fallback) and confirmed against
// the live search DOM before relying on docs_search for reporting.
function isSearchInput(input: HTMLInputElement): boolean {
  if (input.closest('.VPLocalSearchBox')) return true
  return (input.getAttribute('aria-label') || '').toLowerCase().includes('search')
}

function readSearchResultsCount(): number | undefined {
  try {
    const box = document.querySelector('.VPLocalSearchBox')
    if (!box) return undefined
    return box.querySelectorAll('ul li').length
  } catch {
    return undefined
  }
}

let booted = false

export async function initAnalytics(): Promise<void> {
  // Browser + production host only. Everything else stays inert.
  if (typeof window === 'undefined') return
  if (window.location.hostname !== PROD_HOST) return
  if (booted) return

  const key = readEnv('VITE_POSTHOG_PROJECT_API_KEY', 'VITE_POSTHOG_KEY')
  if (!key) return // no key configured in this build => stay inert
  const apiHost = readEnv('VITE_POSTHOG_API_HOST', 'VITE_POSTHOG_HOST') ?? 'https://us.i.posthog.com'

  booted = true

  const { default: posthog } = await import('posthog-js')
  posthog.init(key, {
    api_host: apiHost,
    autocapture: true, // raw/exploration layer only; KPIs are the named events below
    capture_pageview: 'history_change',
    capture_pageleave: true,
    person_profiles: 'identified_only',
  })

  registerKpiListeners(posthog)
}

function registerKpiListeners(posthog: typeof import('posthog-js').default): void {
  // Outbound link clicks (the product-egress KPI). Internal navigation is
  // already covered by pageviews, so only cross-origin links are reported.
  document.addEventListener(
    'click',
    (event) => {
      try {
        const target = event.target as Element | null
        const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null
        if (!anchor) return
        let url: URL
        try {
          url = new URL(anchor.getAttribute('href') || '', window.location.href)
        } catch {
          return
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return
        if (url.origin === window.location.origin) return // internal nav => pageview covers it
        posthog.capture('docs_external_link_clicked', {
          page_path: window.location.pathname,
          link_url: url.href,
          link_text: (anchor.textContent || '').trim().slice(0, 120),
          link_location: anchorLocation(anchor),
          is_external: true,
          destination_product_surface: classifyProductSurface(url),
        })
      } catch {
        // Analytics must never break navigation.
      }
    },
    { capture: true },
  )

  // Code-block copy clicks. autocapture already records the raw button click;
  // this is the stable named口径 (Cindy called the copy button out explicitly).
  document.addEventListener(
    'click',
    (event) => {
      try {
        const target = event.target as Element | null
        const button = target?.closest?.('button.copy') as HTMLButtonElement | null
        if (!button) return
        const block = button.closest('div[class*="language-"]')
        const language =
          Array.from(block?.classList || [])
            .find((c) => c.startsWith('language-'))
            ?.slice('language-'.length) || undefined
        posthog.capture('docs_code_copied', {
          page_path: window.location.pathname,
          language,
        })
      } catch {
        // never break the copy action
      }
    },
    { capture: true },
  )

  // Search queries (docs/Manual gap signal). Debounced so we log the settled
  // query, not every keystroke.
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  document.addEventListener('input', (event) => {
    try {
      const target = event.target as HTMLElement | null
      if (!target || target.tagName !== 'INPUT') return
      if (!isSearchInput(target as HTMLInputElement)) return
      const query = (target as HTMLInputElement).value.trim()
      if (searchTimer) clearTimeout(searchTimer)
      if (!query) return
      searchTimer = setTimeout(() => {
        posthog.capture('docs_search', {
          page_path: window.location.pathname,
          query,
          results_count: readSearchResultsCount(),
        })
      }, 600)
    } catch {
      // ignore
    }
  })
}
