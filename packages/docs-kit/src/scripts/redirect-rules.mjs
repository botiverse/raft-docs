/**
 * Shared parser/matcher for `content/public/_redirects`.
 *
 * Single source of truth on purpose: the sitemap filter (.vitepress/config.mts)
 * and the build-time check (check-sitemap-redirects.mjs) must agree by
 * construction. When they were separate implementations, both skipped wildcard
 * rules and the check still reported "no URL is redirected away" -- a claim
 * broader than what it verified.
 */

/**
 * @typedef {{kind:'exact', from:string, to:string}
 *          |{kind:'prefix', from:string, prefix:string, to:string}} RedirectRule
 */

/**
 * Parse a `_redirects` table.
 *
 * Supports exact sources and TERMINAL wildcards (`/section/*`). Anything else
 * throws rather than being skipped: an unsupported rule that is silently
 * ignored turns into a redirected URL that the sitemap happily publishes,
 * which is the exact defect this module exists to prevent. Fail closed.
 *
 * @param {string} text
 * @returns {RedirectRule[]}
 */
export function parseRedirectRules(text) {
  /** @type {RedirectRule[]} */
  const rules = []

  text.split('\n').forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const [from, to] = trimmed.split(/\s+/)
    if (!from || !to) return

    // Canonicalisation rules such as `/welcome -> /welcome/` point at
    // themselves once slashes are normalised. Compare as written and drop
    // identities, so the rule can never disqualify its own destination.
    if (from === to) return

    if (!from.includes('*')) {
      rules.push({ kind: 'exact', from, to })
      return
    }

    if (from.endsWith('/*') && !from.slice(0, -2).includes('*')) {
      rules.push({ kind: 'prefix', from, prefix: from.slice(0, -1), to })
      return
    }

    throw new Error(
      `_redirects line ${i + 1}: unsupported wildcard source "${from}". ` +
        `Only terminal "/section/*" is handled. Skipping it would let the ` +
        `sitemap publish URLs this rule redirects away, so this fails closed ` +
        `-- extend parseRedirectRules() instead of ignoring the rule.`,
    )
  })

  if (rules.length === 0) {
    throw new Error(
      'Parsed 0 redirect rules. That is far more likely a format change than ' +
        'an empty redirect table, and matching nothing would silently disable ' +
        'every downstream check.',
    )
  }

  return rules
}

/**
 * Where `_redirects` sends this path, or null if it is served directly.
 *
 * @param {string} path absolute, e.g. "/features/"
 * @param {RedirectRule[]} rules
 * @returns {string|null}
 */
export function redirectTargetFor(path, rules) {
  for (const rule of rules) {
    if (rule.kind === 'exact') {
      if (rule.from === path) return rule.to
      continue
    }
    // Never let a prefix rule disqualify the page it redirects to.
    if (path.startsWith(rule.prefix) && path !== rule.to) return rule.to
  }
  return null
}
