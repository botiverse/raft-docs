---
llms_section: "Developers"
llms_order: 891
llms_summary: "Read when your App should show a card in Raft chat: link cards Raft fetches for links to your App, cards your App's bot sends itself, navigate and acting buttons, and which guide to follow."
---

# Cards

A card is a small layout that Raft draws inside a message: a title, a state, a few lines of text and up to four buttons. Your App sends JSON, and Raft draws it with its own components. Your App never sends HTML or JavaScript to the chat client.

Your App can put a card in chat in two ways.

## Two kinds of card {#two-kinds-of-card}

**Link cards.** Someone posts a link to your App, such as a PR or a ticket. Raft asks your App's callback for a card for that link, once for each person who reads the message, and draws the card next to the link. Your App decides what each reader sees, so two people can see different cards for the same link. See [App link previews](/developers/raft-apps/cards/link-previews/).

**App-sent cards.** Your App's bot posts a card message itself, for example an access request sent to the person who has to decide. Everyone in the conversation sees the same card. Your App can update the card later, for example to say "Approved by Dana". See [App-sent cards](/developers/raft-apps/cards/app-sent-cards/).

| | Link cards | App-sent cards |
| --- | --- | --- |
| Who posts the message | Anyone who posts a link to your App | Your App's bot |
| Where the card comes from | Your callback, each time someone reads the message | The message itself; your App replaces it with an update |
| What each reader sees | Their own card | The same card. Only who may press a button differs. |
| What your App needs | A [link-preview registration](/developers/raft-apps/cards/link-previews/) | A [posting identity](/developers/raft-apps/bot/). For acting buttons, also a link-preview registration with an action endpoint. |
| Card format | The [link preview catalog](/developers/raft-apps/cards/link-previews/#newer-versions) | The [card message format](/developers/sdk/external-agents/card-messages/#what-a-card-can-show) |

## Buttons {#buttons}

A card has two kinds of button.

- **`navigate` buttons** open a URL. Every App can use them. On a link card the URL must be on your App's origin. On an App-sent card it can be any public `https` URL.
- **Acting buttons** do something without leaving Raft. When a person presses one, Raft calls your App's **action endpoint** with a signed statement of who pressed which button on which card. Your App checks that this person may do it, acts, and answers. Raft shows the result. An acting button either asks the person to confirm first (`confirm: "prepare"`), or gives them a few seconds to undo (`undoWindowMs`).

Acting buttons work the same way on both kinds of card: the same action endpoint, the same signed requests and the same answers. [Link card actions](/developers/raft-apps/cards/link-card-actions/) documents that protocol. Not every App may use acting buttons. Each guide says which Apps may.

## Which to use {#which-to-use}

- **Use a link card** when the thing already has a URL on your App and people share it in conversation, and when what a person may see depends on who they are. Your callback can show each reader only what they are allowed to see.
- **Use an App-sent card** when your App starts the conversation: a request, an approval or a status that your App posts on its own. Everyone who can read the message sees the whole card, so put nothing on it that some readers must not see. To let only one person act, name them with `for`.
- **Use a `navigate` button** when the next step needs your App's own page, more input, or more than a short confirmation.
- **Use an acting button** when one press is enough and you can describe its effect in a few lines. Use `confirm: "prepare"` for actions that are hard to undo, and `undoWindowMs` for quick ones.

## Guides {#guides}

- [App link previews](/developers/raft-apps/cards/link-previews/): prove your domain, register a callback, and return a card for each reader.
- [Link card actions](/developers/raft-apps/cards/link-card-actions/): acting buttons on link cards, and the action endpoint protocol that App-sent cards use too.
- [App-sent cards](/developers/raft-apps/cards/app-sent-cards/): your App's bot sends a card with acting buttons, optionally for one person.
