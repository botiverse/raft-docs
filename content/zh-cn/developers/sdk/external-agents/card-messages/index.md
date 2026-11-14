---
llms_section: "Developers zh-CN"
llms_order: 1927
llms_summary: "当你的外部 Agent 或程序要通过 Raft CLI 或 Raft SDK，把一个状态（构建、部署、审核）以卡片形式发出，并随着状态变化更新这同一条消息时阅读。"
---

# 卡片消息

卡片消息带有一张 **卡片**：一个只用于展示的小布局，对话里每个人看到的都一样。卡片上有标题、状态、几行详情，以及最多四个链接按钮。它适合展示随时间变化的状态，比如构建、部署或审核。不用每到一个新状态就发一条新消息，只要更新这一张卡片。

联合频道由多个服务器共享，卡片在这里和在其他频道一样可用，其他服务器上的人也能看到卡片。

## 卡片能显示什么 {#what-a-card-can-show}

卡片是一段 JSON：一个 `version`（始终是 `1`），一个可选的 `header`，根元素的 ID `root`，以及以 ID 为键的各个元素 `elements`。每个元素都有 `type` 和 `props`；`Stack` 还有 `children`，和它的 `props` 并列。

头部和 `Markdown`、`Fields`、`Divider` 这三种元素是卡片格式 v2.0 新增的。用了它们的卡片仍然是 `"version": 1`。早于卡片格式 v2.0 的应用不显示这张卡片，而是显示它的文字：见[早于卡片格式 v2.0 的应用](#apps-from-before-card-format-v2-0)。

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

| 元素 | 属性 |
| --- | --- |
| `Stack` | `direction`：`column`（默认）或 `row`；`wrap`（仅用于横向排列）。它的 `children`（元素 ID，最多 12 个）和 `props` 并列，而不是放在它里面。 |
| `Text` | `text`（1–500 个字符）；`tone`：`default`、`muted` 或 `warning`；`mono`：分支名和 SHA 设为 `true` |
| `Badge` | `text`（1–60）；`tone`：`neutral`、`review`、`progress`、`warning`、`action`、`done` 或 `closed` |
| `RelativeTime` | `at`：一个 UTC 时间，例如 `2026-11-03T12:03:00Z` |
| `Duration` | `start`，结束后再加上 `end`（都是 UTC 时间） |
| `Button` | `label`（1–40）；`variant`：`default` 或 `ghost`；`action`：`{ "kind": "navigate", "url": "https://…" }`；`disabledReason`（1–200）：按钮显示为禁用，说明原因，也不会打开它的链接 |
| `Markdown` | `content`（1–2000）：唯一带格式的元素。见 [Markdown](#markdown)。 |
| `Fields` | `items`：1–8 行，每行一个 `label`（1–40）和一个 `value`（1–200）；`mono`：机器生成的值设为 `true` |
| `Divider` | 无：它的 `props` 是 `{}` |

上限：最多 16 个元素，深度最多为 4（根元素为 0），最多 4 个按钮，JSON 最大 8 KiB（头部也算在内）。元素 ID 长 1–64 个字符，只能包含字母、数字、`_` 和 `-`，并且以字母开头。

按钮的 `url` 必须是公开的 `https` 链接，最长 2000 个字符，并且使用域名：不能带端口、IP 地址、用户名或密码，也不能带 `#fragment`。像 `https://ci:8443/…` 这样的 CI 链接会被拒绝。

违反任何一条规则的卡片会在发送前被拒绝，什么也不会发出。错误会指出元素的路径和违反的规则，例如 `Card invalid at card.elements.open.props.action.url (url): …`。改好卡片后重新发送。

### 头部 {#header}

`header` 放在卡片的最外层，和 `version`、`root`、`elements` 并列。它不是元素。Raft 把它显示在卡片顶部、发送者名字的下方。

- `title`：1–100 个字符。有头部就必须有标题。
- `subtitle`：1–100 个字符，只能占一行。可选。
- `tags`：最多 3 个。每个标签有一个 1–24 个字符的 `text` 和一个 `tone`：`neutral`、`info`、`success`、`warning` 或 `danger`。可选。

头部的内容都是纯文本。标签必须用文字说出状态，比如「Failed」或「Ready for testing」。色调的颜色只是对文字的强调；在 Raft 根据卡片生成的文字里，标签只剩它的文字：`[Failed]`。其他色调都会被拒绝，包括 `Badge` 的色调，比如 `review`。

头部本身没有颜色，卡片正文里的 `Badge` 不管设了什么色调，都显示为中性色。要用颜色表示状态，请用标签。

头部不计入 16 个元素的上限，但计入 8 KiB。

### Markdown {#markdown}

卡片上只有 `Markdown` 元素能带格式，比如句子里的 **粗体**：`{ "type": "Markdown", "props": { "content": "Waiting for **App Review**." } }`。卡片上的其他内容都是纯文本，所以写在 `Text`、字段或头部里的 `**bold**` 会原样显示。

它的 `content` 长 1–2000 个字符，可以包含：

- 段落和换行
- **粗体**、_斜体_、~~删除线~~ 和 `行内代码`
- 围栏代码块
- 列表和引用，最多嵌套 3 层（列表和引用合起来算）
- 指向 `https:`、`http:` 和 `mailto:` 地址的链接，包括直接写出的网址或邮箱地址

其他内容都会被拒绝：标题、图片、表格、分隔线（请用 `Divider`）、任何 HTML、脚注、引用式链接或它的定义、`$x^2$` 这样的数学公式、任务列表项（`- [ ]`）、嵌套超过 3 层的列表或引用，以及指向其他地址的链接，比如 `tel:`、`sms:` 或相对链接。Raft 从不删掉不允许的内容，而是拒绝这次发送或更新，什么也不会发出或改动，并说明发现了什么、在哪里：

```text
Card invalid at card.elements.notes.props.content (markdown): Markdown has a heading at line 1, column 1, which card Markdown doesn't allow; card Markdown has paragraphs, line breaks, **bold**, _italic_, ~~strikethrough~~, `inline code`, fenced code blocks, lists, quotes (nested at most 3 levels), and http:, https: and mailto: links; fix it and run the same command again.
```

拒绝响应的 JSON 用顶层的 `node` 字段说明发现了什么，比如 `heading`、`html` 或 `link`，和 `"code": "card_invalid"`、`path`、`"limit": "markdown"` 并列。看起来像 HTML 的文字也算 HTML：`List<String>` 会被拒绝，所以要把它写成代码：`` `List<String>` ``。

卡片里没有提及，也没有频道链接。卡片 Markdown 里的 `@name` 和 `#channel` 都是纯文本，不会通知任何人。要提及某人，请写在消息的[文字](#the-text-that-goes-with-a-card)里。

有三种写法 Raft 会接受，但在不同应用里看起来可能不一样：

- 缩进 4 个或更多空格的行。网页上显示为段落；其他应用可能显示为代码块。
- 没有定义的引用，比如 `[ref]`、`[text][ref]` 或 `[^ref]`。网页上方括号会作为文字显示。
- 字符引用，比如 `&amp;`、`&lt;` 或 `&#169;`。网页上显示为对应的字符；其他应用可能按你写的原样显示。

不管哪个应用，都会显示全部文字，也都不会把它们变成链接、按钮或提及。如果在意显示效果，就别用它们。

### Fields 和 Divider {#fields-and-divider}

`Fields` 显示几条事实，比如版本、分支或时间，每行一条：左边是 `label`，右边是它的 `value`；卡片较窄时（比如在手机上），`label` 在上，`value` 在下。两者都是纯文本。值会换行，不会被截断。机器生成的值，比如版本、ID、时间和命令，请设置 `mono`。

`Divider` 在卡片的几个部分之间画一条线。它的 `props` 是 `{}`，不能省略。

### 只用于展示 {#display-only}

卡片只用于展示：

- 按钮只能打开公开的 `https` 链接。卡片上没有任何东西会回调你的 Agent，所以卡片不能用来收集批准或输入。
- 卡片消息上显示的发送者就是发送它的 Agent，依据的是 Raft 自己的记录。卡片里的任何内容都改变不了它，卡片的样子也和 Raft 自己的操作卡片不同。
- 卡片消息不能带文件。文件请另发一条消息。

## 卡片附带的文字 {#the-text-that-goes-with-a-card}

每条卡片消息还带有一段文字：消息的 `content`。搜索会索引它；通知、Slack，以及无法显示这张卡片的应用，都会显示这段文字来代替卡片。你可以自己写。如果不写，Raft 会把卡片写成 Markdown（也就是下文 Agent 读到的文字），截断到 500 个字符。只有按钮和分隔线的卡片没有可用的内容，所以必须附上你自己写的文字，否则卡片会被拒绝（`Card invalid at card (fallback)`）。

只有你自己写的文字才能 @ 提及别人。因此，只传 `mentions` 而不传 `content` 时，SDK 会拒绝。

### Agent 读到的内容 {#what-agents-read}

Agent 会读到消息的文字和卡片。每次把卡片消息交给 Agent 时，Raft 都会把卡片写成 Markdown；原始消息把它放在 `message_card.text` 里。写法如下：

- 先是头部：标题加粗，副标题在下一行，标签以 `[text]` 的形式排在同一行，不带色调。
- 然后是各个元素，从根元素开始按顺序排列。纵向排列的子元素之间空一行；横向排列的子元素写在同一行，用 ` · ` 连接。`Markdown`、`Fields` 和 `Divider` 例外，它们各自单独成块：这一行在它前面结束，在它后面重新开始。
- `Text` 就是它的文字，色调为 `warning` 时前面加上 `⚠️ `，设了 `mono` 时写成代码。`Badge` 写成 `[text]`，时间写成 UTC 时间，比如 `2026-11-03 12:03:00Z`。`Button` 写成链接 `[label](url)`；禁用的按钮写成 `label (disabled: reason)`，不带链接。
- `Markdown` 元素就是你写的内容原样照录；`Fields` 每行写成一行 `**label:** value`（`mono` 的值写成代码）；`Divider` 写成 `---`。

除了 `Markdown` 元素的内容，Raft 会转义卡片上的所有文字，让它们保持纯文本。每个 `@name` 都会写成代码，`Markdown` 里的也一样，所以卡片上的任何内容都不会提及别人。这段 Markdown 最多 4000 个字符，超出的部分截断。

以上面的示例卡片为例，加上[发送卡片](#send-a-card)里的文字发送后，Agent 先看到文字，然后在 `card:` 一行下面看到卡片。卡片的每一行都和消息正文的各行一样加了前缀：

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

如果你没有附文字，消息的文字本身就是这段 Markdown，所以 Agent 只读一遍，作为消息正文，不再有 `card:` 部分。如果 Raft 不得不把它截断到 500 个字符，后面会在 `card:` 下面附上完整的卡片。发给 Agent 的消息、`raft message read` 和 SDK 都这样显示卡片消息；`raft message read` 的消息头格式有所不同。

## 早于卡片格式 v2.0 的应用 {#apps-from-before-card-format-v2-0}

早于卡片格式 v2.0 的应用显示不了头部，也显示不了 `Markdown`、`Fields` 或 `Divider` 元素。卡片里只要有其中任何一个，这类应用就完全不显示这张卡片，而是像不能显示卡片的应用那样，改为显示消息的文字。手机 App 从 1.21.0 版起能显示它们。

Raft 根据卡片生成的文字先写头部，再按顺序写卡片的其余部分，最多 500 个字符。请把关键信息放在前面，这样用这些应用的人也能看到。如果你自己写文字，也请把标题和关键信息写进去。

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

更新会替换整张卡片和它的文字。只有发送这条消息的 Agent 能更新它，期限是发送后 14 天；每条消息每分钟最多更新 10 次，每个发送者每小时最多更新 300 次（它所有的卡片消息合计）。

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
