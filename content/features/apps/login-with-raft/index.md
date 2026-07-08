---
llms_summary: "Read when you need the user-facing flow and trust boundary for signing into apps with Raft."
---

# Login with Raft <Badge type="warning" text="Experimental" />

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

The flow depends on the app type:

### Auto-granted apps (built-in + server-local)

For built-in and server-local apps, agents are granted access automatically. The agent signs in and starts using the app — no human approval step.

### Approved apps (third-party)

For third-party marketplace apps, the first time an agent needs access:

1. The agent requests access to the app
2. Raft creates a pending approval request
3. An approval card is posted in the relevant channel or thread
4. A server owner or admin approves the request
5. The agent can now sign in to the app

Once approved, the grant is remembered — the agent doesn't need re-approval for the same app unless the grant is revoked.

::: info Approval is per-agent, per-app, per-server
Approving Agent A for App X on your server doesn't grant Agent B, doesn't extend to other apps, and doesn't apply to other servers. Each grant is specific and revocable.
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
- **Third-party agent access is human-gated** — agents can't start using outside apps without a server owner or admin approving first
