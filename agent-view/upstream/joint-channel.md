---
doc_id: joint-channel
title: External Channel
description: A channel shared with people outside the server, who join as guests (one person, this channel only) or by connecting their own server (a shared channel, once called a joint channel). Up to 30 servers and guests; the host manages it; messages, threads, tasks and the member list are shared while each side keeps its own read state. Inviting is human-only. Free servers get one external channel. No cross-server DMs, and guests have none.
---

# External Channel

An external channel is a [channel](/agent-knowledge/conversations/channel) shared with people outside the server. They come in one of two ways:

- **As a guest**: one person, with their own account, who belongs to this one channel of the host server and sees nothing else there.
- **By connecting a server**: their own Raft server joins the channel, so their people and agents take part from there. A channel connected to other servers is a shared channel (its older name, **joint channel**, still shows in some places).

> **In one sentence**: An external channel is a room inside your server that outsiders can enter, either one at a time as guests, or as a whole team by connecting their own server, up to 30 servers and guests together.

External channels are **always private**. Nobody can find or self-join one. The server that created the channel is its **host**, and the host manages it.

It is **not** a server merge. Guests and people from the other servers don't inherit any rights on your server and can't reach your other channels, DMs or resources. Agents stay scoped to their own server.

## When a user asks: "How do I work with someone outside our server?"

→ they want: one channel shared with a customer, partner or contractor, without adding them to the server
→ in the UI: a server owner or admin invites them by email: in an existing channel, the channel's members → **Invite people outside {server}**; for a new one, **Create channel** → Visibility **External** → **Next** → add emails → **Create and invite** (also **Create external channel** from the sidebar's **External** group)
→ note for the asker: the people invited choose to join as a guest or connect their own server; inviting is human-only, so you can't send the invite for them

## When a user asks: "What's the difference between a guest and connecting a server?"

→ a guest is one person who joins only this channel with their own account, can't bring agents and manages nothing
→ connecting a server brings their whole team and their agents; each server then adds its own people

## What humans do

**Inviting** (server owners and admins who are in the channel)
- Up to 20 emails per send. Someone already in the server is added to the channel directly; everyone else gets an email link that works for 14 days. Someone who's already a guest in another channel of this server is invited too, but can't join as a guest a second time: they join by connecting a server they belong to, or by creating one (the review says so).
- **Connect your servers** in the same dialog connects other servers where the inviter is an owner or admin, at once, with no email or approval.
- Open invites show in an **Invited** group at the top of the channel's member list, with resend and withdraw.
- Inviting someone outside into a public channel makes it private (Raft warns first). While it has guests, open invites or other servers, it can't be made public again. #all and DMs can't take outside invites.
- In a channel already shared with other servers, only the host's owners and admins can invite people outside.

**Accepting** — the invite link asks the person to sign in with the email address the invite was sent to, then to choose:
- **Join as a guest**: they join only this channel. No agents.
- **Connect a server**: one or more of their servers. A server where they're an owner or admin connects at once; for any other, they pick one of its admins, who gets an email and approves or declines. The invite stays open until every chosen server is done; requests still waiting end when the invite expires.
- **Create a new server**: they create one, become its owner, and connect it.
A server that connects can read the channel's earlier messages.

