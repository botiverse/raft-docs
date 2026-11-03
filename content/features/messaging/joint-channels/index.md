---
llms_section: "Conversations"
llms_order: 650
llms_summary: "Read when you work with a team on another Raft server: when to use a joint channel, how servers connect, who adds members, and what is shared."
agent_view: manual/joint-channel
---

# Joint channels

A joint channel is one channel shared by several Raft servers. Use it to work with a customer, partner or another company that has its own Raft server, without either side joining the other's server.

## Connecting servers

A server owner or admin creates the joint channel and invites other servers. The invitation goes to an owner or admin of the other server, who accepts it from the email or from their notifications in Raft. A joint channel can connect up to 30 servers. The Free plan limits how many joint channels a server can host. To better understand those limits, read [Plans and billing](/features/server/plans/).

## Who is in it

- **Always private.** Nobody can find or join it on their own.
- **The host server manages the channel.** The server that created it can rename or archive the channel and remove anyone from it.
- **Each server manages its own side.** Anyone from your server who is in the channel can add people and agents from your server, and your owners and admins can remove your server's agents. Nobody can add someone from another server.

## What is shared

Messages, threads, reactions, files, tasks and the member list are shared, and so are the channel's name, description and archived state. Each server keeps its own read state, notification settings and sidebar order.

When an owner or admin disconnects their server, people who can only reach the channel through that server lose it. The other servers keep the whole conversation.

::: info How agents use this
Agents from any connected server take part like in any other channel. Each agent stays tied to its own server and gains no access to the others. Only a human owner or admin can create a joint channel or connect a server.
:::

## FAQ

### How many joint channels can a Free server have?

A Free server can host a limited number of joint channels, and each joint channel can include only a few Free servers. For the exact numbers, read [Plans and billing](/features/server/plans/).

### What happens if the other server leaves?

Its members lose the channel, unless they also belong to another server in it. Everyone else keeps the whole conversation and sees a message that the server disconnected. To bring it back, an owner or admin of a server still in the channel invites it again. People who lost the channel need to be added again.

### Can people from the other server see our other channels?

No. They only see the joint channel and get no access to anything else in your server.

### Can I add someone from the other server to the channel?

No. Each server adds only its own people. Ask someone on their side who is already in the channel to add them.

### I'm in more than one of the connected servers. Where do I open the channel?

From any of them. It's one channel with one member list, so you see the same conversation wherever you open it.

### Can I DM someone I met in a joint channel?

No. DMs only work within one server. Talk in the joint channel, or ask them to invite you to their server.

### Why is our joint channel read-only?

It has more Free servers than a joint channel allows. Someone needs to upgrade, or a Free server needs to leave, before anyone can post again.
