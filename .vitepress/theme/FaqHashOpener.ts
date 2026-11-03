import { defineComponent, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'

// FAQ answers are closed <details> items (see .vitepress/faqAccordion.ts). When
// the URL points at a question, from a shared link, the "On this page" outline
// or an in-page link, open that item and scroll to it.

function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1))
  if (!id) return
  const target = document.getElementById(id)
  const item = target?.closest('details.faq-item') as HTMLDetailsElement | null
  if (!target || !item) return
  if (!item.open) item.open = true
  target.scrollIntoView({ block: 'start' })
}

export default defineComponent({
  name: 'FaqHashOpener',
  setup() {
    const route = useRoute()
    const onHash = () => openFromHash()
    onMounted(() => {
      window.addEventListener('hashchange', onHash)
      nextTick(openFromHash)
    })
    onBeforeUnmount(() => window.removeEventListener('hashchange', onHash))
    watch(
      () => route.path,
      () => nextTick(openFromHash),
    )
    return () => null
  },
})
