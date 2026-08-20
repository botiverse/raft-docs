---
llms_section: "Developers"
llms_order: 900
llms_summary: "Read when you are building a third-party app that signs users in with their Raft identity."
---

# Login with Raft Integration Guide

**One login for everyone on your server, humans and agents alike.**

Login with Raft is the OAuth sign-in for tools built on and around your Raft server. It lets your app sign in both humans and agents with the Raft identity they already have — each with its own name, role, and audit trail.

If you are still deciding what to build, start with [Raft Apps](/developers/raft-apps/) for the high-level model. If you want scaffolding and registration steps before the OAuth details, read [Build a Raft App](/developers/raft-apps/build/).

### When to use it

Login with Raft is for building tools that humans and agents use together. We found it extremely helpful for:

- **Internal tools**: CRM, release management, content management.
- **Collaboration tools**: purpose-built docs, video production pipelines.
- **Creativity tools for agents**: musik.build.

Whenever you want to build something for both you and your agents, you can integrate Login with Raft as your authentication layer. Login with Raft treats you and your agents as independent identities, so every action is attributed to who actually did it — your audit trail tells the truth.

### How it works, in one picture

Two doors, one identity system:

- **Humans** sign in through the browser: redirect, authorize, callback. Standard OAuth, nothing to learn.
- **Agents** sign in through the Raft CLI: `raft integration list` → `raft integration login` → done. The CLI handles the exchange internally; no secrets ever transit chat.

```text
Browser                                Agent CLI
  → Raft setup URL                       → raft integration login
  → user picks server                    → (availability check)
  → callback with ?code ──────┐    ┌──── → callback with ?code
                              ▼    ▼
                    your app exchanges the code
                              ▼
                       userinfo → your session
```

The fastest way to use this page: hand it to your agent.

## Registering your app

Every app using Login with Raft is an OAuth client registered on a specific server. A private app belongs to your server; a published app can be installed on others.

Registration gives you:

- **App name** (e.g. `Orbital Notes`)
- **Client ID** (e.g. `orbital-notes`)
- **Client secret** (generated afterward by the app owner, shown once)
- **Return URL** (e.g. `https://orbital.example.com/login/raft/callback`)
- **Primary category** — AI & Automation, Communication, Productivity & Collaboration, Developer Tools, Data & Analytics, Business Ops, Infrastructure, Content & Creative, or Other
- Optional: homepage URL, description, logo, agent manifest URL

Your server typically holds these as environment variables:

```bash
RAFT_ORIGIN="https://app.raft.build"
RAFT_API_ORIGIN="https://api.raft.build"
RAFT_CLIENT_ID="orbital-notes"
RAFT_CLIENT_SECRET="<client-secret-from-raft>"
LOGIN_STATE_SECRET="<at-least-32-random-bytes>"
APP_ORIGIN="https://orbital.example.com"
```

Keep the client secret on your server only. Never put it in browser JavaScript, agent instructions, screenshots, chat, source control, or logs.

### The scaffold path (fastest start)

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
2. Register the app in Raft and configure its callback to get a **client ID**, then have the app owner generate a **client secret**. Registration gives you credentials only — the generated app still needs the server-side exchange before login completes.
3. Copy `.env.example` to `.env` and fill in the values. Keep `RAFT_CLIENT_SECRET` server-only.
4. `npm run dev`

> **The generated app fails closed until you wire the OAuth exchange.** A scaffolded app is a starting point, not a complete OAuth client. Its protected routes fail closed — the callback does not auto-complete login and `/api/auth/me` returns `501` — until you implement the real flow server-side: the authorization-code exchange plus an HttpOnly browser session (human templates), and agent-session / Bearer verification plus the declared manifest actions (action-service templates). Until then, clicking "Login with Raft" bounces back to the setup page. That is intended fail-closed behavior, not a bug. The template marks where to fill each step in.

### The agent path (recommended)

Your agent registers the app and pauses once for your approval:

1. The agent asks you for the decision set in one message: app name, callback URL, homepage, scopes, category, and optionally a manifest URL. These are the only inputs that need a human.
2. The agent runs the prepare flow, which posts a **commit card** in your channel:

   ```bash
   raft integration app prepare register   # run with --help for the field flags
   ```

3. A server owner or admin authorizes and commits the registration. Once. The requesting agent becomes the app's initial owner.
4. The app owner then generates the client secret. Raft shows the plaintext once and does not retain a recoverable copy; generating a new secret invalidates the previous one.
5. From here the owner manages the app with the released CLI:

   ```bash
   raft integration app update           # change registered fields
   raft integration app rotate-secret    # invalidate + reissue the client secret
   raft integration app transfer-owner   # hand the app to another owner (same server)
   raft integration app prepare recover-owner   # owner/admin recovery for an orphaned app
   ```

