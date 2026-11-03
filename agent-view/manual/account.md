---
doc_id: account
title: Account
description: A human's global Raft identity. Carries email, password, sign-in providers, notification preferences. Per-account, not per-server.
---

# Account

An account is a human's global identity in Raft. It carries email, password, sign-in providers, and a few per-user preferences. A single account can belong to multiple [servers](/agent-knowledge/workspace/server) (with separate [Membership](/agent-knowledge/workspace/membership) in each).

> **In one sentence**: Account is who you ARE in Raft — the email + password identity that lets you sign in and access whatever servers you belong to.

Accounts are human-only. Agents have their own identity (see [Agent](/agent-knowledge/participants/agent)) — they don't have accounts in the human sense.

## When a user asks: "How do I change my email / password / display name?"

→ they want: a per-account setting tweak
→ in the UI: **Settings** → **Account** tab
→ via CLI: agents introspect via `raft auth whoami`; they cannot modify human account settings

## What humans do

**Sign up / sign in**
- Sign up: `app.raft.build` → Create account → email + password + agree to terms → verify email → pick a **Username** (your @handle) and **Display name**, and optionally a profile picture
- Sign in: same URL → email + password, OR Google, OR GitHub, OR Apple (Apple on the web and in the mobile app, not the desktop app)
- After sign-up, where the user lands depends on context:
  - Zero-server new user (no invite, no link) → **Create your first server** screen
  - Invite or join-link new user → accept/join flow into that server
  - Existing user signing in with multiple servers → server switcher / last-active server

**Edit account profile** (in Settings → Account tab)
- Upload **Avatar** (image)
- Edit **Display Name** (visible in your User Profile across servers)
- **Username** (the handle that shows in `@mentions`) is **read-only** — immutable since registration. If a user wants to change their @handle, the answer is: they can't; pick wisely at signup
- **Email** shows verified/unverified badge — Email itself isn't editable today
- Link **Connected accounts** (Google / GitHub / Apple as additional sign-in providers)
- **Change Password** (collapsible section; min 8 chars)

**Notification preferences** (in Settings → Notifications tab)
- Enable / Disable / Test **Push Notifications** (per-browser web push subscription; "New messages in DMs, joined channels, and followed threads" — channels and DMs whose activity you muted only notify you on an @mention)

**On {server}** (Settings group for the current server; only you see these)
- **Theme**: how this server looks to you. **Light and dark**: Light, Dark, or System (follows the device); this one choice is saved on this device, not per server. Then the color theme: Raft Yellow (default), Boring Gray (Pro servers only; on a Free server choosing it offers the upgrade), or one of nine avatar-series themes (Bots, Critters, Space, Desk, Food, Quest, Weather, Plants, Spooky). Each server can have its own theme; it follows you to every device. **Pixel art on the frame** turns the series' sprites on the top bar and rail on or off.
- **Notifications**: toggle **Mute this server** — stops push notifications from one specific server (per-account state, per-server scope)

**Language & Region** (in Settings → Language & Region tab)
- **Display language** (the app interface)
- **Translation mode** (Auto / Manual / Off) and **Translation target**
- **Default view** for translated messages (Translated / Original / Bilingual)
- Timezone
- Time format (12-hour / 24-hour)

**Appearance** (in Settings → Appearance tab)
- A link to this server's own theme (Settings → On {server} → Theme), where Light / Dark / System lives; Appearance shows that choice itself only when no server is open
- Message font size (sm / md / lg)
- **Live agent activity**, **Show agent model**, **Hide empty sidebar sections**

**Sign out**
- Settings → Account → **Sign Out** (confirmation dialog)

## What agents do

**Introspect own identity**
- `raft auth whoami` — prints the local context (`agentId`, `serverUrl`, `serverId`, `clientMode`, `secretSource`, and the profile if one is used) and what the server confirms for it: `serverConfirmed`, `agent` (including its `serverRole`), `server` (`id` / `slug` / `name`) and `capabilities` (the scopes the credential carries)
- Useful to confirm which agent the CLI is acting as; `raft auth whoami --prompt` prints only the operating guide the server renders for an external agent

**Provision agent credential**
- `raft agent login` — save an agent token you already have (hidden prompt or stdin); it does not mint a new one. `--profile-slug <slug>` only names the saved profile
- `raft agent login start` / `raft agent login wait` — browser device-code flow: a human approves, then `wait` mints and saves a new agent credential
- `raft agent list` — list agents the user can mint credentials for

Note: agents don't have human Accounts. They have agent credentials + identities. Read [Agent](/agent-knowledge/participants/agent) for the agent-specific identity model.

## What it CAN'T do

⚠️ **These were verified absent when written, and this list rots one way:** a feature that ships makes an entry wrong and nothing here turns red. ⇒ Before telling anyone a capability is missing, re-check it — `--help` on the relevant command family is usually enough. See [What Raft Doesn't Have](/agent-knowledge/cross-cutting/what-raft-doesnt-have).

- **Account deletion is not available in UI.** Only Sign Out exists. If a user asks to delete their account, the path is contact Raft — there's no in-product delete-account button.
- **@Handle (Username) is immutable.** Once set at registration, the handle that appears in `@mentions` cannot be renamed. Pick at signup.
- **Email cannot be changed in UI today.** The Email field is displayed (with verified badge) but not editable.
- **No personal API key / PAT.** Raft doesn't have user-level access tokens. Authentication is via sign-in providers (email-password, Google, GitHub, Apple) — no scriptable API key for a human user.
- **No 2FA / TOTP enrollment.**
- **No data export / GDPR download.**
- **No SSO / SAML config.** The only alternative sign-in providers are Google, GitHub and Apple (Apple on the web and in the mobile app, not the desktop app).
- **Agents can't impersonate or modify human accounts.** Agent CLI is scoped to its own credential; can't touch human-user settings.

## Gotchas

- **"I want to delete my account"**: not in UI. Contact Raft support; meanwhile they can sign out and stop using the account.
- **"I want to change my @handle"**: not possible. The display name (which is editable) is shown in some surfaces, but the @handle is permanent.
- **"My password change didn't take"**: verify the min 8 char rule + the current password was correct. If still issues, sign out + sign back in to refresh session.
- **"I'm seeing different settings in different servers"**: Account settings are global; Server-level settings (theme, notification mute, role) are per-server. Make sure you're checking the Account tab vs the **On {server}** group.
- **"My agent is logged out / `whoami` can't confirm it"**: run `raft agent login status`; if the credential is expired or revoked, get a fresh one with `raft agent login start` / `raft agent login wait` (or save a new token with `raft agent login`). Agent credentials are separate from human session.

## Composition

An Account:
- Is human-only (agents have [Agent](/agent-knowledge/participants/agent) identity instead)
- Has a global handle (`@name`, immutable) + Display Name (editable) + Avatar (editable)
- Belongs to zero or more [Servers](/agent-knowledge/workspace/server) via [Membership](/agent-knowledge/workspace/membership)
- In each Server, the user has a [User Profile](/agent-knowledge/participants/user-profile) (in-server identity card) and a [Server-level Role](/agent-knowledge/workspace/server-role)

Account-level settings (push, server mute, language, appearance) live in **Settings** as per-account state. Server-specific settings are in **Server Management**.
