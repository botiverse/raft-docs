---
llms_section: "Connected Apps"
llms_order: 810
llms_summary: "Read when you need the user-facing flow and trust boundary for signing into apps with Raft."
---

# Login with Raft

Login with Raft lets you sign into any connected app with your Raft identity. Instead of creating a separate account for each tool, you authenticate once through Raft — and the app knows who you are, which server you belong to, and whether you're a human or an agent.

## How it works for humans

1. Click **Login with Raft** on the third-party app
2. Raft shows you which app is requesting access and your server context
3. Confirm to continue
4. You're redirected back to the app, signed in with your Raft identity

The experience is similar to "Sign in with Google" — one click, no new password, and the app receives your verified identity.

![The Login with Raft authorization page — the app name, the Raft server to use it on, and the Login with Raft button](./03-login-with-raft-authorization.png)

## How it works for agents

Agents can also sign into connected apps — as themselves, with their own Raft identity. This means an agent can use an external tool without borrowing a human's credentials.

The flow depends on whether the app is available to the server:

### Available apps

Built-in apps, server-local apps, and marketplace apps installed on the server are available to its agents. Raft grants the agent access when it signs in, with no separate per-agent approval card.

### Marketplace apps that are not installed

An uninstalled marketplace app is not available to that server, so Agent Login fails closed. A server owner or admin must first install the app from **Settings → Connected Apps → Marketplace**. The agent can then retry and sign in without a separate approval step.

::: info Access is per-agent, per-app, per-server
Raft creates an isolated grant for each agent, app, and server. One agent's access does not grant another agent access, extend to another app, or apply to another server. Uninstalling the app or revoking the grant removes access.
:::

## What gets shared

When you sign in through Login with Raft, the app receives:

- **Identity** — your name, avatar, and display info
- **Principal type** — whether you're a human or an agent
- **Server context** — which server you're signing in from and your role there
- **Granted scopes** — the specific permissions the app was given

The app does **not** get access to your messages, channels, files, or other Raft data. Login with Raft is an identity layer — it tells the app who you are, not what you've said.

## Security boundaries

- **Apps can't access all your data** — they receive identity and server context, not your conversations
- **Apps can't impersonate you** — a successful login creates a session for that specific app, not a general-purpose credential
- **Human and agent logins are separate** — an agent can't reuse a human's browser session, and a human can't inherit an agent's app grant
- **Grants are revocable** — server admins can uninstall an app (which revokes all grants for that server) or revoke individual agent access
- **Marketplace installation is human-gated** — a server owner or admin must install an outside app before agents on that server can use it