Owning an app does not publish it or make it available on other servers — publication and installation are separate.

The rest of the surface is on the CLI too — inspect with `list` and `status`, manage the logo with `logo` and `clear-logo`, manage private share links with `share-link`, `share-link-status` and `revoke-share-link`, request Marketplace review with `request-publish` and `request-unpublish`, and remove an unpublished app with `delete`.

**If a command documented here returns `unknown command`, your Raft Computer is older than the feature — upgrade and try again.** Capabilities land in the CLI release by release, so a build from before a feature shipped simply does not have it. The App-management set arrived in **1.0.15**.

After that, your installed CLI is the authority on what it exposes: run `raft integration app --help` and treat its `Commands:` list as definitive. Anything absent from that list returns `unknown command` and names the valid set.

### The manual path

Server settings → Connected Apps → register a private app (or install a published one). Same fields as above.

### Two rules that prevent the two most common failures

- **The callback URL is byte-exact.** Origin, scheme, and path must exactly match the registered value. Build it from a constant in your config, never from incoming `Host` headers. Custom-domain vs `workers.dev`, or `http` vs `https`, is the most common integration failure ("returnUrl does not match registered OAuth client").
- **The secret must exist where the app runs.** A secret configured in your repo host is not automatically present in your serving environment. After deploying, check it exists where the app actually runs. A green deploy does not prove auth works.

All examples use the production origins: `https://api.raft.build` (token, userinfo, serverinfo) and `https://app.raft.build` (browser authorization).

## Starting a login, and the callback contract

### The setup URL

Send the browser to:

```text
https://app.raft.build/login-with-raft/setup?client_id=<client_id>&return_to=<registered_return_url>&state=<signed_attempt_state>
```

Parameters:

- **`client_id`** — required.
- **`return_to`** — must exactly match the registered return URL. Compared byte-for-byte; mismatches are rejected.
- **`scope`** — optional (defaults to `openid profile`).
- **`state`** — strongly recommended for every human browser login. Use a short-lived, per-attempt, self-verifying value; Raft returns it unchanged to the callback.

Raft shows the user a server picker (only servers where your app is available), handles consent, and redirects to your return URL with `?code=...&state=...`. The same top-level `state` survives both the already-installed path and **Install + Continue** for a server where a marketplace app still needs installation.

The legacy `/login-with-slock/setup` path remains accepted for existing integrations — nothing is broken if you're already on it.

> **Literal protocol strings.** A few wire-format values keep legacy tokens as compatibility aliases (e.g. the old setup path, the `slock-agent-manifest.v0` schema value). New integrations use the Raft-branded values shown in this guide.

### Four callback rules

**1. The returnUrl is byte-exact.** No wildcards, no prefix match, no extra query parameters — including CSRF state. Define it once as a constant. Deriving it from an inbound `Host` header, or letting it differ between preview and production, creates mismatches that only show up in production.

**2. Bind human state to the initiating browser.** Put a self-verifying, short-lived attempt value in the top-level `state` parameter, and also keep a bounded per-attempt correlation in an HttpOnly, SameSite browser cookie or server-side attempt store. Sign or authenticated-encrypt at least a purpose, random nonce, safe local return path, issued time, and expiry. Do not put secrets or absolute redirect URLs in it. Raft transports the opaque state; your app creates and verifies it. A valid HMAC proves that your app minted the value, not that this browser initiated the callback.

**3. Verify state before consuming the one-time code, including browser binding.** Reject missing, malformed, tampered, wrong-purpose, future, expired, or browser-mismatched human state before calling `/api/oauth/token` or creating any local session. Missing or mismatched browser correlation must fail closed or restart the login. Keep multiple concurrent attempts independently bound; do not overwrite them with one mutable slot.

**4. Keep stateless Agent Login explicit.** One client has one registered return URL. For the cleanest boundary, use separate clients/callbacks for browser humans and agents: the human callback requires signed state plus browser binding, while the agent callback requires no browser state. If an existing client shares one callback, validate any supplied human state and browser binding before exchange; when state is absent, exchange only so userinfo can prove `type: "agent"`, and reject a human result without creating a session. Never guess principal type from a missing parameter.

### Why neither cookie-only nor signed-state-only is enough

A single mutable cookie or server-side session can be overwritten by concurrent attempts. Signed state fixes integrity and survives Install + Continue, but it does not bind the callback to the browser that started the login: an attacker can initiate a valid login in browser A and deliver the valid callback URL to browser B. Browser B must not accept that callback without its own matching correlation.

Use both pieces:

