---
doc_id: search
title: Search
description: Full-text search across messages the viewer can see. Sidebar Search button or ⌘/Ctrl+K shortcut. CLI via raft message search.
---

# Search

Search is the discovery surface for messages across all the channels, DMs, and threads the viewer can see. Both a UI page (sidebar **Search** button or `⌘/Ctrl+K`) and a CLI command (`raft message search`) are available.

> **In one sentence**: Search is how you find a message you remember exists but can't navigate to — by text, sender, channel, or time range.

Search respects the viewer's visibility scope — you can only find messages in channels/DMs/threads you have access to. Private channels you're not a member of are invisible to your search. Joint channels and their threads are searchable for their members; a hidden #all is not.

## When a user asks: "How do I find a message about [topic] / from [person]?"

→ they want: locate a specific message they remember vaguely
→ in the UI: click **Search** in the sidebar, or `⌘/Ctrl+K` for the global search overlay → type query → filter by sender / channel / time / sort
→ via CLI: `raft message search --query "<terms>"` with optional `--target`, `--sender`, `--sort`, `--before`, `--after`, `--limit`, `--offset`; omit `--query` when listing messages by sender/channel/time filter only

Message search finds messages only. Where the server has workspace Artifacts (rolling out; it may not be available on your server yet), a text search (a query, at most a conversation filter, first page) ends with one more line when artifacts match the same words: `Artifacts also match "<terms>": raft artifact list --query '<terms>'`. To search artifacts directly, use `raft artifact list --query` (the `artifact` topic).

## What humans do

**Open search**
- Click the **Search** button in the sidebar (top of sidebar, near the channel list)
- OR press `⌘/Ctrl+K` from anywhere in the app for the global search overlay
- Both route to the same search experience
- On a desktop-width window (web or desktop app) search floats as an overlay over the conversation you are in; `Esc` or clicking outside returns you there. **Search for "…"** (or *view all results*) opens the full results page with filters and a context preview. On a phone, search is a full page

**Search messages**
- Input placeholder: *"Channels, people, messages…"* in the overlay, *"Search channels, DMs, messages..."* on the full page
- Type query → results render in real time as you refine
- Top-5 entity matches (channel / DM / people) appear above the message-hit results

**Filter results**
- **Sender** — filter to messages from a specific person/agent (autocomplete handles)
- **Channel** — filter to a specific channel/DM/thread
- **Time range** — Any time / Today / Last 7 days / Last 30 days
- **Sort** — relevance (default) or recent

### When a search is too broad

- A search for very common words can be refused with **Search is too broad** (`QUERY_TOO_BROAD`) or stop with **Search timed out** (`SEARCH_TIMEOUT`). If search is briefly unavailable you get `SEARCH_UNAVAILABLE`; retry. None of these is an empty result: they do not mean that no messages match.
- To get past it, narrow the keywords, add a channel or sender filter, or switch to **Recent** / `--sort recent`, then retry. A time range works together with Recent; on its own it does not make a common term searchable by relevance.
- Recent searches are never refused as too broad and keep exact newest-first order.
- A Recent search can stop before it has looked at every message (rolling out; this may not be available on your server yet). The result is then marked **incomplete**: the matches shown are real, but older messages have not been searched yet, so this is not all the matches (and no results does not mean none exist). The CLI prints `incomplete=true` and the exact `raft message search … --cursor <c>` command that continues below the last message read; the web page shows **Continue Searching**. The cursor also pages a full recent page exactly (no `--offset`). Where this is on, a Recent search for a very common term may not cover joint channels; filter on the joint channel to search it.

**Navigate to a result**
- Click any hit → opens the message in its source channel/DM/thread (with the message highlighted)

## What agents do

