---
llms_section: "Developers"
llms_order: 892
llms_summary: "Register an App-owned link preview, verify the viewer callback, and return a read-only json-render card. Includes access requirements and v1 limits."
---

# App link previews

An App can turn links on its own domain into a title and a small, read-only card in Raft chat. For example, a PR link can show its title, review status and a short description. The App returns JSON; Raft renders it with [json-render](https://json-render.dev/docs) and Raft components. Your App does not upload JavaScript or HTML into the chat client. Your backend can construct this JSON directly from business data; it does not need to install json-render or call a language model.

## Before you start

You need a [registered Raft App](/developers/raft-apps/build/), a public HTTPS domain you control, and a backend callback on that domain. The App must have an active installation on the viewer's Server.

A viewer must already have signed in to this App through [Login with Raft](/developers/login-with-raft/). Raft requires an unexpired, unrevoked human access token for the same App and Server with `openid profile`, still permitted by the App's current scope declaration. Raft does not forward that token to your callback or automatically sign anyone in. When these conditions are absent, the original link stays visible.

A Raft identity assertion identifies the viewer. **Your backend must still check whether that viewer can access the linked resource.** Do not return a private PR or ticket summary merely because its sender could see it.

## 1. Prove ownership of the domain

Serve this JSON at `https://your-app.example/.well-known/raft-link-preview.json`:

```json
{"client_id":"your-registered-client-key"}
```

Raft reads that file when you register or update the renderer. Its `client_id` must match the App making the registration request. Each HTTPS origin has one registered App owner across Raft in v1.

Before transferring or abandoning a domain, delete its registration. Ownership is checked during registration, not continuously on every preview request.

## 2. Register the callback and paths

From your App backend, authenticate with the App client ID and secret using **HTTP Basic** and call `PUT /api/oauth/link-preview` on your Raft API origin:

```json
{
  "origin":"https://your-app.example",
  "endpoint":"https://your-app.example/preview",
  "paths":["/pr", "/issues"]
}
```

Keep the client secret in your backend's secret storage. Never put it into chat, browser code, source control or a URL.

| Field | Contract |
| --- | --- |
| `origin` | Canonical HTTPS origin with no trailing slash, credentials, fragment or non-default port. |
| `endpoint` | HTTPS callback on the same origin, without a query or fragment. |
| `paths` | One to ten path prefixes. `/pr` matches `/pr` and `/pr/123`, but not `/private`. Wildcards are not supported. |

The backend APIs select the App from its client credentials, not from a caller-supplied App ID:

| Request | Result |
| --- | --- |
| `PUT /api/oauth/link-preview` | Verify the domain, create or replace this App's registration, and return `{ "registration": … }`. |
| `GET /api/oauth/link-preview` | Return this App's registration, or `{ "registration": null }`. |
| `DELETE /api/oauth/link-preview` | Remove this App's registration; returns `204`. |

Invalid credentials return `401`. Invalid configuration or a mismatched ownership proof returns `400`; an origin already registered to another App returns `409`. A failed proof fetch or other registration failure returns `502`. Raft does not follow redirects or contact private/special-use network addresses.


### Make the registration request

Here is a backend-only Node example. Populate these environment variables through
your secret manager; do not paste credential values into commands or messages.

```js
const response = await fetch(`${process.env.RAFT_API_ORIGIN}/api/oauth/link-preview`, {
  method: "PUT",
  redirect: "error",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + Buffer.from(
      `${process.env.RAFT_CLIENT_ID}:${process.env.RAFT_CLIENT_SECRET}`
    ).toString("base64"),
  },
  body: JSON.stringify({
    origin: "https://your-app.example",
    endpoint: "https://your-app.example/preview",
    paths: ["/pr"],
  }),
});
if (!response.ok) throw new Error(`Registration failed: HTTP ${response.status}`);
```

## 3. Verify the preview request

When an eligible viewer reads a message with a matching URL, Raft sends your callback:

```json
{
  "version":1,
  "url":"https://your-app.example/pr/123",
  "request_id":"request-uuid"
}
```

Raft sends only the matched URL, not the message body or channel history. The `Authorization: Bearer …` header contains a dedicated signed assertion. Validate it with the JWKS advertised by your **configured Raft issuer**. Never select a JWKS URL from an unverified token claim.

Require these values before reading private App data:

| Header or claim | Required check |
| --- | --- |
| `alg`, `kid` | `ES256`; verify the signature against the matching published Raft key. |
| `typ` | `raft-link-preview+jwt` |
| `iss` | Your configured issuer; for a Server-scoped integration, the issuer includes `/oidc/<server-slug>`. |
| `aud` | `urn:raft:link-preview:<your-client-key>` |
| `token_use`, `type` | `link_preview`, `human` |
| `iat`, `nbf`, `exp` | Valid time window; assertions live for 30 seconds. |
| `jti` | Equals the JSON `request_id`. |
| `url_sha256` | SHA-256 hex digest of the exact UTF-8 JSON `url` string. |
| `server_id`, `installation_id` | The expected Server and installation context. |
| `sub` | The viewer's human ID, the same identity used by Login with Raft; apply your resource ACL to it. |

This assertion is **not** an OAuth access token or ID token. Do not accept it for business mutations or unrelated App APIs. Do not log assertions, raw URLs or private callback bodies.

## 4. Return a title and optional card

Return HTTP `200` with `Content-Type: application/json`:

```json
{
  "version":1,
  "title":"PR 123: Fix sign-in",
  "card":{
    "root":"summary",
    "elements":{
      "summary":{"type":"Stack","props":{},"children":["status","detail"]},
      "status":{"type":"Badge","props":{"text":"Open"}},
      "detail":{"type":"Text","props":{"text":"Ready for review","tone":"muted"}}
    }
  }
}
```

`version` and `title` are required; `card` is optional. The title opens the original URL. Raft supplies App attribution from its registry.

| Component | Props and children |
| --- | --- |
| `Stack` | Empty `props`; optional `children` containing up to 12 element IDs. |
| `Text` | `text`: 1–500 characters; optional `tone`: `default` or `muted`. No children. |
| `Badge` | `text`: 1–60 characters. No children. |

Titles are 1–160 characters. A card contains at most 16 elements and four parent-to-child edges in any branch (five levels including the root). Element IDs begin with a letter and contain at most 64 letters, digits, underscores or hyphens; reserved prototype names are not allowed. Every element must belong to one tree, without missing references, cycles or shared children.

This is a restricted json-render catalog. Expressions, state, watchers, visibility rules, custom styles, arbitrary HTML, scripts, images, actions and additional link destinations are not accepted. Text is rendered literally.

## Fallback and privacy

Raft considers at most three eligible visible HTTPS links per message. Links containing credentials, fragments or non-default ports are not eligible. Code, image destinations and unused Markdown link definitions do not trigger callbacks. Requests have a three-second deadline including DNS, and responses must be at most 32 KiB of JSON. Slow, malformed, unauthorized or failed responses leave the ordinary link intact.

Previews are personal views: they are not saved in message bodies or shared in a cross-viewer cache. Raft rechecks the App, installation, viewer authorization, registration revision and message visibility/content before returning a callback result. Switching viewer or Server discards an older browser request.

V1 supports human ordinary-chat and thread views. Joint-channel storage projections, forwarded bundles, action cards and Agent CLI transcripts retain their normal link behavior. There is no separate browser configuration switch.

## Run the example

Download the dependency-free Node example: [server.mjs](https://github.com/botiverse/create-raft-app/blob/main/examples/app-link-preview/server.mjs) and [server.test.mjs](https://github.com/botiverse/create-raft-app/blob/main/examples/app-link-preview/server.test.mjs). Keep both in the same local directory.

It serves the domain proof and callback, verifies Raft's signature and purpose-bound claims, and returns a synthetic PR card for an explicit viewer allowlist. With Node 24+, run behind your HTTPS reverse proxy:

```sh
RAFT_ISSUER=https://api.raft.build/oidc/YOUR_SERVER_SLUG \
RAFT_CLIENT_ID=your-client-key \
RAFT_SERVER_ID=your-server-uuid \
APP_ORIGIN=https://your-app.example \
ALLOWED_VIEWER_IDS=your-test-human-uuid \
node server.mjs
```

The process listens on `127.0.0.1:8789` (`PORT` can override). Route your public HTTPS domain to it, then register `/preview` with the API above. Sign in to the installed App as the allowlisted human and send a `https://your-app.example/pr/123` link. The callback itself needs no client secret; only registration does.

Run `node --test server.test.mjs` for the standalone signature and access-check regression. Replace the example allowlist with your App's real resource permissions. It is not a connection to real Stamp or GitHub data.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Registration returns `404` | Confirm that link previews are available in your target environment and that the request uses its API origin. |
| Registration returns `400` | Check canonical origin/path syntax, callback origin, and that the proof contains this App's exact client key. |
| Registration returns `409` | Another App owns the origin. Do not work around it with another domain spelling; coordinate removal of the old registration. |
| Registration returns `502` | Check public DNS, TLS, JSON content type and reachability of the proof endpoint. Redirects and private network destinations are rejected. |
| Registration succeeds but only a plain link appears | Check active installation, the viewer's current Login with Raft authorization, matching path, the three-link limit, and the callback response. A private App ACL refusal correctly falls back. |
| A resource changed but an already-open card did not | V1 has no push-update API or continuous polling. A new view request fetches current data; reload the message view to test it. |

Test with two people: one who can access the App resource and one who cannot.
Also test a revoked login, an uninstalled App, a callback timeout, invalid JSON,
and editing/removing a message while its callback is still pending. In each case,
private content must not appear for an unauthorized viewer and the original link
must remain usable.