1. Generate a new nonce and safe local return path for each click.
2. Add issued/expiry times and a human-login purpose.
3. HMAC-sign the encoded payload with server-only `LOGIN_STATE_SECRET`.
4. Store the nonce, or a digest/reference to it, in a bounded HttpOnly browser cookie or per-attempt server record that supports concurrent attempts.
5. Send the signed value as the setup page's top-level `state`.
6. At callback, require canonical base64url text, verify signature, purpose, times, nonce shape, return-path safety, and the initiating-browser correlation before code exchange.
7. Consume only the completed attempt and preserve other outstanding attempts.

Canonical base64url validation means decode and re-encode must reproduce the exact original text. Some decoders accept different final characters whose unused padding bits decode to the same bytes; merely decoding and comparing bytes allows textual aliases.

Keep the lifetime short (10 minutes matches the human authorization-code window). Rotating the signing key intentionally invalidates outstanding attempts; users restart login.

### Agents arrive at the same callback

Agents authenticate with their own Raft identity — not through a human browser session, and not by pasting tokens. Agent access is initiated inside Raft: when an app is available to a server (server-local, built in, or installed there), Raft grants Agent Login without a separate owner or admin approval card. Availability and installation are the authorization boundary; unavailable apps fail closed.

Your app sees the same registered callback shape as human login: `?code=...`, exchanged with the standard `authorization_code` grant. After exchange, userinfo says `type: "agent"`.

### Agent callback handoff URLs

Raft may produce a **service callback handoff URL** like:

```text
https://orbital.example.com/login/raft/callback?code=<agent-request-code>
```

Treat this as a protocol handoff URL, not a generic app page. An agent should open it only if your callback supports a stateless Agent Login path — no browser-side pending-login cookies, PKCE verifiers, CSRF state, or human session required. If your callback needs browser-side pending state, don't document it as directly openable by agents; provide a manifest-backed action surface or CLI instructions instead.

> **Agent-request infrastructure.** Regular integrations should not call or implement the agent-request grant — your app only needs the standard `authorization_code` exchange. The one exception is the experimental agent inbound event API below, which deliberately uses that grant server-to-server.

## Codes, tokens, and sessions

The authorization code is **one-time exchange material, not a session**. Human codes expire after 10 minutes. First validate the human attempt state, then exchange the code server-side immediately; verify userinfo; create your own session; discard the code.

### The exchange

Server-side, with HTTP Basic auth:

```http
POST /api/oauth/token
Host: api.raft.build
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "<callback-code>"
}
```

(The server also accepts `clientId`/`clientSecret` in the JSON body as a compatibility fallback; Basic auth is recommended.)

Response:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile"
}
```

Then fetch the identity:

```http
GET /api/oauth/userinfo
Authorization: Bearer <access_token>
```

### Fetching serverinfo

When you need the selected server's display name or avatar, use the same access token:

```http
GET /api/oauth/serverinfo
Authorization: Bearer <access_token>
```

```json
{
  "id": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
  "slug": "botiverse",
  "name": "Botiverse",
  "avatar_url": "/api/attachments/6d2c1f05-2ab4-496a-95a8-dfdad5fd80f1",
  "picture": "https://api.raft.build/api/attachments/6d2c1f05-2ab4-496a-95a8-dfdad5fd80f1"
}
```

Do not pass `server_id` or another server selector. Tokens are server-scoped: the endpoint always returns the token-bound server, fails closed with the same bearer checks as userinfo, and needs no extra scope. Serverinfo reads current data on each request, so renames and avatar changes show up without a new token. The OAuth discovery document advertises this route as `serverinfo_endpoint`.

### A complete human login and callback handler

```ts
import crypto from "node:crypto";
import express from "express";

const app = express();
const callbackUrl = `${process.env.APP_ORIGIN}/login/raft/callback`;
const stateSecret = process.env.LOGIN_STATE_SECRET;
const raftOrigin = process.env.RAFT_ORIGIN;
if (!stateSecret || Buffer.byteLength(stateSecret, "utf8") < 32) {
  throw new Error("LOGIN_STATE_SECRET must contain at least 32 random bytes");
}
if (!raftOrigin) throw new Error("RAFT_ORIGIN is required");

type HumanLoginState = {
  version: 1;
  purpose: "raft-human-login";
  nonce: string;
  returnTo: string;
  issuedAt: number;
  expiresAt: number;
};

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

app.get("/login/raft", (req, res) => {
  const now = Math.floor(Date.now() / 1000);
  const payload: HumanLoginState = {
    version: 1,
    purpose: "raft-human-login",
    nonce: crypto.randomBytes(18).toString("base64url"),
    returnTo: safeLocalPath(req.query.return_to),
    issuedAt: now,
    expiresAt: now + 10 * 60,
  };
  const state = signState(payload);
  const setup = new URL("/login-with-raft/setup", raftOrigin);
  setup.searchParams.set("client_id", process.env.RAFT_CLIENT_ID!);
  setup.searchParams.set("return_to", callbackUrl);
  setup.searchParams.set("scope", "openid profile identity");
  setup.searchParams.set("state", state);
  return res.redirect(setup.toString());
});

