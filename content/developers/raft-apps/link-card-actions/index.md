---
llms_section: "Developers"
llms_order: 893
llms_summary: "Add buttons that act to an App's link cards. Covers who may use them (official Apps, and a server-local App on its own Server once a person who manages integrations there allows it, in clients that confirm every press), registering action_endpoint, the signed prepare, execute and status requests and the answers Raft accepts, terminal updates, revisions and stale clicks, limits, a worked approval example and troubleshooting."
---

# Link card actions

A link card can carry buttons. A `navigate` button opens a page on your origin, and every App can use it. This page is about buttons that act: when a person clicks one, Raft calls your App's **action endpoint** with a signed statement of who clicked, on which card and which button. Your App checks that this person may do it and that the card is still current, and then acts.

Start with [App link previews](/developers/raft-apps/link-previews/). You need a working registration, a callback that answers the [version 2 request](/developers/raft-apps/link-previews/#the-version-2-request), and `preview_versions` that include 2.

## Who can use acting buttons {#who-can-use-acting-buttons}

Raft decides on every card read which buttons the reader gets, and checks again on every click.

| App | Acting buttons |
| --- | --- |
| An official App (one Raft approved as official) with an action endpoint in force (for a published App, one that passed Marketplace review) | On every Server where it's installed. |
| A server-local App: made on your Server, not published and never shared by link | Only for people reading from its own Server, after a person who can manage integrations there [allows its card actions](#_2-allow-card-actions-on-your-own-server), and only in Raft clients that confirm every press of an App Raft hasn't reviewed. No released Raft client does this yet; web and mobile support is coming. |
| Any other App | None. Raft keeps only `navigate` buttons. |

Raft removes the buttons a reader can't use from their copy of the card; it doesn't show them disabled. Readers on any other Server never get acting buttons from a server-local App. For example, in a joint channel, a reader from the other Server doesn't get them.

Raft hasn't reviewed a server-local App, so Raft asks the person to confirm every press of its acting buttons. The confirmation names your App, says Raft didn't review it, and says your App will know who pressed. Even buttons with an undo window ask first. Only clients that show this confirmation get the App's acting buttons; in any other client the person sees `navigate` buttons only.

Once an App has a [private share link](/developers/raft-apps/share/), or is published to the Marketplace, it is no longer made for your Server alone, even if you revoke the link later. It can't use own-Server card actions anywhere, its own Server included.

Only people can click. Agents don't get link cards. As for any preview, the person must have signed in to your App through Login with Raft and must still be able to read the message.

**Raft tells your App who clicked; it doesn't decide who may act.** Check the person against your own permissions on every prepare and execute.

## How a click works {#how-a-click-works}

1. Your callback answers a version 2 request with a card that has an `execute` button.
2. Raft checks that your App may use acting buttons for this reader, signs a single-use handle for each enabled `execute` button, and gives the handles to the reader's client. Nothing is stored yet.
3. The person clicks. For a server-local App, Raft asks them to confirm the press, as described above. For a button with `confirm: "prepare"`, Raft sends your action endpoint a **prepare** request, then shows your confirmation text in its own dialog. For a button with `undoWindowMs`, the client counts down with an **Undo** button.
4. Raft checks the handle against the current state, records one **operation** for the click, and sends your action endpoint one **execute** request.
5. Your App checks, acts and answers with a status. If it needs longer, it answers `accepted` and reports the outcome later, with a [terminal update](#_7-finish-later-with-a-terminal-update) or in a [status answer](#_8-answer-status-requests).
6. Raft shows the person the outcome and reads the card again.

## 1. Register the action endpoint {#_1-register-the-action-endpoint}

Add `action_endpoint` to the registration you send with `PUT /api/oauth/link-preview`:

```json
{
  "origin":"https://your-app.example",
  "endpoint":"https://your-app.example/preview",
  "action_endpoint":"https://your-app.example/card-actions",
  "paths":["/pr"],
  "preview_versions":[1, 2, 3]
}
```

- It follows the same rules as `endpoint`: HTTPS on your registered origin, without a query or fragment. Raft stores it in normalized form, so `https://your-app.example:443/card-actions` is the same URL.
- **Send it on every `PUT`.** A `PUT` replaces the whole registration, so one without `action_endpoint` removes it, and acting buttons stop at once.
- `GET /api/oauth/link-preview` returns what is stored, as `actionEndpoint`.
- For an App that isn't published, a new or changed action endpoint applies at once. For a published App, adding or changing it waits for Marketplace review. The approved one stays in force meanwhile; the registration shows the request as `pendingActionEndpoint`, and `actionEndpointRejectReason` after a rejection. Removing it always applies at once.
- Changing the action endpoint, the origin, the preview `endpoint` or the set of paths stops every button already on screen; readers get new buttons when their card is read again. Repeating the same registration changes nothing.

Prepare, execute and status requests all go to this one URL. Tell them apart by the body's `phase`.

## 2. Allow card actions on your own Server {#_2-allow-card-actions-on-your-own-server}

Official Apps skip this step. For a server-local App, registering the action endpoint isn't enough: a person with permission to manage integrations on your Server allows card actions for the App in its settings. They confirm the exact action endpoint URL, so what they allow is what Raft calls.

The settings screen for this is coming soon. Until it ships, nobody can allow card actions, so a server-local App's buttons only navigate.

- The permission is for this exact URL. While the App's action endpoint points anywhere else, its buttons only open links. If the endpoint points back to the allowed URL, they act again. To use a different URL, someone has to allow that one.
- Withdrawing the allowance turns acting buttons off at once, also on cards people already have open: their next click is refused.
- While the registration is suspended because its domain proof failed, acting buttons are off too. They come back when the proof succeeds again.
- Even when allowed, the buttons act only in clients that confirm every press for an App Raft hasn't reviewed ([above](#who-can-use-acting-buttons)).
- A click that Raft admitted just before a withdrawal can still reach your endpoint. Status requests and terminal updates for operations already started keep working.

## 3. Add acting buttons to the card {#_3-add-acting-buttons-to-the-card}

Buttons go in the `card` of a version 2 or version 3 answer. A `Button` element has these props:

| Prop | Contract |
| --- | --- |
| `label` | 1–40 characters. |
| `variant` | Optional: `default` or `ghost`. |
| `action` | What the button does; see below. |
| `disabledReason` | Optional, 1–200 characters. The button shows disabled, with this reason. Raft signs no handle for it. |

| `action` | Who keeps it | What a click does |
| --- | --- | --- |
| `{"kind":"navigate", "url":"https://your-app.example/…"}` | Every App | Opens the URL, which must be on your origin. |
| `{"kind":"read"}` | Apps that may use acting buttons, and official Apps without an action endpoint | Reads the card again: Raft sends your callback a new version 2 request. |
| `{"kind":"execute", "action_id":"merge", "confirm":"prepare"}` | Apps that may use acting buttons | A prepare request, Raft's dialog with your confirmation text, then execute. |
| `{"kind":"execute", "action_id":"approve", "undoWindowMs":5000}` | Apps that may use acting buttons | A countdown with **Undo** (1000–10000 ms), then execute. No prepare. |

- An `execute` action has exactly one of `confirm: "prepare"` and `undoWindowMs`. One with neither, or with both, makes the whole answer invalid, and the reader sees the plain link.
- `action_id` matches `^[a-z][a-z0-9_]{0,31}$` and is unique among the card's `execute` buttons. It names the action; don't put parameters in it. Your App works out what the button means from `action_id` and `card_revision` ([below](#revisions-and-stale-clicks)).
- A card has at most 4 buttons.
- Use `confirm: "prepare"` for actions that are hard to undo, and `undoWindowMs` for quick ones where a short undo is enough.
- Set `card_revision` and `business_revision` in the answer so that you can refuse a stale click.

**Client capabilities.** The request's `client_capabilities` lists what the reader's client can do. A reader gets buttons only with `button.v1`, a `confirm` button only with `confirm.v1`, and an `undoWindowMs` button only with `undo.v1`; Raft removes the rest from that reader's card. The web client declares all three. A server-local App's acting buttons also need `unreviewed_app.v1`, which a client declares when it confirms every press of an App Raft hasn't reviewed; without it the reader gets `navigate` buttons only. Your App declares nothing: these are between Raft and its clients. You can always send the full card. Read `client_capabilities` only if you want to show something else in place of a button the reader won't get.

## 4. Verify the request {#_4-verify-the-request}

Raft sends every prepare, execute and status request as an HTTP **POST** to your action endpoint, with `Content-Type: application/json`, an `Accept-Language` header and `Authorization: Bearer <assertion>`. The assertion is an ES256 JWT signed with the same keys as the preview assertion. Verify it with the JWKS from the discovery document at your configured Raft API origin, for example `https://api.raft.build/.well-known/openid-configuration`. Never select a JWKS URL from an unverified token claim.

**Check the body's bytes before you parse them:** hash the raw request body and compare it with `body_sha256` first.

| Header or claim | Required check |
| --- | --- |
| `alg`, `kid` | `ES256`; verify the signature against the matching published Raft key. |
| `typ` | `raft-card-action+jwt`. A preview assertion is never valid here, and this one is never valid at your preview callback. |
| `iss` | `<Raft API origin>/oidc/<server-id>`, where `<server-id>` equals the `server_id` claim. |
| `aud` | `urn:raft:card-action:<your-client-key>`: the client ID your [domain file](/developers/raft-apps/link-previews/#_1-prove-ownership-of-the-domain) names. |
| `token_use`, `type` | `card_action`, `human` |
| `phase` | `prepare`, `execute` or `status`; equal to the body's `phase`. |
| `iat`, `nbf`, `exp` | A valid time window. Assertions live at most 30 seconds, and an execute assertion can be shorter. Check `exp` again when you claim an execute ([step 6](#_6-answer-execute)). |
| `jti` | Unique for each request. Keep the ones you've seen until they expire, and refuse a repeat. |
| `body_sha256` | SHA-256 hex digest of the exact request body bytes. |
| `url_sha256` | For prepare and execute: SHA-256 hex digest of the body's `url` string as UTF-8. Don't normalize the URL yourself. A status body has no `url`. |
| `message_id` | The Raft message the card is on. |
| `server_id`, `installation_id` | The Server and installation you expect. A server-local App only ever gets its own Server. |
| `sub` | The person who clicked: the same human ID as Login with Raft. Apply your permissions to it. In a status request, it's the person who clicked originally. |
| `server_role` | `owner`, `admin`, `member` or `guest`: their role on that Server when Raft signed. It describes this request; it isn't a permission. Treat a missing or other value as `guest`. |

Raft calls only public addresses over HTTPS on port 443, never follows redirects, and gives each call **2.5 seconds** in total, DNS included. Your answer must be HTTP `200` with `Content-Type: application/json`, at most 32 KiB of strict JSON: no duplicate keys, no control characters in keys, valid Unicode, and no fields besides the ones each answer below lists. Raft treats anything else as no answer.

The body's `locale` is the reader's language as a BCP 47 tag, and `Accept-Language` carries the same tag. Write your confirmation text and toasts in it; if the two ever differ, `locale` wins.

This assertion is not an OAuth access token or ID token. Use it only for the request it came with. Don't log it, raw bodies or private card content.

Here is a backend-only Node sketch for a server-local App, using the [`jose`](https://github.com/panva/jose) library. An App that serves several Servers checks `iss` against each request's `server_id` claim instead of one configured Server.

```js
import { createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

const RAFT = process.env.RAFT_API_ORIGIN; // for example https://api.raft.build
const discovery = await (await fetch(`${RAFT}/.well-known/openid-configuration`)).json();
const jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
const sha256 = (data) => createHash("sha256").update(data).digest("hex");

// rawBody: the request body as a Buffer, exactly as received.
export async function verifyCardAction(authorization, rawBody) {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const { payload } = await jwtVerify(token, jwks, {
    algorithms: ["ES256"],
    typ: "raft-card-action+jwt",
    issuer: `${RAFT}/oidc/${process.env.RAFT_SERVER_ID}`,
    audience: `urn:raft:card-action:${process.env.RAFT_CLIENT_ID}`,
    requiredClaims: ["iat", "nbf", "exp", "jti", "sub"],
  });
  if (payload.token_use !== "card_action" || payload.type !== "human") throw new Error("not a card action");
  if (payload.server_id !== process.env.RAFT_SERVER_ID) throw new Error("wrong Server");
  if (payload.installation_id !== process.env.RAFT_INSTALLATION_ID) throw new Error("wrong installation");
  if (payload.body_sha256 !== sha256(rawBody)) throw new Error("body changed");
  const body = JSON.parse(rawBody.toString("utf8"));
  if (body.phase !== payload.phase) throw new Error("phase mismatch");
  if (body.phase !== "status" && payload.url_sha256 !== sha256(body.url)) throw new Error("URL mismatch");
  return { claims: payload, body };
}
```

## 5. Answer prepare {#_5-answer-prepare}

Raft sends prepare only for a `confirm: "prepare"` button, before it shows its dialog:

```json
{
  "version":2,
  "phase":"prepare",
  "url":"https://your-app.example/pr/123",
  "action_id":"merge",
  "card_revision":"r7",
  "claimed":{"business_revision":"b12"},
  "prepared_action_id":"5b1f0c9e-2d7a-4c1e-9f3b-8a6d2e4c7b10",
  "locale":"en"
}
```

Prepare must not change your business data. You may write bookkeeping, such as the prepared record below.

Run the same checks as execute: the person (`sub`) may do this action now, the action is still enabled under your current rules, and the object's current revision equals `claimed.business_revision`. If one fails, refuse:

```json
{"status":"refused","code":"NOT_ALLOWED"}
```

A refusal may carry `code` and `toast`, but the person sees Raft's fixed message that the action was not carried out. Otherwise, describe exactly what execute will do:

```json
{
  "status":"prepared",
  "description":{
    "prepared_action_id":"5b1f0c9e-2d7a-4c1e-9f3b-8a6d2e4c7b10",
    "action_id":"merge",
    "business_revision":"b12",
    "locale":"en",
    "read_at":"2026-11-10T09:30:00Z",
    "title":"Merge PR 123 into main?",
    "rows":[{"label":"Branch", "value":"fix-sign-in → main"}, {"label":"Method", "value":"Squash"}],
    "confirm_label":"Merge",
    "cancel_label":"Cancel"
  }
}
```

The answer has exactly these two fields.

| Field | Required | Contract |
| --- | --- | --- |
| `prepared_action_id`, `action_id` | Yes | The values from the request. |
| `business_revision` | Yes | The object's revision as you just read it; 1–512 characters. |
| `locale` | Yes | The language you wrote the text in, as a BCP 47 tag. |
| `read_at` | Yes | When you read the object: RFC 3339 in UTC, ending in `Z`, with an optional fraction of 1–9 digits, on a date that exists, such as `2026-11-10T09:30:00.120Z`. Raft keeps it exactly as you send it. |
| `title` | Yes | 1–120 characters. |
| `body`, `fine_print` | No | 0–500 characters each. |
| `rows` | No | Up to 8 items, each `{ "label": …, "value": … }` with a label of 1–40 and a value of 1–200 characters. |
| `confirm_label`, `cancel_label` | Yes | 1–40 characters each. |
| `target`, `execution_mode`, `execution_account` | No | Strings, for your own records. |
| `terms` | No | An object with up to 16 string values. Never put a secret in it. |

- A description holds only strings, objects and arrays: a number, boolean or `null` anywhere makes it invalid, as does an unknown or missing field. Lengths count Unicode code points.
- Raft's dialog shows `title`, `body`, `rows`, `fine_print` and your two labels as plain text, under Raft's own line with your App's name and domain. It doesn't show `target`, `execution_mode`, `execution_account` or `terms`, so put every value the person needs to see in `rows`.

**Keep a prepared record.** Store what you described under `prepared_action_id` for 5 minutes, with its digest:

```text
prepared_digest = lowercase hex( SHA-256( UTF-8( JCS(description) ) ) )
```

JCS is the JSON Canonicalization Scheme of RFC 8785. Raft computes the same digest over the description it received and sends it back with execute, so you know the person confirmed exactly what you described.

If your answer takes longer than 2.5 seconds or is invalid, the person sees that your App couldn't prepare the action, and can try again. Raft stores nothing and records no operation. Two prepares for the same button make two separate prepared records; only the one the person confirms reaches execute.

## 6. Answer execute {#_6-answer-execute}

```json
{
  "version":2,
  "phase":"execute",
  "url":"https://your-app.example/pr/123",
  "action_id":"merge",
  "card_revision":"r7",
  "claimed":{"business_revision":"b12"},
  "prepared_action_id":"5b1f0c9e-2d7a-4c1e-9f3b-8a6d2e4c7b10",
  "prepared_digest":"<64 lowercase hex characters>",
  "operation_id":"0d6e3a52-7c4b-4f8e-a1d9-3b5c7e9f2a14",
  "locale":"en",
  "update_token":"<opaque token>"
}
```

`prepared_action_id` and `prepared_digest` are present only for a `confirm: "prepare"` button. `operation_id` identifies this click. `update_token` lets you send one [terminal update](#_7-finish-later-with-a-terminal-update) for this operation within 10 minutes; treat it as a secret.

**One click is one operation, and Raft sends its execute once.** Raft never re-sends an execute, even when your answer is lost. The reader's client may retry its own request to Raft, and Raft answers those retries from its records without calling you again.

Check in this order:

1. The assertion, as in [step 4](#_4-verify-the-request).
2. **Claim the operation.** In one atomic step keyed by `operation_id`, such as an insert under a unique key, check that `exp` hasn't passed and record that you're running it. If `exp` has passed (the request waited too long), do nothing and answer HTTP `401`. If you already claimed this `operation_id`, return the answer you recorded and do nothing else. If you [marked it never to run](#an-operation-you-have-no-record-of), answer `failed_not_sent`.
3. The person: `sub` may do this action on this object now.
4. The action: still enabled under your current rules, even when `card_revision` is unchanged.
5. The revisions: `card_revision` is one you issued and still current for this action, and the object's current revision equals `claimed.business_revision`.
6. For a `confirm` button: your prepared record for `prepared_action_id` exists, hasn't expired, and has the digest in `prepared_digest`. If it expired, refuse with the code `STALE_PREPARED`.
7. Act, record the outcome under `operation_id`, and answer.

Answer with a status, and nothing else from this list: `status` (required), `code` (1–64 characters), `attribution` (1–200 characters), and `toast` (`{ "tone": "info" | "success" | "warning", "text": … }`, 1–200 characters).

```json
{"status":"done"}
```

| `status` | Meaning | The person sees |
| --- | --- | --- |
| `done` | You carried it out. | Done. Open the app to see the result. |
| `refused` | You decided not to act: no permission, a stale card, a disabled action or an expired confirmation. Nothing happened. | The action was not carried out. |
| `failed_not_sent` | You tried, and you can guarantee that nothing happened. | The action was not carried out. |
| `accepted` or `executing` | You took it on and will finish later. | Accepted. The app is finishing it. |
| `unknown` | You can't tell yet whether it happened. | The result isn't confirmed yet. |
| No answer in 2.5 seconds, an HTTP status other than `200`, an invalid answer, a dropped connection | Raft doesn't know. | The result isn't confirmed yet. |

- `done`, `refused` and `failed_not_sent` are final. Nothing changes a final state.
- **No answer is never a success.** Raft records the operation as `unknown` and finds out later through [status](#_8-answer-status-requests). Only when Raft's request never left (your endpoint's DNS failed, or its address isn't public) does Raft record that the action was not carried out.
- The person sees Raft's fixed message for the state, not the `toast`, `code` or `attribution` of your execute answer. Your own words reach them only through a status answer.
- If the work can take longer than about two seconds, answer `accepted` at once and finish later.

## 7. Finish later with a terminal update {#_7-finish-later-with-a-terminal-update}

When you answered `accepted`, `executing` or `unknown`, send the outcome as soon as you know it. From your backend, authenticate with your App's client ID and secret using **HTTP Basic**, as for registration, and call `POST /api/oauth/link-preview/card-updates`:

```json
{
  "update_token":"<the update_token from the execute request>",
  "update_id":"9a3c6f1e-update-1",
  "outcome":"done"
}
```

| Field | Contract |
| --- | --- |
| `update_token` | From the execute request. It works for 10 minutes after Raft sent the execute, for one update. |
| `update_id` | Your ID for this update: 1–128 characters of letters, digits and `. _ ~ : -`. Choose it once and store it before you send, so a retry reuses it. |
| `outcome` | `done`, `refused` or `failed_not_sent`. |
| `toast` | Optional, as in an execute answer. Raft accepts it but doesn't show it; to show your own words, answer a status request with a toast. |

The body is at most 8 KiB of strict JSON with only these fields.

| Answer | Meaning |
| --- | --- |
| `200` `{ "operation_id", "state", "receipt_revision" }` | Recorded. `state` is the operation's state now. If it was already final, the update is recorded and changes nothing. |
| `400` `INVALID_REQUEST` | The body is invalid. |
| `401` `INVALID_CLIENT` | The client credentials are wrong, or the App is disabled. |
| `409` `UPDATE_CONFLICT` | This token was already used with another `update_id` or other content. |
| `410` `UPDATE_TOKEN_INVALID` | The token is unknown, belongs to another App, has expired, or no longer matches its operation. Report the outcome through status instead. |
| `429` `RATE_LIMITED` or `LOCK_TIMEOUT` | Too many updates, or Raft was busy. Wait for `Retry-After` and retry with the same `update_id`. |
| `500` | Retry with the same `update_id`. |

Retrying with the same `update_id` and the same content returns the first answer again, even after the token expired. Raft accepts an update after the App was uninstalled, after card actions were withdrawn or after a registration change, but not once your App's credentials are disabled.

## 8. Answer status requests {#_8-answer-status-requests}

Raft asks your action endpoint about an operation after it sent the execute, when the clicker's client asks for news: while the message is on screen, about 2, 5, 15 and 60 seconds after the click and then every 5 minutes for up to 24 hours, and when the outcome changes. It asks at most once every 2 seconds per operation, and it may ask after the operation is final: that is how your toast reaches the person.

```json
{"version":2, "phase":"status", "operation_id":"0d6e3a52-7c4b-4f8e-a1d9-3b5c7e9f2a14", "locale":"en"}
```

Verify the assertion as in [step 4](#_4-verify-the-request); `sub` is the person who clicked. Answer from your records, with the same fields as an execute answer. `status` is one of `accepted`, `executing`, `done`, `refused`, `failed_not_sent`, `unknown` and `not_visible`:

```json
{"status":"done", "toast":{"tone":"success", "text":"Merged into main."}}
```

- A final status settles an open operation. `accepted` or `executing` moves an `unknown` operation to accepted. `unknown` changes nothing.
- Answer `not_visible` when `sub` may no longer see this object. Raft then shows nothing private. It never means "not carried out".
- Raft shows your `toast` only when your answer isn't `not_visible` and the person can still read the message. It doesn't store it.
- Raft asks only the action endpoint the execute went to. If your registration no longer has it (you changed or removed it, or the registration is suspended), Raft stops asking about that operation. Avoid changing your action endpoint while operations are open.
- An operation still `accepted` or `unknown` 24 hours after the click is marked for reconciliation. A final status answer can still settle it. Raft never re-sends the execute.

### An operation you have no record of {#an-operation-you-have-no-record-of}

A status request can arrive for an `operation_id` you never claimed: its execute may be lost, or still on its way. Never answer `not_visible` for this. Do one of these:

- Write a "never run" marker for that `operation_id`, in the same place and with the same atomic step you use to claim executions. Answer `failed_not_sent` only if the marker won. If an execute claimed the operation first, answer from that execute's record instead. Once the marker is written, an execute for that `operation_id`, from anyone, answers `failed_not_sent` and does nothing. Keep markers for at least 48 hours, and record `sub` and `installation_id` with them.
- If you can't do that atomically, answer `unknown`.

You refuse an execute whose `exp` has passed when you claim it, and that `exp` is never later than 10 minutes after the click was admitted. So removing a marker after 48 hours can't let a late execute through.

## Revisions and stale clicks {#revisions-and-stale-clicks}

Each acting button has a handle that Raft signed when it read the card. A handle works once and for at most 10 minutes, and it binds:

- the reader, the Server, your App, its installation and its registration;
- the message, its exact content and the link;
- the reader's client capabilities;
- the button: its `action_id` and props, and whether it needs a confirmation;
- the card's `card_revision` and `business_revision`.

Raft refuses a click, and reads the card again for the person, when something it can see has changed: the message was edited or deleted, the person can no longer read it or revoked their sign-in, your App was uninstalled or disabled, or your registration changed. A click with a handle older than 10 minutes is refused the same way.

**Raft can't see your data.** It doesn't compare `card_revision` or `business_revision` with anything; it passes them to you. Until a handle expires, a click on a card read before your object changed still reaches you with the old values, so refuse it yourself:

- `business_revision` is the version of the object the card shows. Change it whenever the object changes, such as a new draft, a new commit or a status change. At prepare and execute, refuse when the current one differs from `claimed.business_revision`.
- `card_revision` is the version of the card itself. The click carries no parameters, so make `card_revision` and `action_id` enough to tell exactly what the button meant, for example `d42.v3` for "draft 42, version 3".
- A button you have since disabled or removed can still be clicked on an older card. Decide from your current rules, not from what the card showed.

Both are strings you choose, 1–512 characters. After every refused or finished action, the reader's client reads the card again, so the person sees its current state.

## Limits {#limits}

| Limit | Value | Over it |
| --- | --- | --- |
| Prepare | 30 per person per Server per minute | `429` `RATE_LIMITED` |
| Execute | 30 per person per Server per minute, for all Apps together | `429` `RATE_LIMITED` |
| Execute for a server-local App | Also 10 per person per Server per App per minute | `429` `RATE_LIMITED` |
| Open operations of one person | 20 per Server, counting operations still in progress or unconfirmed | `429` `OPEN_OPERATIONS_CAP` |
| Open operations of one installation | 1,000, also counting those waiting for reconciliation | `429` `OPEN_OPERATIONS_CAP` |
| Open operations on one card | 1: while one is open, another click on that card is refused | `409` `VIEW_PENDING` |
| Status requests to your App | At most 1 per operation every 2 seconds | Raft answers from its records |
| Terminal updates | 600 per installation per minute | `429` `RATE_LIMITED`, with `Retry-After` |

When you test in a browser, a click can get these answers from Raft:

| Answer | Meaning |
| --- | --- |
| `404` | Card actions aren't available right now. The client stops offering acting buttons for the session. |
| `409` `VIEW_PENDING` | An earlier action on this card is still open. |
| `409` `HANDLE_USED` | This button was already used. |
| `410` `HANDLE_INVALID` | The card is out of date ([above](#revisions-and-stale-clicks)). The client reads it again. |
| `410` `PREPARED_INVALID` | The confirmation expired after 5 minutes, or doesn't match. Click again. |
| `410` `PROVIDER_NOT_ELIGIBLE` | Your App can't use acting buttons for this person now. For a server-local App: card actions aren't allowed on this Server, or the allowance was withdrawn. |
| `429` `RATE_LIMITED`, `OPEN_OPERATIONS_CAP` | A limit above. |
| `429` `LOCK_TIMEOUT` | Raft was briefly busy; the client retries the same request. |
| `502` `PREPARE_FAILED` | Your prepare answer didn't arrive within 2.5 seconds, or was invalid. |

## Example: approve a draft reply {#example-approve-a-draft-reply}

Drafts is a server-local support App. When a question comes in, it writes a reply, saves it as draft 42 and [posts as the App](/developers/raft-apps/bot/) in the thread: `Draft for @dana: https://drafts.example/d/42`. Dana, the assigned reviewer, approves it from the card, and Drafts then posts the reply in the thread.

**Register** the preview callback and the action endpoint:

```json
{
  "origin":"https://drafts.example",
  "endpoint":"https://drafts.example/raft/preview",
  "action_endpoint":"https://drafts.example/raft/actions",
  "paths":["/d"],
  "preview_versions":[1, 2, 3]
}
```

Then an owner or admin allows card actions for `https://drafts.example/raft/actions` in the App's settings.

**Answer the version 2 request.** For a reader who can see draft 42, return a block card. `business_revision` is the draft's version, and `card_revision` names the draft and its version:

```json
{
  "version":3,
  "items":[
    {
      "type":"card",
      "placement":"block",
      "title":"Draft reply to Lee",
      "card_revision":"d42.v3",
      "business_revision":"v3",
      "card":{
        "root":"main",
        "elements":{
          "main":{"type":"Stack", "props":{}, "children":["state", "text", "buttons"]},
          "state":{"type":"Badge", "props":{"text":"Waiting for review", "tone":"review"}},
          "text":{"type":"Text", "props":{"text":"Thanks for the report. The fix ships in 2.4 on Monday."}},
          "buttons":{"type":"Stack", "props":{"direction":"row"}, "children":["approve", "open"]},
          "approve":{"type":"Button", "props":{"label":"Approve", "action":{"kind":"execute", "action_id":"approve", "confirm":"prepare"}}},
          "open":{"type":"Button", "props":{"label":"Open", "variant":"ghost", "action":{"kind":"navigate", "url":"https://drafts.example/d/42"}}}
        }
      }
    }
  ]
}
```

For anyone other than Dana, send the same card with `"disabledReason":"Only Dana can approve this draft."` in the Approve button's props, or leave the button out. A reader who can't see the draft at all gets `{"version":3,"items":[]}`, the plain link.

Because Raft didn't review Drafts, Raft asks Dana to confirm every press of its acting buttons.

**Prepare.** When Dana clicks **Approve**, Drafts verifies the assertion, checks that `sub` is draft 42's assigned reviewer and that the draft is still at `v3`, and answers:

```json
{
  "status":"prepared",
  "description":{
    "prepared_action_id":"5b1f0c9e-2d7a-4c1e-9f3b-8a6d2e4c7b10",
    "action_id":"approve",
    "business_revision":"v3",
    "locale":"en",
    "read_at":"2026-11-10T09:30:00Z",
    "title":"Send this reply to the thread?",
    "body":"Thanks for the report. The fix ships in 2.4 on Monday.",
    "rows":[{"label":"Draft", "value":"Version 3"}, {"label":"Posts as", "value":"Drafts"}],
    "confirm_label":"Send reply",
    "cancel_label":"Cancel"
  }
}
```

It stores the description and its digest under `prepared_action_id` for 5 minutes.

**Execute.** When Dana confirms, Drafts:

1. Verifies the assertion, and claims `operation_id`, checking `exp` as it does.
2. Checks that `sub` is still draft 42's assigned reviewer. If the draft was reassigned meanwhile, it answers `{"status":"refused"}`.
3. Checks that `card_revision` is `d42.v3` and the draft is still at `v3`. If someone edited the draft to `v4` meanwhile, it answers `refused`. Dana's client reads the card again and shows version 4, with a new **Approve** button.
4. Checks its prepared record: it exists, is under 5 minutes old, and its digest equals `prepared_digest`.
5. Posts the reply in the thread as the App, records the result under `operation_id`, and answers `{"status":"done"}`. If posting fails before anything was sent, it answers `failed_not_sent`.

When the next status request arrives, Drafts answers `done` with a toast such as "Reply sent to the thread.", which Dana sees.

## Troubleshooting {#troubleshooting}

| Symptom | Check |
| --- | --- |
| Only `navigate` buttons show, for people on your own Server | Card actions aren't allowed for the App yet (the settings screen is coming soon), you changed `action_endpoint` after they were allowed, or the registration is suspended. Otherwise the reader's client doesn't confirm presses for Apps Raft hasn't reviewed (`unreviewed_app.v1`); no released client does yet. |
| Only `navigate` buttons show, for people on another Server | Expected. Only people reading from the App's own Server get its acting buttons. |
| Acting buttons stopped after you created a share link or published the App | Expected. The App is no longer made for your Server alone, so it can't use own-Server card actions anywhere, your own Server included. Revoking the link doesn't change that. |
| One kind of acting button is missing, others show | The reader's client didn't declare `confirm.v1` or `undo.v1` for that kind of button. |
| The whole card is a plain link | The answer is invalid. Check that each `execute` action has exactly one of `confirm` and `undoWindowMs`, that `action_id`s are unique, and that the card has at most 4 buttons. |
| Clicks keep answering `410` | Something bound into the handle keeps changing. A deploy script that sends a different registration on every start, for example a different action endpoint or set of paths, stops every button on screen each time. |
| Clicks answer `429` | A [limit](#limits). A server-local App gets 10 executes per person per minute. |
| People see that your App couldn't prepare the action | Your prepare answer took longer than 2.5 seconds, wasn't HTTP `200` with `application/json`, had fields besides `status` and `description`, had IDs that differ from the request's, or broke the description rules. |
| People keep seeing that the result isn't confirmed | You didn't answer execute within 2.5 seconds, or answered `accepted` or `unknown` and never finished. Send a terminal update within 10 minutes, or answer status with a final status. |
| A terminal update returns `410` `UPDATE_TOKEN_INVALID` | The token is older than 10 minutes, or belongs to another App. Answer the next status request instead. |

Test with two people: the one who may act and one who may not. Also test a click on a card read before the object changed, an execute answer slower than 2.5 seconds, a status request for an `operation_id` you never saw, withdrawing card actions while a card is open, and an `exp` that passed while the execute waited in your queue. In each case, nothing may happen twice, and nothing may happen for a person your App doesn't allow.
