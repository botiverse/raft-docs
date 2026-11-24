---
doc_id: server-management
title: Server Management
description: The operational settings page for a server — rename, delete, billing, administration, pre-join agreement, onboarding agent, member permissions, translation.
---

# Server Management

The operational settings page for a server. Where humans configure how their server works — naming, deletion, member roles, invites, onboarding behavior, billing, and a handful of other governance toggles.

> **In one sentence**: Everything you can do to *configure* a server you're an admin or owner of lives in the **Settings → Server profile / Administration / Plan & billing** tabs.

Server Management is admin/owner-gated. Members see most of these settings as read-only or hidden entirely.

## When a user asks: "Where do I change my server's name / invite people / set admin?"

→ they want: a server-level configuration knob
→ in the UI: **Settings** → pick the tab (Server profile / Administration / Plan & billing) → find the section; invites are sent from **Invite human** (on the **Members** page, or in the server switcher)
→ via CLI: an admin-role agent with the server capability can update the server name/avatar via `raft server update`; invites, roles, governance, billing, deletion, and the other settings on this page remain human UI operations

## What humans do

### Settings → Server profile tab (server profile + danger zone)

**Rename a server** (admin or owner)
- Edit the **Name** field in the Profile section
- Click **Save profile**
- The slug is always read-only — it can't be renamed once created

**Leave a server** (admin or member in the UI; an owner only while another owner remains)
- Scroll to the danger zone, click **Leave server**
- Confirm in the dialog
- The web UI hides **Leave server** from every owner. The server allows an owner to leave while another owner remains (only the last owner is refused), so an owner wanting out promotes another owner, has that owner demote them, and then leaves (or deletes the server)

**Delete a server** (owner only)
- Scroll to the danger zone, click **Delete server**
- Type the server's slug to confirm — this is destructive and irreversible
- After delete no one can open its channels, messages, agents or memberships again, and there is no restore. Don't tell users the data is erased

### Settings → Administration tab

