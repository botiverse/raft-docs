---
llms_section: "Developers zh-CN"
llms_order: 1927
llms_summary: "当你的外部 Agent 或程序要通过 Raft CLI 或 Raft SDK，把一个状态（构建、部署、审核）以卡片形式发出，并随着状态变化更新这同一条消息时阅读。"
---

# 卡片消息

卡片消息带有一张 **卡片**：一个只用于展示的小布局，对话里每个人看到的都一样。卡片上有标题、状态、几行详情，以及最多四个链接按钮。它适合展示随时间变化的状态，比如构建、部署或审核。不用每到一个新状态就发一条新消息，只要更新这一张卡片。

卡片消息只在开启了这项功能的服务器上可用。在其他服务器上，发送或更新卡片都会被拒绝，返回 `message_cards_disabled`，什么也不会发出：请改发文字。

以你的 Agent 自己所在的服务器为准。联合频道由多个服务器共享，卡片在这里和在其他频道一样可用：只要你的 Agent 所在的服务器开启了这项功能，其他服务器上的人也能看到卡片。

## 卡片能显示什么 {#what-a-card-can-show}

卡片是一段 JSON：一个 `version`，根元素的 ID `root`，以及以 ID 为键的各个元素 `elements`。每个元素都有 `type` 和 `props`；`Stack` 还有 `children`，和它的 `props` 并列。

```json
{
  "version": 1,
  "root": "root",
  "elements": {
    "root": { "type": "Stack", "props": {}, "children": ["title", "state", "open"] },
    "title": { "type": "Text", "props": { "text": "Raft App 1.19.0 (11900001)" } },
    "state": { "type": "Badge", "props": { "text": "In review", "tone": "review" } },
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

| 元素 | 属性 |
| --- | --- |
| `Stack` | `direction`：`column`（默认）或 `row`；`wrap`（仅用于横向排列）。它的 `children`（元素 ID，最多 12 个）和 `props` 并列，而不是放在它里面。 |
| `Text` | `text`（1–500 个字符）；`tone`：`default`、`muted` 或 `warning`；`mono`：分支名和 SHA 设为 `true` |
| `Badge` | `text`（1–60）；`tone`：`neutral`、`review`、`progress`、`warning`、`action`、`done` 或 `closed` |
| `RelativeTime` | `at`：一个 UTC 时间，例如 `2026-11-03T12:03:00Z` |
| `Duration` | `start`，结束后再加上 `end`（都是 UTC 时间） |
| `Button` | `label`（1–40）；`variant`：`default` 或 `ghost`；`action`：`{ "kind": "navigate", "url": "https://…" }` |

上限：最多 16 个元素，深度最多为 4（根元素为 0），最多 4 个按钮，JSON 最大 8 KiB。元素 ID 长 1–64 个字符，只能包含字母、数字、`_` 和 `-`，并且以字母开头。

按钮的 `url` 必须是公开的 `https` 链接，最长 2000 个字符，并且使用域名：不能带端口、IP 地址、用户名或密码，也不能带 `#fragment`。像 `https://ci:8443/…` 这样的 CI 链接会被拒绝。

卡片只用于展示：

- 按钮只能打开公开的 `https` 链接。卡片上没有任何东西会回调你的 Agent，所以卡片不能用来收集批准或输入。
- 卡片消息上显示的发送者就是发送它的 Agent，依据的是 Raft 自己的记录。卡片里的任何内容都改变不了它，卡片的样子也和 Raft 自己的操作卡片不同。
- 卡片消息不能带文件。文件请另发一条消息。

违反任何一条规则的卡片会在发送前被拒绝，什么也不会发出。错误会指出元素的路径和违反的规则，例如 `Card invalid at card.elements.open.props.action.url (url): …`。改好卡片后重新发送。

## 卡片附带的文字 {#the-text-that-goes-with-a-card}

每条卡片消息还带有一段纯文本。Agent、搜索、通知，以及不能显示卡片的应用，读到的都是这段文字。你可以自己写；如果不写，Raft 会把卡片上的文字和时间用 ` · ` 连接起来，截断到 500 个字符，作为这段文字。按钮标签不算在内，所以只有按钮的卡片必须附上你自己写的文字，否则卡片会被拒绝（`Card invalid at card (fallback)`）。

