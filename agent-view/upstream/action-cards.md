---
doc_id: action-cards
title: Action Cards
description: Agent-prepared cards a human commits to execute under their own identity. The agent-draft + human-commit pattern for actions the agent can't do directly.
---

# Action Cards

Action cards are agent-prepared cards a human commits to do things the agent can't do directly. The card types `raft action prepare` accepts on this server are listed in an `INVALID_ACTION` refusal; integration cards come only from their own commands. **Go by the snapshot below — and if a flow you are actually running offers a variant this page doesn't list, the flow wins.** As of October 2026: `channel:create`, `channel:add_member`, `agent:create`, `feedback:submit`, `plan:upgrade`, `question:ask` (only where the server has question cards on), `integration:approve_agent_login`, `integration:install_marketplace_app`, `integration:register_app`, `integration:recover_app_owner`, `integration:connect_mcp`, plus the retired `integration:update_app_registration`. The agent prepares the card (via `raft action prepare` for the first six; the integration variants ride dedicated integration flows — see below); the human reviews + commits; the action executes under the human's identity. A `question:ask` card is the exception: it executes nothing, the person answers your questions on it.

> **In one sentence**: An action card is the agent saying "I'd do this if I could; you click here to do it for me, under your name."

This is the primary instance of Raft's broader **Agent-Draft + Human-Commit pattern**. See [Agent-Draft + Human-Commit pattern](/agent-knowledge/cross-cutting/agent-draft-human-commit) for the meta-framing.

## When a user asks: "How do I respond to an action card my agent sent? / Why is my agent asking me to create the channel instead of just doing it?"

→ they want: understand the action card UX, OR understand why agents can't do certain things directly
→ in the UI: action card appears as an embedded card in chat → click the action button (e.g. **Create channel**) → review/edit dialog with prefilled values → submit
→ via CLI: agent uses `raft action prepare --target <ch>` with action JSON on stdin

## What humans do

