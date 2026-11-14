---
llms_section: "Developers"
llms_order: 894
llms_summary: "Read when your App's bot should send a card whose buttons act, optionally for one person: actions and for, what people see, consent, presses, refusals, limits, which Apps may, client support."
---

# App-sent cards

Your App's bot can send a card message whose buttons act. When a person presses one, Raft calls your App's action endpoint, exactly as for a [link card action](/developers/raft-apps/cards/link-card-actions/). You can name the one person who may press the buttons, such as the owner who has to approve a request. Everyone else in the conversation sees the card, with the buttons disabled.

App-sent cards are available from Raft 1.27.0. For which clients show the buttons, see [Client support](#client-support).

## Before you start {#before-you-start}

- **Your App posts as itself.** It has a [posting identity](/developers/raft-apps/bot/) granted on the Server, and your backend holds the bot's `sk_agent_*` key.
- **You know the card format.** An App-sent card is a [card message](/developers/sdk/external-agents/card-messages/), with the same elements, limits and text rules. This page covers only what acting buttons add.
- **Your App has a link-preview registration with an action endpoint.** Raft takes two things from it: the origin your buttons' pages must be on, and the action endpoint it calls. Follow [App link previews](/developers/raft-apps/cards/link-previews/) steps 1 and 2 (prove the domain, register), then [register the action endpoint](/developers/raft-apps/cards/link-card-actions/#_1-register-the-action-endpoint). Raft doesn't call your preview callback for an App-sent card.
- **Your App may send acting buttons on this Server.** See [Who can send acting buttons](#who-can-send-acting-buttons).
- **Your action endpoint answers prepare, execute and status requests**, as [Link card actions](/developers/raft-apps/cards/link-card-actions/#_4-verify-the-request) steps 4 to 8 describe.

## How it works {#how-it-works}

1. Your backend sends a card message as the App's bot. Next to the `card`, `actions` says which `Button` elements act, and `for` optionally names the one person who may press them.
2. Raft checks the send: your App may send acting buttons here, every key of `actions` names a `Button`, the conversation isn't a joint channel, and `for` is a person who can read it. If any check fails, nothing is posted.
3. Raft stores the card. Each acting button is stored as a disabled `navigate` button, so clients that can't press it still draw the whole card.
4. When someone reads the message, their client asks Raft for the buttons they may press. Raft gives them a single-use handle for each acting button only if they may press it now.
5. The person presses. From here everything is as for a link card: Raft's confirmation dialog or undo countdown, then the prepare and execute requests to your action endpoint, signed with who pressed.
6. Your App acts, answers, and then updates the card to show what happened.

## 1. Send the card {#_1-send-the-card}

Write each acting button as an ordinary `navigate` button. Its `action.url` is the page in your App for the thing the button acts on, and it must be `https` on your link-preview registration's origin. Then list the button's element id in `actions`.

This card asks Dana to approve an agent's use of a deploy key. **Approve** and **Deny** act; **Open request** only navigates:

```json
{
  "version": 1,
  "header": { "title": "Access request: deploy key" },
  "root": "root",
  "elements": {
    "root": { "type": "Stack", "props": {}, "children": ["what", "row"] },
    "what": { "type": "Text", "props": { "text": "builder-bot asks to use the deploy key until 18:00 UTC." } },
    "row": { "type": "Stack", "props": { "direction": "row" }, "children": ["approve", "deny", "open"] },
    "approve": { "type": "Button", "props": { "label": "Approve", "action": { "kind": "navigate", "url": "https://your-app.example/requests/42" } } },
    "deny": { "type": "Button", "props": { "label": "Deny", "variant": "ghost", "action": { "kind": "navigate", "url": "https://your-app.example/requests/42" } } },
    "open": { "type": "Button", "props": { "label": "Open request", "variant": "ghost", "action": { "kind": "navigate", "url": "https://your-app.example/requests/42" } } }
  }
}
```

Send it with the SDK's program layer, using the bot's key:

```ts
import { createRaftClient } from "@botiverse/raft-sdk";

const client = createRaftClient({
  serverUrl: "https://api.raft.build",
  credential: process.env.RAFT_BOT_KEY!, // the bot's sk_agent_* key
});

const sent = await client.messages.sendV2({
  target: `dm:sub:${danaSub}`,
  content: "builder-bot asks to use the deploy key.",
  card,
  actions: {
    approve: { kind: "execute", action_id: "approve", confirm: "prepare" },
    deny: { kind: "execute", action_id: "deny", undoWindowMs: 5000 },
  },
  for: danaSub,
  idempotencyKey: "access-request-42",
});
if (!sent.ok) throw new Error(sent.error.message);
if (sent.data.state === "sent") {
  // Keep both: you need them to recognise presses and to update the card.
  await saveCardMessage({ requestId: 42, messageId: sent.data.messageId, revision: sent.data.messageCard?.revision });
}
```

The SDK sends `POST /internal/agent-api/v2/send` on your Raft API origin, with `Authorization: Bearer <the bot's sk_agent_* key>` and the fields below as a JSON body. You can make the same request yourself.

| Field | Contract |
| --- | --- |
| `target` | Where to post, as for any message from the bot: a channel the bot is a member of, a thread, or a DM. `dm:sub:<sub>` names a DM with a person by the `sub` your App got for them from Login with Raft. Not a joint channel, nor a thread in one. |
| `card` | The card, in the [card message format](/developers/sdk/external-agents/card-messages/#what-a-card-can-show). |
| `actions` | An object from a `Button` element id to that button's action: `{ "kind": "execute", "action_id": …, "confirm": "prepare" }` or `{ "kind": "execute", "action_id": …, "undoWindowMs": … }`. 1 to 4 entries. Same rules as on a link card: `action_id` matches `^[a-z][a-z0-9_]{0,31}$` and is different on every acting button, `undoWindowMs` is 1000 to 10000, and each action has exactly one of `confirm` and `undoWindowMs`. |
| `for` | Optional. The one person who may press the acting buttons: the `sub` your App got for them from Login with Raft. Needs `actions`. It must name a member of this Server who isn't a guest and who can read the conversation now. |
| `content` | Optional. The message text that notifications, search and Slack show. Without it, Raft derives it from the card. |
| `idempotencyKey` | Optional. Send the same key again to retry without posting twice. |

What Raft does with them:

- **It stores each acting button disabled.** In the stored card, every button named in `actions` gets `disabledReason: "Update Raft to use this button"`, written over any `disabledReason` you set. A client that can't press acting buttons draws the button disabled with that text, and never opens its URL. Buttons not named in `actions` stay as you sent them.
- **It mentions the `for` person.** If your `content` doesn't mention them, Raft appends `@name` on its own line, so they're notified as any mention notifies. Raft binds the mention to the person, not to the name.
- **It writes acting buttons as text that says where to press them.** In a text Raft derives from the card, an acting button reads `Approve (in Raft)`. Agents read the card as ``Approve (in Raft, for `@dana`)``.

A send that succeeds answers with the message, like any send. Keep `messageId` and `messageCard.revision` (1 for a new card):

```json
{ "ok": true, "state": "sent", "messageId": "…", "messageCard": { "revision": 1 } }
```

## 2. What people see {#_2-what-people-see}

The card is the same for everyone. What differs is who may press its acting buttons. A person may press them only when all of these hold now:

- they are a member of this Server and not a guest, and they can read the conversation;
- the card has no `for`, or they are the `for` person;
- they have agreed that your App may know who they are ([below](#consent-on-first-press));
- your App may still use acting buttons on this Server ([Who can send acting buttons](#who-can-send-acting-buttons));
- their client can draw acting buttons ([Client support](#client-support)).

Agents never press buttons.

| Who | What they see on an acting button |
| --- | --- |
| The `for` person, or with no `for` anyone who may press | The button, enabled. |
| Everyone else, when the card has a `for` | Disabled, with "Waiting for {name}". |
| Someone who never agreed that your App may know who they are | The button, enabled. Their first press asks first ([below](#consent-on-first-press)). |
| Someone who turned your App off | Disabled, with "You turned off {App}." and a way to allow it again. |
| Anyone else who can't press now, such as a guest | Disabled. The web app says "This button isn't available right now". |
| A reader on a client without App-sent card support | Disabled, with "Update Raft to use this button". |

`navigate` buttons work for everyone.

### Consent on first press {#consent-on-first-press}

Your App learns who pressed. So a person must agree once that your App may know who they are. This is the same agreement link cards use: signing in to your App through Login with Raft counts, and so does allowing your App's link previews.

If a person never agreed, the buttons look enabled. Their first press opens Raft's prompt, "Allow {App}?", which says your App will know it's them when they view its links or use its buttons. Nothing is sent to your App before they allow. Once they do, the client reads the card again. A press that leads to Raft's confirmation goes on to it; on an undo-window button of an official App, the person presses again, so that allowing your App never runs an action by itself. If they choose **Not now**, nothing is recorded, and their next press asks again. A person who turned your App off in **Settings → Apps** sees the buttons disabled until they allow it again.

## 3. Answer presses {#_3-answer-presses}

A press reaches your action endpoint as the same prepare, execute and status requests a link card sends. Verify and answer them as [Link card actions](/developers/raft-apps/cards/link-card-actions/#_4-verify-the-request) steps 4 to 8 describe. Rate limits, open operations, toasts, terminal updates and reconciliation are the same too.

On an App-sent card, these values come from your card message:

| In the request | Value |
| --- | --- |
| `message_id` (claim) | The card message's ID: the `messageId` your send returned. |
| `url` (body), `url_sha256` (claim) | The pressed button's `action.url`, as you wrote it in the card. |
| `action_id` | The button's `action_id` from `actions`. |
| `card_revision`, `claimed.business_revision` | Both the card's revision, as a string: `"1"` after the send, `"2"` after the first update, and so on. |
| `sub` | The person who pressed. On a card with `for`, always that person. |

Use `message_id` and `url` to find the request the card is about. On every prepare and execute, check your own state as well: that `sub` may still decide, and that the request is still open. In your prepare answer, `business_revision` is your object's revision as you just read it, as for a link card.

**Raft refuses presses on an outdated card.** Each handle is bound to the card's revision and the message's text. Once you update the card, a press on a button of the old revision gets `410 HANDLE_INVALID`, and the person's client reads the card again. Raft also refuses a press when the person may no longer press ([above](#_2-what-people-see)): `410 HANDLE_INVALID`, or `410 PROVIDER_NOT_ELIGIBLE` when your App may no longer use acting buttons. The other answers a press can get are listed in [Limits](/developers/raft-apps/cards/link-card-actions/#limits).

## 4. Update the card {#_4-update-the-card}

After you act, replace the card to show the outcome, and remove the buttons that no longer apply. Answer the execute request first, then update the card.

```ts
const updated = await client.routes.messages.updateCard({
  params: { messageId },
  body: {
    card: decidedCard,
    content: "Dana approved builder-bot's use of the deploy key.",
    expectedRevision: 1,
    idempotencyKey: "access-request-42-decided",
  },
});
if (updated.ok) await saveRevision(42, updated.data.revision); // 2
```

Here `decidedCard` says what happened and keeps only a `navigate` button:

```json
{
  "version": 1,
  "header": { "title": "Access request: deploy key", "tags": [{ "text": "Approved", "tone": "success" }] },
  "root": "root",
  "elements": {
    "root": { "type": "Stack", "props": {}, "children": ["what", "open"] },
    "what": { "type": "Text", "props": { "text": "Approved by Dana. builder-bot can use the deploy key until 18:00 UTC." } },
    "open": { "type": "Button", "props": { "label": "Open request", "variant": "ghost", "action": { "kind": "navigate", "url": "https://your-app.example/requests/42" } } }
  }
}
```

The update is `PUT /internal/agent-api/messages/:messageId/card`. It follows the rules in [Update a card](/developers/sdk/external-agents/card-messages/#update-a-card), with these additions:

- **`actions` replaces the acting buttons.** An update with `actions` gets the same checks as a send, against the state now: your App may still send acting buttons here, every key names a `Button` of the new card, and the conversation isn't a joint channel.
- **An update without `actions` ends the acting buttons.** Every `Button` in the new card is then an ordinary `navigate` button that opens its URL. To keep a button visible but unusable, give it your own `disabledReason`.
- **`for` stays as you sent it.** Leave it out of updates. An update whose `for` names anyone else is refused.
- **Every update makes a new revision.** Buttons on the old revision stop working, and clients draw the new card.
- **An update that gives acting buttons to a card that had none** counts toward the [send limit](#limits).
- **After 14 days you can't update the card.** Its acting buttons keep working while your App may use them, so refuse presses on requests you already decided.

An update notifies no one, not even the `for` person.

## Errors {#errors}

A send or update that Raft refuses posts or changes nothing. Raft never sends the card without its acting buttons instead.

| Answer | Meaning |
| --- | --- |
| `400` `message_card_actions_not_allowed` | Raft can't store this card's `actions` or `for`. The `error` says which rule failed (see below). |
| `400` `card_invalid` | The card breaks a [card rule](/developers/sdk/external-agents/card-messages/#what-a-card-can-show). |
| `404` `target_not_found` | The bot can't post to this target. A `dm:sub:<sub>` that names no one on this Server gets this answer. |
| `409` `channel_archived` | The conversation is archived. |
| `429` `RATE_LIMITED` | Too many sends with acting buttons. Wait for `Retry-After` and send again. |

`message_card_actions_not_allowed` means one of these:

- The sender isn't an App's bot. Other agents can't send `actions` or `for`.
- `actions` or `for` came without a `card`, or `for` came without `actions`.
- `actions` doesn't have 1 to 4 entries, a key doesn't name a `Button` element of the card, an action isn't a valid execute action, or two buttons share an `action_id`.
- Your App may not use acting buttons on this Server now. See [Who can send acting buttons](#who-can-send-acting-buttons).
- The conversation is a joint channel or a thread in one.
- An acting button's `action.url` isn't `https` on your link-preview registration's origin.
- `for` doesn't name a member of this Server who isn't a guest and can read the conversation now. A `sub` that names no one gets the same answer.
- In an update, `for` names someone other than the person the card was sent for.

```json
{
  "error": "Acting buttons don't work in a joint channel or a thread in one yet.",
  "code": "message_card_actions_not_allowed",
  "errorCode": "message_card_actions_not_allowed",
  "suggestedNextAction": "send the card without actions and for, or fix what the error names"
}
```

In the SDK, a refusal comes back as `{ ok: false, error }` with `error.kind` `"http"` and `error.errorCode` set to the code.

## Limits {#limits}

| Limit | Value | Over it |
| --- | --- | --- |
| Sends with acting buttons | 30 per App per Server per minute. An update that gives acting buttons to a card that had none counts too. | `429` `RATE_LIMITED`, with `Retry-After` |
| Card updates | As for any [card message](/developers/sdk/external-agents/card-messages/#update-a-card): within 14 days of sending, 10 per message per minute, 300 per sender per hour | `429` `RATE_LIMITED` |
| Presses | As for [link card actions](/developers/raft-apps/cards/link-card-actions/#limits) | As listed there |

## Who can send acting buttons {#who-can-send-acting-buttons}

Raft applies these rules when your App's bot sends or updates a card with `actions`, every time a client asks which buttons a person may press, and again on every prepare and execute. If your App stops meeting them after it sent a card, the card's acting buttons stop working: readers get none, and presses are refused with `410 PROVIDER_NOT_ELIGIBLE`.

Your App can send acting buttons on a Server only while **all** of these hold:

1. The sender is your App's bot on that Server. Your App is enabled and its installation on that Server is active.
2. Your App has a link-preview registration that isn't suspended, and Raft has confirmed its domain file within the last 72 hours. Raft checks the file again by itself; keep serving it.
3. Your App is one of these two kinds:
   - **An official App:** one Raft approved as official, with an action endpoint in force. Raft reviews a new or changed action endpoint before it is in force. It works on every Server where your App is installed.
   - **An App made on this Server:** a server-local App, not published and never shared by link. A person who can manage integrations on this Server must [allow its card actions](/developers/raft-apps/cards/link-card-actions/#_2-allow-card-actions-on-your-own-server) for the exact action endpoint it has now. Once you share the App by link or publish it, this no longer applies anywhere, even if you revoke the link.
4. The conversation is not a joint channel or a thread in one.
5. Each acting button's `action.url` is `https` on your registration's origin.

Raft hasn't reviewed an App made on a Server. So for such an App, Raft asks the person to confirm every press, and shows its acting buttons only in clients that do this. The web app does.

<!-- TODO(AppFather): confirm that the mobile app (1.25 and later) confirms every press for an App Raft hasn't reviewed on App-sent cards (declares unreviewed_app.v1 with card.execute.v1); then name it in the sentence above. -->

Any other App can't send acting buttons. It can still send cards with `navigate` buttons.

## Client support {#client-support}

| Client | App-sent cards with acting buttons |
| --- | --- |
| Web app | Raft 1.27.0 and later |
| Mobile app | Mobile app 1.25 and later |
| Older web and mobile apps | Draw the whole card. Acting buttons show disabled, with "Update Raft to use this button". |
| Agents | Read the card as text. An acting button reads ``Approve (in Raft, for `@dana`)``. |
| Notifications, search, Slack | Show the message's text. |

## Troubleshooting {#troubleshooting}

| Symptom | Check |
| --- | --- |
| The send is refused because your App can't run card actions on this Server | Go through [Who can send acting buttons](#who-can-send-acting-buttons). For an App made on this Server: card actions aren't allowed yet, `action_endpoint` changed after they were allowed, or the App was shared or published. |
| The send is refused at an acting button's URL | Its `action.url` must be `https` on the origin of your link-preview registration, not just any page of yours. |
| The send is refused at `for` | `for` is the person's `sub` from Login with Raft, not a name. They must be a member of this Server, not a guest, and able to read the conversation. In a private channel, they must be in it. |
| The buttons say "Update Raft to use this button" | The reader's app is older than Raft 1.27.0 on the web, or older than mobile app 1.25. |
| Everyone but one person sees "Waiting for …" | Expected: the card has a `for`. |
| The first press asks "Allow {App}?" | Expected: the person never agreed that your App may know who they are. |
| The buttons stay disabled for someone who should be able to press | They may be a guest, may have turned your App off, or your App may no longer meet [the rules](#who-can-send-acting-buttons). For an App made on this Server, their client may not confirm presses for Apps Raft hasn't reviewed. |
| Presses answer `410` after you updated the card | Expected: the old revision's buttons stopped. The client reads the card again. |
| Buttons you meant to end still open a page | You updated the card without `actions`, so they became `navigate` buttons. Remove them, or give them a `disabledReason`. |

Test with three people: the `for` person, another member of the conversation, and a guest. Also test a press after you updated the card, a press after you withdrew card actions or changed `action_endpoint`, and the first press of someone who never signed in to your App.
