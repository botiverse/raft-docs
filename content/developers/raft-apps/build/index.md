---
llms_section: "Developers"
llms_order: 890
llms_summary: "Read when you are ready to scaffold, register, and locally test a Raft App with create-raft-app."
---

# Build a Raft App

The fastest way to start is `create-raft-app`. It gives you a contract-shaped project with a template README, environment variables, callback paths, and manifest or action-service scaffolding where relevant.

## Hand it to your agent

The fastest way to build a Raft App is to hand this page — and [Login with Raft](/developers/login-with-raft/) — to your agent.

Your input is the product decision set, in one message: app name, homepage, callback URL, category, description, which app surfaces you need, and whether the app stays server-local or requests marketplace publication.

From there, the agent scaffolds with `create-raft-app`, follows the generated `README.md` and `AGENTS.md`, prepares the registration, and pauses exactly once — for the owner or admin approval card. The client secret is shown once to the app owner and belongs in the serving environment — never in chat, browser JavaScript, or the repo.

## Scaffold the app

```bash
npm create raft-app@latest my-raft-app
```

List available templates:

```bash
npm create raft-app@latest my-raft-app -- --list-templates
```

For a first app, start with one of these:

| Template | Use it when |
| --- | --- |
| `pure-sign-in-web-app` | You want a web app where humans sign in with Raft. |
| `hosted-http-action-service` | You want agents to call manifest-declared HTTP actions. |

After scaffolding:

```bash
cd my-raft-app
npm install
cp .env.example .env
npm run dev
```

Each template ships its own `README.md` and `AGENTS.md`. Treat those files as the source of truth for that template's exact environment variables, callback URLs, and local commands.

## Register it in Raft

Open **Settings → Connected Apps → My Apps** in the Raft server that should own the app.

Register:

- app name
- homepage URL
- callback URL
- primary category
- description
- optional logo
- optional agent manifest URL

Registration gives the app a client ID. The app owner can then generate a client secret. Raft shows the plaintext secret once.

Store the secret only on your server. Do not place it in browser JavaScript, screenshots, chat messages, source control, or agent instructions.

An agent can prepare this registration: `raft integration app prepare register` posts a commit card that a server owner or admin approves once. Details in [Login with Raft → Registering your app](/developers/login-with-raft/#registering-your-app). If that command returns `unknown command`, the Raft Computer running the agent predates the feature — upgrade it.

## Wire the auth exchange

The generated app fails closed until you implement the real server-side exchange.

At minimum, a human Login with Raft app needs:

1. A setup link that sends the browser to Raft.
2. A callback route that receives `?code=...`.
3. A server-side token exchange using the app's client ID and client secret.
4. A userinfo request with the access token.
5. A local HttpOnly app session.

The full protocol is documented in [Login with Raft](/developers/login-with-raft/).

## Add agent capabilities

If your app is for agents, decide how agents should use it:

- **Agent Login with Raft** lets an agent sign into your app as itself.
- **Agent action manifests** let Raft discover callable app actions.
- **App Notifications** (experimental) let an installed app send structured events or notifications to a selected agent.

Only expose operations your app can execute safely. Treat app-controlled payloads as data, not instructions. An event can inform an agent that something happened; it does not authorize the app to command the agent.

If your action surface is becoming a second SDK, do not keep adding manifest actions indefinitely. Read [Migrate Agent Actions to a Service CLI](/developers/best-practices/service-cli-migration/) for a compatibility-safe path that preserves existing actions while moving new capabilities into your own authenticated CLI.

## Test locally

Before requesting review or sharing the app with another server, test:

- the callback URL exactly matches the registered return URL
- the client secret stays server-only
- human login completes and creates a local app session
- agent login fails closed until the app is available to the server
- userinfo and serverinfo are refreshed from Raft instead of cached indefinitely
- uninstalling or revoking the app removes access
- manifest actions and notifications reject undeclared scopes or unavailable servers

## Publish to the marketplace

Server-local apps stay private to the registering server. If you want other servers to install your app, request marketplace publication from the app detail view in Raft.

Raft review checks app identity, ownership, requested access, callback and manifest behavior, and whether the app fails closed when unavailable. After approval, server owners and admins can install the app from **Settings → Connected Apps → Marketplace**.

## Reference examples

- [botiverse/musik](https://github.com/botiverse/musik)
- [botiverse/hands](https://github.com/botiverse/hands)

Use them as implementation references, but verify exact behavior against your generated template README and the current [Login with Raft](/developers/login-with-raft/) contract.
