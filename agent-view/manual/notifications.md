---
doc_id: notifications
title: Notifications
description: How attention reaches you outside the app. Three distinct surfaces — browser push subscription, server-level mute, and in-app notification center. Don't conflate them with Inbox.
---

# Notifications

Notifications is how attention reaches a user **outside the app** — push to the browser, server-level mute, in-app notification badge. It's distinct from [Inbox](/agent-knowledge/coordination/inbox), which is the in-app attention aggregation.

> **In one sentence**: Notifications = the way Raft pings you when you're not looking at it; Inbox = what you see when you ARE looking at it.

Three distinct surfaces — agents must not conflate them when answering user questions:

1. **Browser push subscription** — opt-in per-browser web push (DMs, direct mentions, followed thread replies)
2. **Server-level mute** — stop all push from one specific server (per-user setting, server-scoped)
3. **In-app notification center / bell** (top bar) — account and server alerts: App permission updates, joint-channel invites, usage and plan limits, a Computer offline or needing attention, install prompts, replies to your feedback. Distinct from Inbox attention

## When a user asks: "How do I turn on / off / mute notifications?"

→ they want: configure the push experience
→ in the UI: **Settings** → **Notifications** tab → Enable/Disable Push Notifications (in a browser; Raft Desktop shows its own desktop notification settings there); **Settings** → **On {server}** → **Notifications** → Mute this server checkbox
→ via CLI: agents can't configure a user's **push** settings; humans only. ⚠️ Do not read this as "agents cannot mute anything" — per-channel Activity mute (`raft channel mute` / `unmute`) is an agent command. See below.

## What humans do

**Enable push notifications** (per-browser, opt-in)
- Settings → Notifications tab → click **Enable Push Notifications** (in a browser; in Raft Desktop this tab shows desktop notification settings instead)
- Browser prompts for notification permission → grant
- Status badge shows `Enabled` / `Ready to enable` / `Denied` / `Disabled`
- Coverage, as the UI states it: **"New messages in DMs, joined channels, and followed threads"**. Channels and DMs with activity muted (only a DM with an App can be muted) only notify on a personal @mention; followed threads still notify. This is the default for each server; the mobile app's Settings → Notifications can narrow a server to mentions only or none, and **Mute this server** below sets none

**Test push**
- Settings → Notifications → **Send Test Push** (lime button) — fires a test notification so user can verify it works

**Disable push**
- Settings → Notifications → **Disable Push Notifications**

**Mute push from a specific server** (per-account state, server-scoped)
- Settings → **On {server}** group → **Notifications** → **Mute this server** switch (the personal Notifications page links there, showing Muted / On)
- Helper text: *"Stops notifications from [server] on all your devices: web push, desktop, and the mobile app. Other servers are unchanged."* Server mute covers web, desktop and mobile.
- It applies as soon as it is switched (no Save); "Saved" shows under it for a moment, and if the request fails the switch goes back and says so on the same line

**Mobile app**
- Raft has a mobile app with native push: **Settings** → **About** → **Mobile app**, or the `/download` page. Turn notifications on in the app.

**Raft Desktop**
- Raft Desktop shows system notifications for every server you are in, not just the open one: the same DMs, joined channels, @mentions and followed thread replies as push (Activity mute and **Mute this server** apply), plus task updates on threads you follow, tasks assigned to you, an agent that needs you, and reminders you scheduled for an agent.
- It shows nothing while its window is in front and you are using it; notifications resume when you switch away, minimize it, or step away.

**PWA install prompt**
- Settings → Notifications → PWA Install card — install Raft as a Progressive Web App on the device

**Push nudge**
- Users see an in-app banner nudging them to enable push (shown over the composer; dismissible)

## What agents do

**No CLI for notifications.** Agents can't enable, disable, mute, or test push on a user's behalf. Notifications are a per-user (per-browser) setting in the UI.

What agents CAN do:
- Read whether a user has push enabled? — no, not exposed via CLI
- Tell a user how to enable / mute — yes, via the doc + guiding them through Settings

## What it CAN'T do

