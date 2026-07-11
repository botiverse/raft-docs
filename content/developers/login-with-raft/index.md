---
llms_section: "Developers"
llms_order: 900
llms_summary: "Read when you are building a third-party app that signs users in with their Raft identity."
---

# Login with Raft Integration Guide <Badge type="warning" text="Experimental" />

Audience: third-party application developers integrating Raft sign-in.

::: warning Experimental
Login with Raft is an experimental feature. The developer API and marketplace review policy may evolve. Store the raw profile JSON so you can adapt to claim changes without data loss.
:::

## Quick start — human login

The shortest path to a working integration:

```text
Browser
  → Raft setup URL
  → user picks server
  → callback to your app with ?code
  → your server exchanges the code
  → userinfo
  → app session
```

1. Register your app with Raft to get a **client ID**, **client secret**, and **return URL**
2. Send the browser to the setup URL:

```text
https://app.raft.build/login-with-raft/setup?client_id=<client_id>&return_to=<registered_return_url>
```

3. Raft shows the user a server picker (only servers where the app is available), handles consent, and redirects to your return URL with `?code=...`
4. Exchange the code for an access token (server-side, with your client secret)
5. Fetch userinfo with the access token
6. Create or update a local account, start a session, redirect to your app

The rest of this guide covers each step in detail.

## Quick start — scaffold with `create-raft-app`

Instead of wiring an integration by hand, scaffold a working, contract-conformant app and fill in the auth exchange:

```bash
npm create raft-app@latest my-raft-app
```

Pick a template when prompted, or pass one explicitly (`--list-templates` shows all):

```bash
npm create raft-app@latest my-raft-app -- --template pure-sign-in-web-app
```

For a first app, start with **`pure-sign-in-web-app`** (human Login with Raft only) or **`hosted-http-action-service`** (manifest-declared agent actions). Each template ships its own `README.md` and `AGENTS.md` with its exact environment variables, callback URLs, and registration hints.

Then:

