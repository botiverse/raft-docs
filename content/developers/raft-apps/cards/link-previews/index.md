---
llms_section: "Developers"
llms_order: 892
llms_summary: "Register an App-owned link preview, verify the viewer callback, and return a read-only json-render card. Includes access requirements, v1 limits and declaring newer versions for block cards and buttons."
---

# App link previews

An App can turn links on its own domain into a title and a small, read-only card in Raft chat. For example, a PR link can show its title, review status and a short description. The App returns JSON; Raft renders it with [json-render](https://json-render.dev/docs) and Raft components. Your App does not upload JavaScript or HTML into the chat client. Your backend can construct this JSON directly from business data; it does not need to install json-render or call a language model.

This page covers link cards. To have your App's bot post a card itself, see [App-sent cards](/developers/raft-apps/cards/app-sent-cards/); [Cards](/developers/raft-apps/cards/) compares the two.

## Before you start

You need a [registered Raft App](/developers/raft-apps/build/), a public HTTPS domain you control, and a backend callback on that domain. The App must be enabled and have an active installation on the viewer's Server.

A viewer must already have signed in to this App through [Login with Raft](/developers/login-with-raft/). Raft requires an unexpired, unrevoked human access token for the same App and Server with `openid profile`, still permitted by the App's current scope declaration. Raft does not forward that token to your callback or automatically sign anyone in. When these conditions are absent, the original link stays visible.

A Raft identity assertion identifies the viewer. **Your backend must still check whether that viewer can access the linked resource.** Do not return a private PR or ticket summary merely because its sender could see it.

## 1. Prove ownership of the domain

Serve this JSON at `https://your-app.example/.well-known/raft-link-preview.json`:

```json
{"client_id":"your-registered-client-key"}
```

Raft reads that file when you register or update the renderer. Its `client_id` must be the client ID of the App making the registration request, or one of that App's [old IDs](/developers/login-with-raft/#changing-your-client-id). The `aud` of the link-preview, resolve and card-action requests Raft sends you uses the ID this file names, so after changing your client ID you move to the new one by updating the file. Each HTTPS origin has one registered App owner across Raft in v1.

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

When an eligible viewer reads a message with a matching URL, Raft sends an HTTP **POST** to your callback with `Content-Type: application/json`:

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
| `iss` | Exactly your configured issuer: `<Raft API origin>/oidc/<server-slug>`. Version 1 requests use this Server-scoped form. [Version 2 requests](#newer-versions) name the Server by ID instead. |
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

## 5. Declare newer versions for block cards and buttons {#newer-versions}

Everything above is version 1: a read-only card on the link. Newer versions let your App draw a block card in the message and add buttons. An App gets them only if it declares them. Raft keeps sending version 1 wherever a reader's client can't take a newer one, so your callback must always answer it.

Add `preview_versions` to your registration:

```json
{
  "origin":"https://your-app.example",
  "endpoint":"https://your-app.example/preview",
  "paths":["/pr", "/issues"],
  "preview_versions":[1, 2, 3]
}
```

The list must include 1, can't repeat a version, and can only have 3 together with 2. Any other value returns `400`.

**Send it on every `PUT`.** A `PUT` replaces the whole registration, so one without `preview_versions` takes your App back to `[1]`, with no error. If that happens, its page under Developer in Raft says its previews are read-only. Check what is stored with `GET /api/oauth/link-preview`, which returns it as `previewVersions`.

A change applies from the next read and doesn't need Marketplace review. It also leaves buttons on cards people already have open working.

### The version 2 request

An App that declared 2 gets this body, with an `Accept-Language` header:

```json
{
  "version":2,
  "url":"https://your-app.example/pr/123",
  "request_id":"request-uuid",
  "client_capabilities":["card.v2", "button.v1", "block.v1", "preview.v3"],
  "locale":"en"
}
```

Verify it as in [step 3](#_3-verify-the-preview-request), with one difference: **`iss` names the Server by ID**, as `<Raft API origin>/oidc/<server-id>`, so accept that form for version 2 and the slug form for version 1. `<server-id>` is the same value as the assertion's `server_id` claim.

**Branch on the body's `version`.** One callback gets both: answer a `version: 1` request with a version 1 answer, and a `version: 2` request with version 2 or 3. A version 1 answer to a version 2 request is invalid.

Raft doesn't retry a failed version 2 request as version 1: an invalid answer shows the plain link. Declare 2 only once your callback answers it.

### The version 3 answer

There's no version 3 request. Answer the version 2 request with version 3, an ordered list of what to draw. Raft draws only what you list:

```json
{
  "version":3,
  "items":[
    {"type":"inline", "title":"PR 123"},
    {
      "type":"card",
      "placement":"block",
      "title":"PR 123: Fix sign-in",
      "card_revision":"r1",
      "business_revision":"b1",
      "card":{
        "root":"summary",
        "elements":{
          "summary":{"type":"Stack", "props":{}, "children":["status", "detail", "open"]},
          "status":{"type":"Badge", "props":{"text":"Open"}},
          "detail":{"type":"Text", "props":{"text":"Ready for review", "tone":"muted"}},
          "open":{"type":"Button", "props":{"label":"Review", "action":{"kind":"navigate", "url":"https://your-app.example/pr/123/files"}}}
        }
      }
    }
  ]
}
```

| Item | What Raft draws |
| --- | --- |
| `inline` | The link becomes a small label with this `title`. Without it, a hover card's label takes the card's `title`, and next to a block card the link stays as written. |
| `card` with `placement: "block"` | The card, in the message after the link's paragraph. At most three per message. |
| `card` with `placement: "hover"` | The card, when someone hovers over the label. |
| `[]` (an empty `items`) | Only the plain link. |

Send at most one `inline` and one `card`; an invalid answer shows the plain link, and Raft skips item types it doesn't know. `card_revision` and `business_revision` are strings you choose (1–512 characters): change `card_revision` when the card changes, and `business_revision` when the thing it shows changes.

`inline.title` is 1–80 characters and a card's `title` 1–160. A card has at most 4 buttons, each `label` 1–40 characters. An unknown field on a known item, more than 8 items, or a `navigate` URL off your origin makes the whole answer invalid, and the reader sees the plain link.

You can answer version 3 to every version 2 request. For a reader whose `client_capabilities` doesn't list `preview.v3`, Raft converts your answer: a block card becomes a label with the card on hover, and an `inline` with no card becomes the plain link.

**Buttons:** Raft keeps `navigate` buttons, which open a URL on your origin, for any App. Buttons that act on something need an official App with an action endpoint in force (for a published App, one that passed Marketplace review), or a server-local App, read on its own Server, after a person who manages integrations there allows its card actions. Raft removes them from any other App's card, and a server-local App's from readers on other Servers. See [Link card actions](/developers/raft-apps/cards/link-card-actions/).

**Badges:** a card's `Badge` takes `text` (1–60 characters) and an optional `tone`: `neutral` (the default), `review`, `progress`, `warning`, `action`, `done` or `closed`. It can also carry `color`, a hex colour `#RRGGBB`, to show a state in your own colour (Stamp's "Merged" badge is green):

```json
"status":{"type":"Badge", "props":{"text":"Merged", "tone":"done", "color":"#218358"}}
```

Raft draws `color` only on a block card, and only for a reader whose `client_capabilities` lists `badge.color.v1`. The badge is filled with your colour, and Raft picks black or white text for contrast, in light and dark mode. Every other reader sees the badge in its `tone`, so always set `tone` as well, and say the state in the badge's words: colour only reinforces them. A `color` that isn't `#RRGGBB` is dropped, not an error, and the badge falls back to its `tone`. A `color` on an `inline` item's badge makes the whole answer invalid.

## Fallback and privacy

Raft takes the **first ten distinct visible HTTPS URLs that meet its URL rules** (three on older clients), in message order, **before matching App registrations**. Links to sites without a registered renderer still count toward this limit; a URL past it is not considered. URLs containing credentials, fragments, non-default ports, IP-literal hosts or dotless hosts are not eligible. Code, image destinations and unused Markdown link definitions do not trigger callbacks. Requests have a three-second deadline including DNS, and responses must be at most 32 KiB of JSON. Slow, malformed, unauthorized or failed responses leave the ordinary link intact.

Preview fetch requests are limited to 60 per minute for each viewer and Server. Above that limit, the original link remains visible.

Previews are personal views: they are not saved in message bodies or shared in a cross-viewer cache. Raft rechecks the App, installation, viewer authorization, registration revision and message visibility/content before returning a callback result. Switching viewer or Server discards an older browser request.

In v1, link previews support human ordinary-chat and thread views. Joint-channel storage projections, forwarded bundles, action cards and Agent CLI transcripts retain their normal link behavior. There is no separate browser configuration switch.

## Run the example

Download the dependency-free Node example: [server.mjs](https://github.com/botiverse/create-raft-app/blob/main/examples/app-link-preview/server.mjs) and [server.test.mjs](https://github.com/botiverse/create-raft-app/blob/main/examples/app-link-preview/server.test.mjs). Keep both in the same local directory.

It serves the domain proof and callback, verifies Raft's signature and purpose-bound claims, and returns a synthetic PR card for an explicit viewer allowlist. The example answers version 1 only: before you [declare newer versions](#newer-versions), add the version 2 branch and accept the `iss` form that names the Server by ID. With Node 24+, run behind your HTTPS reverse proxy:

```sh
RAFT_ISSUER=https://api.raft.build/oidc/YOUR_SERVER_SLUG \
RAFT_CLIENT_ID=your-client-key \
RAFT_SERVER_ID=your-server-uuid \
RAFT_INSTALLATION_ID=your-installation-uuid \
APP_ORIGIN=https://your-app.example \
ALLOWED_VIEWER_IDS=your-test-human-uuid \
node server.mjs
```

The process listens on `127.0.0.1:8789` (`PORT` can override). Configure the expected installation ID for the App on that Server, and compare it with the signed assertion's installation ID before returning data. Your backend can [look up the installation ID](/developers/raft-apps/bot/#_2-get-the-per-server-grant) using the App's client credentials. Route your public HTTPS domain to it, then register `/preview` with the API above. Sign in to the installed App as the allowlisted human and send a `https://your-app.example/pr/123` link. The callback itself needs no client secret; only registration and installation lookup do.

Run `node --test server.test.mjs` for the standalone signature and access-check regression. Replace the example allowlist with your App's real resource permissions. It is not a connection to real Stamp or GitHub data.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Registration returns `404` | Confirm that link previews are available in your target environment and that the request uses its API origin. |
| Registration returns `400` | Check canonical origin/path syntax, callback origin, and that the proof contains this App's exact client key. |
| Registration returns `409` | Another App owns the origin. Do not work around it with another domain spelling; coordinate removal of the old registration. |
| Registration returns `502` | Check public DNS, TLS, JSON content type and reachability of the proof endpoint. Redirects and private network destinations are rejected. |
| Registration succeeds but only a plain link appears | Check active installation, the viewer's current Login with Raft authorization, matching path, the link limit, and the callback response. A private App ACL refusal correctly falls back. |
| Previews stay read-only after you declared newer versions | Check `previewVersions` with `GET /api/oauth/link-preview`. A `PUT` without `preview_versions` goes back to `[1]`. A reader on an older client still gets version 1, so test on the current web or mobile App. |
| A resource changed but an already-open card did not | There is no push-update API or continuous polling in v1. A new view request fetches current data; reload the message view to test it. |

Test with two people: one who can access the App resource and one who cannot.
Also test a revoked login, an uninstalled App, a callback timeout, invalid JSON,
and editing/removing a message while its callback is still pending. In each case,
private content must not appear for an unauthorized viewer and the original link
must remain usable.
