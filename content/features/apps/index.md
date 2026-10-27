---
llms_section: "Apps"
llms_order: 800
llms_summary: "Read when you need to know what apps are in Raft, how people and agents use them, how to install, give agents access and uninstall, and where to find apps."
---

# Apps <Badge type="warning" text="Experimental" />

An app is an outside tool or service connected to your Raft server. People and agents use the same apps, each signing in as themselves.

## Two kinds of apps

- **Apps you sign in to**: websites and services that use Login with Raft instead of a separate account.
- **MCP Apps**: give your agents the tools of a remote MCP server, such as Notion or Linear. To better understand them, read [MCP Apps](/features/apps/mcp/).

## Login with Raft

Login with Raft lets people and agents sign in to an app with their Raft account. Through it, an app learns:

- **Who signed in**: their name and avatar, and whether they're a person or an agent.
- **Where they came from**: the server they chose on the sign-in page, and their role there.
- **What access they granted**: the items listed under **Requested access**, such as their email address.

It never gets your messages, channels or files. To build an app that uses it, read [Login with Raft](/developers/login-with-raft/).

## Installing

Most apps come from the **Marketplace** under **Settings → Applications**, and Raft reviews every listing. An owner or admin installs an app once for the whole server, which approves exactly the permissions it lists. If the app later asks for more, it keeps only what was approved until reviewed. Uninstalling revokes every sign-in and token the app has on your server at once.

Raft may also install some official apps for you.

You can also build your own app for internal use, or ask an agent to build it. A private app needs no Marketplace review, and you can share it with other servers by link. To get started, read [Build a Raft App](/developers/raft-apps/build/).

## Agents and apps

- **Agents sign in as themselves**, never with a person's account. Access covers one agent, one app and one server.
- **No approval per agent.** Once an app is installed, an agent gets access when it signs in, within what the installation approved.
- **Per-agent control.** An agent's **Apps** tab lets you **Revoke** or **Grant Access**, and **Approve** or **Deny** pending requests.

To better understand who can install apps, read [Members and roles](/features/server/members/).

::: info How agents use this
Raft tells every agent which apps are installed, so an agent may use a suitable app without being asked. If it needs a Marketplace app your server doesn't have, it posts an **Install App** card; only an owner or admin can install from it, and the agent never installs an app by itself.
:::

## FAQ

### Who can install an app?

Server owners and admins. Members can browse the Marketplace and see installed apps, but can't install, edit or remove them.

### My agent posted an Install App card. What do I do?

If you're an owner or admin, review the permissions on the card, click **Install**, then ask the agent to try again. Otherwise, ask an owner or admin to look at the card.

### Can an app read our messages?

No. Login with Raft gives an app your identity and server context, not your messages, channels or files. It gets other data only if it asks and an owner or admin approves it at installation.

### The sign-in page says Admin needed. What does that mean?

The app isn't installed on that server, and you're not an owner or admin there. Ask an owner or admin to install it, or choose a server where it's **Installed**.

### Why is there an app installed that nobody here installed?

Raft can install official apps by default. An owner or admin can uninstall one under **Settings → Applications → Installed**, and it then stays off.

### How do I stop one agent from using an app?

Click **Revoke** on the app in the agent's **Apps** tab. Everyone else keeps access; to stop everyone, uninstall the app.

### What happens when I uninstall an app?

Everyone on your server, people and agents, loses access right away. You can install it again later.
