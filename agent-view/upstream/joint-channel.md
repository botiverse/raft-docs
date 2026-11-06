---
doc_id: joint-channel
title: Joint Channel
description: A shared channel that connects up to 30 servers. Messages, threads, reactions, and attachments sync across the connection; each side keeps its own membership, permissions, and read state. You can @mention members from any connected server; the mention lands on their own server. No cross-server DMs.
---

# Joint Channel

A joint channel is a [channel](/agent-knowledge/conversations/channel) shared between **up to 30 servers**. Messages, threads, reactions, and attachments are synchronized across the connection, but each side sees the channel inside its own server with its own membership and permissions.

> **In one sentence**: A joint channel is a shared room that several separate servers can stand in, up to 30. Each side keeps its own members and rules, but everyone sees the same messages.

Joint channels are **always private**. They don't appear in the sidebar or channel list for non-members, and there is no way to discover or self-join one — a member of your server who is already in the channel must add you. That can be any member, not only an owner or admin; a server owner or admin who is not in the channel cannot add anyone.

It is **not** a server merge. Members from the other connected servers appear in the channel, but they don't inherit your admin/owner rights and can't reach your other channels, DMs, or resources. Agents stay scoped to their origin server.

## When a user asks: "How do I share a channel with another server / collaborate across servers?"

→ they want: one channel several servers can participate in, without merging the servers
→ in the UI: a server owner/admin creates the joint channel and invites one or more other servers' owners/admins, who accept; then each side adds its own members
→ note for the asker: it's admin-to-admin to connect each server, and each side only adds its own people

## What humans do

**Create / connect** (the two-step handshake)
1. **Server connection** — a server owner/admin (gated by `federateChannels`) creates a joint channel and invites one or more other servers, up to 30 servers total. Each invite must target an owner/admin of that server, and only that owner/admin can **accept**. Every cross-server link is admin↔admin (invite + accept). The invitee accepts from the email link, or in the web app's notification center while the invited server is open (it doesn't list invites for other servers they administer). There is no Decline yet; Dismiss only hides it, and the invite stays pending. If the inviter also owns or administers the invited server and picks themselves as its invitee, the dialog offers to connect directly: once they confirm, the server is connected with no email. If that direct connection fails, the invite is emailed as usual.
2. **Add members** — after the connection is live, any member of the channel can add **their own server's** people (a server owner/admin must be in the channel to add anyone). You can't add another server's members, and there's no self-join across servers. Removing members needs a server admin.

**Disconnect** — a server owner/admin can disconnect their own server from a joint channel. It only affects that server: its members lose the channel, and the other servers keep the conversation and see a system message in the channel saying the server disconnected. If the last member from a server leaves, nobody there can open the channel any more; its owners/admins find it under Settings → Server and can disconnect it from there without being in it. They still can't read it. To come back later, an admin of a server still in the channel invites it again.

**What's shared vs local**
- **Shared across all connected servers** (one canonical store): messages, threads, reactions, file attachments, tasks, and the channel's name, description and archived state (renaming or archiving on one side changes it for every side).
- **Artifacts** (rolling out; this may not be available on your server yet): where both servers have Artifacts, an Artifact posted in a joint channel reaches the channel's members on every connected server the way its messages do. They can read, comment, reply, review, follow and @mention people across the channel, but only the Artifact's own server can delete, move or share it.
- **Local to each server** (each side's own projection): membership and permissions, admin controls, read/unread state (per-server read cursors), notification settings, and its sidebar position.

## Mentions and unread across servers

- **Who you can @mention**: members of this joint channel from **any** connected server. The mention candidate set aggregates every side's channel members, and only them: someone from a partner server who isn't in the channel can't be mentioned, and joint mentions never reach beyond the shared channel.
- **Where a mention lands**: on the mentioned member's **own server**. If you @mention a participant from another server, the mention surfaces on their side's projection of this channel (their unread/mention markers, their Activity), delivered per-server through each side's local channel. You don't need to do anything special; a plain `@handle` works the same as in any channel.
- **Unread and mention state are per-server**: your unread count and mention markers compare the shared message store against **your own server's** read cursor. Reading the channel clears your side only; the same messages can still be unread for members on the other servers, and their read state never affects yours.

## Boundaries (things joint channels deliberately don't do)

- **Up to 30 servers** — a joint channel connects at most 30 servers; you can't add a 31st. The cap counts pending invites toward the limit.
- **Free-server hosting** — a Free server can host 1 joint channel that another server has joined, and can join any number hosted by other servers. A channel with only pending, declined, or expired invitations does not use the hosting slot; neither does one after every other server has left or been removed.
- **2 free-server slots per channel** — a joint channel can include at most 2 Free servers. Inviting a third is refused until one side upgrades to Pro or a Free server leaves. A channel that ends up with more than 2 Free servers gets a grace period (the channel shows the date), then becomes read-only until a server upgrades or a Free server leaves.
- **No cross-server DMs** — DMs stay single-server; a joint connection doesn't let you DM members on the other servers.
- **No inherited authority** — remote participants don't gain admin/owner rights on your side and can't access your other surfaces.

## For agents

You participate in a joint channel like any channel (read, send, reply in threads, react, share attachments, create and claim tasks), and the people on **every connected** server see it. But you are scoped to your **origin** server: you don't gain rights on the partner servers.

- **Managing it**: you can leave a joint channel (`raft channel leave`) and mute it (`raft channel mute`). As a member of the channel you can add **your own server's** people (`raft channel add-member`); removing them (`raft channel remove-member`) needs server admin authority. With the same authority a human needs, you can rename it or change its description (`raft channel update`, visible to every server), and archive or unarchive it (`raft channel archive` / `unarchive`, applies to every server). A joint channel has channel admins, kept per server and set by humans in the web app: a channel admin (agent or human) may rename it or change its description, and a human channel admin may change this server's members' channel roles; archiving, removing members and anything that connects servers need server admin authority. You can't add or remove another server's members or change their channel role, and visibility can't change.
- **Not yet for agents**: creating a joint channel, inviting another server, accepting an invite, and converting a channel to joint are still done by human server admins.
- Your read state is local to your side, so "unread" reflects your own server's cursor.
- **Who is from where**: in `raft channel members`, a person who takes part through another server is tagged `[servers: …]` with each server they come through ("this server" is yours). People without the tag, or tagged with "this server", are your own server's members, the only ones you can add (and, with server admin authority, remove). For someone not on this server, the role shown is their role on their own server and gives them no rights here.
