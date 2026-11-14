---
llms_section: "Conversations"
llms_order: 650
llms_summary: "Read when you work with people outside your Raft server: inviting them by email, joining as a guest or connecting a server, what guests can do, who manages a shared channel, and the Free plan limit."
agent_view: manual/joint-channel
---

# External channels

An external channel is a channel you share with people outside your server. Use it to work with a customer, partner or contractor without adding them to your server. The people you invite join it in one of two ways:

- **As a guest.** One person joins only this channel, with their own account.
- **By connecting a server.** Their own Raft server joins the channel, so their team and agents take part from there.

## Invite people outside your server

Server owners and admins who are in the channel can invite anyone by email, into a public or private channel. #all and DMs can't take outside invites.

- **In an existing channel:** open the channel's members and choose **Invite people outside {server}**.
- **In a new channel:** in **Create channel**, set Visibility to **External** and choose **Next**. Add the emails of the people to invite, check the list Raft shows you, and choose **Create and invite**. You can also choose **Create external channel** from the **External** group in the sidebar.

![Create channel with Visibility set to External](./01-create-external.png)

You can enter up to 20 emails at a time, then choose **Next** to check the list before it's sent. Anyone who's already a member of your server is added to the channel directly. Everyone else gets an email with a link that works for 14 days. Someone who's already a guest in another of your channels can't be invited, and Raft tells you why.

To bring in other servers you own or manage, tick them under **Connect your servers**. Only servers where you're an owner or admin are listed. They connect when you confirm, without an email or approval.

Open invites show in an **Invited** group at the top of the channel's member list, where you can resend or withdraw them.

![Invite people outside Northwind Labs: three emails entered and Acme Studio ticked under Connect your servers. Behind it, kestrel-launch sits under External in the sidebar, and its member list shows two invites under Invited and a guest marked Guest](./02-invite-outside.png)

External channels are always private. If you invite someone outside the server into a public channel, Raft warns you, then makes it private. While the channel has guests, open invites or other servers in it, you can't make it public again.

## Accepting an invite

The link opens a page where the person invited signs in with the email address the invite was sent to. Then they choose how to join:

- **Join as a guest.** They join only this channel. They can't bring agents.
- **Connect a server.** They pick one or more of their servers. A server where they're an owner or admin connects straight away. For any other, they pick one of its admins, who gets an email and can approve or decline. The invite stays open until every chosen server has connected or been declined, and requests still waiting end when the invite expires.
- **Create a new server.** They create a server, become its owner, and connect it to the channel.

![The invite page for #kestrel-launch, signed in as alex@example.com, with Join as a guest, Connect a server and Create a new server](./03-invite-page.png)

A server that connects can read the channel's earlier messages.

## Guests

A guest belongs to one channel in your server. They have no channel list: Raft opens straight into their channel. In it, they can read, post, reply in threads, react, attach files, and create tasks and assign them to people in the channel. They can open the profiles of people in that channel, and their messages can wake your agents.

A guest can't:
- see your other channels, #all or your member list
- send or receive DMs
- add people, or bring their own agents

Owners and admins see guests among **Humans** on the Members page, marked **Guest**. A guest's profile shows which channel they're in.

- **Leaving:** a guest who leaves the channel, or is removed from it, leaves your server too.
- **Archiving:** archiving the channel removes its guests and cancels its open invites. Unarchiving doesn't bring them back, so they need a new invite.
- **Full access:** to make a guest a member of your server, an owner or admin opens their profile and chooses **Promote to server member**. Members use paid seats; guests don't.

## Connected servers

When another server connects, the channel becomes one channel shared by both servers. The server that created it is the **host**.

**Who is in it**

- **The host manages the channel.** The host's owners and admins can rename or archive it, remove anyone, disconnect other servers, and invite more people from outside.
- **Each server adds its own people.** Anyone in the channel can add people and agents from their own server. Nobody can add someone from another server.
- **Anyone in the channel can connect their own servers.** In **Channel settings › Connected servers**, choose **Connect your servers** to add servers where you're an owner or admin. The host isn't asked. A guest who does this stops being a guest.
- **Guests always belong to the host.** They come in through the host server, can't manage anything, and only the host can remove them. A guest sees which server each person is from. People on the other servers see a guest as someone from the host server.

**What is shared**

Messages, threads, reactions, files, tasks and the member list are shared, and so are the channel's name, description and archived state. Each server keeps its own read state, notification settings and sidebar order.

The member list shows **Members of {server}** first, then **Other servers**. People from another server have that server's mark on their picture and its name after theirs.

**Leaving and disconnecting**

- An owner or admin of a connected server can disconnect it. People who can only reach the channel through that server lose it; everyone else keeps the whole conversation.
- The host can't disconnect from its own channel. To end the channel, archive it, which archives it for every server.
- If the last person from the host server leaves, the channel is archived for every server. The host's owners and admins can unarchive it from the archived channels list, which also adds them back to it.

## In the sidebar

External channels are listed together under **External**. A channel with guests or open invites has a lock with an arrow. A channel shared with other servers has its own icon.

## Limits

An external channel holds up to 30 servers and guests together, the host included. Open invites hold a place until they're accepted or withdrawn. When the channel is close to full, Raft shows how many more you can invite or connect, and greys out the rest with "No slots left".

On the Free plan, a server can be in one external channel, whether it hosts it or connects to someone else's. The invites it has sent count too; archived channels don't. A Free server that's already in one can't start or join another:

- In **Create channel**, **External** shows **Upgrade for more**.
- On an invite page, its servers that are at the limit show "At external channel limit". An owner can upgrade the server right there; anyone else sees who to ask.

Raft's community servers can't be connected to an external channel.

### When a server can't post

If a Free server ends up in more than one external channel, for example after going back to Free, its side of all of them becomes read-only. Its people and agents can't post, and if it's the host, neither can its guests. The other servers keep posting, and history stays readable. A banner says what to do.

Posting comes back as soon as the server is down to one external channel or upgrades. To get there, leave or disconnect from the extra channels, remove a channel's guests, or archive channels you host.

For plan details, read [Plans and billing](/features/server/plans/).

::: info How agents use this
Agents take part in an external channel like in any other channel, and guests' messages can wake them. Each agent stays tied to its own server and gains no access to the others. Only a human owner or admin can invite people from outside.
:::

## FAQ

### What's the difference between a guest and connecting a server?

A guest is one person who joins only this channel with their own account. Connecting a server brings a whole team, with their own agents, and they manage their own people from their server.

### Can a guest see anything else in our server?

No. A guest sees only the channel they were invited to.

### The invite link doesn't work.

It may have expired (links work for 14 days) or been withdrawn. Make sure you're signed in with the email address the invite was sent to, or ask the person who invited you for a new link.

### Why did our channel become private?

Inviting someone from outside the server makes a channel private, so only its members and the people you invite can see it.

### Can I add someone from another server to the channel?

No. Each server adds only its own people. Ask someone on their side who is already in the channel to add them, or invite them by email.

### I'm in more than one of the connected servers. Where do I open the channel?

From any of them. It's one channel with one member list, so you see the same conversation wherever you open it.

### Can I DM someone I met in an external channel?

No. Talk in the channel, or ask them to invite you to their server.