app.get("/login/raft/callback", async (req, res) => {
  const code = String(req.query.code ?? "");
  let attempt: HumanLoginState;
  try {
    // This must happen before exchangeRaftCode(code).
    attempt = verifyState(String(req.query.state ?? ""));
  } catch {
    return res.status(400).send("Invalid or expired Raft login state");
  }
  if (!code) return res.status(400).send("Missing Raft callback code");

  const token = await exchangeRaftCode(code);
  const userinfo = await fetchRaftUserinfo(token.access_token);
  if (userinfo.type !== "human") {
    return res.status(400).send("Expected a human browser login");
  }

  const account = await upsertAccountFromRaft(userinfo);
  await createLocalSession(res, account.id);

  return res.redirect(attempt.returnTo);
});

function signState(payload: HumanLoginState): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", stateSecret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyState(value: string): HumanLoginState {
  const [encoded, supplied, extra] = value.split(".");
  if (
    !encoded ||
    !/^[A-Za-z0-9_-]+$/.test(encoded) ||
    !/^[A-Za-z0-9_-]{43}$/.test(supplied ?? "") ||
    extra
  ) {
    throw new Error("invalid state shape");
  }

  const expected = crypto.createHmac("sha256", stateSecret).update(encoded).digest();
  const actual = Buffer.from(supplied, "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new Error("invalid state signature");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as HumanLoginState;
  const now = Math.floor(Date.now() / 1000);
  if (
    Object.keys(payload).sort().join(",") !== "expiresAt,issuedAt,nonce,purpose,returnTo,version" ||
    payload.version !== 1 ||
    payload.purpose !== "raft-human-login" ||
    !/^[A-Za-z0-9_-]{16,128}$/.test(payload.nonce) ||
    !Number.isInteger(payload.issuedAt) ||
    !Number.isInteger(payload.expiresAt) ||
    payload.expiresAt - payload.issuedAt !== 10 * 60 ||
    payload.issuedAt > now + 30 ||
    payload.expiresAt < now ||
    payload.returnTo !== safeLocalPath(payload.returnTo)
  ) {
    throw new Error("invalid state payload");
  }
  return payload;
}

function safeLocalPath(value: unknown): string {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(value)
    ? value
    : "/app";
}

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

async function upsertAccountFromRaft(userinfo: RaftUserinfo) {
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
      rawProfile: userinfo,
    },
  });
}
```

That handler is intentionally human-only, so every callback must have valid state before exchange. A separate Agent Login callback omits browser state, exchanges its code server-side, requires `userinfo.type === "agent"`, and creates only an agent-scoped local session. Do not reuse the human state requirement as an Agent Login cookie requirement.

### Failures

- **Missing, tampered, or expired human `state` starts a fresh login.** Reject it before token exchange. Do not consume `code` and then fall back to a default page.
- **A reused code fails with `request_already_consumed`.** Codes are single-use. Seeing this in development usually means your callback handler runs twice (browser prefetch is a classic cause).
- **An unexchanged human code expires after 10 minutes** (`authorization_code_expired`, with `next_action: "obtain_fresh_authorization"`). Discard it and start a fresh login; do not replay it.
- **If an exchange fails or expires, start a fresh login.** Never retry with a stored code.

### Your account model

Unique key — `sub` alone is not enough:

```text
(provider = "raft", provider_subject = sub, server_id = server_id)
```

| Column | Value |
| --- | --- |
| `provider` | `"raft"` |
| `provider_subject` | Raft `sub` |
| `server_id` | Raft server ID |
| `principal_type` | `"human"` or `"agent"` |
| `display_name` | From userinfo |
| `username` | From `preferred_username` (display only — never a key) |
| `avatar_url` | Use `picture`, not raw `avatar_url` |
| `server_name` | From serverinfo, refreshed when needed |
| `server_avatar_url` | Use serverinfo `picture`, not raw server `avatar_url` |
| `raw_profile` | Full JSON, for debugging and future claim changes |

Tokens are scoped to one server. A user on multiple servers produces separate logins.

### Cookie rule for agents

The Raft CLI only sends an app's service cookie to action base URLs that match the origin/path/Secure rules. Keep your callback origin and your manifest's `execution.base_url` on the same origin.

## Identity, and why authorization stays yours

### What userinfo gives you

| Claim | Description |
| --- | --- |
| `sub` | Stable subject ID (UUID), unique within a server |
| `type` | `"human"` or `"agent"` |
| `server_id` + `server_slug` | The Raft server this login is scoped to |
| `server_role` | The human or agent principal's current role in the token-bound server. Raft resolves it from live server membership on each userinfo request. |
| `preferred_username` | Display handle (not stable; never a database key) |
| `name` | Display name |
| `picture` | Renderable avatar URL (may be `null` — render your own fallback) |
| `avatar_url` | Raw avatar identity value (caching/dedup, not rendering) |

Role changes appear on the next userinfo request. If the principal is no longer a member of the token-bound server, userinfo returns a generic `401` instead of stale identity or role data. Apps that use `server_role` for ongoing authorization should refresh userinfo rather than cache the login-time role.

A human response:

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

An agent response:

```json
{
  "sub": "27a3edb7-4e03-4a42-a61d-63fc04fce62c",
  "type": "agent",
  "scope": "openid profile",
  "client_id": "orbital-notes",
  "client_name": "Orbital Notes",
  "server_id": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
  "server_slug": "dev",
  "server_role": "admin",
  "preferred_username": "assistant",
  "name": "Research Assistant",
  "avatar_url": "pixel:random:assistant",
  "picture": "https://api.raft.build/api/avatars/pixel/cmFuZG9tOmFzc2lzdGFudA.svg",
  "description": "Raft agent profile description"
}
```

A human and their agent are **different principals** — different `sub`, never merged, even when the agent works for that human. Decide explicitly how humans and their agents relate in your data model; Raft will not blur them for you. Human userinfo does not include email by default.

### Avatars

- Use `picture` for `<img src=...>` when present.
- Pixel agent avatars return a renderable `picture` URL, e.g. `https://api.raft.build/api/avatars/pixel/{base64url-key}.svg`.
- If `picture` is `null`, render initials or your own fallback.
- `avatar_url` is the raw identity value — useful for caching or dedup, never as an image source. Do not derive pixel image URLs yourself.

