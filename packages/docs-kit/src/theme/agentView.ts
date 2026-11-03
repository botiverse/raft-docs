import { useData, withBase } from 'vitepress'
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { pageTwinPath } from '../config.mjs'

/**
 * The For human / For agents switch (see ../agent-view.mjs for where the
 * agent side comes from).
 *
 * A page with `agent_view` frontmatter gets a switch at the bottom centre.
 * Hovering For agents peeks at the agent side; choosing it grows that peek
 * into the whole page: the page's Markdown twin as plain text, dark, with a
 * bar to copy its link for an agent. Switching back returns to where the
 * reader was. The choice is remembered across pages; pages without an agent
 * side are untouched.
 */

type Mode = 'human' | 'agent'
type AgentViewData = { words: number; source: string }

const MODE_KEY = 'docsAgentView'
const TRIED_KEY = 'docsAgentViewTried'

// One state for the dock and the pane, shared across page navigations.
const mode = ref<Mode>('human')
const tried = ref(true)
const texts = new Map<string, Promise<string>>()

const defaults: Record<string, string> = {
  agentViewHuman: 'For human',
  agentViewAgent: 'For agents',
  agentViewBarTitle: "You're reading what agents read.",
  agentViewBarText: '{words} words of commands, limits and edge cases. Hand it to your agent instead.',
  agentViewCopy: 'Copy for agents',
  agentViewBack: 'Back',
  agentViewCopied: 'Link copied',
  agentViewCopyText: 'Read this Raft docs page before you start: {url}',
  agentViewPeek: '{words} words · what agents read · click to switch',
  agentViewLoading: 'Loading…',
  agentViewFailed: "Couldn't load the agent version. Open it as Markdown instead:",
  agentViewSource: 'for agents · source: {source}',
}

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_m, key) => values[key] ?? '')
}

function esc(text: string) {
  return text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
}

