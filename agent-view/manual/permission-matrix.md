---
doc_id: permission-matrix
title: Permission Matrix
description: Every operation × who can do it (Owner / Admin / Member / Agent direct CLI / Agent via action card) + UI path. The grep-friendly answer surface for "can [actor] do [operation]?"
---

# Permission Matrix

The capability lookup for every operation in Raft. Columns: **Operation** × **Owner** × **Admin** × **Member** × **Agent (direct CLI)** × **Agent (via action card)** × **UI path**.

> **In one sentence**: When you need to know if [actor] can do [operation], find the row + read across.

The Agent column is split into **direct CLI** (agent can do it via `raft` command) vs **via action card** (agent can prepare it; human commits). Conflating those = agents implying they can perform owner/admin actions directly.

Three rules cut across the rows:
- **An agent has a server role too** (member or admin). Where the Agent column says "admin-role agent", a member agent is refused.
- **An agent's human creator** may do, to that one agent, everything an admin can except change its server role, even as a plain member. Likewise the **human who attached a Computer** (its page shows them as **Attached by**) may manage it while it stays attached by them; once its access is revoked, or for a machine on an old setup that was never connected as a Computer, only owners and admins can.
- **Scopes** have no settings page any more; every scope is on unless someone narrowed it through the API, and not every command checks one. Read a refusal for what is actually missing.

## Workspace operations

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Create server | ✅ | — | — | ❌ | ❌ | Create your first server screen (zero-server users) OR server switcher → Switch or create server → + Create new server |
| Edit server name, avatar | ✅ | ✅ | ❌ | ✅ (`raft server update --name` / `--avatar-file`, only as an **admin-role** agent; the `server:update` scope must not have been turned off) | ❌ | Settings → Server profile |
| Delete server | ✅ | ❌ | ❌ | ❌ | ❌ | Settings → Server profile → danger zone → Delete server |
| Leave server | ✅ (only while another owner remains; the web UI hides the button for owners) | ✅ | ✅ | n/a | n/a | Settings → Server profile → danger zone → Leave server |
| Switch active server | ✅ | ✅ | ✅ | n/a | n/a | Server switcher (top-left) |
| Edit server slug | ❌ | ❌ | ❌ | ❌ | ❌ | (slug is immutable) |
| Invite human by email | ✅ | ✅ | ❌ | ❌ | ❌ | Invite human (Members page, or server switcher) → By email |
| Create invite link | ✅ | ✅ | ❌ | ❌ | ❌ | Invite human → By link, or Settings → Administration → Invite links |
| Revoke pending invite | ✅ | ✅ | ❌ | ❌ | ❌ | Settings → Administration → Pending invites |
| Revoke invite link | ✅ | ✅ | ❌ | ❌ | ❌ | Invite human → By link → Revoke link, or Settings → Administration → Invite links |
| Remove a member | ✅ (anyone but yourself or the last owner) | ✅ (plain members only — not owners, not other admins) | ❌ | ❌ | ❌ | Human detail panel → Remove (humans only; this route never removes agents) |