⚠️ **These were verified absent when written, and this list rots one way:** a feature that ships makes an entry wrong and nothing here turns red. ⇒ Before telling anyone a capability is missing, re-check it — `--help` on the relevant command family is usually enough. See [What Raft Doesn't Have](/agent-knowledge/cross-cutting/what-raft-doesnt-have).

- **No per-channel mute of *push* specifically.** The push settings surface is server-level: you can't keep push for some channels in a server and drop it for others.
  - ⚠️ Do not read this as "there is no per-channel mute at all" — there is. **Per-channel Activity mute exists** (`raft channel mute` / `raft channel unmute`), and it suppresses ordinary Activity delivery from that channel itself while personal @mentions and DMs still pierce; threads you follow keep delivering independently. To stop one thread, `raft thread unfollow` removes its follow record and stops its ordinary delivery. It is a different surface from push settings. Full treatment in [Channel](/agent-knowledge/conversations/channel).
  - **Only a DM with an App can be muted.** A person mutes it from the DM's row menu (sidebar or Activity) or Mute activity in its settings, and a personal @mention still pierces. A DM with a person or an ordinary agent cannot be muted, and agents can't mute DMs (the CLI takes a regular channel). **Storage granularity is not a capability** — answer from the surface a user can actually reach.
  - Which of the two a user means is usually "stop this channel from waking me," and that one is available. Reach for `raft channel mute` before telling anyone the capability is missing.
- **No per-thread mute.** Same.
- **Web push is per browser.** Enable it separately in each browser; the mobile app and Raft Desktop have their own notification settings.
- **No quiet hours / DND scheduling.** No "only ping me between 9am-5pm" — push is per server (all, mentions only, or none), with no time-of-day setting.
- **No notification grouping / channel-priority.** All notifications respect the standard browser notification UX.
- **Agents can't trigger custom notifications.** They can `@mention` someone (which triggers push if user enabled) but can't fire arbitrary push.

## Gotchas

- **"I enabled push but I'm not getting notifications"**: check browser permission (`Denied` shows in status). Re-grant via the browser's notification settings.
- **"Test push works but real mentions don't"**: check the message actually triggered a notification-shape (DM / direct mention / followed thread reply — see coverage line). Channel-root chatter without your mention doesn't push.
- **"I stopped getting browser notifications while Raft Desktop is open"** / **"my phone was quiet while I was at my computer"**: by design. A notification alerts only on the devices the person is actively using (keyboard or mouse input within the last 3 minutes; the mobile app in the foreground), so the same message does not ring everywhere. When they use none of them, every device alerts, except that browser notifications yield to Raft Desktop while it is running. There is no setting for this. The Settings test notification is never skipped.
- **"I muted the server but I'm still getting browser notifications"**: cache or sync lag. Hard refresh + check the mute toggle is still on.
- **"I want per-channel mute"**: this exists — `raft channel mute --target "#channel"` (undo with `raft channel unmute`). It suppresses ordinary Activity delivery from that channel itself; personal @mentions and DMs still reach you, and threads they follow keep delivering independently. For a single thread, point them at `raft thread unfollow`. What is *not* per-channel is the **push** settings surface, which stays server-level. Ask which one they mean before answering "no".
- **"DM mute"**: only for a DM with an App — right-click its row (sidebar or Activity) → Mute, or Mute activity in the DM's settings; Unmute undoes it. A DM with a person or an ordinary agent can't be muted. You can hide one from the sidebar (right-click → Close DM), but that is a display action, not a mute, and messages keep arriving. Say it's missing for those DMs rather than pointing at Close DM as if it were the feature.
- **"Why does the in-app bell show different items than my inbox?"**: the bell shows account and server alerts (App permission updates, joint-channel invites, usage and plan limits, Computers offline or needing attention, install prompts); Inbox shows message-attention. Different signal types.

## Composition

Notifications:
- Span three distinct surfaces (push subscription · server mute · in-app notification bell)
- Are configured per-[Account](/agent-knowledge/participants/account) (settings live in the user's Settings panel)
- Server mute is per-account but server-scoped (each server has its own mute state per user)
- Push delivery is gated by browser permission AND server-mute state AND user enable; only the devices the user is actively using alert (all of them when none is in use; browsers yield to a running Raft Desktop)
- Distinct from [Inbox](/agent-knowledge/coordination/inbox) (in-app attention aggregation)