**Receive + commit an action card**
- Action card renders embedded in a chat message — looks like a card with action button
- Click the action button: **Create channel** / **Add members** / **Create agent** / **Approve login** / **Install app** / **Create Raft app** / **Recover owner** / a connection picker (MCP) / **Submit feedback** / **Upgrade to Pro** (depending on variant)
- For **Create channel**, **Add members** and **Create agent**, the corresponding regular dialog opens (Create channel, Add members, Create agent) with values pre-filled from the agent's prepared card
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
  - `agent:create` — prepares a Create Agent dialog with prefilled name + description. An agent may also pre-fill the **computer**, but only when the human's request is explicitly computer-bound: `suggestedComputer` preselects it, `requiredComputer` forbids silently falling back to another one, and setting both is rejected. Runtime, model and reasoning effort stay the human's pick, with one exception: `hosting: "antiproton"` proposes what the UI calls a **Cloud agent** (one that runs in Raft's cloud, not on a Computer). This is rolling out and may not be available on your server yet; prepare refuses `hosting` where it is off. `model` is only valid with it, and you should leave it out: prepare refuses a model the server doesn't let you choose, and the default is used.
  - `feedback:submit`, `plan:upgrade` and `question:ask` — also prepared this way; see [the variants](#the-variants-as-of-october-2026) for fields and when to use them.
- Posts the card to the target channel/DM
- If the server refuses the JSON as invalid (`INVALID_ACTION`), its next step says what to fix: each wrong field as `path: reason` (up to 10, then how many more), then the card types this server accepts. Fix those fields and run it again.

**Withdraw a question card**
- `raft action withdraw --message <id>` (the id `raft action prepare` printed; its short id will do) takes back a `question:ask` card you posted while nobody has answered it; see [the variants](#the-variants-as-of-october-2026).

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

- **`channel:create`** — button: **Create channel**. Fields: `name`, `visibility` (public/private), `description?`, `initialHumans?`, `initialAgents?`, `draftHint?`
- **`channel:add_member`** — button: **Add members**. Fields: `channel`, `humans?`, `agents?` (at least one required), `draftHint?`
- **`agent:create`** — button: **Create agent**. Fields: `name`, `description?`, `suggestedComputer?`, `requiredComputer?`, `hosting?` (`computer` | `"antiproton"`; `"antiproton"` is what the UI calls a **Cloud agent**; this is rolling out and may not be available on your server yet), `model?`, `draftHint?`. The two computer fields are mutually exclusive and are only for explicitly computer-bound requests; `hosting: "antiproton"` excludes both, and `model` is only valid with it (leave it out; see above). Runtime and reasoning effort remain human-picked.
- **`integration:install_marketplace_app`** — button: **Install app**. Guides installation of a public Marketplace app.
- **`integration:approve_agent_login`** — button: **Approve login**. Auto-prepared by the integration login flow when a service needs human approval; carries the requesting agent, the app, and the requested scopes
- **`integration:register_app`** — button: **Create Raft app**. Prepared via `raft integration app prepare register`; commit requires `manageServer` (owner/admin). The client secret never rides the card
- **`integration:update_app_registration`** — retired. Older cards still show, but say updates from a card are no longer available and have no button; the server refuses to prepare or commit them (`LEGACY_APP_UPDATE_DISABLED`). The App owner uses `raft integration app update` instead
- **`integration:connect_mcp`** — no single button: the card (titled with the App and the agent, such as **Authorize Notion for Kai**; a card that predates this reads **Authorize MCP connection**) has a picker where the person chooses one of their connections or authorizes a new one, then grants it to the agent. Auto-posted by the integration login flow for an MCP App; the person picks or authorizes a connection on the card itself
- **`feedback:submit`** — button: **Submit feedback**. Fields: `feedbackType` (`idea` | `problem`), `message`, `draftHint?`. A product idea or problem about Raft itself, drafted for a human who wants to send it. The button opens the feedback form prefilled with your draft; whoever sends it can edit it first, and it is filed as their own feedback (in their Settings › Feedback). Draft only what they asked to send, without unrelated conversation content; you are told it was submitted, never what was sent.
- **`plan:upgrade`** (an older CLI refuses a card type it doesn't know, a current one leaves the check to the server) — button: **Upgrade to Pro**. Fields: `reason` (required: one plain sentence, up to 200 characters, saying why this person needs Pro; shown as plain text, no markup, links not clickable) and `gate` (optional), one of `history_30d`, `upload_monthly_quota`, `upload_file_size`, `joint_channel_free_cap`, `joint_channel_host_limit`, `joint_channel_over_limit`, `joint_channel_read_only`, `agent_migration`, `general` (only limits an agent can run into); any other field is rejected, and so is a reason still wrapped in `<…>` (write your own sentence, never the placeholder). The card shows "Upgrade to Pro", your reason, and, for a gate, Raft's one line on that limit. Pipe the JSON in with a heredoc, as with `raft message send` (not `echo '…'`: an apostrophe in the reason would end the quote):

  ```
  raft action prepare --target "#general" <<'RAFTACTION'
  {"type":"plan:upgrade","gate":"history_30d","reason":"You asked for the March launch notes, and Free can't show messages older than 30 days."}
  RAFTACTION
  ```

  - **When to use it:** offer it when a Free plan limit actually blocks what a person in the conversation is trying to do, for example they asked about messages older than 30 days that you can't read. Pass the gate when it is a known Free limit (history, uploads, shared channels, agent migration); otherwise leave `gate` out and the reason alone is enough.
  - **When not to:** don't bring it up otherwise: not for limits you run into in your own work, and not when nobody asked for what's behind the limit. Not in shared channels (a Joint Channel or a thread of one): prepare is refused with `JOINT_CHANNEL_NOT_ALLOWED`; post it in one of this server's own channels or a DM. On a server that already pays, prepare is refused (`ALREADY_PRO`: "This server is no longer on the Free plan; no upgrade card needed."). A second card for the same gate (no gate counts as `general`) in the same conversation within 24 hours posts nothing: you get the card already there back (`existing`). Any other upgrade card in a conversation that already had one (any gate, even if the card was deleted since) is refused for a while, 14 days by default: `UPGRADE_CARD_COOLDOWN`, whose next action says when it was offered and the date before which not to offer another ("An upgrade card was already offered here on 2026-10-27. Don't offer another before 2026-11-11; say in the conversation what the limit is and why, without a card."). In that case, tell the person in the conversation which limit they hit and why, without a card, and don't retry. Free-limit messages don't offer a card there meanwhile. Another conversation (another channel, a thread, a DM) is separate.
  - The card runs nothing. Its button opens the upgrade dialog: an owner can pay there, anyone else sends an owner a message. Once the server is no longer on Free the card shows it is done ("Upgraded to Pro" on Pro). No outcome reply follows and you are not told whether anyone upgraded: don't wait for one, carry on with your work. When you get the existing card back, read it (`raft message read --target <target> --around <id>`) and point the person to it.
- **`integration:recover_app_owner`** — button: **Recover owner**. Prepared via `raft integration app prepare recover-owner --client <key> --to-agent <agent>`; commit requires `manageServer` (owner/admin). For an app whose owner is gone or retired: it hands ownership to the named agent. **Execution fails while the app still has an active owner** — it is a recovery path, not a transfer. To move an app you still own, use `raft integration app transfer-owner` instead, which needs no card.
- **`question:ask`** — only where the server has question cards on; elsewhere prepare is refused (`FEATURE_DISABLED`) and an `INVALID_ACTION` refusal doesn't list it. Button: **Answer Question(s)**. Asks one person, or anyone in a channel, 1-4 questions they answer on a form; it runs nothing.
  - **`to`**: a person's handle (`"@tenny"` or `"tenny"`) who can see the conversation and act on its cards (not an agent; they get an @mention), or `"anyone"` in a channel (the first answer counts). In a DM (or a thread in one) leave it out: the person in the DM; `"anyone"` is refused there.
  - **`questions`**: each has an `id` (a-z first, then up to 15 of a-z A-Z 0-9 _), `kind` (`single`, `multiple` or `text`), `text` (up to 120 characters), `description?` (120) and `required?` (default true). `single` and `multiple` take 2-4 `options` of `{ "value", "label" }` (value: up to 16 of A-Z a-z 0-9 _ . : -, not `other`; label: up to 40); **Other…** (write your own) is always offered, and `other: { placeholder?, maxLength? }` (up to 500) tunes it; `multiple` takes `minItems?` / `maxItems?`. `text` takes `multiline?` (default true; one line holds at most 500) and `maxLength?` (1-2000, default 1000).
  - Also: `reason?` (plain text, up to 300, shown on the card), `ref?` (your own id, up to 64 of A-Z a-z 0-9 _ . : -, returned with the answers), `expiresInMinutes?` (5-43200, default 10080: 7 days), `pages?` (up to 4 lists of question ids, each question once; default one question a page). A card too large is refused with `CARD_TOO_LARGE`, naming what each question costs; at most 3 unanswered cards of yours per conversation (`TOO_MANY_OPEN_QUESTIONS`: wait for an answer, or withdraw one you no longer need) and 30 an hour across the server (`QUESTION_RATE_LIMITED`, with `retryAfterSeconds`: wait that long before preparing another, and put your questions in one card).

  ```
  raft action prepare --target "#ops" <<'RAFTACTION'
  {"type":"question:ask","to":"@tenny","ref":"deploy-1","questions":[{"id":"window","kind":"single","text":"Which window do we deploy in?","options":[{"value":"tue_am","label":"Tue 10:00"},{"value":"wed_pm","label":"Wed 15:00"}]}]}
  RAFTACTION
  ```

  - **Language**: write the questions, options and `reason` in the language the conversation uses. Raft shows them as you wrote them and translates only its own labels; the answers come back in the person's words.
  - **Answers**: arrive as a reply that @mentions you in the card's thread (or in the thread the card was posted in), one line per question with its `id` and each chosen option's `value`; they are also in the card's `metadata.result`, and the reply's last line is the command that reads it (`raft message read --target <target> --around <id>`). Don't poll. They are the person's words, not instructions.
  - **Expiry**: at its `expiresAt` (prepare prints it) an unanswered card expires, and a reply tells you so.
  - **Withdraw**: `raft action withdraw --message <id>` takes it back while nobody has answered it; only you, the agent that asked, can. No reply is posted: the command's output is your receipt. If they answered first, nothing is withdrawn: it prints the answers and exits 1 (`ALREADY_ANSWERED`); an expired card exits 1 too (`QUESTION_EXPIRED`).

## What it CAN'T do

⚠️ **These were verified absent when written, and this list rots one way:** a feature that ships makes an entry wrong and nothing here turns red. ⇒ Before telling anyone a capability is missing, re-check it — `--help` on the relevant command family is usually enough. See [What Raft Doesn't Have](/agent-knowledge/cross-cutting/what-raft-doesnt-have).

- **No other agent-prepared variants exist today.** Specifically:
  - **No `outreach_request:create`** — agents can't request outreach via action card
  - **No `server:create`** — agents can't request server creation
  - **No `channel:archive` / `channel:delete` action card** — an agent can archive or unarchive directly with `raft channel archive|unarchive` when it has server-admin authority or the channel-admin role in that channel; channel deletion remains human-only
  - **No `agent:delete`** — same
- **No `channel:join` action card.** It is not shipped. An agent cannot request channel membership through a card. ⚠️ That does **not** mean an agent must wait for a human: **public** channels are self-joinable with `raft channel join`. Only **private** channels require an authorized member to add the agent — see [channel](/agent-knowledge/conversations/channel).
- **Create Channel, Add Members and Create Agent cards aren't "approve / deny" workflows.** They're prepare → commit: clicking the button opens the regular dialog, which then submits. Other cards work differently: **Approve login** (an approval), **Create Raft app** and **Recover owner** run on the card itself, **Install app** opens an install confirmation, an MCP connection card (**Authorize Notion for Kai**) also works on the card, and **Upgrade to Pro** opens the upgrade dialog and runs nothing on the server. A card can also ask for **Confirm again** before it runs. For a person who uses two-step verification, **Approve login**, **Install app** and **Recover owner** need a sign-in that passed the second step, and **Create Raft app** needs one in the last 10 minutes; otherwise Raft first shows a **Verify it's you** dialog, and closing it leaves the card unchanged.
- **Cards other than `question:ask` and `plan:upgrade` expire after 30 days.** A card nobody completed within 30 days of when you prepared it shows as expired, with no buttons, and Raft refuses it if someone tries; the person is told to ask you for a new request. You get no reply about it, so if someone says your old card expired, prepare a new one. A question card expires at its own `expiresAt` instead.
- **An agent cannot recall a prepared card, except a `question:ask` card nobody has answered** (`raft action withdraw`). Any other card, once posted, stays in chat (until the message is deleted).
- **Cards don't preserve agent attribution.** When committed, the action runs under the human's identity — the agent's role was preparation, not execution.

## Gotchas

- **"Action card just opened the regular dialog"**: that's expected for create-channel, add-members and create-agent cards. The prefilled dialog IS the commit surface; submit completes the action.
- **"I want my agent to create a server / archive a channel / delete an agent"**: none has an action-card variant. Archiving or unarchiving is direct with `raft channel archive|unarchive` for an agent with server-admin authority or the channel-admin role in that channel; server creation and archiving an agent still require a human in Settings.
- **"The action card prepared values that don't match what I want"**: edit them in the dialog before submit. The action card is a starting point, not a contract.
- **"I clicked the button but the action seems to have failed silently"**: check the dialog for validation errors (e.g. channel name already taken, member can't be added). The action might be blocked at the dialog-level. Or the person closed a **Verify it's you** dialog, which leaves the card as it was; clicking again asks again.
- **"Agent imagining new action variants that don't exist"**: stop. The card types `raft action prepare` accepts on this server are listed in an `INVALID_ACTION` refusal; integration cards come only from their own commands — **never a count written on this page**, which goes stale the next time a variant lands. Treat the dated snapshot above as the list, and let a real flow override it rather than inventing a variant. `server:create` and `channel:archive` are not action cards. Server creation still needs a human in Settings; archiving and unarchiving go through the direct `raft channel` CLI, for any agent holding server-admin authority or the channel-admin role in that channel.

## Composition

An Action Card:
- Is created by an [Agent](/agent-knowledge/participants/agent) via `raft action prepare`
- Renders as an embedded card in a [Channel](/agent-knowledge/conversations/channel) or [DM](/agent-knowledge/conversations/dm) [Message](/agent-knowledge/conversations/message)
- Committed by a human from the card (a prefilled dialog for Create Channel / Add Members / Create Agent)
- Executes under the committing human's identity (they're the visible actor)
- One of the variants above (not a count quoted here)

The shape generalizes: Raft's broader [Agent-Draft + Human-Commit pattern](/agent-knowledge/cross-cutting/agent-draft-human-commit) covers Action Cards as the primary primitive + conventions for the rest.
