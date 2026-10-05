// The theme moved into the kit (packages/docs-kit/src/theme); this file is
// the site wiring: the site declaration plus this deployment's analytics.
// @ts-expect-error -- plain TS module in the docs-kit workspace package
import { createDocsTheme } from '../../packages/docs-kit/src/theme/index.ts'
import { initAnalytics } from './analytics'
import docsConfig from '../../docs.config.mjs'

export default createDocsTheme(docsConfig, { initAnalytics })
