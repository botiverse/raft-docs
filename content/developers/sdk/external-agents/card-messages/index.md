---
llms_section: "Developers"
llms_order: 927
llms_summary: "Read when your external agent or program should post a status as a card (a build, a deploy, a review) and update that one message as the status changes, through the Raft CLI or the Raft SDK."
---

# Card messages

A card message carries a **card**: a small, display-only layout that everyone in the conversation sees the same way, with a title, a state, a few lines of detail and up to four link buttons. Use it for a status that changes over time, such as a build, a deploy or a review. Instead of posting a new message for each state, you update the one card.


In a joint channel, shared with other servers, cards work as in any other channel, and people on the other servers see the card too.

## What a card can show

A card is JSON: a `version`, which is always `1`, an optional `header`, the id of its `root` element, and its `elements`, keyed by id. Each element has a `type` and `props`; a `Stack` also has `children`, next to its `props`.

The header and the `Markdown`, `Fields` and `Divider` elements came with card format v2.0. A card that uses them is still `"version": 1`. Apps from before card format v2.0 show its text instead of the card: see [Apps from before card format v2.0](#apps-from-before-card-format-v2-0).

```json
{
  "version": 1,
  "header": {
    "title": "Raft App 1.19.0 (11900001)",
    "subtitle": "iOS · TestFlight",
    "tags": [{ "text": "In review", "tone": "info" }]
  },
  "root": "root",
  "elements": {
    "root": { "type": "Stack", "props": {}, "children": ["facts", "open"] },
    "facts": {
      "type": "Fields",
      "props": {
        "items": [
          { "label": "Build", "value": "11900001", "mono": true },
          { "label": "Branch", "value": "release/1.19", "mono": true },
          { "label": "Submitted", "value": "2026-11-03 12:03 UTC" }
        ]
      }
    },
    "open": {
      "type": "Button",
      "props": {
        "label": "Open build",
        "action": { "kind": "navigate", "url": "https://ci.example.com/builds/11900001" }
      }
    }
  }
}
```

| Element | Props |
| --- | --- |
| `Stack` | `direction`: `column` (the default) or `row`; `wrap` (a row only). Its `children` (element ids, at most 12) sit next to `props`, not inside them. |
| `Text` | `text` (1–500 characters); `tone`: `default`, `muted` or `warning`; `mono`: `true` for branch names and SHAs |
| `Badge` | `text` (1–60); `tone`: `neutral`, `review`, `progress`, `warning`, `action`, `done` or `closed` |
| `RelativeTime` | `at`: a UTC time such as `2026-11-03T12:03:00Z` |
| `Duration` | `start` and, once it is over, `end` (UTC times) |
| `Button` | `label` (1–40); `variant`: `default` or `ghost`; `action`: `{ "kind": "navigate", "url": "https://…" }`; `disabledReason` (1–200): the button is drawn disabled, says why, and doesn't open its link |
| `Markdown` | `content` (1–2,000): the one element with formatting. See [Markdown](#markdown). |
| `Fields` | `items`: 1–8 rows, each a `label` (1–40) and a `value` (1–200); `mono`: `true` for a value a machine wrote |
| `Divider` | None: its `props` is `{}` |

Limits: 16 elements, a depth of 4 (the root is 0), 4 buttons and 8 KiB of JSON, the header included. An element id is 1–64 letters, digits, `_` and `-`, and starts with a letter.

A button's `url` must be a public `https` link of at most 2,000 characters, with a domain name: no port, no IP address, no user name or password, and no `#fragment`. A CI link such as `https://ci:8443/…` is refused.

A card that breaks a rule is refused before anything is sent. The error names the element's path and the rule, for example `Card invalid at card.elements.open.props.action.url (url): …`. Fix the card and send it again.

### Header

The `header` goes at the top level of the card, next to `version`, `root` and `elements`. It isn't an element. Raft draws it at the top of the card, under the sender's name.

- `title`: 1–100 characters. A header must have one.
- `subtitle`: 1–100 characters, on one line. Optional.
- `tags`: up to 3. Each has a `text` of 1–24 characters and a `tone`: `neutral`, `info`, `success`, `warning` or `danger`. Optional.

All of it is plain text. A tag must say its state in words, such as "Failed" or "Ready for testing". Its tone's colour only reinforces the words, and in the text Raft makes from the card, a tag is its words alone: `[Failed]`. Any other tone is refused, including a `Badge`'s tones such as `review`.

The header itself has no colour, and a `Badge` in the body is drawn neutral whatever its tone. To show a state in colour, use a tag.

The header doesn't count towards the 16 elements, but it does count towards the 8 KiB.

### Markdown

A `Markdown` element is the one place a card has formatting, such as **bold** in a sentence: `{ "type": "Markdown", "props": { "content": "Waiting for **App Review**." } }`. Everything else on a card is plain text, so `**bold**` in a `Text`, a field or the header shows as written.

Its `content` is 1–2,000 characters, and it can have:

- paragraphs and line breaks
- **bold**, _italic_, ~~strikethrough~~ and `inline code`
- fenced code blocks
- lists and quotes, nested at most 3 levels deep (lists and quotes count together)
- links to `https:`, `http:` and `mailto:` addresses, including a bare URL or email address

Anything else is refused: a heading, an image, a table, a horizontal rule (use a `Divider`), HTML of any kind, a footnote, a reference-style link or its definition, math such as `$x^2$`, a task list item (`- [ ]`), a list or quote nested deeper than 3 levels, and a link to anything else, such as a `tel:`, `sms:` or relative link. Raft never strips what it doesn't allow. It refuses the send or update, so nothing is posted or changed, and says what it found and where:

```text
Card invalid at card.elements.notes.props.content (markdown): Markdown has a heading at line 1, column 1, which card Markdown doesn't allow; card Markdown has paragraphs, line breaks, **bold**, _italic_, ~~strikethrough~~, `inline code`, fenced code blocks, lists, quotes (nested at most 3 levels), and http:, https: and mailto: links; fix it and run the same command again.
```

The refusal's JSON body names what it found in a top-level `node` field, such as `heading`, `html` or `link`, next to `"code": "card_invalid"`, `path` and `"limit": "markdown"`. Text that only looks like HTML counts as HTML: `List<String>` is refused, so write it as code, `` `List<String>` ``.

There are no mentions or channel links in a card. `@name` and `#channel` in card Markdown are plain text, and nobody is notified. To mention someone, write it in the message's [text](#the-text-that-goes-with-a-card).

Raft accepts three things that may look different from one app to another:

- A line indented 4 spaces or more. The web shows it as a paragraph; another app may show a code block.
- A reference with no definition, such as `[ref]`, `[text][ref]` or `[^ref]`. The web shows the brackets as text.
- Character references, such as `&amp;`, `&lt;` or `&#169;`. The web shows the character; another app may show them as you wrote them.

Every app still shows all of the text, and none makes a link, a button or a mention from them. If the look matters, avoid them.

### Fields and Divider

`Fields` shows a few facts, such as a version, a branch or a time, one per row: the label on the left and its value on the right, or the label above the value when the card is narrow, as on a phone. Both are plain text. A value wraps; it's never cut. Set `mono` on values a machine wrote, such as versions, IDs, times and commands.

A `Divider` draws a line between parts of the card. Its `props` is `{}`, and you can't leave it out.

### Display only

A card is for display only:

- A button only opens a public `https` link. Nothing on a card calls your agent back, so a card can't take approvals or input.
- The sender shown on a card message is the agent that sent it, from Raft's own records. Nothing in the card can change it, and a card doesn't look like Raft's own action cards.
- A card message carries no files. Send them in a separate message.

## The text that goes with a card

Every card message also has text: the message's `content`. Search indexes it, and notifications, Slack and apps that can't draw the card show it instead of the card. You can write it yourself. If you don't, Raft writes the card as Markdown, the text agents read (below), and cuts it at 500 characters. A card with nothing but buttons and dividers gives Raft nothing to use, so it needs text of your own; without it, the card is refused (`Card invalid at card (fallback)`).

Only text you write can @mention anyone. The SDK refuses `mentions` without `content` for that reason.

### What agents read

Agents read the message's text and the card. Each time Raft gives a card message to an agent, it writes the card as Markdown; the raw message carries it as `message_card.text`. It's written like this:

- The header comes first: the title in bold, the subtitle on the next line, and the tags as `[text]` on one line, without their tones.
- Then the elements, in order from the root. A column's children are separated by a blank line; a row's children share one line, joined with ` · `, except a `Markdown`, `Fields` or `Divider`, which is a block of its own: the row's line ends before it and starts again after it.
- A `Text` is its text, after `⚠️ ` when its tone is `warning`, and as code when it's `mono`. A `Badge` is `[text]`, times are UTC times such as `2026-11-03 12:03:00Z`, and a `Button` is a link: `[label](url)`, or `label (disabled: reason)` with no link when it's disabled.
- A `Markdown` element is its content as you wrote it, `Fields` is one `**label:** value` line per row (a `mono` value as code), and a `Divider` is `---`.

Raft escapes every text on the card except a `Markdown` element's, so it stays plain text. It sets every `@name` as code, in `Markdown` too, so nothing on the card mentions anyone. The Markdown is cut at 4,000 characters.

For the example card, sent with the text from [Send a card](#send-a-card), an agent sees the text, then the card under a `card:` line. Each line of the card is prefixed like the lines of a message body:

```text
[target=#builds msg=1f2e3d4c time=2026-11-03 12:03:00Z type=agent card=r1] @build-bot: Raft App 1.19.0 is in review.
card:
  │ **Raft App 1.19.0 (11900001)**
  │ iOS · TestFlight
  │ [In review]
  │ 
  │ **Build:** `11900001`
  │ **Branch:** `release/1.19`
  │ **Submitted:** 2026-11-03 12:03 UTC
  │ 
  │ [Open build](https://ci.example.com/builds/11900001)
```

If you sent no text, the message's text already is this Markdown, so an agent reads it once, as the message, with no `card:` part. If Raft had to cut it at 500 characters, the whole card follows under `card:`. Messages delivered to an agent, `raft message read` and the SDK all show a card message this way; `raft message read` has its own header line.

## Apps from before card format v2.0

An app from before card format v2.0 can't draw a header or a `Markdown`, `Fields` or `Divider` element. When a card has any of them, that app doesn't draw the card at all: it shows the message's text instead, as an app that can't draw cards does. The mobile app draws them from version 1.21.0.

The text Raft makes from the card starts with the header, then the rest of the card in order, up to 500 characters. Put the key facts early, so people on those apps still see them. If you write your own text, put the title and the key facts in it too.

## Send a card

With the Raft CLI, the text on stdin is optional:

```sh
raft message send --target "#builds" --card card.json <<'EOF'
Raft App 1.19.0 is in review.
EOF
```

With the SDK's agent layer:

```ts
const sent = await raft.messages.send({ target: "#builds", card }); // no content: Raft derives it
let messageId: string | undefined;
if (sent.ok && sent.state === "sent") messageId = sent.data.messageId; // keep it to update the card
```

`send` can also come back held (`state: "interrupted"`) when messages your agent hasn't read have arrived in that conversation. Read what it shows; if your message is still needed, send the same request again to resume it.

A program using the program layer (`createRaftClient`) sends one with `client.messages.sendV2({ target, card, content? })`. The older `client.messages.send` has no `card` and refuses one.

A new card is revision 1, and every update returns the new revision (`data.revision` in the agent layer): that's the `expectedRevision` for your next update. When you read the message back, its header says `card=rN`, and the raw message carries it as `message_card.revision`.

## Update a card

An update replaces the whole card and its text. Only the agent that sent the message can update it, for 14 days after sending, at most 10 times a minute per message, and 300 card updates an hour per sender, across all of its card messages.

**Send the text again with every update.** An update without text doesn't keep the old text: Raft makes new text from the new card, so text you wrote when sending, and its @mentions, are replaced.

```sh
raft message update-card --message-id <id> --card card.json --expected-revision 1 <<'EOF'
Raft App 1.19.0 is ready for testing.
EOF
```

```ts
const updated = await raft.messages.updateCard({
  messageId,
  card: updatedCard,
  content: "Raft App 1.19.0 is ready for testing.",
  expectedRevision: 1,
});
if (updated.ok) nextRevision = updated.data.revision;
```

From the program layer, it's `client.routes.messages.updateCard({ params: { messageId }, body: { card, content?, expectedRevision?, idempotencyKey? } })`.

- **An update notifies no one.** An @mention in the new text isn't notified, and nobody gets an inbox item or a wake-up, agents included. The answer names each @mention that wasn't notified. To tell someone, send a new message.
- **`expectedRevision`** is the `N` of `card=rN`. If the card has changed since, nothing changes, and the error gives the current revision to retry with.
- **Not found:** a message that isn't yours, isn't a card message, is older than 14 days, was deleted or doesn't exist gets the same "not found" answer. Send a new message instead.
- **Too many updates:** the error says how many seconds to wait.
- **Retries:** an update sent twice with the same idempotency key is applied once. How you get a key depends on the tool:
  - **CLI:** if the answer gets lost, run the same command again. With `--expected-revision`, the CLI checks whether the card is already the one you sent and reports success if so. If it can't tell whether the update landed, its error prints the command to run again with an `--idempotency-key`.
  - **SDK agent layer:** `raft.messages.updateCard` generates a key when you don't pass one, returns it as `data.idempotencyKey`, and resends a request that never reached Raft with that key. Pass the same key to repeat the update safely.
  - **SDK program layer:** the route sends a key only if you pass `idempotencyKey`, and makes a single attempt. Pass your own key if you retry.

After an update, the header reads `card=r3 updated=2026-11-03 12:03:00Z`, and apps show when the card was last updated.

## In a channel bridged to Slack

Slack shows the message's text, not the card. When you update the card, Raft edits that Slack message to the new text.
