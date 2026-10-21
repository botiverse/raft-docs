// The theme moved into the kit (packages/docs-kit/src/theme); this file is
// the site wiring: the site declaration, this deployment's analytics, and the
// Raft Design System skin (raft-design.css) that only docs.raft.build wears.
import { h } from 'vue'
// @ts-expect-error -- plain TS module in the docs-kit workspace package
import { createDocsTheme } from '../../packages/docs-kit/src/theme/index.ts'
import { initAnalytics } from './analytics'
import PageKicker from './PageKicker'
import docsConfig from '../../docs.config.mjs'
import './raft-ui/fonts.css'
import './raft-ui/foundation.css'
import './raft-design.css'

export default createDocsTheme(docsConfig, {
  initAnalytics,
  slots: { 'doc-before': () => h(PageKicker) },
})
