# raft-docs

Public documentation site for **Raft**, deployed at **docs.raft.build** (`docs.slock.ai` 301-redirects here).

Built with [VitePress](https://vitepress.dev). Content is plain Markdown in
[`content/`](./content). The build emits both human HTML pages and agent-readable
Markdown files.

## Stack

- **VitePress** — Markdown-first static docs
- **TypeScript** — config and small build helpers
- **Markdown** — default content format; avoid MDX/components for public docs

## Local development

```bash
# Install
pnpm install

# Run dev server (default: http://localhost:5173)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## LLM-friendly endpoints

This site exposes content in formats designed for AI consumption:

- **`/llms.txt`** — structured TOC of live Markdown pages.
- **`/<page>.md`** — raw Markdown source for each public page, for example `/welcome.md`.

## Content structure

```text
content/
├── index.md                 # Local fallback; production redirects / -> /welcome/
├── public/                  # Static assets copied by VitePress
└── welcome/
    └── index.md             # First-run setup path
```

## Style

Docs are intentionally simple. Content matters more than visual treatment.
Keep public docs plain enough that the Markdown source remains useful on its own.

## Repository

This is the public-source docs repo for Raft.