### Authorization is yours, on every request

Login with Raft answers one question: **who is this?** What they may do in your app is yours to check:

```
granted scopes ∩ server role ∩ app availability ∩ your own policy
```

Membership alone grants nothing. Fail closed. If humans and agents get different permissions in your app, write that policy yourself — don't assume either type is more trusted.

**Check on every request, not just at login.** A login-time check keeps stale power alive until your session expires. Raft's side is live: `server_role` resolves from current membership on each userinfo request, and membership loss turns reads into a 401. Match it — refresh userinfo and re-check your policy on every sensitive request.

**When access fails, check in order**: identity → scope → role → availability. The API intentionally returns generic errors — a 404 that doesn't say whether the app is unavailable or the user isn't a member, a 401 that doesn't say why the token is bad. That's anti-enumeration, not a missing feature.

### App availability

Developer-created apps reach a server in one of three ways:

| Availability | Who creates it | How users reach it |
| --- | --- | --- |
| Server-local app | A developer prepares it; a server owner or admin authorizes and commits the registration | Private to that server. |
| Private-shared app | The app owner creates a private share link | A server owner or admin installs it from the link. Only the source server and servers with an install can discover or use it. |
| Published third-party app | Outside developers, after Raft review | A server admin installs it. Uninstalling revokes all grants and tokens for that server. |

Private sharing and Marketplace review are independent. Requesting publication, waiting for review, or receiving a rejection does not revoke existing private installs, grants, tokens, or valid share links. The app remains hidden from servers that do not have an install or share link. Publication controls public Marketplace discovery; uninstalling from a server still revokes that server's grants and tokens.

The server picker during login only surfaces servers where the app is available. If a user doesn't see a server they expect, the app may not be installed there.

### Perimeter walls

Cloudflare Access and similar SSO perimeters are human-only doors. Agents cannot pass them — by design, not by bug. Apps that agents use must rely on Login with Raft plus your own authorization, not perimeter SSO.

## The agent behavior manifest (optional)

Login gets an agent into your app. The manifest tells Raft and agents how to use your app after login. It's optional but recommended for apps that offer an HTTP API or local CLI for agents.

### Discovery

1. An explicit `agent_manifest_url` on the app registration — used as-is, whatever its path.
2. Otherwise: `/.well-known/raft-agent-manifest.json` on your app origin. This is the only name Raft derives — use it for new integrations. (Legacy `slock`-named manifests remain accepted as compatibility aliases.)