// VitePress' heading slugs (@mdit-vue/shared), so a link to a section that
// only exists on the agent side still lands on it.
function slugify(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

function headingAnchor(line: string) {
  const text = line.replace(/^#{1,6}\s+/, '')
  const explicit = text.match(/\{#([^}]+)\}\s*$/)
  return explicit ? explicit[1] : slugify(text)
}

function headingAnchors(markdown: string) {
  let inFence = false
  const anchors: string[] = []
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    else if (!inFence && /^#{1,6} /.test(line)) anchors.push(headingAnchor(line))
  }
  return anchors
}

function rawHtml(markdown: string) {
  let inFence = false
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
      return !inFence && /^#{1,6} /.test(line)
        ? `<span class="h" data-anchor="${esc(headingAnchor(line)).replace(/"/g, '&quot;')}">${esc(line)}</span>`
        : esc(line)
    })
    .join('\n')
}

function fetchText(url: string) {
  let pending = texts.get(url)
  if (!pending) {
    pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${response.status}`)
      return response.text()
    })
    pending.catch(() => texts.delete(url))
    texts.set(url, pending)
  }
  return pending
}

export function createAgentView(config: any, localeFor: (relativePath: string) => { chrome?: Record<string, string> }) {
  function usePage() {
    const { page, frontmatter } = useData()
    const data = computed(() => (frontmatter.value as any).agentView as AgentViewData | undefined)
    const twinUrl = computed(() =>
      withBase(`/${pageTwinPath(config, String(page.value.relativePath))}`.replace(/\/{2,}/g, '/')),
    )
    const copy = computed(() => {
      const chrome = localeFor(String(page.value.relativePath)).chrome ?? {}
      return (key: string) => chrome[key] ?? defaults[key]
    })
    return { page, data, twinUrl, copy }
  }

  /** The agent side in place of the page body (doc-before slot). */
  const AgentViewPane = defineComponent({
    setup() {
      const { data, twinUrl, copy } = usePage()
      const text = ref<string | null>(null)
      const failed = ref(false)

      function load() {
        text.value = null
        failed.value = false
        if (!data.value || typeof window === 'undefined') return
        const url = twinUrl.value
        fetchText(url).then(
          (markdown) => {
            if (url === twinUrl.value) text.value = markdown
          },
          () => {
            if (url === twinUrl.value) failed.value = true
          },
        )
      }

      onMounted(load)
      watch(twinUrl, load)

      return () => {
        if (!data.value) return null
        const t = copy.value
        const meta = h(
          'span',
          { class: 'meta' },
          `<!-- ${fill(t('agentViewSource'), { source: data.value.source })} -->`,
        )
        let body
        if (failed.value) {
          body = h('p', { class: 'docs-av-failed' }, [
            t('agentViewFailed'),
            ' ',
            h('a', { href: twinUrl.value, target: '_blank', rel: 'noreferrer external' }, twinUrl.value),
          ])
        } else if (text.value == null) {
          body = h('span', { class: 'meta' }, t('agentViewLoading'))
        } else {
          // The twin starts with the same source comment; show it once.
          const markdown = text.value.replace(/^<!--[^\n]*-->\n+/, '')
          body = h('div', { innerHTML: rawHtml(markdown) })
        }
        return h('div', { class: 'docs-av-raw' }, [meta, '\n\n', body])
      }
    },
  })

  /** The switch, its peek and the agent-side bar (layout-bottom slot). */
  const AgentViewDock = defineComponent({
    setup() {
      const { page, data, twinUrl, copy } = usePage()
      const { isDark } = useData()
      const peeking = ref(false)
      const preview = ref('')
      const toast = ref('')
      const scroll: Record<Mode, number> = { human: 0, agent: 0 }
      let toastTimer = 0

      const root = () => document.documentElement

      function applyClasses() {
        if (typeof document === 'undefined') return
        const has = Boolean(data.value)
        const agent = has && mode.value === 'agent'
        root().classList.toggle('docs-av-page', has)
        root().classList.toggle('docs-av-agent', agent)
        // The agent side is always dark; leaving it restores the reader's theme.
        root().classList.toggle('dark', agent || isDark.value)
      }

      function prefetch() {
        if (!data.value) return
        const url = twinUrl.value
        fetchText(url)
          .then((markdown) => {
            if (url !== twinUrl.value) return
            const lines = markdown.replace(/^<!--[^\n]*-->\n+/, '').split('\n').slice(0, 60)
            preview.value = rawHtml(lines.join('\n'))
          })
          .catch(() => {})
      }

      /**
       * A link to a section only the agent side has (#app-notifications-catalog
       * after a page moved its detail there) opens that side at the section.
       * It doesn't change the reader's remembered choice.
       */
      async function openHashOnAgentSide() {
        const id = decodeURIComponent(window.location.hash.slice(1))
        if (!id || !data.value || document.getElementById(id)) return
        const markdown = await fetchText(twinUrl.value).catch(() => '')
        if (!headingAnchors(markdown).includes(id)) return
        mode.value = 'agent'
        applyClasses()
        for (let tries = 0; tries < 20; tries++) {
          await nextTick()
          const target = document.querySelector(`.docs-av-raw [data-anchor="${CSS.escape(id)}"]`)
          if (target) {
            target.scrollIntoView()
            return
          }
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }

      onMounted(() => {
        const stored = localStorage.getItem(MODE_KEY)
        mode.value = stored === 'agent' ? 'agent' : 'human'
        tried.value = Boolean(localStorage.getItem(TRIED_KEY))
        applyClasses()
        const idle = (window as any).requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 200))
        idle(prefetch)
        void openHashOnAgentSide()
      })

      onUnmounted(() => {
        root().classList.remove('docs-av-page', 'docs-av-agent')
        window.clearTimeout(toastTimer)
      })

      watch(
        () => page.value.relativePath,
        () => {
          preview.value = ''
          peeking.value = false
          applyClasses()
          prefetch()
          void openHashOnAgentSide()
        },
      )
      watch(isDark, applyClasses)

      function originRect() {
        const dock = document.querySelector('.docs-av-dock')
        const peek = dock?.querySelector<HTMLElement>('.docs-av-peek')
        const seg = dock?.querySelector<HTMLElement>('.docs-av-seg')
        const el = peek && peeking.value ? peek : seg
        return el?.getBoundingClientRect() ?? null
      }

      function setMode(next: Mode) {
        if (next === mode.value) return
        const rect = originRect()
        scroll[mode.value] = window.scrollY
        const go = () => {
          mode.value = next
          tried.value = true
          localStorage.setItem(MODE_KEY, next)
          localStorage.setItem(TRIED_KEY, '1')
          peeking.value = false
          applyClasses()
          window.scrollTo(0, scroll[next])
        }
        const startViewTransition = (document as any).startViewTransition?.bind(document)
        if (!startViewTransition || !rect || matchMedia('(prefers-reduced-motion: reduce)').matches) {
          go()
          return
        }
        // The agent page grows out of the peek (or the switch) and shrinks back into it.
        const vw = innerWidth
        const vh = innerHeight
        const small = `inset(${rect.top}px ${vw - rect.right}px ${vh - rect.bottom}px ${rect.left}px round 14px)`
        const full = 'inset(0px 0px 0px 0px round 0px)'
        const cls = next === 'agent' ? 'docs-av-vt-in' : 'docs-av-vt-out'
        root().classList.add(cls)
        const transition = startViewTransition(go)
        transition.ready.then(() => {
          const easing = 'cubic-bezier(.7,0,.2,1)'
          if (next === 'agent') {
            root().animate(
              { clipPath: [small, full] },
              { duration: 620, easing, pseudoElement: '::view-transition-new(root)' },
            )
          } else {
            root().animate(
              [
                { clipPath: full, opacity: 1 },
                { clipPath: small, opacity: 1, offset: 0.8 },
                { clipPath: small, opacity: 0 },
              ],
              { duration: 600, easing, fill: 'forwards', pseudoElement: '::view-transition-old(root)' },
            )
          }
        })
        transition.finished.finally(() => root().classList.remove(cls))
      }

      function showToast(message: string) {
        toast.value = message
        window.clearTimeout(toastTimer)
        toastTimer = window.setTimeout(() => (toast.value = ''), 2200)
      }

      function copyLink() {
        const t = copy.value
        const url = new URL(twinUrl.value, window.location.origin).href
        const text = fill(t('agentViewCopyText'), { url })
        const done = () => showToast(t('agentViewCopied'))
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => showToast(text))
        else showToast(text)
      }

      return () => {
        if (!data.value) return null
        const t = copy.value
        const words = data.value.words.toLocaleString()
        const seg = h('div', { class: 'docs-av-seg', role: 'group' }, [
          h('div', { class: 'knob', 'aria-hidden': 'true' }),
          h(
            'button',
            {
              class: 'b-human',
              type: 'button',
              'aria-pressed': String(mode.value === 'human'),
              onClick: () => setMode('human'),
            },
            t('agentViewHuman'),
          ),
          h(
            'button',
            {
              class: 'b-agent',
              type: 'button',
              'aria-pressed': String(mode.value === 'agent'),
              onClick: () => setMode('agent'),
              onMouseenter: () => mode.value === 'human' && (peeking.value = true),
              onFocus: () => mode.value === 'human' && (peeking.value = true),
              onMouseleave: () => (peeking.value = false),
              onBlur: () => (peeking.value = false),
            },
            t('agentViewAgent'),
          ),
          tried.value ? null : h('span', { class: 'docs-av-dot', 'aria-hidden': 'true' }),
        ])
        const peek = h('div', { class: 'docs-av-peek', 'aria-hidden': 'true' }, [
          h('div', { innerHTML: preview.value }),
          h('div', { class: 'cap' }, fill(t('agentViewPeek'), { words })),
        ])
        const bar = h('div', { class: 'docs-av-card docs-av-bar' }, [
          h('div', [
            h('b', t('agentViewBarTitle')),
            fill(t('agentViewBarText'), { words }),
          ]),
          h('button', { class: 'docs-av-btn', type: 'button', onClick: copyLink }, t('agentViewCopy')),
          h(
            'button',
            { class: 'docs-av-btn ghost', type: 'button', onClick: () => setMode('human') },
            t('agentViewBack'),
          ),
        ])
        return [
          h('div', { class: ['docs-av-dock', peeking.value ? 'peeking' : ''] }, [
            h('div', { class: 'docs-av-stack' }, [peek, seg, bar]),
          ]),
          h('div', { class: ['docs-av-toast', toast.value ? 'on' : ''], role: 'status' }, toast.value),
        ]
      }
    },
  })

  return { AgentViewPane, AgentViewDock }
}
