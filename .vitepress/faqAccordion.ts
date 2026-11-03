import type MarkdownIt from 'markdown-it'

// FAQ sections render as an accordion: under a `## FAQ` (or `## 常见问题`)
// heading, each `### question` and the content up to the next question becomes
// one <details> item, closed by default. The question stays a real h3 inside
// <summary>, so its id, the "On this page" outline and links like
// /features/agents/lifecycle/#does-a-reset-delete-the-agent-s-messages keep
// working; FaqHashOpener opens the item a link points to. The markdown source
// (and so the raw .md and llms.txt output) is unchanged.

const FAQ_TITLES = new Set(['faq', '常见问题'])

type Token = ReturnType<MarkdownIt['parse']>[number]

export function faqAccordion(md: MarkdownIt) {
  md.core.ruler.push('faq_accordion', (state) => {
    const src = state.tokens
    const out: Token[] = []
    const html = (content: string) => {
      const t = new state.Token('html_block', '', 0)
      t.content = content
      return t
    }
    let inFaq = false
    let itemOpen = false
    let listOpen = false
    const closeItem = () => {
      if (itemOpen) out.push(html('</div></details>\n'))
      itemOpen = false
    }
    const closeList = () => {
      closeItem()
      if (listOpen) out.push(html('</div>\n'))
      listOpen = false
    }

    for (let i = 0; i < src.length; i++) {
      const tok = src[i]
      if (tok.type === 'heading_open' && (tok.tag === 'h1' || tok.tag === 'h2')) {
        closeList()
        const title = src[i + 1]?.content.replace(/\s*\{#[^}]*\}\s*$/, '').trim().toLowerCase()
        inFaq = tok.tag === 'h2' && FAQ_TITLES.has(title ?? '')
        out.push(tok)
        continue
      }
      if (inFaq && tok.type === 'heading_open' && tok.tag === 'h3') {
        closeItem()
        if (!listOpen) out.push(html('<div class="faq-list">\n'))
        listOpen = true
        out.push(html('<details class="faq-item"><summary>'))
        // heading_open, inline, heading_close
        out.push(tok, src[i + 1], src[i + 2])
        out.push(html('</summary><div class="faq-answer">\n'))
        itemOpen = true
        i += 2
        continue
      }
      out.push(tok)
    }
    closeList()
    state.tokens = out
  })
}