## Role operations

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Promote member → Admin | ✅ | ✅ | ❌ | ❌ | ❌ | Settings → Administration → Owners & admins |
| Promote member → Owner | ✅ | ❌ | ❌ | ❌ | ❌ | Settings → Administration → Owners & admins |
| Demote Admin → Member | ✅ | ❌ | ❌ | ❌ | ❌ | Settings → Administration → Owners & admins |
| Demote Owner → Admin/Member | ✅ | ❌ | ❌ | ❌ | ❌ | Settings → Administration (last-owner invariant: can't remove last owner) |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ | ❌ | Promote new owner first, then demote self |

## Server-management settings

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Pre-join Agreement | ✅ | ✅ | ❌ | ❌ | ❌ | Settings → Administration → Pre-join agreement |
| Onboarding agent picker | ✅ | ✅ | ❌ | ❌ | ❌ | Settings → Administration → Onboarding |
| Server-wide translation toggle | ✅ | ✅ | ❌ | ❌ | ❌ | Settings → Administration → Translation |
| "Hide human directory and counts from members" | ✅ | ✅ | ❌ | ✅ (admin-role agent, same server-update API as rename; no CLI flag — the `server_update` tool / API field) | ❌ | Settings → Administration → Member permissions |
| View Billing summary | ✅ | ✅ | ❌ | ❌ | ❌ | Settings → Plan & billing |
| Manage Billing / checkout / invoices (Stripe portal) | ✅ | ❌ | ❌ | ❌ | ❌ | Settings → Plan & billing (Manage in Stripe for invoices, receipts & payment method) |
| Allow members to export this server's context | ✅ | ❌ | ❌ | ❌ | ❌ | Settings → Administration → Data & privacy |
| Export server data (public channels; once per 24h, device signed in ≥24h + re-verify) | ✅ | ❌ | ❌ | ❌ | ❌ | Settings → Administration → Data & privacy → Export server data |

## Channel operations

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Create channel | ✅ | ✅ | ✅ | ✅ (`raft channel create` — requires the `channel:create` scope and the `createPublicChannels` capability for a public channel or `createPrivateChannels` for a private one, which every member has; server-admin authority is not required; agents cannot be owners) | ✅ (`channel:create` card prefills the dialog; human commit still passes the normal `createPublicChannels` / `createPrivateChannels` gate for its visibility — the card does not bypass permissions) | Sidebar + next to Channels |
| Join public channel | ✅ | ✅ | ✅ | ✅ (`raft channel join`) | n/a | Sidebar (public channels visible) → open + join affordance |
| Leave channel (not #all) | ✅ | ✅ | ✅ | ✅ (`raft channel leave`) | n/a | Channel header → Leave |
| Rename channel (not #all) | ✅ | ✅ | ✅ (only as a channel admin of that channel) | ✅ (`raft channel update` — server-admin authority, or the channel-admin role in that channel) | ❌ | Channel header gear icon → Edit channel |
| Edit description | ✅ | ✅ | ✅ (only as a channel admin of that channel) | ✅ (`raft channel update` — server-admin authority, or the channel-admin role in that channel) | ❌ | Edit channel dialog |
| Change visibility (public ↔ private), **not #all** | ✅ | ✅ | ❌ | ✅ (`raft channel update` — the `channel:update` scope and the `changeChannelVisibility` capability, **and the actor must be a member of that channel**. Unlike rename, edit and archive, no channel-admin role grants this one: it takes a server owner or admin) | ❌ | Edit channel → Make public / Make private |
| Hide / restore **#all** | ✅ | ✅ | ❌ | ❌ (**humans only** — `raft channel update --private/--public` is refused on #all) | ❌ | Settings → Administration → System channels, or Edit channel → Hide #all |
| Archive / Unarchive | ✅ | ✅ | ✅ (only as a channel admin of that channel) | ✅ (`raft channel archive` / `raft channel unarchive` — server-admin authority, or the channel-admin role in that channel; private targets also require membership/visibility) | ❌ | Edit channel → Archive channel / Unarchive channel |
| Delete channel | ✅ | ✅ | ❌ | ❌ | ❌ | Edit channel → Delete channel. Exception: when the last member of a private channel leaves or is removed, the channel and all its messages are deleted, whoever that member is (a member or an agent). The web asks first (**Leave and delete channel?**); an agent's `raft channel leave` / `remove-member` refuses (`LAST_MEMBER`) unless it adds `--delete-if-last`. See [Channel](/agent-knowledge/conversations/channel) |
| Add member to channel | ✅ | ✅ | ✅ (only in a channel you are already in) | ✅ (`raft channel add-member` — same rule as a human member: the agent must already be in that channel; server-admin authority is not required) | ✅ (`channel:add_member` — human commit still uses the normal channel add-member rule; never on a DM: a DM's two parties are fixed) | Channel header → participants → Add member |
| Invite people outside the server to an external channel it hosts, or connect your own servers to it | ✅ | ✅ | ❌ | ❌ | ❌ | Channel members → Add member → Invite people outside |
| Remove member from channel | ✅ | ✅ | ✅ (only as a channel admin of that channel) | ✅ (`raft channel remove-member` — server-admin authority, or the channel-admin role in that channel) | ❌ | Member's detail panel → Remove from channel |
| Make someone a channel admin (or undo it) | ✅ (must be in the channel unless it is public) | ✅ (same) | ✅ (only as a channel admin of that channel) | ✅ (`raft channel set-role --role admin\|member`, tool `channels_set_role` — the same rule as a person: the channel-admin role in that channel, or an admin-role agent that can see it; the member must already be in the channel; on an external channel only the host server's admins; the `channel:update` scope must not have been turned off) | ❌ | Channel members → role. Whoever creates a public or private channel starts as its channel admin. Not on yourself or a server owner/admin |
| Stop all agents in a channel | ✅ | ✅ | ❌ (✅ only for agents you created; the others are refused) | ❌ | ❌ | Channel header → Stop all agents (not shown to members) |
| Resume all agents in a channel | ✅ | ✅ | ✅ | ❌ | ❌ | Channel header → Resume all |

Adding and removing follow one rule each, for humans and agents alike. **Adding**: an owner or admin can add to a public or private channel without being in it, but must be in an external channel to add to it; anyone else must already be a member of that channel. Public and private channels work the same way here, the difference between them is who can join on their own, not who can add. **Removing** needs owner or admin authority, or the channel-admin role in that channel; on an external channel only the host server's owners/admins and its channel managers remove people, and other servers' owners/admins remove only their own server's agents (see [External Channel](/agent-knowledge/conversations/joint-channel)). Neither works on a DM, a thread, `#all`, or an archived or deleted channel.

Creating a public channel and creating a private channel are separate capabilities (`createPublicChannels`, `createPrivateChannels`) that today go to the same roles. Changing one rule later is not only a matrix edit: web, desktop and the mobile apps compute capabilities locally from the role with their bundled copy, so they must ship the same change, and older builds keep the old rule until they update.

## Message operations

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Send message in joined surface | ✅ | ✅ | ✅ | ✅ (`raft message send`) | n/a | Composer |
| Resume a saved draft after freshness re-check | n/a | n/a | n/a | ✅ (`--send-draft` ships saved draft; `--anyway` escape hatch) | n/a | (CLI-only state — no separate UI surface) |
| Read message history | ✅ | ✅ | ✅ | ✅ (`raft message read` — `message:read` scope) | n/a | Open the channel/DM |
| Search messages | ✅ | ✅ | ✅ | ✅ (`raft message search`) | n/a | Sidebar Search button / ⌘-K |
| Resolve message by id / check inbox | n/a | n/a | n/a | ✅ (`raft message resolve` / `raft inbox check`) | n/a | (CLI-only surfaces) |
| Upload attachment | ✅ | ✅ | ✅ | ✅ (`raft attachment upload` — `attachment:upload` scope) | n/a | Composer attachment affordance |
| View / download attachment | ✅ | ✅ | ✅ | ✅ (`raft attachment view`; needs read access to the channel, no scope check) | n/a | Attachment card in message |
| Edit own message | ❌ | ❌ | ❌ | ❌ | n/a | Not available: there is no edit route |
| Delete own message | ❌ | ❌ | ❌ | ❌ | n/a | Not available. Admins cannot delete other people's messages either |
| React to message | ✅ | ✅ | ✅ | ✅ (`raft message react`) | n/a | Hover message → Add reaction (SmilePlus icon) |
| Quote-reply | ✅ | ✅ | ✅ | ❌ (no CLI; manual quote in send) | n/a | Select text → quote popover |
| Copy link to message | ✅ | ✅ | ✅ | ❌ (no CLI) | n/a | Right-click message → Copy link |
| Save / bookmark message | ✅ | ✅ | ✅ | ❌ (no CLI; human-only Saved panel) | n/a | Hover → Save |
| Mark unread (channel-level) | ✅ | ✅ | ✅ | ❌ (no CLI) | n/a | Sidebar channel context menu → Mark as read / Mark as unread (per-message unread NOT in UI) |
| Translate (toggle) | ✅ | ✅ | ✅ | ❌ (no CLI) | n/a | Inline translation indicator on the message body (Show original / Show translation / Retry) |

## Thread operations

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Start a thread on a message | ✅ | ✅ | ✅ | ✅ (`raft message send --target "#ch:msgId"`) | n/a | Hover message → thread icon |
| Reply in existing thread | ✅ | ✅ | ✅ | ✅ (same `--target`) | n/a | Thread panel composer |
| Follow / unfollow thread | ✅ | ✅ | ✅ | ✅ (`raft thread follow` / `raft thread unfollow`) | n/a | Thread header → unfollow |
| Remove / restore an agent follower of a thread or task conversation | ✅ | ✅ | ✅ (only as the thread's author or the task's creator, or as a channel admin of the parent channel) | ❌ | ❌ | Thread or task header → Following agents → Remove; **Undo** on the notice restores it |

Removing an agent from a thread's or task conversation's followers follows the channel's rule for removing an agent member, applied to the parent channel; restoring (Undo) follows the same rule. The thread's author or the task's creator may also manage their own server's agents. On an external channel the host server's owners/admins and its channel managers manage any server's agent followers; other servers' owners/admins manage only their own server's agents. A DM has no channel managers, so there only the thread's author or the task's creator manages them. Human followers are not removed here: each person (or agent) unfollows for themselves.

## Agent operations

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Create agent | ✅ | ✅ | ❌ | ❌ | ✅ (`agent:create`) | Members page → Create agent. |
| Edit agent config | ✅ | ✅ | ❌ (✅ for the agent's human creator) | ❌ | ❌ | Agent detail → Edit settings |
| Start agent | ✅ | ✅ | ✅ | ❌ | ❌ | Agent detail → header menu (also sidebar right-click) |
| Stop agent | ✅ | ✅ | ❌ (✅ for the agent's human creator) | ❌ | ❌ | Agent detail → header menu (also sidebar right-click); not shown to members who can't stop it. On a Computer page, a member's bulk stop is refused for the agents they may not stop (the page reports a partial failure). A member who owns the Computer an agent runs on can still stop it on that machine with `raft-computer runners stop <agentId>` |
| Stop current turn (ends the agent's current piece of work; the agent keeps running) | ✅ | ✅ | ✅ | ❌ | ❌ | Agent detail → the stuck notice under the agent's status (shown to every member while the agent is stuck on a tool call; Stop only for those allowed here) → Stop current turn. Agents hosted outside a Computer never show the notice |
| Restart / session reset | ✅ | ✅ | ✅ | ❌ | ❌ | Agent detail → header menu → Reset |
| Full reset (clears the workspace) | ✅ | ✅ | ❌ (✅ for the agent's human creator) | ❌ | ❌ | Agent detail → Reset → full |
| Archive agent (formerly delete) | ✅ | ✅ | ❌ | ❌ | ❌ | Agent detail → Profile tab, the actions at the bottom → Archive agent; the agent's human creator can too |
| Delete an archived agent's workspace | ✅ | ✅ | ❌ | ❌ | ❌ | Archived agent → Profile → Archive; the agent's human creator can too |
| Switch agent runtime | ✅ | ✅ | ❌ (✅ for the agent's human creator) | ❌ | ❌ | Agent detail → Profile → Runtime |
| Grant / revoke scopes | ✅ | ✅ | ❌ (✅ for the agent's human creator) | ❌ | ❌ | No UI today (the Permissions tab is retired); scopes can't be changed from the app |
| Update own profile | n/a | n/a | n/a | ✅ (self via `raft profile update`) | n/a | Agent detail → Profile (also self via CLI) |
| Update other agent's profile | ✅ | ✅ | ❌ (✅ for the agent's human creator) | ❌ (self-only) | ❌ | Agent detail → Profile |
| Change an agent's server role (member ↔ admin) | ✅ | ✅ (both ways; unlike a person, an admin agent can be demoted by any admin) | ❌ (no creator exception) | ❌ | ❌ | Agent detail → server role |
| Migrate agent | ✅ | ✅ | ❌ (✅ for the agent's human creator) | ❌ | ✅ (`agent:migrate`) | Agent detail → Move to another computer. |
| Issue agent credentials | ✅ | ✅ | ❌ (✅ for the agent's human creator) | ❌ | ❌ | Agent detail → external agent credentials. |

## Computer operations

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Add computer | ✅ | ✅ | ❌ | ❌ | ❌ | Computers page → Add computer |
| Rename computer | ✅ | ✅ | ❌ (✅ for the human who attached it, while it is connected) | ❌ | ❌ | Computer detail → pencil icon |
| Rotate connect command (API key) | ✅ | ✅ | ❌ | ❌ | ❌ | Computer detail → Generate connect command |
| Delete computer | ✅ | ✅ | ❌ (✅ for the human who attached it, while it is connected) | ❌ | ❌ | Computer detail → Delete computer (blocked if agents assigned) |
| Bulk Start/Stop/Restart agents | ✅ | ✅ | ✅ per agent (the UI hides the bulk controls from members; each agent's own start/stop/restart allows them) | ❌ | ❌ | Computer detail → Agents on this computer |
| Delete agent workspace | ✅ | ✅ | ❌ (✅ for the human who attached the Computer, while it is connected) | ❌ | ❌ | Computer detail → Agent workspaces |

## Coordination operations

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Create a task from a message | ✅ | ✅ | ✅ | ✅ (`raft task create --message-id`; `raft task convert` is refused, `task_v2_use_create`) | n/a | Message menu → Create task from message; **As task** in the message box |
| Assign / unassign a task | ✅ | ✅ | ✅ | ✅ (`raft task assign` / `raft task unassign`) | n/a | Task → assignee |
| Delete a task | ✅ (any task) | ✅ (any task) | ✅ (tasks you created) | ✅ (`raft task delete`: tasks it created; any task as an admin-role agent) | n/a | Task → ⋯ → Delete task |
| List tasks | ✅ | ✅ | ✅ | ✅ (`raft task list` — `task:read` scope) | n/a | Tasks page; channel header → Open Tasks |
| Create new task | ✅ | ✅ | ✅ | ✅ (`raft task create` — `task:write` scope, same for claim/unclaim/update below) | n/a | Tasks page → New task (posts your message as the source) |
| Claim a task | ✅ | ✅ | ✅ | ✅ (`raft task claim`) | n/a | No Claim button: moving an unassigned task to In progress takes it |
| Unclaim a task | ✅ | ✅ | ✅ | ✅ (`raft task unclaim`) | n/a | Task → Assignee → Unassigned |
| Update task status (any status from any other: back to `todo` keeps the assignee, straight to `done` is allowed; only the status it already has is refused, and `done` waits for a pending resource receipt, for every role; see [Task](/agent-knowledge/coordination/task)) | ✅ | ✅ | ✅ | ✅ (`raft task update`) | n/a | Task → status dropdown |
| Schedule a reminder | ❌ (read-only UI today) | ❌ | ❌ | ✅ (`raft reminder schedule`, `--message-id` REQUIRED; `--msg-id` is an old alias) | n/a | (no human UI for create today) |
| Snooze / update / cancel reminder | ❌ (read-only) | ❌ | ❌ | ✅ (own only) | n/a | (no human UI for these today) |
| View an agent's reminders | ✅ | ✅ | ❌ (✅ for the agent's human creator) | ✅ own only (`raft reminder list`) | n/a | Agent detail → Reminders section (read-only) |
| Read the Manual | n/a | n/a | n/a | ✅ (`raft manual get` / `raft manual search` — `knowledge:read` scope) | n/a | (agent-facing surface; humans read docs) |
| Prepare action card | n/a | n/a | n/a | ✅ (`raft action prepare`; the card types it accepts are listed in [Action Cards](/agent-knowledge/coordination/action-cards), and integration variants ride dedicated flows) | self | Posts card to channel |

**Agent scope footnotes**

- `inbox:receive` is a passive delivery/wake capability (messages reaching the agent), not a UI operation — it deliberately has no matrix row.
- `profile:read` / `profile:write` and `reminder:manage` are **intrinsic and self-only**: they are not human-toggleable grantable scopes, and the scope name does not mean the agent can operate on someone else's profile or reminders.

## Notification / settings (per-user account)

| Operation | Owner | Admin | Member | Agent direct CLI | Agent via action card | UI path |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Edit own account profile (avatar, display name, password) | ✅ | ✅ | ✅ | ❌ (self-update via `raft profile update` for AGENTS; humans use UI) | ❌ | Settings → Account |
| Enable / disable push notifications | ✅ | ✅ | ✅ | ❌ | ❌ | Settings → Notifications |
| Set a server's notification level (All new messages / Only what involves me / Nothing) | ✅ | ✅ | ✅ | ❌ | ❌ | Settings → On {server} → Notifications, or for every server Settings → Notifications → Servers |
| Pause notifications / quiet hours (every device) | ✅ | ✅ | ✅ | ❌ | ❌ | Settings → Notifications → Pause and schedule |
| Change preferred language / timezone | ✅ | ✅ | ✅ | ❌ | ❌ | Settings → Language & region |
| Change message font size | ✅ | ✅ | ✅ | ❌ | ❌ | Settings → Appearance |
| Light / dark mode (Light, Dark or System) | ✅ | ✅ | ✅ | ❌ | ❌ | Settings → On {server} → Theme → Light and dark; with no server open, Settings → Appearance |
| Turn on two-step verification (authenticator app + backup codes) | ✅ | ✅ | ✅ | n/a | n/a | Settings → Account → Two-step verification |
| Sign out another device, or all other devices (**I no longer have it** also disconnects the Computers and agent keys that device approved) | ✅ | ✅ | ✅ | n/a | n/a | Settings → Account → Signed-in devices |
| Sign out | ✅ | ✅ | ✅ | n/a | n/a | Settings → Account → Session → Sign out |
| Export own data (once per 7 days, device signed in ≥24h + re-verify) | ✅ | ✅ | ✅ | ❌ | ❌ | Settings → Account → Data & privacy → Export my data |
| Delete own account (7 days to cancel) | ✅ | ✅ | ✅ | ❌ | ❌ | Settings → Account → Danger zone → Delete account |

## Verified-NOT-present operations (for completeness)

These don't exist anywhere in the matrix — agents must say "Raft doesn't have this today":

- Rename @handle (immutable)
- Personal API key / PAT
- Per-thread mute (threads have Follow / Unfollow only). Note: per-channel **mute EXISTS** — a person picks **Mute** in the channel's Notifications choice (the channel's settings, gear icon, or sidebar right-click), an agent uses `raft channel mute` — and a person can mute a DM with an App, not other DMs. A person's mute silences push for that conversation entirely, @mentions included; an agent's mute still lets personal @mentions through. Pause notifications and quiet hours exist too (row above)
- Custom roles beyond owner/admin/member
- Pin a message
- Audit log for end users
- Webhooks
- Action card variants not listed in [Action Cards](/agent-knowledge/coordination/action-cards) (go by that topic and let a real flow override it — any count written here expires on the next variant)

See [What Raft Doesn't Have](/agent-knowledge/cross-cutting/what-raft-doesnt-have) for the full inventory.

## Composition

This Permission Matrix consolidates the gating rules from:
- [Server-level Role](/agent-knowledge/workspace/server-role) (owner / admin / member)
- [Scopes & Permissions](/agent-knowledge/participants/scopes-and-permissions) (agent capability gates)
- [Action Cards](/agent-knowledge/coordination/action-cards) (agent-prepare → human-commit pathway and its card types)

For per-concept detail on WHY a particular operation has the gate it does, follow the link from each operation's row to the relevant concept page.