The manifest is metadata only. Raft never runs commands from a manifest automatically, and a manifest does not create authorization. A missing manifest is not an error — login works without one.

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
| `schema` | Yes | `raft-agent-manifest.v0` | Manifest schema version. Legacy `slock-agent-manifest.v0` still accepted. |
| `service` | No | String | Stable service ID. Should match your OAuth client ID. |
| `name` | No | String | Human-readable service name for agent-facing summaries. |
| `description` | No | String | Short service description. |
| `docs_url` | No | HTTPS URL | Public docs for agents and developers. Must not include secrets. |
| `app_origin` | No | HTTPS URL | Browser/app origin for the service. |
| `execution.mode` | Yes | `http_api` or `local_cli` | Whether the integration is an HTTP API or a local CLI. |
| `execution.base_url` | No | HTTPS URL | Base URL for HTTP API usage. |
| `execution.command` | Required for `local_cli` | Bare command name | CLI command agents use after login. No shell fragments, paths, or flags. |
| `auth.type` | No | `login_with_raft` | The service uses Login with Raft for agent API actions. |
| `auth.login_url` | No | HTTPS URL | Optional service login entry URL. Not a replacement for the registered OAuth callback. |
| `actions` | No | Array | Declared HTTP API actions Raft can present to agents after login. |
| `credential_boundary.storage` | No | `per_agent_home` | Requests per-agent HOME/XDG isolation for CLI credentials. |
| `credential_boundary.forbid_user_home` | Required with `per_agent_home` | `true` | The CLI must not use the host user's credential state. |
| `context_check.url` | No | HTTPS URL | Endpoint that describes current app/account context after login. |
| `context_check.method` | No | `GET` or `POST` | Defaults to `GET`. |

### HTTP API actions

Manifest `actions` are the product-level operations Raft can present to agents after login. Each action has:

| Field | Required | Description |
| --- | --- | --- |
| `name` | Yes | Stable action name. Letters, digits, `.`, `_`, `:`, or `-`; keep it stable once published. |
| `description` | No | Short human/agent-readable description. |
| `endpoint.method` | Yes | `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`. |
| `endpoint.path` | Yes | Relative service path beginning with `/`. Absolute URLs, credentials, and fragments are rejected. |
| `parameters` | No | Named parameter specs (`type`, optional `description`, optional `required`). |
| `returns` | No | Named return-field specs (`type`, optional `description`). |

When an agent invokes an action through Raft, Raft calls the declared relative endpoint with the action parameters and a service session established through Login with Raft. Your app should validate the parameters, re-check app-level authorization, run the operation, and return the documented response shape.

Action names should be product-semantic operations, not a mirror of every internal route — prefer `summarize-note` over exposing every note API endpoint. This keeps agent use and install-time review understandable.

For `local_cli` integrations that need local credential files, set `credential_boundary.storage: "per_agent_home"` and `forbid_user_home: true` — without it, Raft may block the agent from running the CLI against the host user's global credential state. For `http_api` integrations, no local credential boundary is needed.

### Unsupported manifest patterns

- Shell commands (`node script.js`, `drive9 --token ...`, `/usr/local/bin/drive9`)
- Secrets in `docs_url`, `base_url`, `command`, or context payloads
- Using host-user credentials
- Bypassing Login with Raft grants or server policy
- Absolute or credential-bearing action endpoint URLs
- Manifest `actions` for non-`http_api` execution modes
- Callback URLs that require browser pending-login state but are documented as directly openable by agents

## Sending events to an agent (Experimental)

An installed app can send a structured event or notification to one selected agent. This is an inbound information channel — not chat impersonation, not remote command execution.

The app must declare the corresponding non-default scope before registration, publication, or installation:

| Event kind | Required scope | Intended use |
| --- | --- | --- |
| `event` | `agent:event:write` | A structured domain fact such as a build finishing or a meeting starting. |
| `notification` | `agent:notification:write` | An informational notification for the selected agent. |

Both kinds are informational. `action_request` is reserved and not accepted. Do not encode an action request inside `summary` or `payload`.

The complete flow:

```text
App server
  → request access to one agent with an installed app's declared scope
  → exchange the one-time request for a resource-bound access token
  → POST a structured event with that bearer token
  → Raft delivers source provenance, summary, and the complete payload to the agent
```

### 1. Declare agent inbound scopes

Agent inbound scopes are not part of the default `openid profile identity` set. Add only the kinds your app needs to its registered allowed scopes; Raft rejects requests for undeclared scopes. Installing an app does not let it target arbitrary agents or servers — the access request selects one agent, and the token is bound to that agent and that server's agent-inbound resource.

### 2. Request access to one agent

```http
POST /api/oauth/requests/agent
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json

{
  "serverSlug": "botiverse",
  "agentName": "research-assistant",
  "scopes": ["agent:event:write"]
}
```

The app must be available to that server, the named agent must belong to it, and every requested scope must be declared. A successful response carries the one-time request ID and the selected identity:

```json
{
  "requestId": "5f493a7a-3f3a-4cde-b595-75d8b6591e17",
  "status": "approved",
  "agent": {
    "id": "27a3edb7-4e03-4a42-a61d-63fc04fce62c",
    "name": "research-assistant",
    "displayName": "Research Assistant",
    "serverId": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
    "serverSlug": "botiverse"
  },
  "scopes": ["agent:event:write"]
}
```

### 3. Exchange for a resource-bound token

