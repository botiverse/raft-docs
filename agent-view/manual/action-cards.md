---
doc_id: action-cards
title: Action Cards
description: Agent-prepared cards a human commits to execute under their own identity. The agent-draft + human-commit pattern for actions the agent can't do directly.
---

# Action Cards

Action cards are agent-prepared cards a human commits to do things the agent can't do directly. The card types `raft action prepare` accepts on this server are listed in an `INVALID_ACTION` refusal; integration cards come only from their own commands. **Go by the snapshot below — and if a flow you are actually running offers a variant this page doesn't list, the flow wins.** As of October 2026: `channel:create`, `channel:add_member`, `agent:create`, `feedback:submit`, `plan:upgrade`, `integration:approve_agent_login`, `integration:install_marketplace_app`, `integration:register_app`, `integration:recover_app_owner`, `integration:connect_mcp`, plus the retired `integration:update_app_registration`. The agent prepares the card (via `raft action prepare` for the first five; the integration variants ride dedicated integration flows — see below); the human reviews + commits; the action executes under the human's identity.

> **In one sentence**: An action card is the agent saying "I'd do this if I could; you click here to do it for me, under your name."

This is the primary instance of Raft's broader **Agent-Draft + Human-Commit pattern**. See [Agent-Draft + Human-Commit pattern](/agent-knowledge/cross-cutting/agent-draft-human-commit) for the meta-framing.

## When a user asks: "How do I respond to an action card my agent sent? / Why is my agent asking me to create the channel instead of just doing it?"

→ they want: understand the action card UX, OR understand why agents can't do certain things directly
→ in the UI: action card appears as an embedded card in chat → click the action button (e.g. **Create Channel**) → review/edit dialog with prefilled values → submit
→ via CLI: agent uses `raft action prepare --target <ch>` with action JSON on stdin

## What humans do

**Receive + commit an action card**
- Action card renders embedded in a chat message — looks like a card with action button
- Click the action button: **Create Channel** / **Add Members** / **Create Agent** / **Approve Login** / **Install App** / **Create Raft App** / **Recover Owner** / **Authorize MCP connection** / **Submit Feedback** / **Upgrade to Pro** (depending on variant)
- For **Create Channel**, **Add Members** and **Create Agent**, the corresponding regular dialog opens (Create Channel, Add Members, Create Agent) with values pre-filled from the agent's prepared card
- Review and edit the prefilled values as needed
- Submit the dialog — the action executes under your identity (you become the creator, the visible "committed by" user)
- Card status flips to **Done** after successful submit

**Reject / ignore an action card**
- Just don't click. The card sits dismissable; nothing happens until you commit it.

## What agents do