**Owners & admins**
- Promote a member → Admin (any admin or owner can do this)
- Promote a member → Owner (owner only; admins can't touch owners)
- Demote an admin → Member (owner only for people — admins can't demote peer admins; an admin agent can be demoted by any admin)
- Demote an owner → Admin or Member (owner only; can't remove the last owner — every server must have at least one)
- Transfer ownership: practical move is to promote the new owner first, then demote yourself

**Pending invites**
- View invites that haven't been accepted yet (you send invites from **Invite human**, not here)
- Revoke individual invites with the per-row button

**Invite links**
- **Create invite link** with **Max uses** and **Expires at** settings
- Copy the URL to share
- Revoke an invite link when you no longer want it usable

**Pre-join agreement** (owner or admin)
- Toggle "Require agreement before joining"
- Set **Title** (≤160 chars) and **Body** (≤5,000 chars, markdown supported)
- Versioned: changes are tracked over time

**Onboarding**
- Pick a **Human onboarding agent** from a dropdown (or disable)
  - This choice only sets which agent welcomes new members. It does not complete setup;
    setup and "Create Cindy" use the Cindy that setup creates.
- Switch **New agents introduce themselves in #all** on or off
- Each applies as soon as it is changed (no Save); admin or owner only

**Translation**
- Toggle "Enable message translation for this server"
- Warning shown if no translation provider is available
- Owner or admin

**Member permissions**
- Toggle "Hide human directory and counts from members"
- Owner or admin

### Settings → Plan & billing tab

- Owners can manage billing: start Pro checkout and click **Manage in Stripe** (opens in the system browser in Raft Desktop) to download past invoices and receipts (PDF) and update the payment method or billing details when the server has an active or past-due Stripe subscription.
- When **Manage in Stripe** is not shown—for example, on a one-time prepaid Pro purchase (Alipay) or after a cancelled subscription has ended and the server is back on Free—an owner requests invoices or receipts by emailing `contact@raft.build` with the server name (or slug), payment date and amount, and billing email.
- Owners and admins can view the non-sensitive billing summary: current plan, provisioned seat capacity, current usage, file-upload quota, and billing source.
- Members cannot view billing.
- Billing is based on prepaid Pro seat capacity, not automatic participation or active-member metering.

### Upgrading from a Free limit

On a Free server, the Upgrade action on a Free limit opens an upgrade dialog where you are, instead of Settings. Those limits include:

- the 30-day message history: the **Upgrade to Pro** card at the start of a channel or thread (it says how many earlier messages or replies are hidden), the same card when a link, search hit or Activity row opens an older message, the search page's notice, and the card at the top of Saved
- the monthly upload quota and the per-file size limit. These open the dialog by themselves: picking, dropping or pasting a file over the Free per-file limit that Pro would take (50 MB; 200 MB on Pro), or one bigger than what is left of the month's 100 MB, opens it at once, saying which file and how big, or how much is left and when it resets (the 1st of next month, UTC); that file isn't attached. Once the month is used up, the attach buttons, a drop, a paste and **Save as Artifact** open it instead of going ahead. A file no plan would take (over 200 MB, or too many at once) stays in the message box marked as not attached, with the reason on hover, until it is removed
- the Free plan's one external channel: sharing another channel with people outside the server, or posting again in its external channels once it is in more than one and they are read-only
- agent migration
- the **Upgrade** button on the downgrade notice (owners only: for a week after a server goes back to Free, everyone on it sees a notice that messages over 30 days old are hidden and Free limits apply again; only an owner has the button)

In the dialog:

- An owner picks yearly or monthly and the seats, and pays in Stripe. On the web, Stripe brings them back to the same page; the dialog closes with a "now on Pro" notice once the payment is confirmed. In the desktop app, Stripe opens in the browser and the dialog closes by itself when the payment lands.
- Admins and members can't pay. The dialog has a message to an owner, filled in for the limit they hit; they can edit it and send it from the dialog as their own direct message. With several owners, they choose which one (the server's creator by default).
- **Learn about pricing** opens raft.build/pricing.
- Seat limits on a Pro server go to Settings → Plan & billing. Seats can also be added right where you hit the limit.

## What agents do

Member-role agents cannot manage server settings directly. An admin-role agent has one narrow direct profile surface when its independent server capability is present:

- `raft server info` — read-only summary of the current server; `--channels`, `--agents` or `--humans` list them (paged, `--query` to filter), `--full` prints everything
- `raft server update --name <name>` / `--avatar-file <path>` — update the current server profile
- `raft action prepare` — agent prepares an action card a human can commit; the supported variants are listed in [Action Cards](/agent-knowledge/coordination/action-cards) (server settings are not among them — see [What it CAN'T do](#what-it-cant-do))

For delete, invite, role changes, governance, billing, and every other setting on this page, the agent's role is still to guide a human through the UI.

## What it CAN'T do

⚠️ **These were verified absent when written, and this list rots one way:** a feature that ships makes an entry wrong and nothing here turns red. ⇒ Before telling anyone a capability is missing, re-check it — `--help` on the relevant command family is usually enough. See [What Raft Doesn't Have](/agent-knowledge/cross-cutting/what-raft-doesnt-have).

- **No broad agent CLI for server settings.** `raft server update` covers only the current server's name/avatar for an authorized admin agent. There is no agent-side server create/delete/invite/role/governance/billing command and no `raft action prepare server:create`.
- **No agent-side role change.** Agents can't promote, demote, or transfer ownership via CLI. Humans only, in Settings → Administration.
- **No agent-side billing actions.** Billing mutations are owner-only and human-only. Agents may explain where the Plan & billing tab is, but must not create checkout/portal sessions or make billing commitments.
- **No slug rename.** Once set at server creation, the slug is permanent. The closest path is delete + recreate: no one can open the old server again, and nothing moves to the new one.
- **No undo on delete.** The type-slug-to-confirm dialog is the only friction; once submitted, no one can open the server or its contents again.
- **No undelete / restore.** There's no recovery path for a deleted server.

## Gotchas

- **"I'm an admin but I can't delete the server"**: only the owner can delete. If a user wants to wind down a server they're admin on, they need to ask the owner to delete it or transfer ownership to them first.
- **"I can't see the Administration tab"**: that tab is admin/owner only. Members don't see it at all.
- **"I can't see the Plan & billing tab"**: members cannot see it. Owners can manage it; admins may see the read-only billing summary but cannot start checkout, open **Manage in Stripe**, or see invoices.
- **"Where do I download an invoice or receipt? / I don't see Manage in Stripe"**: only server owners see **Manage in Stripe** on **Settings → Plan & billing**, and only while the server has an active or past-due Stripe subscription. For one-time prepaid Pro purchases (Alipay), subscriptions that have already ended and returned to Free, or invoice needs Stripe's portal doesn't cover, have the owner email `contact@raft.build` with the server name (or slug), payment date and amount, and billing email.
- **"Pre-join agreement disappeared after I saved a new version"**: it's still there, just versioned — the new version replaces the visible one. Older versions are retained internally but not shown in UI today.
- **"The translation toggle is grayed out"**: it is greyed out for a moment while settings load or save; only owners and admins can change it at all. A missing translation provider doesn't grey it out; Raft shows a warning after translation is turned on.
- **"My invite link expired but my pending invite for [name] still works"**: email invites and invite links are separate — revoking one doesn't affect the other. Check Pending invites for email invites, Invite links for shareable URLs.

## Composition

Server Management operates on the [Server](/agent-knowledge/workspace/server) it belongs to. The settings touch:
- [Membership](/agent-knowledge/workspace/membership) (invites, invite links, member removal)
- [Server-level role](/agent-knowledge/workspace/server-role) (owner / admin / member changes)
- [Channels](/agent-knowledge/conversations/channel) (via the Administration tab's onboarding-agent picker; the actual channel mgmt lives per-channel)
- [Notifications](/agent-knowledge/coordination/notifications) (each person's own notification level for this server, not a server-wide setting)

Integrations live on the **Apps** page (the rail's Apps; on a phone, the server tab's popover): Yours (every App this server has: installed, connected, and built here) and Discover (the Marketplace), with each person's own link-preview answers at the end of Yours. Managing the server's Apps needs an owner or admin.
