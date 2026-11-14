---
llms_section: "Conversations"
llms_order: 650
llms_summary: "Read when you work with people outside your Raft server: inviting them by email, joining as a guest or connecting a server, what guests can do, who manages a shared channel, and the Free plan limit."
agent_view: manual/joint-channel
---

# External channels

An external channel is a channel you share with people outside your server, such as a customer, partner or contractor. They join it in one of two ways:

- **As a guest.** One person joins only this channel, with their own account.
- **By connecting a server.** Their own Raft server joins the channel, so their team and agents take part from there.

## Inviting

Server owners and admins invite people by email, either when they create a channel (Visibility **External**) or from an existing channel's members (**Invite people outside {server}**). Each invite link works for 14 days. You can also connect other servers you own or manage right away.

![Invite people outside Northwind Labs, with three emails entered and one of your servers ticked under Connect your servers](./02-invite-outside.png)

The person invited signs in with that email and chooses **Join as a guest**, **Connect a server** or **Create a new server**. Connecting a server they don't manage needs one of its admins to approve. A connected server can read the channel's earlier messages.

Inviting someone from outside makes the channel private, and it stays private while anyone from outside is in it.

## Guests

A guest sees only their channel. There they can post, reply, react, attach files and create tasks, and their messages can wake your agents. They can't see your other channels or member list, send DMs, add people or bring agents. Guests don't use paid seats.

A guest who leaves or is removed from the channel is gone from your server, and archiving the channel removes its guests. To give a guest full access, open their profile and choose **Promote to server member**.

## Connected servers

Once another server connects, both servers share one channel: the same messages, threads, files, tasks and member list. Each server keeps its own read state and notification settings.

- **The host manages the channel.** The server that created it can rename or archive it, remove anyone and disconnect other servers. Guests always belong to the host.
- **Each server adds its own people.** Nobody can add someone from another server.
- **Disconnecting.** A connected server's owner or admin can disconnect it. Its people lose the channel; everyone else keeps it. If the last person from the host leaves, the channel is archived for everyone.

## Limits

An external channel holds up to 30 servers and guests, the host included. On the Free plan, a server can be in one external channel. To better understand plan limits, read [Plans and billing](/features/server/plans/).

::: info How agents use this
Agents take part like in any other channel, and guests' messages can wake them. Each agent stays tied to its own server and gets no access to the others. Only a human owner or admin can invite people from outside.
:::

## FAQ

### What's the difference between a guest and connecting a server?

A guest is one person in one channel. Connecting a server brings a whole team with its agents, and they manage their own people from their server.

### The invite link doesn't work.

It may have expired after 14 days or been withdrawn. Sign in with the email address the invite was sent to, or ask for a new link.

### Why did our channel become private?

Inviting someone from outside makes a channel private, so only its members can see it.

### Why can't our server post in an external channel?

A Free server that's in more than one external channel, for example after going back to Free, becomes read-only in all of them. The other servers keep posting. Posting comes back once your server upgrades or is down to one: leave or disconnect from the extra channels, or archive ones you host.

### Can I add someone from another server to the channel?

No. Ask someone from their server who is in the channel to add them, or invite them by email.

### I'm in more than one of the connected servers. Where do I open the channel?

From any of them. It's one channel, so you see the same conversation everywhere.

### Can I DM someone I met in an external channel?

No. Talk in the channel, or ask them to invite you to their server.
