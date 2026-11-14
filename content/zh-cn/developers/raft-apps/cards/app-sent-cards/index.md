---
llms_section: "Developers zh-CN"
llms_order: 1894
llms_summary: "当你的应用机器人要发出一张按钮能执行操作的卡片、并且可以只让指定的一个人操作时阅读：发送和更新的字段（actions、for）、人和旧版客户端看到什么、同意、按下后如何到达你的操作端点、message_card_actions_not_allowed 等拒绝、上限、哪些应用可以发送执行操作的按钮，以及客户端支持。"
---

# 应用发送的卡片

你的应用机器人可以发出一条卡片消息，上面的按钮能执行操作。有人按下其中一个时，Raft 调用你应用的操作端点，和 [链接卡片操作](/zh-cn/developers/raft-apps/cards/link-card-actions/) 完全一样。你可以指定唯一一个可以按这些按钮的人，比如要批准一个申请的所有者。对话里的其他人也能看到这张卡片，但按钮是禁用的。

应用发送的卡片从 Raft 1.27.0 起可用。要带类型地发送 `actions` 和 `for`，需要 0.35.1 之后发布的 `@botiverse/raft-sdk`。0.35.1 及更早的版本没有这两个字段的类型，但在纯 JavaScript 里会原样传过去。哪些客户端会显示这些按钮，见 [客户端支持](#client-support)。

## 开始之前 {#before-you-start}

- **你的应用以自己的身份发消息。** 它在这个服务器上已经获得授权的 [发消息的身份](/zh-cn/developers/raft-apps/bot/)，你的后端保存着这个机器人的 `sk_agent_*` 密钥。
- **你了解卡片格式。** 应用发送的卡片就是一条 [卡片消息](/zh-cn/developers/sdk/external-agents/card-messages/)，元素、上限和文字规则都一样。本页只讲执行操作的按钮额外带来的内容。
- **你的应用有一份带操作端点的链接预览注册。** Raft 从里面取两样东西：按钮页面必须所在的源，以及它要调用的操作端点。按 [应用链接预览](/zh-cn/developers/raft-apps/cards/link-previews/) 的第 1、2 步（证明域名、注册）操作，再 [注册操作端点](/zh-cn/developers/raft-apps/cards/link-card-actions/#_1-register-the-action-endpoint)。对应用发送的卡片，Raft 不会调用你的预览回调。
- **你的应用可以在这个服务器上发送执行操作的按钮。** 见 [谁可以发送执行操作的按钮](#who-can-send-acting-buttons)。
- **你的操作端点能回答 prepare、execute 和 status 请求**，做法见 [链接卡片操作](/zh-cn/developers/raft-apps/cards/link-card-actions/#_4-verify-the-request) 的第 4 到 8 步。

## 工作方式 {#how-it-works}

1. 你的后端以应用机器人的身份发出一条卡片消息。和 `card` 并列，`actions` 说明哪些 `Button` 元素执行操作，`for` 可以指定唯一一个可以按它们的人。
2. Raft 检查这次发送：你的应用可以在这里发送执行操作的按钮，`actions` 的每个键都对应一个 `Button`，对话不是联合频道，`for` 是一个能阅读这段对话的人。任何一项不通过，就什么也不发出。
3. Raft 保存这张卡片。每个执行操作的按钮都保存为禁用的 `navigate` 按钮，这样不能按它的客户端也能画出整张卡片。
4. 有人阅读这条消息时，他的客户端向 Raft 询问他可以按哪些按钮。只有他现在可以按的执行操作的按钮，Raft 才会为它给出一个只能用一次的 handle。
5. 这个人按下按钮。从这里开始，一切都和链接卡片一样：Raft 的确认对话框或撤销倒计时，然后是发往你的操作端点、带有按下者签名的 prepare 和 execute 请求。
6. 你的应用执行、回答，然后更新卡片，显示发生了什么。

## 1. 发送卡片 {#_1-send-the-card}

把每个执行操作的按钮写成普通的 `navigate` 按钮。它的 `action.url` 是你应用里这个按钮所操作对象的页面，必须是你的链接预览注册所在源上的 `https` 地址。然后把这个按钮的元素 ID 写进 `actions`。

这张卡片请 Dana 批准一个 Agent 使用部署密钥。**Approve** 和 **Deny** 执行操作；**Open request** 只打开页面：

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

用 SDK 的程序层（0.35.1 之后发布的 `@botiverse/raft-sdk`）和机器人的密钥发送它：

```ts
import { createRaftClient } from "@botiverse/raft-sdk";

const client = createRaftClient({
  serverUrl: "https://api.raft.build",
  credential: process.env.RAFT_BOT_KEY!, // 机器人的 sk_agent_* 密钥
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
  // 两个都要保存：识别按下和更新卡片时都要用到。
  await saveCardMessage({ requestId: 42, messageId: sent.data.messageId, revision: sent.data.messageCard?.revision });
}
```

`sendV2` 接受这些字段：

| 字段 | 约定 |
| --- | --- |
| `target` | 发到哪里，和机器人发的任何消息一样：机器人所在的频道、一个消息列，或一个私信。`dm:sub:<sub>` 用你的应用从 Login with Raft 得到的某人的 `sub` 指定和这个人的私信。不能是联合频道，也不能是联合频道里的消息列。 |
| `card` | 卡片，使用 [卡片消息的格式](/zh-cn/developers/sdk/external-agents/card-messages/#what-a-card-can-show)。 |
| `actions` | 一个对象，键是 `Button` 元素的 ID，值是这个按钮的操作：`{ "kind": "execute", "action_id": …, "confirm": "prepare" }` 或 `{ "kind": "execute", "action_id": …, "undoWindowMs": … }`。1 到 4 项。规则和链接卡片相同：`action_id` 匹配 `^[a-z][a-z0-9_]{0,31}$`，每个执行操作的按钮各不相同；`undoWindowMs` 为 1000 到 10000；每个操作只能有 `confirm` 和 `undoWindowMs` 中的一个。 |
| `for` | 可选。唯一一个可以按这些执行操作的按钮的人：你的应用从 Login with Raft 得到的这个人的 `sub`。需要同时有 `actions`。它必须是这个服务器上的成员，不是访客，并且现在能阅读这段对话。 |
| `content` | 可选。通知、搜索和 Slack 显示的消息文字。不写的话，Raft 根据卡片生成。 |
| `idempotencyKey` | 可选。重试时再发同一个键，就不会发出两次。 |

Raft 会这样处理它们：

- **把每个执行操作的按钮保存为禁用状态。** 在保存的卡片里，`actions` 里提到的每个按钮都会得到 `disabledReason: "Update Raft to use this button"`，覆盖你设置的任何 `disabledReason`。不能按执行操作按钮的客户端会把它画成禁用，显示这句话，也从不打开它的 URL。`actions` 没有提到的按钮保持你发送时的样子。
- **提及 `for` 指定的人。** 如果你的 `content` 没有提及这个人，Raft 会另起一行加上 `@name`，这样他会像被任何提及一样收到通知。Raft 把这个提及绑定到这个人本身，而不是名字。
- **把执行操作的按钮写成说明在哪里按的文字。** 在 Raft 根据卡片生成的文字里，执行操作的按钮显示为 `Approve (in Raft)`。Agent 读到的卡片里是 ``Approve (in Raft, for `@dana`)``。

发送成功时，回答和任何发送一样，带着这条消息。保存 `messageId` 和 `messageCard.revision`（新卡片是 1）：

```json
{ "ok": true, "state": "sent", "messageId": "…", "messageCard": { "revision": 1 } }
```

## 2. 大家看到什么 {#_2-what-people-see}

卡片对每个人都一样。不同的是谁可以按它的执行操作的按钮。一个人只有在下面这些条件现在都满足时才能按：

- 他是这个服务器的成员，不是访客，并且能阅读这段对话；
- 卡片没有 `for`，或者他就是 `for` 指定的人；
- 他已经同意你的应用知道他是谁（[见下文](#consent-on-first-press)）；
- 你的应用仍然可以在这个服务器上使用执行操作的按钮（[谁可以发送执行操作的按钮](#who-can-send-acting-buttons)）；
- 他的客户端能画出执行操作的按钮（[客户端支持](#client-support)）。

Agent 从不按按钮。

| 谁 | 他在执行操作的按钮上看到什么 |
| --- | --- |
| `for` 指定的人；没有 `for` 时，任何可以按的人 | 按钮，可用。 |
| 卡片有 `for` 时，其他所有人 | 禁用，显示「等待 {name} 处理」。 |
| 从没同意过你的应用知道他是谁的人 | 按钮，可用。第一次按下时会先询问（[见下文](#consent-on-first-press)）。 |
| 关闭了你的应用的人 | 禁用，显示「你已关闭 {app}。」，并提供重新允许的方法。 |
| 现在因为其他原因不能按的人，比如访客 | 禁用。网页版显示「按钮暂不可用」。 |
| 使用不支持应用发送卡片的客户端的读者 | 禁用，显示「Update Raft to use this button」。 |

`navigate` 按钮对所有人都能用。

### 第一次按下时的同意 {#consent-on-first-press}

你的应用会知道是谁按的。所以一个人必须先同意一次，让你的应用可以知道他是谁。这和链接卡片用的是同一份同意：通过 Login with Raft 登录过你的应用算，允许过你应用的链接预览也算。

如果一个人从没同意过，按钮看起来是可用的。他第一次按下时，会打开 Raft 的提示「允许 {app}？」，说明他在这里查看你应用的链接或使用它的按钮时，你的应用会知道是他。他允许之前，什么都不会发给你的应用。允许之后，客户端会重新读取卡片。接下来要经过 Raft 确认的按下会继续进入确认；官方应用的撤销倒计时按钮则需要这个人再按一次，这样允许你的应用本身永远不会执行操作。如果他选择 **暂不**，什么都不会记录，下次按下时还会再问。在 **设置 → 应用** 里关闭了你的应用的人，在重新允许之前看到的按钮都是禁用的。

## 3. 回答按下 {#_3-answer-presses}

一次按下到达你的操作端点时，就是链接卡片会发的那些 prepare、execute 和 status 请求。按 [链接卡片操作](/zh-cn/developers/raft-apps/cards/link-card-actions/#_4-verify-the-request) 的第 4 到 8 步验证并回答它们。频率上限、进行中的操作、提示消息、终态更新和对账也都一样。

在应用发送的卡片上，下面这些值来自你的卡片消息：

| 请求里的 | 值 |
| --- | --- |
| `message_id`（声明） | 卡片消息的 ID：你的发送返回的 `messageId`。 |
| `url`（请求体）、`url_sha256`（声明） | 被按下按钮的 `action.url`，和你写在卡片里的一样。 |
| `action_id` | 这个按钮在 `actions` 里的 `action_id`。 |
| `card_revision`、`claimed.business_revision` | 都是卡片的修订版本号，字符串形式：发送后是 `"1"`，第一次更新后是 `"2"`，依此类推。 |
| `sub` | 按下的人。在有 `for` 的卡片上，总是那个人。 |

用 `message_id` 和 `url` 找到卡片对应的申请。每次 prepare 和 execute，也要检查你自己的状态：`sub` 仍然可以做决定，申请仍然未处理。在你的 prepare 回答里，`business_revision` 是你刚读到的对象的修订版本，和链接卡片一样。

**Raft 会拒绝在过时卡片上的按下。** 每个 handle 都绑定了卡片的修订版本和消息的文字。你一更新卡片，在旧修订版本按钮上的按下就会得到 `410 HANDLE_INVALID`，这个人的客户端会重新读取卡片。当这个人已经不能再按时（[见上文](#_2-what-people-see)），Raft 也会拒绝：`410 HANDLE_INVALID`；如果是你的应用不能再使用执行操作的按钮，则是 `410 PROVIDER_NOT_ELIGIBLE`。按下可能得到的其他回答列在 [上限](/zh-cn/developers/raft-apps/cards/link-card-actions/#limits) 里。

## 4. 更新卡片 {#_4-update-the-card}

执行之后，替换卡片来显示结果，并去掉不再适用的按钮。先回答 execute 请求，再更新卡片。

```ts
import { createRaftAgent } from "@botiverse/raft-sdk/agent";

const raft = createRaftAgent({ serverUrl: "https://api.raft.build", credential: process.env.RAFT_BOT_KEY! });

const updated = await raft.messages.updateCard({
  messageId, // the stored messageId, a plain string
  card: decidedCard,
  content: "Dana approved builder-bot's use of the deploy key.",
  expectedRevision: 1,
  idempotencyKey: "access-request-42-decided",
});
if (updated.ok) await saveRevision(42, updated.data.revision); // 2
```

这里的 `decidedCard` 写明发生了什么，只保留一个 `navigate` 按钮：

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

更新遵循 [更新卡片](/zh-cn/developers/sdk/external-agents/card-messages/#update-a-card) 里的规则，另外还有这些：

- **`actions` 替换执行操作的按钮。** `raft.messages.updateCard` 目前还不接受 `actions`，所以暂时不能用 SDK 做保留执行按钮的更新。带 `actions` 的更新会按当前状态做和发送时一样的检查：你的应用仍然可以在这里发送执行操作的按钮，每个键都对应新卡片里的一个 `Button`，对话不是联合频道。
- **不带 `actions` 的更新会结束执行操作的按钮。** 这时新卡片里的每个 `Button` 都是会打开 URL 的普通 `navigate` 按钮。想让按钮留在卡片上但不能用，就给它写上你自己的 `disabledReason`。
- **`for` 保持发送时的值。** 更新时不要写它。`for` 指定了其他人的更新会被拒绝。
- **每次更新都产生一个新的修订版本。** 旧修订版本上的按钮停止工作，客户端会画出新卡片。
- **让原本没有执行操作按钮的卡片有了这类按钮的更新**，会计入 [发送上限](#limits)。
- **14 天后就不能再更新卡片。** 只要你的应用还能使用执行操作的按钮，它们就会继续工作，所以对已经处理过的申请，要拒绝之后的按下。

更新不会通知任何人，`for` 指定的人也不会收到通知。

## 错误 {#errors}

被 Raft 拒绝的发送或更新，不会发出或改变任何东西。Raft 也从不改为发送一张去掉了执行操作按钮的卡片。

| 回答 | 含义 |
| --- | --- |
| `400` `message_card_actions_not_allowed` | Raft 不能保存这张卡片的 `actions` 或 `for`。`error` 会说明是哪条规则没通过（见下文）。 |
| `400` `card_invalid` | 卡片违反了一条 [卡片规则](/zh-cn/developers/sdk/external-agents/card-messages/#what-a-card-can-show)。 |
| `404` `target_not_found` | 机器人不能发到这个目标。一个在这个服务器上指不到任何人的 `dm:sub:<sub>` 也会得到这个回答。 |
| `409` `channel_archived` | 这段对话已归档。 |
| `429` `RATE_LIMITED` | 带执行操作按钮的发送太多。等到 `Retry-After` 之后再发。 |

`message_card_actions_not_allowed` 表示下面的某一种情况：

- 发送者不是应用机器人。其他 Agent 不能发送 `actions` 或 `for`。
- `actions` 或 `for` 没有和 `card` 一起发送，或者 `for` 没有和 `actions` 一起发送。
- `actions` 不是 1 到 4 项，某个键没有对应卡片里的 `Button` 元素，某个操作不是有效的 execute 操作，或者两个按钮用了同一个 `action_id`。
- 你的应用现在不能在这个服务器上使用执行操作的按钮。见 [谁可以发送执行操作的按钮](#who-can-send-acting-buttons)。
- 这段对话是联合频道，或者联合频道里的消息列。
- 某个执行操作按钮的 `action.url` 不是你的链接预览注册所在源上的 `https` 地址。
- `for` 指定的不是这个服务器上、不是访客、并且现在能阅读这段对话的成员。指不到任何人的 `sub` 也得到同样的回答。
- 在更新里，`for` 指定的人不是发送卡片时指定的那个人。

```json
{
  "error": "Acting buttons don't work in a joint channel or a thread in one yet.",
  "code": "message_card_actions_not_allowed",
  "errorCode": "message_card_actions_not_allowed",
  "suggestedNextAction": "send the card without actions and for, or fix what the error names"
}
```

在 SDK 里，拒绝会以 `{ ok: false, error }` 返回，其中 `error.kind` 是 `"http"`，`error.errorCode` 是这个代码。

## 上限 {#limits}

| 上限 | 值 | 超过时 |
| --- | --- | --- |
| 带执行操作按钮的发送 | 每个应用在每个服务器上每分钟 30 次。让原本没有执行操作按钮的卡片有了这类按钮的更新也算在内。 | `429` `RATE_LIMITED`，带 `Retry-After` |
| 卡片更新 | 和任何 [卡片消息](/zh-cn/developers/sdk/external-agents/card-messages/#update-a-card) 一样：发送后 14 天内，每条消息每分钟 10 次，每个发送者每小时 300 次 | `429` `RATE_LIMITED` |
| 按下 | 和 [链接卡片操作](/zh-cn/developers/raft-apps/cards/link-card-actions/#limits) 一样 | 见那里的列表 |

## 谁可以发送执行操作的按钮 {#who-can-send-acting-buttons}

你的应用机器人发送或更新带 `actions` 的卡片时、每次客户端询问一个人可以按哪些按钮时、以及每次 prepare 和 execute 时，Raft 都会套用下面的规则。如果你的应用在发出卡片之后不再满足这些规则，卡片上执行操作的按钮就会停止工作：读者拿不到这些按钮，按下会被拒绝，返回 `410 PROVIDER_NOT_ELIGIBLE`。

只有在下面 **所有** 条件都满足时，你的应用才能在一个服务器上发送执行操作的按钮：

1. 发送者是你的应用在这个服务器上的机器人。你的应用已启用，在这个服务器上的安装处于生效状态。
2. 你的应用有一份没有被暂停的链接预览注册，并且 Raft 在过去 72 小时内确认过它的域名文件。Raft 会自己再次检查这个文件，请持续提供它。
3. 你的应用属于下面两种之一：
   - **官方应用**：Raft 批准为官方、并且有生效中操作端点的应用。新的或改动过的操作端点要先经过 Raft 审核才会生效。它在安装了你的应用的每个服务器上都可用。
   - **在这个服务器上创建的应用**：服务器本地应用，没有发布，也从未通过链接分享。必须由这个服务器上能管理集成的人，为它现在的这个操作端点 [允许它的卡片操作](/zh-cn/developers/raft-apps/cards/link-card-actions/#_2-allow-card-actions-on-your-own-server)。一旦你通过链接分享了这个应用或发布了它，这一条在任何地方都不再适用，之后撤销链接也一样。
4. 这段对话不是联合频道，也不是联合频道里的消息列。
5. 每个执行操作按钮的 `action.url` 都是你的注册所在源上的 `https` 地址。

Raft 没有审核过在服务器上创建的应用。所以对这类应用，Raft 每次按下都会请这个人确认，并且只在会这样确认的客户端里显示它的执行操作的按钮。网页版和 1.25 及以后的手机 App 会这样确认。

其他任何应用都不能发送执行操作的按钮。它们仍然可以发送带 `navigate` 按钮的卡片。

## 客户端支持 {#client-support}

| 客户端 | 带执行操作按钮的应用发送的卡片 |
| --- | --- |
| 网页版 | Raft 1.27.0 及以后 |
| 手机 App | 手机 App 1.25 及以后 |
| 更早的网页版和手机 App | 画出整张卡片。执行操作的按钮显示为禁用，带「Update Raft to use this button」。 |
| Agent | 以文字读取卡片。执行操作的按钮显示为 ``Approve (in Raft, for `@dana`)``。 |
| 通知、搜索、Slack | 显示消息的文字。 |

## 故障排查 {#troubleshooting}

| 现象 | 检查 |
| --- | --- |
| 发送被拒绝，原因是你的应用不能在这个服务器上执行卡片操作 | 逐条核对 [谁可以发送执行操作的按钮](#who-can-send-acting-buttons)。对在这个服务器上创建的应用：还没有允许卡片操作，允许之后改过 `action_endpoint`，或者应用已经被分享或发布。 |
| 发送在某个执行操作按钮的 URL 处被拒绝 | 它的 `action.url` 必须是你的链接预览注册所在源上的 `https` 地址，不能是你的任意页面。 |
| 发送在 `for` 处被拒绝 | `for` 是这个人从 Login with Raft 得到的 `sub`，不是名字。他必须是这个服务器的成员，不是访客，并且能阅读这段对话。在私有频道里，他必须在这个频道中。 |
| 按钮上显示「Update Raft to use this button」 | 读者用的网页版早于 Raft 1.27.0，或者手机 App 早于 1.25。 |
| 除了一个人以外，大家都看到「等待 … 处理」 | 正常：这张卡片有 `for`。 |
| 第一次按下时询问「允许 {app}？」 | 正常：这个人从没同意过你的应用知道他是谁。 |
| 本该能按的人看到按钮一直是禁用的 | 他可能是访客，可能关闭了你的应用，或者你的应用已经不再满足 [这些规则](#who-can-send-acting-buttons)。对在这个服务器上创建的应用，他的客户端可能不会为 Raft 没有审核过的应用确认按下。 |
| 你更新卡片之后，按下得到 `410` | 正常：旧修订版本的按钮已经停止工作。客户端会重新读取卡片。 |
| 你想结束的按钮还会打开页面 | 你更新卡片时没有带 `actions`，所以它们变成了 `navigate` 按钮。去掉它们，或者给它们写上 `disabledReason`。 |

用三个人测试：`for` 指定的人、对话里的另一位成员和一位访客。还要测试更新卡片之后的按下、撤回卡片操作或改动 `action_endpoint` 之后的按下，以及一个从没登录过你的应用的人第一次按下。
