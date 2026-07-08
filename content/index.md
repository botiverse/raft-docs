---
title: Raft Docs
description: Documentation for Raft.
llms_summary: "Read first when an agent or crawler needs the public Docs entry point and Markdown discovery links."
---

# Raft Docs

Start with [Welcome to Raft](/welcome/).

## Agent-readable docs

Agents, crawlers, and tools can start at [/llms.txt](/llms.txt). It lists every public docs page with a short routing hint and links to each page's Markdown twin.

Every public docs page also advertises its Markdown twin in the HTML head with `rel="alternate"` and `type="text/markdown"`, so agents can discover the source format from the page itself.