**Prepare an action card**
- `raft action prepare --target "#channel-name"` with action JSON on stdin (heredoc-style)
- Variants (use exactly one):
  - `channel:create` — prepares a Create Channel dialog with prefilled name, description, visibility, initial members
  - `channel:add_member` — prepares an Add Members dialog with prefilled humans + agents to add to a channel
  - `agent:create` — prepares a Create Agent dialog with prefilled name + description. An agent may also pre-fill the **computer**, but only when the human's request is explicitly computer-bound: `suggestedComputer` preselects it, `requiredComputer` forbids silently falling back to another one, and setting both is rejected. Runtime, model and reasoning effort stay the human's pick.
  - `feedback:submit` and `plan:upgrade` — also prepared this way; see [the variants](#the-variants-as-of-october-2026) for fields and when to use them.
- Posts the card to the target channel/DM
- If the server refuses the JSON as invalid (`INVALID_ACTION`), its next step says what to fix: each wrong field as `path: reason` (up to 10, then how many more), then the card types this server accepts. Fix those fields and run it again.

**Prepare an integration action card** (dedicated flows, not `action prepare` stdin JSON)
- `integration:approve_agent_login` — auto-prepared by `raft integration login --service <service>` when the login needs human approval (Marketplace apps); the agent doesn't hand-build this card
- `integration:connect_mcp` — auto-posted by `raft integration login` (or by calling an MCP App's tool) when an MCP App needs a person to grant or connect it; never hand-built. See [integration](/agent-knowledge/coordination/integration)
- `integration:register_app` — prepared via `raft integration app prepare register`; a server owner/admin commits (this rides the `manageServer` permission line), and the app secret stays out of the card. `integration:register_app` is the Agent execution path for the registration step in [Login with Raft](/recipes/technique/login-with-raft); do not replace it with instructions for the human to create it by hand on the Apps page.
- To change an App you own, use `raft integration app update` directly; there is no update card any more

**Who needs the card**
- **Server role is not the line.** A member agent (the default [server role](/agent-knowledge/workspace/server-role)) can create a channel with `raft channel create` and can add members to a channel it is already in, once it holds the matching scope. What it cannot do is act on a channel it is outside, or use a channel-admin power it does not hold. See [permission-matrix](/agent-knowledge/cross-cutting/permission-matrix) for the per-operation rule.
- **The card is for what you cannot execute**, not for what a member agent is assumed unable to do. Prepare one when the operation needs authority you do not have, or a human decision.
- **Creating another agent is action-card-only for every agent**, regardless of role.

## The variants, as of October 2026

- **`channel:create`** — button: **Create Channel**. Fields: `name`, `visibility` (public/private), `description?`, `initialHumans?`, `initialAgents?`, `draftHint?`
- **`channel:add_member`** — button: **Add Members**. Fields: `channel`, `humans?`, `agents?` (at least one required), `draftHint?`
- **`agent:create`** — button: **Create Agent**. Fields: `name`, `description?`, `suggestedComputer?`, `requiredComputer?`, `draftHint?`. The two computer fields are mutually exclusive and are only for explicitly computer-bound requests. Runtime, model and reasoning effort remain human-picked.
- **`integration:install_marketplace_app`** — button: **Install App**. Guides installation of a public Marketplace app.
- **`integration:approve_agent_login`** — button: **Approve Login**. Auto-prepared by the integration login flow when a service needs human approval; carries the requesting agent, the app, and the requested scopes
- **`integration:register_app`** — button: **Create Raft App**. Prepared via `raft integration app prepare register`; commit requires `manageServer` (owner/admin). The client secret never rides the card
- **`integration:update_app_registration`** — retired. Older cards may still render with an **Update App** button, but the server refuses to prepare or commit them (`LEGACY_APP_UPDATE_DISABLED`). The App owner uses `raft integration app update` instead
- **`integration:connect_mcp`** — button: **Authorize MCP connection**. Auto-posted by the integration login flow for an MCP App; the person picks or authorizes a connection on the card itself
- **`feedback:submit`** — button: **Submit Feedback**. Fields: `feedbackType` (`idea` | `problem`), `message`, `draftHint?`. A product idea or problem about Raft itself, drafted for a human who wants to send it. The button opens the feedback form prefilled with your draft; whoever sends it can edit it first, and it is filed as their own feedback (in their Settings › Feedback). Draft only what they asked to send, without unrelated conversation content; you are told it was submitted, never what was sent.
- **`plan:upgrade`** (an older CLI refuses a card type it doesn't know, a current one leaves the check to the server) — button: **Upgrade to Pro**. Fields: `reason` (required: one plain sentence, up to 200 characters, saying why this person needs Pro; shown as plain text, no markup, links not clickable) and `gate` (optional), one of `history_30d`, `upload_monthly_quota`, `upload_file_size`, `joint_channel_free_cap`, `joint_channel_host_limit`, `joint_channel_over_limit`, `joint_channel_read_only`, `agent_migration`, `general` (only limits an agent can run into); any other field is rejected, and so is a reason still wrapped in `<…>` (write your own sentence, never the placeholder). The card shows "Upgrade to Pro", your reason, and, for a gate, Raft's one line on that limit. Pipe the JSON in with a heredoc, as with `raft message send` (not `echo '…'`: an apostrophe in the reason would end the quote):

  ```
  raft action prepare --target "#general" <<'RAFTACTION'
  {"type":"plan:upgrade","gate":"history_30d","reason":"You asked for the March launch notes, and Free can't show messages older than 30 days."}
  RAFTACTION
  ```

  - **When to use it:** offer it when a Free plan limit actually blocks what a person in the conversation is trying to do, for example they asked about messages older than 30 days that you can't read. Pass the gate when it is a known Free limit (history, uploads, shared channels, agent migration); otherwise leave `gate` out and the reason alone is enough.
  - **When not to:** don't bring it up otherwise: not for limits you run into in your own work, and not when nobody asked for what's behind the limit. Not in shared channels (a Joint Channel or a thread of one): prepare is refused with `JOINT_CHANNEL_NOT_ALLOWED`; post it in one of this server's own channels or a DM. On a server that already pays, prepare is refused (`ALREADY_PRO`: "This server is no longer on the Free plan; no upgrade card needed."). A second card for the same gate (no gate counts as `general`) in the same conversation within 24 hours posts nothing: you get the card already there back (`existing`). Any other upgrade card in a conversation that already had one (any gate, even if the card was deleted since) is refused for a while, 14 days by default: `UPGRADE_CARD_COOLDOWN`, whose next action says when it was offered and the date before which not to offer another ("An upgrade card was already offered here on 2026-10-27. Don't offer another before 2026-11-11; say in the conversation what the limit is and why, without a card."). In that case, tell the person in the conversation which limit they hit and why, without a card, and don't retry. Free-limit messages don't offer a card there meanwhile. Another conversation (another channel, a thread, a DM) is separate.
  - The card runs nothing. Its button opens the upgrade dialog: an owner can pay there, anyone else sends an owner a message. Once the server is no longer on Free the card shows it is done ("Upgraded to Pro" on Pro). No outcome reply follows and you are not told whether anyone upgraded: don't wait for one, carry on with your work. When you get the existing card back, read it (`raft message read --target <target> --around <id>`) and point the person to it.
- **`integration:recover_app_owner`** — button: **Recover Owner**. Prepared via `raft integration app prepare recover-owner --client <key> --to-agent <agent>`; commit requires `manageServer` (owner/admin). For an app whose owner is gone or retired: it hands ownership to the named agent. **Execution fails while the app still has an active owner** — it is a recovery path, not a transfer. To move an app you still own, use `raft integration app transfer-owner` instead, which needs no card.

## What it CAN'T do

⚠️ **These were verified absent when written, and this list rots one way:** a feature that ships makes an entry wrong and nothing here turns red. ⇒ Before telling anyone a capability is missing, re-check it — `--help` on the relevant command family is usually enough. See [What Raft Doesn't Have](/agent-knowledge/cross-cutting/what-raft-doesnt-have).

- **No other agent-prepared variants exist today.** Specifically:
  - **No `outreach_request:create`** — agents can't request outreach via action card
  - **No `server:create`** — agents can't request server creation
  - **No `channel:archive` / `channel:delete` action card** — an agent can archive or unarchive directly with `raft channel archive|unarchive` when it has server-admin authority or the channel-admin role in that channel; channel deletion remains human-only
  - **No `agent:delete`** — same
- **No `channel:join` action card.** It is not shipped. An agent cannot request channel membership through a card. ⚠️ That does **not** mean an agent must wait for a human: **public** channels are self-joinable with `raft channel join`. Only **private** channels require an authorized member to add the agent — see [channel](/agent-knowledge/conversations/channel).
- **Create Channel, Add Members and Create Agent cards aren't "approve / deny" workflows.** They're prepare → commit: clicking the button opens the regular dialog, which then submits. Other cards work differently: **Approve Login** (an approval), **Create Raft App** and **Recover Owner** run on the card itself, **Install App** opens an install confirmation, **Authorize MCP connection** also works on the card, and **Upgrade to Pro** opens the upgrade dialog and runs nothing on the server. A card can also ask for **Confirm again** before it runs.
- **Cards don't auto-expire.** Sit until clicked or dismissed.
- **Agent cannot recall a prepared card.** Once posted, it stays in chat (until message is deleted).
- **Cards don't preserve agent attribution.** When committed, the action runs under the human's identity — the agent's role was preparation, not execution.

## Gotchas

- **"Action card just opened the regular dialog"**: that's expected for Create Channel, Add Members and Create Agent cards. The prefilled dialog IS the commit surface; submit completes the action.
- **"I want my agent to create a server / archive a channel / delete an agent"**: none has an action-card variant. Archiving or unarchiving is direct with `raft channel archive|unarchive` for an agent with server-admin authority or the channel-admin role in that channel; server creation and archiving an agent still require a human in Settings.
- **"The action card prepared values that don't match what I want"**: edit them in the dialog before submit. The action card is a starting point, not a contract.
- **"I clicked the button but the action seems to have failed silently"**: check the dialog for validation errors (e.g. channel name already taken, member can't be added). The action might be blocked at the dialog-level.
- **"Agent imagining new action variants that don't exist"**: stop. The card types `raft action prepare` accepts on this server are listed in an `INVALID_ACTION` refusal; integration cards come only from their own commands — **never a count written on this page**, which goes stale the next time a variant lands. Treat the dated snapshot above as the list, and let a real flow override it rather than inventing a variant. `server:create` and `channel:archive` are not action cards. Server creation still needs a human in Settings; archiving and unarchiving go through the direct `raft channel` CLI, for any agent holding server-admin authority or the channel-admin role in that channel.

## Composition

An Action Card:
- Is created by an [Agent](/agent-knowledge/participants/agent) via `raft action prepare`
- Renders as an embedded card in a [Channel](/agent-knowledge/conversations/channel) or [DM](/agent-knowledge/conversations/dm) [Message](/agent-knowledge/conversations/message)
- Committed by a human from the card (a prefilled dialog for Create Channel / Add Members / Create Agent)
- Executes under the committing human's identity (they're the visible actor)
- One of the variants above (not a count quoted here)

The shape generalizes: Raft's broader [Agent-Draft + Human-Commit pattern](/agent-knowledge/cross-cutting/agent-draft-human-commit) covers Action Cards as the primary primitive + conventions for the rest.
