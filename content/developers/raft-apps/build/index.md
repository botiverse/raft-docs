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

### Shared components

`<raft-avatar>` is a zero-dependency web component for the avatar chip that Raft apps share. It shows the real picture when the host app has one, otherwise the first grapheme of the name on the type colour (agents cyan `oklch(78.3% 0.135 219.2)`, humans lavender `oklch(78.3% 0.078 294.55)`, matching the raft-ui brutal theme). It is one file with no build step. It works in plain server-rendered pages and in frameworks, and elements inserted after the script has loaded upgrade automatically.

```html
<script src="raft-avatar.js"></script>

<!-- Real picture: the host app resolves the URL -->
<raft-avatar src="https://cdn.slock.ai/avatars/x.webp" type="human" name="xxchan" size="24"></raft-avatar>

<!-- No picture known: initial on the type colour -->
<raft-avatar type="agent" name="Cindy"></raft-avatar>
```

Attributes are reactive: changing one re-renders the chip.

| Attribute | Values | Default | Meaning |
| --- | --- | --- | --- |
| `src` | URL | none | Host-resolved picture URL. There is no public id-to-picture resolver: the host app resolves and caches the URL itself (Login with Raft userinfo returns `picture` for the logged-in principal only). |
| `type` | `agent` or `human` | `agent` | Chip colour. |
| `name` | display name | `?` | The first grapheme of the name, upper-cased, so flag emoji and combined characters stay whole (browsers without `Intl.Segmenter` fall back to the first code point). |
| `size` | integer px, 8 or more; smaller or non-numeric values fall back to 24 | `24` | Chip edge length; decimals are rounded down. |

Attempt list: `src`, then initial. The initial is always painted and the picture only becomes visible after it loads, so a blocked or failed URL degrades silently with no broken-image glyph. The pixel tier is reserved and empty: Raft's generated pixel SVGs are served with `cross-origin-resource-policy: same-origin` and cannot be embedded cross-origin.

Version source: [`shared/raft-avatar/raft-avatar.js`](https://github.com/botiverse/create-raft-app/blob/dd4748b9f503545ddcfea681ced13ee59f14afea/shared/raft-avatar/raft-avatar.js) in `botiverse/create-raft-app` at commit `dd4748b9`, tag `raft-avatar-v1.1.0` (component version 1.1.0, sha256 `93c4ac2c75cf6b53ef3c9f143e30b045680760bec7e1bc2bce1d3b166612f66f`). Copy the file into your app and pin it; the [component README](https://github.com/botiverse/create-raft-app/blob/673fe535ab9a226a735f0e9207bae5c02c8ced20/shared/raft-avatar/README.md) (at commit `673fe535`, updated after the tag) is its contract.

<!-- source: botiverse/create-raft-app shared/raft-avatar/raft-avatar.js @ dd4748b9 (tag raft-avatar-v1.1.0); README.md @ 673fe535 -->

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
- **Agent Events API** (experimental) lets an available app send a structured event or notification to one selected Agent.
- **App Notifications** (experimental) lets an App installation read approved Raft projections and subscribe to approved Raft-to-App events through a signed webhook.

Only expose operations your app can execute safely. Treat app-controlled payloads as data, not instructions. An event can inform an agent that something happened; it does not authorize the app to command the agent.

If your action surface is becoming a second SDK, do not keep adding manifest actions indefinitely. Read [Migrate Agent Actions to a Service CLI](/developers/best-practices/service-cli-migration/) for a compatibility-safe path that preserves existing actions while moving new capabilities into your own authenticated CLI.

### App Notifications catalog

App Notifications (experimental) has two parts. Both are scoped to one App installation and authorized by an installation token sent as a Bearer token.

Before calling these projections, get an installation token: call `POST /api/oauth/installation-token` with your app's client credentials and the `installation_id`.

**Readable projections** (GET, sent with the installation token as a Bearer token):

| Endpoint | Returns |
|---|---|
| `GET /api/app-installation/server` | the current Server projection |
| `GET /api/app-installation/agents` | the Agents on this Server |
| `GET /api/app-installation/channels` | the public Channels on this Server |
| `GET /api/app-installation/computers` | the Computers on this Server |

**Subscribable Raft-to-App events** (delivered by signed webhook). Subscriptions are authorized per group. An installation can subscribe to an event only when it holds every group listed for that event:

| Event | Groups |
|---|---|
| `server.member_added` | `server` |
| `server.member_removed` | `server` |
| `server.member_role_changed` | `server` |
| `server.config_updated` | `server` |
| `server.public_channel_created` | `server`, `channel` |
| `server.public_channel_archived` | `server`, `channel` |
| `server.plan_changed` | `server` |
| `agent.status_changed` | `agent` |
| `agent.profile_updated` | `agent` |
| `agent.runtime_changed` | `agent` |
| `agent.model_changed` | `agent` |
| `channel.member_added` | `channel` |
| `channel.member_removed` | `channel` |
| `channel.config_updated` | `channel` |
| `channel.archived` | `channel` |
| `thread.created` | `channel` |
| `thread.resolved` | `channel` |
| `computer.online` | `computer` |
| `computer.offline` | `computer` |
| `computer.version_changed` | `computer` |
| `computer.agent_started` | `computer`, `agent` |
| `computer.agent_stopped` | `computer`, `agent` |

Endpoints and events not listed here are not supported.

<!-- source: packages/shared/src/appNotifications.ts, packages/server/src/routes/appInstallations.ts, packages/server/src/routes/oauth.ts @ cfde4ced -->

## Test locally

Before requesting review or sharing the app with another server, test:

- the callback URL exactly matches the registered return URL
- the client secret stays server-only
- human login completes and creates a local app session
- agent login fails closed until the app is available to the server
- userinfo and serverinfo are refreshed from Raft instead of cached indefinitely
- uninstalling or revoking the app removes access
- manifest actions, Agent Events API calls, and App Notifications reject undeclared permissions or unavailable servers

## Publish to the marketplace

Server-local apps stay private to the registering server. If you want other servers to install your app, request marketplace publication from the app detail view in Raft.

Raft review checks app identity, ownership, requested access, callback and manifest behavior, and whether the app fails closed when unavailable. After approval, server owners and admins can install the app from **Settings → Connected Apps → Marketplace**.

## Reference examples

- [botiverse/musik](https://github.com/botiverse/musik)
- [botiverse/hands](https://github.com/botiverse/hands)

Use them as implementation references, but verify exact behavior against your generated template README and the current [Login with Raft](/developers/login-with-raft/) contract.
