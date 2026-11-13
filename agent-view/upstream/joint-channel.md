---
doc_id: joint-channel
title: Joint Channel
description: A shared channel that connects up to 30 servers. Messages, threads, reactions, and attachments sync across the connection; membership is one list for the whole channel, the host server manages it, and each side keeps its own read state. You can @mention members from any connected server; the mention lands on their own server. No cross-server DMs.
---

# Joint Channel

A joint channel is a [channel](/agent-knowledge/conversations/channel) shared between **up to 30 servers**. Messages, threads, reactions, attachments and the member list are shared across the connection. Each side sees the channel inside its own server, with its own read state and notification settings.

> **In one sentence**: A joint channel is a shared room that several separate servers can stand in, up to 30. Each side brings in its own people, but there is one member list and everyone sees the same messages.

Joint channels are **always private**. They don't appear in the sidebar or channel list for non-members, and there is no way to discover or self-join one — a member of your server who is already in the channel must add you. That can be any member, not only an owner or admin; a server owner or admin who is not in the channel cannot add anyone.

The server that created the channel is its **host**. Membership is one list for the whole channel, and the host manages it: who can remove people, rename or archive the channel, and appoint channel managers.

It is **not** a server merge. Members from the other connected servers appear in the channel, but they don't inherit your admin/owner rights and can't reach your other channels, DMs, or resources. Agents stay scoped to their origin server.

## When a user asks: "How do I share a channel with another server / collaborate across servers?"

→ they want: one channel several servers can participate in, without merging the servers
→ in the UI: a server owner/admin creates the joint channel and invites one or more other servers' owners/admins, who accept; then each side adds its own members
→ note for the asker: it's admin-to-admin to connect each server, and each side only adds its own people

## What humans do

**Create / connect** (the two-step handshake)
1. **Server connection** — a server owner/admin (gated by `federateChannels`) creates a joint channel and invites one or more other servers, up to 30 servers total. Each invite must target an owner/admin of that server, and only that owner/admin can **accept**. Every cross-server link is admin↔admin (invite + accept). The invitee accepts from the email link, or in the web app's notification center while the invited server is open (it doesn't list invites for other servers they administer). There is no Decline yet; Dismiss only hides it, and the invite stays pending. If the inviter also owns or administers the invited server and picks themselves as its invitee, the dialog offers to connect directly: once they confirm, the server is connected with no email. If that direct connection fails, the invite is emailed as usual.
2. **Add members** — after the connection is live, any member of the channel can add **their own server's** people (a server owner/admin must be in the channel to add anyone). You can't add another server's members, and there's no self-join across servers. Guests can't be in a joint channel.

**One membership, every connected server** — a person is a member of the channel itself, not of one server's copy. They can open it and post from every connected server where they are a member. Removing them or their leaving takes them out of the whole channel.

In the web app, the channel's member list has two groups: **Members of** the server you're viewing it from, and **Other servers**. Someone under **Other servers** has their server's mark on the corner of their avatar and the names of their servers after their own name, for example "Dana  Acme, Lumen". For a member of your own server, a tag next to the name shows another connected server that person also belongs to, for example "Ebby is also a member of Acme". The same mark is on their avatar in messages and in the @ list; hovering their avatar on a message shows a card that lists their servers and says External (names in the member list open no card).

**Removing people and managing the channel**
- **Host owners and admins**: remove any person and any server's agents; rename it, change its description, archive or unarchive it; appoint channel managers.
- **Channel managers** (appointed by a host owner or admin, from the host's members): the same, acting from the host server, but they can't appoint others. Leaving the host server ends the appointment.
- **Owners and admins of the other servers**: remove only their own server's agents, not people; they can't rename, describe or archive the channel.
- **Everyone else**: can't remove anyone. Anyone can leave.

**Disconnect** — an owner/admin of a connected server who is in the channel can disconnect their own server. Access through that server ends: someone who is also a member of another connected server stays, and anyone with no other connected server is removed from the channel. Its agents leave. The other servers keep the conversation and see a system message saying the server disconnected. A server (other than the host) with no members left in the channel is disconnected automatically, with its agents. When the last member from the host leaves the channel, is removed from it, or leaves the host server, the channel is archived for every server instead (rolling out; this may not be available on your server yet): its history stays readable, nobody can post, and a system message says why. Agents and Guests don't keep it open. While nobody from the host is in it, it stays in the host server's archived channels, where a host owner or admin can unarchive it even if they aren't in the channel; unarchiving adds them back to it. To come back later, an admin of a server still in the channel invites it again; reconnecting doesn't bring back people who were removed.

**What's shared vs local**
- **Shared across all connected servers** (one canonical store): messages, threads, reactions, file attachments, tasks, the member list, and the channel's name, description and archived state (changed by the host, for every side).
- **Artifacts**: where both servers have Artifacts, an Artifact posted in a joint channel reaches the channel's members on every connected server the way its messages do. They can read, comment, reply, review, follow and @mention people across the channel, but only the Artifact's own server can delete, move or share it.
- **Local to each server** (each side's own projection): read/unread state (per-server read cursors), notification settings, and its sidebar position.

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

- **Managing it**: you can leave a joint channel (`raft channel leave`) and mute it (`raft channel mute`). As a member of the channel you can add **your own server's** people and agents (`raft channel add-member`). The rest follows the human rules above, with your own server role: if your server is the host and you are its admin (or a channel manager there), you can remove any person or agent (`raft channel remove-member`), rename it or change its description (`raft channel update`), and archive or unarchive it (`raft channel archive` / `unarchive`), each for every server. As an admin of another connected server you can remove only your own server's agents. Appointing channel managers and disconnecting a server are done by humans in the web app. Visibility can't change.
- **Not yet for agents**: creating a joint channel, inviting another server, accepting an invite, and converting a channel to joint are still done by human server admins.
- Your read state is local to your side, so "unread" reflects your own server's cursor.
- **Who is from where**: in `raft channel members`, a person who takes part through another server is tagged `[servers: …]` with each server they come through ("this server" is yours). People without the tag, or tagged with "this server", are your own server's members, the only ones you can add. For someone not on this server, the role shown is their role on their own server and gives them no rights here.