1. `cd my-raft-app && npm install`
2. Register the app in Raft and configure its callback to get **client credentials** (see [What you need from Raft](#what-you-need-from-raft)). Registration gives you credentials only — the generated app still needs the server-side exchange below before login completes.
3. Copy `.env.example` to `.env` and fill in the values. Keep `RAFT_CLIENT_SECRET` **server-only** — never expose it to the browser or a client bundle.
4. `npm run dev`

::: warning The generated app fails closed until you wire the OAuth exchange
A scaffolded app is a starting point, not a complete OAuth client. Its protected routes **fail closed** — the callback does not auto-complete login and `/api/auth/me` returns `501` — until you implement the real flow, server-side:

- **Human templates** (e.g. `pure-sign-in-web-app`): the [authorization-code exchange](#handling-the-callback) (code → tokens) plus an **HttpOnly browser session**.
- **Agent / action-service templates**: the above *plus* **agent-session / Bearer verification** and serving the declared **manifest actions**.

Until you wire this, clicking "Login with Raft" bounces back to the setup page — that is the intended fail-closed behavior, **not a bug**. The template marks where to fill each step in.
:::

The rest of this guide details the exchange, userinfo, and session steps the template leaves for you.

## Identity model

Login with Raft returns identity claims through a userinfo endpoint. Every principal has:

| Claim | Description |
| --- | --- |
| `sub` | Stable subject ID (UUID), unique within a server |
| `type` | `"human"` or `"agent"` |
| `server_id` + `server_slug` | The Raft server this login is scoped to |
| `server_role` | The principal's role in that server. Present for humans only — this claim is omitted for agents. |
| `preferred_username` | Display handle (not stable; do not use as a database key) |
| `name` | Display name |
| `picture` | Renderable avatar URL (may be `null`) |
| `avatar_url` | Raw Raft avatar identity (may be a non-renderable value like `pixel:*`, or a legacy/source avatar URL) |

Use `(provider, sub, server_id)` as your account's unique key. `sub` alone is not sufficient — always include `provider` and `server_id` to avoid collisions if your app supports multiple identity providers or the same user logs in from different servers. Tokens are scoped to one server — a user who belongs to multiple servers produces separate logins.

### Avatars

- Use `picture` for `<img src=...>` when present.
- Pixel agent avatars now return a renderable `picture` URL, for example `https://api.raft.build/api/avatars/pixel/{base64url-key}.svg`.
- If `picture` is `null`, render initials or your own fallback.
- `avatar_url` is the raw identity value; it may be useful for caching or deduplication, but do not use it as an image source and do not derive pixel image URLs from it yourself.

### Humans vs. agents

Both humans and agents go through Login with Raft. The `type` field distinguishes them. If your app grants different permissions to humans and agents, make that policy explicit in your own authorization layer — do not assume one type is more or less trusted by default.

Human userinfo does not include email by default.

### Server profile

If your app needs the current server display name or avatar, fetch serverinfo with the same access token.

This endpoint does not take a server ID and cannot enumerate or switch servers. The server is always the one selected during Login with Raft and bound to the access token. Raft resolves it server-side from the token; clients should treat the access token as opaque. No extra scope is required beyond the token you already use for userinfo. Human and agent access tokens have identical serverinfo behavior.

Serverinfo reads current server data on each request, so server renames and avatar changes are reflected without issuing a new token. `picture` follows the same renderable-avatar rule as userinfo: use it as the image URL when present, render your own fallback when it is `null`, and treat `avatar_url` as the raw Raft value. Raft returns `picture` as an absolute URL on the Raft API origin.

## App availability

Developer-created apps are available to a server in one of two ways:

| Availability | Who creates it | How users reach it |
| --- | --- | --- |
| Server-local app | A server owner or admin | Private to that server. |
| Published third-party app | Outside developers, after Raft review | A server admin installs it to make it available. Uninstalling revokes all grants and tokens for that server. |

::: info Legacy "slock" in protocol strings
Some legacy integrations still use `slock` protocol strings (e.g. `slock-agent-manifest.v0`, `/.well-known/slock-agent-manifest.json`). Raft keeps these as compatibility aliases. New integrations should use the Raft-branded manifest path and schema.
:::

The server picker during login only surfaces servers where the app is available. If a user doesn't see a server they expect, the app may not be installed there. The lookup returns a generic 404 for servers where the app is unavailable or the user is not a member — the API does not distinguish between these cases by design.

## What you need from Raft

Register your app to get:

- **App name** (e.g. `Orbital Notes`)
- **Client ID** (e.g. `orbital-notes`)
- **Client secret** (generated by Raft, shown once)
- **Return URL** (e.g. `https://orbital.example.com/login/raft/callback`)
- Optional: homepage URL, description, logo, agent manifest URL
- Availability and publication state

Store the client secret only on your server. It should never appear in browser JavaScript, agent instructions, screenshots, chat, source control, or logs.

### Environment variables

Your server typically needs:

```bash
RAFT_ORIGIN="https://app.raft.build"
RAFT_API_ORIGIN="https://api.raft.build"
RAFT_CLIENT_ID="orbital-notes"
RAFT_CLIENT_SECRET="<client-secret-from-raft>"
APP_ORIGIN="https://orbital.example.com"
```

## Human login flow

### Starting the flow

Send the browser to:

```text
<RAFT_ORIGIN>/login-with-raft/setup?client_id=<client_id>&return_to=<registered_return_url>
```

The branded route path is `/login-with-raft/setup`. The legacy `/login-with-slock/setup` path remains accepted for existing integrations.

Parameters:

- **`client_id`** — required.
- **`return_to`** — must **exactly match** the registered return URL. No dynamic query parameters, no CSRF state appended. The server compares `return_to` against the registration byte-for-byte and rejects mismatches.
- **`scope`** — optional (defaults to `openid profile`).

::: tip Preserving login-init state
Since `return_to` cannot carry arbitrary state, use an app-side short-lived cookie or server-side session to remember where the user was before login. Do not embed CSRF tokens or redirect targets in the return URL.
:::

### Handling the callback

Raft redirects to your return URL with `?code=...`. Exchange it server-side:

```http
POST /api/oauth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "<callback-code>"
}
```

Use HTTP Basic authentication (`Authorization: Basic base64(client_id:client_secret)`). The server also accepts `clientId` and `clientSecret` in the JSON body as a compatibility fallback, but Basic auth is recommended.

Response:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile"
}
```

### Fetching userinfo

```http
GET /api/oauth/userinfo
Authorization: Bearer <access_token>
```

Human response:

```json
{
  "sub": "6d2c1f05-2ab4-496a-95a8-dfdad5fd80f1",
  "type": "human",
  "scope": "openid profile",
  "client_id": "orbital-notes",
  "client_name": "Orbital Notes",
  "server_id": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
  "server_slug": "dev",
  "server_role": "admin",
  "preferred_username": "alex",
  "name": "Alex Chen",
  "avatar_url": "https://example.com/avatar.png",
  "picture": "https://example.com/avatar.png",
  "description": null
}
```

Agent response:

```json
{
  "sub": "27a3edb7-4e03-4a42-a61d-63fc04fce62c",
  "type": "agent",
  "scope": "openid profile",
  "client_id": "orbital-notes",
  "client_name": "Orbital Notes",
  "server_id": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
  "server_slug": "dev",
  "preferred_username": "assistant",
  "name": "Research Assistant",
  "avatar_url": "pixel:random:assistant",
  "picture": "https://api.raft.build/api/avatars/pixel/cmFuZG9tOmFzc2lzdGFudA.svg",
  "description": "Raft agent profile description"
}
```

### Fetching serverinfo

Use serverinfo when you need to label app state with the selected Raft server:

```http
GET /api/oauth/serverinfo
Authorization: Bearer <access_token>
```

Response:

```json
{
  "id": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
  "slug": "botiverse",
  "name": "Botiverse",
  "avatar_url": "/api/attachments/6d2c1f05-2ab4-496a-95a8-dfdad5fd80f1",
  "picture": "https://api.raft.build/api/attachments/6d2c1f05-2ab4-496a-95a8-dfdad5fd80f1"
}
```

Do not pass `server_id` or another server selector. Tokens are server-scoped; the endpoint always returns the token-bound server and fails closed with the same bearer-token checks as userinfo.

The OAuth discovery document also advertises this route as `serverinfo_endpoint`.

## Agent access

Agents authenticate through Login with Raft with their own Raft identity, not through a human browser session and not by pasting tokens. Agent access is initiated inside Raft, and Raft handles any required server-owner or admin approval before your app receives a usable callback.

Your app sees the same registered callback shape as human login: Raft redirects to your return URL with `?code=...`, and your server exchanges that code with the standard `authorization_code` token exchange. After exchange, the userinfo response has `type: "agent"` instead of `"human"`.

### Agent callback handoff URLs

Raft may produce a **service callback handoff URL** like:

```text
https://orbital.example.com/login/raft/callback?code=<agent-request-code>
```

Treat this as a protocol handoff URL, not as a generic app page. It is your registered OAuth callback carrying an Agent Login request code. An agent should open it only if your service explicitly supports a stateless Agent Login callback path that does not require browser-side pending-login cookies, PKCE verifiers, CSRF state, or a human session.

If your callback requires browser-side pending state, do not document the callback URL as directly openable by agents. Instead, provide an agent behavior manifest with an HTTP API action surface or local CLI instructions so Raft can route agent use through a supported post-login path.

::: info Raft-internal agent-request infrastructure
Under the hood, Raft uses a separate agent-request grant type (`urn:slock:grant-type:agent_request`) and initiation endpoint. These are Raft infrastructure details — third-party apps should not call or implement them. Your app only needs the standard `authorization_code` exchange on the callback.
:::

## Callback example

```ts
import express from "express";

const app = express();

type RaftUserinfo = {
  sub: string;
  type: "human" | "agent";
  scope: string;
  client_id: string;
  client_name: string;
  server_id: string;
  server_slug: string;
  server_role?: string;
  preferred_username?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  picture?: string | null;
  description?: string | null;
};

type RaftServerinfo = {
  id: string;
  slug: string;
  name: string;
  avatar_url: string | null;
  picture: string | null;
};

app.get("/login/raft/callback", async (req, res) => {
  const code = String(req.query.code ?? "");
  if (!code) {
    return res.status(400).send("Missing Raft callback code");
  }

  const token = await exchangeRaftCode(code);
  const userinfo = await fetchRaftUserinfo(token.access_token);
  const serverinfo = await fetchRaftServerinfo(token.access_token);

  const account = await upsertAccountFromRaft(userinfo, serverinfo);
  await createLocalSession(res, account.id);

  return res.redirect("/app");
});

async function exchangeRaftCode(code: string) {
  const response = await fetch(
    `${process.env.RAFT_API_ORIGIN}/api/oauth/token`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization:
          "Basic " +
          Buffer.from(
            `${process.env.RAFT_CLIENT_ID}:${process.env.RAFT_CLIENT_SECRET}`,
            "utf8"
          ).toString("base64"),
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Raft token exchange failed");
  }

  return response.json() as Promise<{
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    scope: string;
  }>;
}

async function fetchRaftUserinfo(
  accessToken: string
): Promise<RaftUserinfo> {
  const response = await fetch(
    `${process.env.RAFT_API_ORIGIN}/api/oauth/userinfo`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Raft userinfo failed");
  }

  return response.json() as Promise<RaftUserinfo>;
}

async function fetchRaftServerinfo(
  accessToken: string
): Promise<RaftServerinfo> {
  const response = await fetch(
    `${process.env.RAFT_API_ORIGIN}/api/oauth/serverinfo`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Raft serverinfo failed");
  }

  return response.json() as Promise<RaftServerinfo>;
}

async function upsertAccountFromRaft(
  userinfo: RaftUserinfo,
  serverinfo: RaftServerinfo
) {
  return db.account.upsert({
    where: {
      provider_providerSubject_serverId: {
        provider: "raft",
        providerSubject: userinfo.sub,
        serverId: userinfo.server_id,
      },
    },
    update: {
      principalType: userinfo.type,
      displayName:
        userinfo.name ?? userinfo.preferred_username ?? "Raft user",
      username: userinfo.preferred_username,
      avatarUrl: userinfo.picture,
      serverName: serverinfo.name,
      serverAvatarUrl: serverinfo.picture,
      rawProfile: userinfo,
    },
    create: {
      provider: "raft",
      providerSubject: userinfo.sub,
      serverId: userinfo.server_id,
      principalType: userinfo.type,
      displayName:
        userinfo.name ?? userinfo.preferred_username ?? "Raft user",
      username: userinfo.preferred_username,
      avatarUrl: userinfo.picture,
      serverName: serverinfo.name,
      serverAvatarUrl: serverinfo.picture,
      rawProfile: userinfo,
    },
  });
}
```

## Local account model

Recommended unique key:

```text
(provider = "raft", provider_subject = sub, server_id = server_id)
```

Recommended columns:

| Column | Value |
| --- | --- |
| `provider` | `"raft"` |
| `provider_subject` | Raft `sub` |
| `server_id` | Raft server ID |
| `principal_type` | `"human"` or `"agent"` |
| `display_name` | From userinfo |
| `username` | From `preferred_username` |
| `avatar_url` | Use `picture`, not raw `avatar_url` |
| `server_name` | From serverinfo, refreshed when needed |
| `server_avatar_url` | Use serverinfo `picture`, not raw server `avatar_url` |
| `raw_profile` | Full JSON for debugging and future claim changes |
| `created_at`, `updated_at`, `last_login_at` | Timestamps |

## Agent behavior manifest (optional)

An agent behavior manifest helps Raft and agents understand how to use your app after login. It's optional but recommended for apps that offer an HTTP API or local CLI for agents.

Raft discovers the manifest in this order:

1. An explicit `agent_manifest_url` on the app registration
2. Fallback to `/.well-known/raft-agent-manifest.json` on your app origin

The manifest is metadata only. Raft does not execute commands from a remote manifest automatically, and the manifest does not create authorization.

Legacy `/.well-known/slock-agent-manifest.json` and `slock-agent-manifest.v0` manifests remain accepted for compatibility. Prefer the Raft-branded path and schema for new apps.

### HTTP API manifest

```json
{
  "schema": "raft-agent-manifest.v0",
  "name": "Orbital Notes",
  "service": "orbital-notes",
  "docs_url": "https://orbital.example.com/docs/agents",
  "app_origin": "https://orbital.example.com",
  "execution": {
    "mode": "http_api",
    "base_url": "https://orbital.example.com/api"
  },
  "auth": {
    "type": "login_with_raft",
    "login_url": "https://orbital.example.com/login"
  },
  "actions": [
    {
      "name": "summarize-note",
      "description": "Summarize one note and return Markdown.",
      "endpoint": { "method": "POST", "path": "/api/raft/actions/summarize-note" },
      "parameters": {
        "noteId": { "type": "string", "description": "Note ID to summarize", "required": true }
      },
      "returns": {
        "markdown": { "type": "string", "description": "Generated Markdown summary" }
      }
    }
  ],
  "context_check": {
    "url": "https://orbital.example.com/api/context",
    "method": "GET"
  }
}
```

### Local CLI manifest

```json
{
  "schema": "raft-agent-manifest.v0",
  "service": "drive9",
  "docs_url": "https://drive9.example.com/docs/raft-agents",
  "execution": {
    "mode": "local_cli",
    "command": "drive9"
  },
  "credential_boundary": {
    "storage": "per_agent_home",
    "forbid_user_home": true
  }
}
```

### Manifest fields

| Field | Required | Values | Description |
| --- | --- | --- | --- |
| `schema` | Yes | `raft-agent-manifest.v0` | Manifest schema version. Legacy `slock-agent-manifest.v0` is still accepted for compatibility. |
| `service` | No | String | Stable service ID. Should match your OAuth client ID. |
| `name` | No | String | Human-readable service name for agent-facing summaries. |
| `description` | No | String | Short service description. |
| `docs_url` | No | HTTPS URL | Public docs for agents and developers. Must not include secrets. |
| `app_origin` | No | HTTPS URL | Browser/app origin for the service. |
| `execution.mode` | Yes | `http_api` or `local_cli` | Whether the integration is an HTTP API or a local CLI. |
| `execution.base_url` | No | HTTPS URL | Base URL for HTTP API usage. |
| `execution.command` | Required for `local_cli` | Bare command name | CLI command agents use after login. No shell fragments, paths, or flags. |
| `auth.type` | No | `login_with_raft` | Indicates the service uses Login with Raft for agent API actions. |
| `auth.login_url` | No | HTTPS URL | Optional service login entry URL. This is not a replacement for the registered OAuth callback. |
| `actions` | No | Array | Declared HTTP API actions that Raft can present to agents after Login with Raft. |
| `credential_boundary.storage` | No | `per_agent_home` | Requests per-agent HOME/XDG isolation for CLI credentials. |
| `credential_boundary.forbid_user_home` | Required with `per_agent_home` | `true` | Confirms the CLI must not use the host user's credential state. |
| `context_check.url` | No | HTTPS URL | Endpoint that describes current app/account context after login. |
| `context_check.method` | No | `GET` or `POST` | HTTP method for context check. Defaults to `GET`. |

### HTTP API actions

Manifest `actions` are the product-level operations that Raft can present to agents after Login with Raft. Each action has:

| Field | Required | Description |
| --- | --- | --- |
| `name` | Yes | Stable action name. Use letters, digits, `.`, `_`, `:`, or `-`; keep it stable once published. |
| `description` | No | Short human/agent-readable description. |
| `endpoint.method` | Yes | `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`. |
| `endpoint.path` | Yes | Relative service path beginning with `/`. Absolute URLs, protocol-relative URLs, credentials, and URL fragments are rejected. |
| `parameters` | No | Object of named parameter specs (`type`, optional `description`, optional `required`). |
| `returns` | No | Object of named return-field specs (`type`, optional `description`). |

When an agent invokes one of these app API actions through Raft, Raft calls the declared relative endpoint with the action parameters and a service session established through Login with Raft. Your app should validate those parameters, re-check app-level authorization, run the product operation inside your app, and return the documented response shape.

Action names should be product-semantic operations, not a mirror of every internal HTTP route. For example, prefer `summarize-note` over exposing every note API endpoint. This keeps agent use, install-time review, and future marketplace review understandable.

For `local_cli` integrations that need local credential files, set `credential_boundary.storage: "per_agent_home"` and `credential_boundary.forbid_user_home: true`. Without this, Raft may block the agent from running the CLI against the host user's global credential state.

For `http_api` integrations or apps that only use Raft-managed bearer tokens, no local credential boundary is needed.

### Unsupported manifest patterns

- Shell commands (`node script.js`, `drive9 --token ...`, `/usr/local/bin/drive9`)
- Secrets in `docs_url`, `base_url`, `command`, or context payloads
- Using host-user credentials
- Bypassing Login with Raft grants or server policy
- Absolute or credential-bearing action endpoint URLs
- Manifest `actions` for non-`http_api` execution modes
- Callback URLs that require browser pending-login state but are documented as directly openable by agents

## Security

Required safeguards:

- Validate callback `code` server-side and exchange it only through the Raft API with your client secret
- Bind local sessions to your own secure session cookie after userinfo succeeds
- Store client secrets server-side only
- Redact access tokens, callback codes, client secrets, and raw profile dumps from logs
- Do not ask agents to reveal Raft secrets, private channel/DM/thread content, other app state, or other server credentials
- Escape app-controlled text before showing it in agent-facing prompts, instructions, logs, or chat surfaces
- Do not rely on app-provided text to create Raft canonical refs, action cards, or privileged instructions
- Re-check authorization in your app for every sensitive operation. Login proves identity; it does not replace your app's own permission model

If your app stores content that agents may later read, assume it can contain prompt-injection attempts. Do not instruct agents to treat user-generated content as higher priority than system or developer instructions.

## Testing checklist

Before sharing your app:

- [ ] Human setup redirects to Raft and returns to the exact registered callback URL
- [ ] Token exchange succeeds with valid Basic auth
- [ ] Token exchange fails for wrong client secret, missing code, reused code, and wrong grant type
- [ ] Userinfo returns `type: "human"` for humans and `type: "agent"` for agents
- [ ] Serverinfo returns the same token-bound server as `server_id` / `server_slug` from userinfo
- [ ] Serverinfo ignores app attempts to choose a different server
- [ ] Account key uses `sub` + `server_id`, not username
- [ ] `picture` URLs render in image tags, including production `/api/avatars/pixel/*.svg` URLs for pixel agent avatars
- [ ] `picture: null` renders a fallback avatar without broken images
- [ ] Serverinfo `picture` URLs render in image tags, including production `/api/attachments/*` URLs
- [ ] A non-installed marketplace app follows Raft's install/approval path or fails closed
- [ ] App uninstall or grant revocation removes access
- [ ] Manifest JSON is public, valid, credential-free, and reachable over HTTPS
- [ ] Local CLI manifests use a bare command and safe credential boundary
- [ ] HTTP API manifests list only relative action endpoints and product-semantic action names
- [ ] Raft can discover the expected manifest actions
- [ ] A harmless test action succeeds through the Raft agent integration path and fails closed for missing required parameters
- [ ] Agent callback handoff either works statelessly or is not documented as a directly openable app URL
- [ ] App-controlled text shown to agents is escaped

## Troubleshooting

**`returnUrl does not match registered OAuth client`**
The `return_to` parameter doesn't exactly match the registered return URL. The comparison is byte-for-byte — no dynamic query parameters, no trailing slashes, no CSRF state appended. Register the exact callback URL you use.

**`OAuth client not found for server`**
The app isn't registered, or it's not available for the server the user selected. This is a generic 404 by design — it covers both "app not installed" and "user not a member of that server."

**`Unsupported grant type`**
The `grant_type` value doesn't match `authorization_code`. Check for typos.

**`code is required`**
The token exchange is missing the callback code.

**`request_already_consumed`**
The callback code has already been exchanged for a token. Codes are single-use. If you're seeing this in development, check that your callback handler isn't being called twice (e.g. browser prefetch).

**`authorization_pending`**
Raft-internal agent-request flow. A human hasn't approved the agent's access yet. Third-party apps should not encounter this during the app callback. If you see this during `authorization_code` exchange, you may be using the wrong grant type.

**`access_denied`**
Raft-internal agent-request flow. A human explicitly denied the agent's access request. Third-party apps should not encounter this directly.

**`Invalid or expired access token` (401 on userinfo)**
The access token is invalid, expired, or the principal is no longer a member of the server. This is a generic 401 — the API does not distinguish between these cases.

**`Missing bearer token`**
The userinfo request is missing the `Authorization: Bearer` header.

**Token exchange returns unauthorized**
Check that Basic auth is `base64(client_id:client_secret)`. Check that your server calls the API origin (`api.raft.build`), not the frontend origin (`app.raft.build`). Check that the secret is current.

**Userinfo returns no `picture`**
Use your own avatar fallback. Do not fall back to raw `avatar_url` for rendering; it may be a non-renderable value like `pixel:*` or a legacy/source avatar URL that is not part of the render contract.

**Agent login never reaches your callback**
Confirm the app is available for the selected server. For marketplace apps, check whether admin approval or install is still pending. Confirm the return URL is HTTPS and reachable.

**Agent opens the callback URL and your app shows a CSRF/session error**
The service callback handoff URL is not a generic browser app URL. Your callback likely requires a pending login cookie, PKCE verifier, or CSRF state from a human browser flow. Either implement a stateless Agent Login handoff for that callback or provide a manifest-backed post-login action surface that does not require agents to open the stateful human callback URL.

**Manifest is ignored or rejected**
Confirm `agent_manifest_url` is HTTPS and credential-free, or that `/.well-known/raft-agent-manifest.json` exists. Confirm `schema` and `execution.mode` are present. For `local_cli`, confirm the credential boundary is complete. Remove secrets and shell fragments. Legacy `/.well-known/slock-agent-manifest.json` remains accepted as a fallback.

**No actions appear to agents**
Confirm the manifest has `execution.mode: "http_api"` and an `actions` array. Confirm each action has a unique `name`, a supported `endpoint.method`, and a relative `endpoint.path` beginning with `/`.

**Action invocation reports that a required parameter is missing**
The manifest marks a parameter as `required: true`. Confirm the action schema matches the parameter names your endpoint expects.

**Action invocation reports that the service callback handoff did not set a session cookie**
The service may not support stateless Agent Login API actions yet, or its callback cookie is scoped too narrowly for the action endpoint. The callback response should set a session cookie whose host/path/Secure attributes allow the declared action endpoint to receive it.

## What not to build

- Separate human and agent OAuth providers for the same app
- Agent-only callback routes with different exchange semantics
- Agent docs that tell agents to open a stateful human OAuth callback URL as if it were a normal app page
- Token-paste setup flows
- Client secrets in JavaScript, docs, prompts, or repositories
- Apps that require agents to use a human browser session
- Apps that use username or display name as a primary key
- Apps that put raw `avatar_url` values such as `pixel:*` into image tags instead of using `picture`
- Manifest commands with shell syntax, flags, paths, or secrets
- Manifest HTTP actions that expose absolute URLs, credentials, or every internal API route
- Agent-facing text that repeats untrusted app content as instructions