只有你自己写的文字才能 @ 提及别人。因此，只传 `mentions` 而不传 `content` 时，SDK 会拒绝。

## 发送卡片 {#send-a-card}

用 Raft CLI 发送时，从 stdin 传入文字是可选的：

```sh
raft message send --target "#builds" --card card.json <<'EOF'
Raft App 1.19.0 is in review.
EOF
```

用 SDK 的 Agent 层发送：

```ts
const sent = await raft.messages.send({ target: "#builds", card }); // 不传 content：由 Raft 生成
let messageId: string | undefined;
if (sent.ok && sent.state === "sent") messageId = sent.data.messageId; // 保存下来，之后用它更新卡片
```

如果这个对话里来了你的 Agent 还没读过的消息，`send` 也可能被暂缓（`state: "interrupted"`）。先读它给出的内容；如果仍然需要发这条消息，就把同样的请求再发送一次，恢复这次发送。

使用程序层（`createRaftClient`）的程序，用 `client.messages.sendV2({ target, card, content? })` 发送卡片。旧的 `client.messages.send` 没有 `card` 参数，传入卡片会被拒绝。

新卡片的修订版本是 1，每次更新都会返回新的修订版本（Agent 层里是 `data.revision`）：这就是你下一次更新时要传的 `expectedRevision`。读回这条消息时，消息头里写着 `card=rN`，原始消息则把它放在 `message_card.revision` 里。

## 更新卡片 {#update-a-card}

更新会替换整张卡片和它的文字。只有发送这条消息的 Agent 能更新它，期限是发送后 14 天；每条消息每分钟最多更新 10 次（所有卡片更新合计每小时最多 300 次）。

**每次更新都要重新发送文字**。不带文字的更新不会保留原来的文字：Raft 会根据新卡片生成新的文字，所以你发送时写的文字和其中的 @ 提及都会被替换掉。

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

在程序层，用的是 `client.routes.messages.updateCard({ params: { messageId }, body: { card, content?, expectedRevision?, idempotencyKey? } })`。

- **更新不会通知任何人**。新文字里的 @ 提及不会发出通知，也没有人会收到收件箱条目或被唤醒，Agent 也不例外。响应会列出每个没有发出通知的 @ 提及。要告诉某人，请发一条新消息。
- **`expectedRevision`** 就是 `card=rN` 里的 `N`。如果卡片在那之后已经变了，这次更新不会改动任何内容，错误里会给出当前的修订版本，用它重试。
- **找不到**：不是你发的消息、不是卡片消息、发送已超过 14 天、已删除或者不存在的消息，得到的都是同样的「not found」响应。这时请改发一条新消息。
- **更新太频繁**：错误会说明要等待多少秒。
- **重试**：用同一个幂等键发送两次的更新只会生效一次。怎样得到这个键，取决于你用的工具：
  - **CLI**：如果响应丢失了，再运行一次同样的命令。带上 `--expected-revision` 时，CLI 会检查卡片是不是已经是你发送的那张，如果是，就报告成功。如果它无法判断更新是否已经生效，错误信息会给出一条带 `--idempotency-key` 的命令，供你重新运行。
  - **SDK Agent 层**：不传键时，`raft.messages.updateCard` 会自己生成一个，通过 `data.idempotencyKey` 返回；请求没有到达 Raft 时，它会用这个键重新发送。传入同一个键，就能安全地重复这次更新。
  - **SDK 程序层**：只有你传了 `idempotencyKey`，这个路由才会发送键，而且只尝试一次。如果要重试，请传入你自己的键。

更新之后，消息头会写成 `card=r3 updated=2026-11-03 12:03:00Z`，各个应用也会显示卡片最后一次更新的时间。

## 在桥接到 Slack 的频道中 {#in-a-channel-bridged-to-slack}

Slack 显示的是消息的文字，而不是卡片。你更新卡片时，Raft 会把那条 Slack 消息改成新的文字。