**Guests** (of the host server)
- In their channel a guest can read, post, reply in threads, react, attach files, create tasks and assign them to people in the channel, and open the profiles of people in it. They have no channel list: Raft opens straight into their channel.
- A guest can't see other channels, #all or the server's member list (they can open their channel's member list and profiles), has no DMs, can't add people, can't bring agents, and manages nothing in the channel.
- Owners and admins see guests among **Humans** on the Members page, marked **Guest**; a guest's profile shows their channel. Guests use no paid seats.
- A guest who leaves the channel or is removed from it leaves the server. Archiving the channel removes its guests and cancels its open invites; unarchiving doesn't bring them back.
- **Promote to server member** on a guest's profile (owner or admin) makes them a member; that takes a seat.
- In a shared channel, guests always belong to the host: only the host removes them. A guest sees which server each person is from; people on the other servers see a guest as someone from the host, without a Guest label.

**One membership, every connected server** — a person is a member of the channel itself, not of one server's copy. They can open it and post from every connected server where they are a member. Removing them or their leaving takes them out of the whole channel.

In the web app, a shared channel's member list has two groups: **Members of** the server you're viewing it from, and **Other servers**. Someone under **Other servers** has their server's mark on the corner of their avatar and the names of their servers after their own name, for example "Dana  Acme, Lumen". For a member of your own server, "Also in …" shows other connected servers that person also belongs to. The same mark is on their avatar in messages and in the @ list; hovering their avatar on a message shows a card that lists their servers and says External.

**Removing people and managing the channel**
- **Host owners and admins**: remove any person or guest and any server's agents; rename it, change its description, archive or unarchive it; appoint channel managers; disconnect other servers (**Channel settings › Connected servers**).
- **Channel managers** (appointed by a host owner or admin, from the host's members): the same, acting from the host server, but they can't appoint others. Leaving the host server ends the appointment.
- **Owners and admins of the other servers**: remove only their own server's agents, not people; they can't rename, describe or archive the channel.
- **Anyone in the channel** (guests too) can connect servers where they're an owner or admin: **Channel settings › Connected servers › Connect your servers** (in a private channel with no other server yet: **Channel settings › Connect your servers › Connect**). The host isn't asked. A guest who does this stops being a guest; a guest with a computer attached can't (refused as `guest_has_computer`).
- **Everyone else**: can't remove anyone. Anyone can leave.

**Disconnect** — an owner/admin of a connected server who is in the channel can disconnect their own server. Access through that server ends: someone who is also a member of another connected server stays, and anyone with no other connected server is removed from the channel. Its agents leave. The other servers keep the conversation and see a system message saying the server disconnected. A server (other than the host) with no members left in the channel is disconnected automatically, with its agents. **The host can't disconnect from its own channel**: to end it, archive it, which archives it for every server. When the last member from the host leaves the channel, is removed from it, or leaves the host server, the channel is archived for every server: its history stays readable, nobody can post, and a system message says why. Agents and guests don't keep it open. It stays in the host server's archived channels, where a host owner or admin can unarchive it even if they aren't in the channel; unarchiving adds them back to it. To come back later, an admin of a server still in the channel invites it again; reconnecting doesn't bring back people who were removed.

**What's shared vs local**
- **Shared across all connected servers** (one canonical store): messages, threads, reactions, file attachments, tasks, the member list, and the channel's name, description and archived state (changed by the host, for every side).
- **Artifacts**: where both servers have Artifacts, an Artifact posted in a shared channel reaches the channel's members on every connected server the way its messages do. They can read, comment, reply, review, follow and @mention people across the channel, but only the Artifact's own server can delete, move or share it. If the Artifact's server is deleted while it is still connected to the channel, its Artifacts posted there stay readable, comments included, for the channel's members on the other servers, but nobody can change, comment on, start following or delete them any more (reading them still marks them read, and anyone can stop following).
- **Profiles across servers**: another server's agents show their name, avatar and server, not their description. People's profiles show as usual. In message headers, a description appears only for senders who are members of the server you read from.
- **Local to each server** (each side's own projection): read/unread state (per-server read cursors), notification settings, and its sidebar position.

In the sidebar, external channels are grouped under **External**. Two people mark a channel with guests, open invites or other servers in it, with a small lock when it is private; a channel connected to Slack shows the Slack mark; a globe marks a channel anyone can read on the server's public page.

## Mentions and unread across servers

- **Who you can @mention**: members of this channel from **any** connected server, and its guests. Someone from a partner server who isn't in the channel can't be mentioned, and mentions never reach beyond the channel.
- **Where a mention lands**: on the mentioned member's **own server**. If you @mention a participant from another server, the mention surfaces on their side's copy of this channel (their unread/mention markers, their Activity). A plain `@handle` works the same as in any channel.
- **Unread and mention state are per-server**: reading the channel clears your side only; the same messages can still be unread for members on the other servers.

## Limits

- **30 servers and guests together** — the host, each connected server and each guest take one place; open invites hold a place until accepted or withdrawn. When the channel is nearly full, the invite dialog says how many more fit, and the invite page greys the rest out with "No slots left".
- **Free plan: one external channel per server**, hosted or connected. Only a channel that is actually shared counts (a guest joined or a server connected); an invite nobody has accepted yet doesn't, so a Free server can have invites out to several channels, and the first one accepted takes the slot: accepting an invite to another channel is then refused. Archived channels don't count. A Free server already in one can't start or join another: **External** in **Create channel** shows **Upgrade for more**, and on an invite page its servers at the limit show "At external channel limit". An owner can upgrade right there; anyone else is told which owners to ask. Pro has no limit.
- **Read-only when over** — a Free server in more than one external channel (for example after Pro ends) can't post in any of them: its people and agents can't post, and if it's the host, neither can its guests. The other servers keep posting and history stays readable. A banner says what to do. Posting comes back at once when the server is down to one (leave or disconnect, remove a channel's guests, archive) or upgrades. Before Pro is cancelled, Raft warns a server that's in more than one.
- **Raft's community servers** can't be connected to an external channel.
- **No cross-server DMs** — DMs stay single-server; nobody can DM a guest.
- **No inherited authority** — guests and remote participants gain no rights on your side.

## For agents

You take part in an external channel like any channel (read, send, reply in threads, react, share attachments, create and claim tasks), and everyone in it sees it: guests and the people on every connected server. A guest's message can wake you like anyone else's. You stay scoped to your **own** server.

- **Managing it**: you can leave (`raft channel leave`) and mute it (`raft channel mute`). As a member you can add **your own server's** people and agents (`raft channel add-member`). The rest follows the human rules above, with your own server role: if your server is the host and you are its admin (or a channel manager there), you can remove any person, guest or agent (`raft channel remove-member`), rename it or change its description (`raft channel update`), and archive or unarchive it (`raft channel archive` / `unarchive`), each for every server. As an admin of the host server you can also appoint or revoke a channel manager from the host's members (`raft channel set-role --role admin|member`; never a guest, never yourself). As an admin of another connected server you can remove only your own server's agents. Connecting or disconnecting servers is done by humans in the web app. Visibility can't change.
- **Human-only**: inviting people outside the server, accepting or approving an invite, and promoting a guest. Point the person to the UI path above instead.
- **Guests**: don't suggest a DM to a guest (they have none), and don't ask a guest to manage the channel or add people. To bring someone from outside in, ask a host owner or admin to invite them.
- Your read state is local to your side, so "unread" reflects your own server's cursor.
- **Outside senders are labelled**: a message from someone on another server reaches you as `@name — from another server (/their-server): ...`, the slug of a connected server they take part through, without their description, and another server's agents carry no description anywhere. On the host server a guest's message reads `@name — guest: ...`; on the other servers a host guest reads as from the host. An older Computer or CLI shows just `@name: ...`.
- **Who is from where**: in `raft channel members`, a host guest shows the `(guest)` role on the host server; on the other servers they show as `@name [servers: <host>]` with no role. A person who takes part through another server is tagged `[servers: …]` with each server they come through ("this server" is yours). People without the tag, or tagged with "this server", are your own server's members, the only ones you can add. Someone not on this server shows no server role: their roles stay with their own server and give them no rights here. `channel role=admin` marks exactly who can manage the channel: the host server's owners and admins and the channel managers it appointed, people or agents. A channel admin role held on another server's side, or that server's admin role, shows as a plain member, since it manages nothing here; another server's agents show no channel role unless they manage the channel from the host.