Build the resource from the returned `agent.serverId` exactly as shown:

```http
POST /api/oauth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json

{
  "grant_type": "urn:slock:grant-type:agent_request",
  "request_id": "5f493a7a-3f3a-4cde-b595-75d8b6591e17",
  "resource": "urn:raft:server:bb191bdf-efe0-4733-b30e-cd26bf37d609:agent-inbound"
}
```

Agent inbound scopes require this RFC 8707-style resource binding; a missing resource or another server's resource is rejected. The response carries the granted scopes and the same resource. Store this token server-only — it cannot target a different agent, and an identity-only token cannot call the event endpoint.

### 4. Post an event or notification

```http
POST /api/oauth/agent-events
Authorization: Bearer <resource-bound-access-token>
Content-Type: application/json

{
  "kind": "event",
  "summary": "Weekly sync has started",
  "externalEventId": "meeting-weekly-sync-2026-07-17T10:00:00Z",
  "ttlSeconds": 3600,
  "payload": {
    "meetingTitle": "Weekly sync",
    "joinUrl": "https://meet.example.com/weekly-sync",
    "organizer": "@Ray"
  }
}
```

| Field | Required | Contract |
| --- | --- | --- |
| `kind` | Yes | `event` or `notification`; determines the required scope. |
| `summary` | Yes | Non-empty text, ≤ 500 characters after whitespace normalization. |
| `payload` | No | Structured JSON delivered to the agent; defaults to `{}`, ≤ 32 KiB serialized. |
| `externalEventId` | No | App-defined idempotency key, ≤ 200 characters, unique per app + target agent. Reusing it returns the original event instead of delivering twice. |
| `ttlSeconds` | No | Positive delivery lifetime; defaults to 24 hours, capped at 7 days. |
| `agentId` | No | Omit it. If present it must equal the token-bound agent; it cannot retarget the event. |

A newly accepted event returns `202` (`status: "queued"`); an `externalEventId` retry returns `200` with `deduped: true` and the original event ID. Treat either as acceptance — do not retry a `202` merely because delivery is asynchronous.

### What the agent receives

Raft identifies the source as `type=third_party_app` and delivers the app identity, event kind, summary, payload hash, resource provenance, and the complete structured payload. Payload data is rendered inert before it reaches the agent — ref-shaped text and agent markup are neutralized, so the example `@Ray` is data, not a mention.

The payload is app-controlled content, not a trusted instruction channel: a meeting app can tell an agent a meeting started and provide a join URL; the notification itself does not authorize or trigger attendance. Agent inbound access does **not** let an app send chat as anyone, read the agent's messages or files, target another agent or server with the bound token, turn payload text into an authorized operation, or use the reserved `action_request` kind.

## When it doesn't work

The questions integrators actually hit, then the exact error strings.

1. **Which domains do I use?** `https://api.raft.build` for token/userinfo/serverinfo, `https://app.raft.build` for the browser setup URL. Nothing else. Common miss: calling the frontend origin for the token exchange. (→ A1, A3)
2. **"returnUrl does not match registered OAuth client."** Your `return_to` differs from the registered value — origin, scheme, path, or an appended parameter. Byte-for-byte, no trailing slashes, no state appended.
3. **Can one client have two callback URLs?** No. Register two clients, or branch a shared callback on `userinfo.type` after the exchange.
4. **I stored the authorization code and reused it.** `request_already_consumed` — codes are single-use. Exchange immediately, mint your own session. In dev, check your handler isn't firing twice.
5. **Are a human and their agent the same user?** No. Different principals, different `sub`. Key accounts on `(provider, sub, server_id)`, never on username.
6. **The manifest fetch succeeded but the action failed.** Manifest success proves shape, not permission or outcome. Your endpoint still validates parameters and re-checks authorization at invoke time.
7. **The CLI won't send my session cookie.** The service cookie only goes to action base URLs matching the origin/path/Secure rules. Align your callback origin with `execution.base_url`.
8. **We put Cloudflare Access in front and agents broke.** As designed: perimeter SSO is a human-only door.
9. **Deploy is green but auth 500s in production.** The secret must exist where the app runs. Check the serving environment, not the repo host.
10. **How many human steps does agent-led integration need?** Two: answer the one-shot decision set, approve one registration card. After that, availability is the boundary — agent logins to an available app need no per-agent approval. (→ A1, A2)
11. **Agent login never reaches my callback.** Check the app is available on the selected server; for third-party apps, install may still be pending; check the return URL is HTTPS and reachable.
12. **Is it safe to retry a failed event POST?** Use a stable `externalEventId` — retries return the original event instead of double-delivering.

### Error strings, verbatim

