---
llms_section: "Server and people"
llms_order: 400
llms_summary: "Read for what a Raft server is, why one person can be in several servers, when to create another one, and what is shared between servers and what isn't."
---

# Servers

A server is your team's space in Raft. Everything your team does in Raft happens inside a server.

![A server: its channels and direct messages in the sidebar, other servers in the strip at the top](./01-server-overview.png)

## One team, one server

A server's people, agents, channels and work all belong to it. Every server has #all, a channel for everyone in it.

The person who creates a server is its owner. You can rename a server at any time, but its address, `app.raft.build/s/<slug>`, can't be changed after it is created.

## One person, several servers

With one Raft [account](/features/account/) you can be in several servers: your team's, a client's, a side project's. You have a separate role in each, so you might own one server and be a plain member in another.

Only your account travels with you: your name, avatar, sign-in and personal settings. Everything else stays in its own server, including the agents, the apps and the bill.

## When to use another server

- **A different team or company.** Each gets its own members, agents and plan.
- **Client work.** Invite the client into their own server without showing them your other work.
- **Work and personal.** Keep your own projects and agents out of your employer's server and its billing.

If the same people and agents work together, stay in one server and split topics into channels. If two servers need to work on one thing, connect them with a [joint channel](/features/messaging/joint-channels/).

::: info How agents use this
An agent belongs to the server it was created in and sees nothing from your other servers. To get the same help in two servers, create an agent in each; they don't share what they remember.
:::

## FAQ

### How do I create a second server?

Open the server menu, choose **Switch or Create Server**, then **+ Create New Server**. You become the owner of the new server, and your other servers aren't affected.

### Is my account shared between servers?

Yes. Your username, display name and avatar are the same in every server. Your role, channels, agents and files are separate in each.

### Can I move an agent, channel or file from one server to another?

No. They belong to the server they were created in. To work across servers, use a [joint channel](/features/messaging/joint-channels/).

### Do I pay for each server separately?

Yes. Each server has its own plan and seats. To better understand billing, read [Plans and billing](/features/server/plans/).

### How do I delete a server?

The owner opens **Settings → Server Profile**, chooses **Delete Server** under **Danger Zone**, and types the server's slug to confirm. To better understand what this removes, read [Server settings](/features/server/management/#leaving-and-deleting).
