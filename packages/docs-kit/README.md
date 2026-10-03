# @botiverse/docs-kit

Reusable documentation-site kit, extracted from **raft-docs** (docs.raft.build).
Goal: a new product docs site is content plus a small config — not a fork of
another site's plumbing.

Status: **skeleton**. raft-docs consumes it (dogfood); the **Hands docs site is
the pilot** for the full migration (artin, #proj-hands b529da37 / e1183d38).

## Layout

```text
packages/docs-kit/
  src/scripts/          shared build scripts (importable and runnable)
  src/config.mts        planned: defineDocsConfig() factory   [not yet moved]
  src/theme/            planned: kit theme (index.ts + tokens) [not yet moved]
```

Moved so far:

- `src/scripts/redirect-rules.mjs` — `_redirects` parser/matcher, the single
  source of truth shared by the sitemap filter (`.vitepress/config.mts`) and
  `scripts/check-sitemap-redirects.mjs`. Pure functions, no root assumptions.

Planned moves, in order (each one PR, behavior-preserving):

1. `check-zh-coverage` — parameterized by `--root` / locale dir / baseline path.
2. `check-sitemap-redirects` + `generate-agent-artifacts` (`llms.txt` and
   per-page `.md` twins).
3. `defineDocsConfig()` — the generic half of raft-docs' `config.mts`
   (locales wiring, sitemap filter, search, theme registration) with nav/
   sidebar/site data passed in.
4. The theme (`theme/index.ts`, `custom.css`) generalized: derive translated
   paths from the content tree instead of a hand-maintained
   `translatedZhPaths` list, and ship the **language-switch flyout** as a kit
   deliverable (the v3 spec: icon + chevron `<details>` menu, no JS).

## Content conventions (agreed with gzj, #proj-hands e1183d38)

- A page is `content/<slug>/index.md`; images live beside the Markdown.
- Locales are directories, fully configurable: `locales[].dir` +
  `locales[].pathPrefix` (raft: `zh-cn/` → `/zh-cn/…`; hands: `zh/` →
  `/docs/zh/…`). Translation pairing is **derived by scanning for the same
  relative path**, never declared by hand.
- URL compatibility is configuration: raft keeps `/welcome/` + `/<page>.md`;
  hands keeps `/docs/<slug>/` + `/docs/<slug>.md`.
- Internal links are written as source filenames (`permissions.md`); the build
  resolves them to the target language's page when translated, else falls back
  to the reference-language page.
- Page `description` should come from frontmatter (single source), not a
  parallel config list.
- Optional: strip preview markers (`[Screenshot:]` / `[[preview]]`) from
  production output.

## Gates the kit owns

- zh coverage (missing translations need explicit baseline entries) —
  `pnpm check:zh-coverage -- --check`.
- sitemap ↔ `_redirects` consistency (no redirected URL in the sitemap) —
  `pnpm check:sitemap-redirects`; matcher self-test:
  `pnpm check:redirect-matcher` (`--self-test`, 10 cases).
- Markdown twin completeness for every page (agent-artifacts check, planned).

## Ownership

- Site engineering, build scripts, deploy wiring: @Kirby.
- Content model, directory conventions, visual spec: @gzj.