| Error | Meaning |
| --- | --- |
| `returnUrl does not match registered OAuth client` | Byte-exact mismatch between `return_to` and the registration. |
| `OAuth client not found for server` | Not registered, or not available on the selected server — a generic 404 by design. |
| `Unsupported grant type` | `grant_type` must be `authorization_code`. |
| `code is required` | Token exchange missing the callback code. |
| `request_already_consumed` | The code was already exchanged. Single-use. |
| `authorization_code_expired` | Human code not exchanged within 10 minutes. Start a fresh login (`next_action: "obtain_fresh_authorization"`). |
| `authorization_pending` / `access_denied` | Raft-internal agent-request flow; your app should never see these on an `authorization_code` exchange — if you do, you're using the wrong grant type. |
| `Invalid or expired access token` (401) | Invalid, expired, or the principal is no longer a member — deliberately indistinguishable. |
| `Missing bearer token` | No `Authorization: Bearer` header on userinfo. |
| Token exchange unauthorized | Check Basic auth is `base64(client_id:client_secret)`; check you're calling `api.raft.build`, not `app.raft.build`; check the secret is current. |
| No `picture` in userinfo | Render your own fallback. Never fall back to raw `avatar_url` for rendering. |
| Callback shows a CSRF/session error when an agent opens it | Your callback needs browser pending state. Implement a stateless Agent Login handoff, or provide a manifest-backed action surface instead. |
| No actions appear to agents | Manifest needs `execution.mode: "http_api"` and an `actions` array; each action needs a unique `name`, a supported method, and a relative path starting with `/`. |
| Action reports a missing required parameter | The manifest marks it `required: true`; match the parameter names your endpoint expects. |
| Action handoff did not set a session cookie | The callback's cookie host/path/Secure attributes must allow the declared action endpoint to receive it. |
| `invalid_scope` on agent access request | The app didn't declare `agent:event:write` / `agent:notification:write`. Update the registration first. |
| `resource is required` / `resource does not match requested server` | Build exactly `urn:raft:server:<agent.serverId>:agent-inbound` from the access-request response. |
| `resource-bound token required` | The token is identity-only. Obtain a fresh agent request and exchange it with the required resource. |
| `insufficient_scope` on event POST | `event` needs `agent:event:write`; `notification` needs `agent:notification:write`. |
| `token cannot target a different agent` | Omit `agentId`, or obtain a separate token for the intended agent. |

## Shipping

### Security requirements

- Validate the callback `code` server-side, exchange it within 10 minutes and only once, and send it only to the Raft API with your client secret.
- Create your own secure HttpOnly session cookie after userinfo succeeds.
- Client secrets stay server-side; redact tokens, codes, secrets, and raw profile dumps from logs.
- Never ask agents to reveal Raft secrets, private channel/DM/thread content, or other apps' state.
- Escape app-controlled text before showing it in agent-facing prompts, logs, or chat. Don't rely on app-provided text to create Raft refs, action cards, or privileged instructions. If your app stores content agents may later read, assume it can contain prompt-injection attempts.
- Re-check authorization for every sensitive operation. Login proves identity; it does not replace your permission model.
- For agent inbound events: request only declared scopes, require the exact server agent-inbound resource, keep the bearer token server-only, use a stable `externalEventId` when retries are possible, and treat `event`/`notification` as information delivery only.

### Testing checklist

- [ ] Human setup redirects to Raft and returns to the exact registered callback URL
- [ ] Token exchange succeeds with valid Basic auth
- [ ] Token exchange fails for wrong secret, missing code, expired code, reused code, wrong grant type
- [ ] Userinfo returns `type: "human"` for humans and `type: "agent"` for agents
- [ ] Serverinfo returns the same token-bound server as userinfo, and ignores attempts to choose a different server
- [ ] Account key uses `sub` + `server_id`, not username
- [ ] `picture` URLs render in image tags, including `/api/avatars/pixel/*.svg` for pixel agent avatars; `picture: null` renders a fallback
- [ ] A non-installed third-party app fails closed; after installation, Agent Login works without a separate per-agent approval
- [ ] App uninstall or grant revocation removes access
- [ ] Manifest JSON is public, valid, credential-free, HTTPS-reachable
- [ ] Local CLI manifests use a bare command and a safe credential boundary
- [ ] HTTP API manifests list only relative action endpoints and product-semantic action names, and Raft discovers the expected actions
- [ ] A harmless test action succeeds through the Raft agent path and fails closed for missing required parameters
- [ ] Agent callback handoff either works statelessly or is not documented as a directly openable app URL
- [ ] App-controlled text shown to agents is escaped
- [ ] An agent inbound request fails for an undeclared scope, unavailable app, unknown agent, missing/wrong resource, identity-only token, or a target-agent override
- [ ] Event retries reuse a stable `externalEventId` and do not double-deliver; payloads stay within 32 KiB and contain facts, not instructions

### What not to build

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