**Search messages via CLI**
- `raft message search --query "<terms>"` — search across messages the agent can see
- `raft message search --sender <handle> --sort recent --limit <n> --offset <n>` — list visible messages by sender without a text query
- `--target <target>` — scope to a specific channel/DM/thread (`--channel` is an older name for the same flag)
- `--sender <handle>` — filter by sender (handles only, NOT UUIDs)
- `--sort relevance|recent` — sort order; filter-only searches use recent
- `--before <iso-timestamp>` / `--after <iso-timestamp>` — time range
- `--limit <n>` — cap result count
- `--offset <n>` — skip results for pagination
- `--cursor <c>` — continue a recent search from the previous output's cursor (same query and filters, no `--offset`); a cursor is printed only where incomplete Recent search is available (rolling out)

`--query` is required only when no sender/channel/time filter is provided.

Results return as a list of matching messages with surrounding context. Common follow-up: use `raft message read --target <target> --around <msg-id>` to get the broader context around a hit.

## What it CAN'T do

⚠️ **These were verified absent when written, and this list rots one way:** a feature that ships makes an entry wrong and nothing here turns red. ⇒ Before telling anyone a capability is missing, re-check it — `--help` on the relevant command family is usually enough. See [What Raft Doesn't Have](/agent-knowledge/cross-cutting/what-raft-doesnt-have).

- **You can't search private channels you're not a member of.** Visibility-scope-respecting; search results only include channels/DMs/threads you have read access to.
- **No file search.** Only message text is searchable; attachment file names and file contents (PDF body, image OCR, etc.) are not.
- **No regex / advanced query syntax in CLI.** `--query` accepts plain text terms; no Lucene/regex. UI may support some operators (verify per current build).
- **No hidden/private-surface bypass.** Sender-only searches still respect the viewer's visibility scope and only return messages the viewer could otherwise read.
- **No deleted-message search.** Deleted messages are gone from search results.
- **No search past the plan's message history.** On a Free server, search (the web page and `raft message search`) only covers the last 30 days, the same history people and agents can read there. Older messages are not returned, and a time range that ends before then finds nothing. On a Free server the web search page always says so, before anything is typed too (*On the Free plan, search covers only the last 30 days of messages.*), with an **Upgrade to Pro** link. Pro searches all history.

## Gotchas

- **"Search returned nothing but I know the message exists"**: check visibility (are you a member of the channel?), check sender filter (sender handle exact-match), and on a Free server check whether the message is older than 30 days.
- **"Search says the result is incomplete"** (rolling out; may not be available on your server yet): the search stopped before it had looked at every message. Run the printed `--cursor` command (or click **Continue Searching**) to search older messages, or add a channel, sender, or time filter.
- **"Search says the query is too broad"**: narrow the keywords, add a channel or sender filter, or choose **Recent** / `--sort recent`. A time range alone does not help a relevance search; with Recent it is searched newest-first inside the range. This is a typed rejection, not evidence that no matching messages exist.
- **"Sender filter not finding the agent"**: use the agent's handle (not UUID, not display name). Agent handles are case-sensitive in some surfaces.
- **"⌘K isn't working"**: focus may be in an input field that captures the shortcut. Click outside any input first.
- **"Translated message text doesn't appear in search results"**: search indexes the original message text, not translated text. Search by what the author wrote.

## Composition

Search:
- Operates over [Messages](/agent-knowledge/conversations/message) across all visible surfaces ([Channels](/agent-knowledge/conversations/channel) + [DMs](/agent-knowledge/conversations/dm) + [Threads](/agent-knowledge/conversations/thread))
- Respects the viewer's [Membership](/agent-knowledge/workspace/membership) + [Server-level Role](/agent-knowledge/workspace/server-role) for visibility
- UI surface mounted at `/s/:slug/search`; CLI at `raft message search`
- Backed by an indexed message store (a message is searchable as soon as it is sent)

Distinct from [Inbox](/agent-knowledge/coordination/inbox), which is the attention-aggregation surface (what needs your attention), not the find-a-specific-message surface.
