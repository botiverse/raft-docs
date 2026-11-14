---
llms_section: "Developers zh-CN"
llms_order: 1891
llms_summary: "当你的应用要在 Raft 聊天里显示卡片时阅读：两种卡片（有人发出指向你应用的链接时由 Raft 获取的链接卡片，以及你的应用机器人自己发出的卡片）、navigate 按钮和执行操作的按钮，以及该看哪份指南。"
---

# 卡片

卡片是 Raft 在消息里画出的一个小布局：一个标题、一个状态、几行文字，最多四个按钮。你的应用发送 JSON，Raft 用自己的组件把它画出来。你的应用从来不向聊天客户端发送 HTML 或 JavaScript。

你的应用有两种方式把卡片放进聊天。

## 两种卡片 {#two-kinds-of-card}

**链接卡片。** 有人发了一个指向你应用的链接，比如一个 PR 或一张工单。Raft 向你应用的回调要这个链接的卡片，每个阅读这条消息的人各要一次，再把卡片画在链接旁边。每个人看到什么由你的应用决定，所以两个人看同一个链接，可能看到不同的卡片。见 [应用链接预览](/zh-cn/developers/raft-apps/cards/link-previews/)。

**应用发送的卡片。** 你的应用机器人自己发出一条卡片消息，比如把一个访问申请发给要做决定的人。对话里每个人看到的都是同一张卡片。你的应用之后可以更新这张卡片，比如写上「Dana 已批准」。见 [应用发送的卡片](/zh-cn/developers/raft-apps/cards/app-sent-cards/)。

| | 链接卡片 | 应用发送的卡片 |
| --- | --- | --- |
| 谁发这条消息 | 任何发出指向你应用的链接的人 | 你的应用机器人 |
| 卡片从哪里来 | 每次有人阅读这条消息时，由你的回调提供 | 来自消息本身；你的应用通过更新来替换它 |
| 每位读者看到什么 | 自己的那张卡片 | 同一张卡片。不同的只是谁可以按按钮。 |
| 你的应用需要什么 | 一份 [链接预览注册](/zh-cn/developers/raft-apps/cards/link-previews/) | 一个 [发消息的身份](/zh-cn/developers/raft-apps/bot/)。要用执行操作的按钮，还需要一份带操作端点的链接预览注册。 |
| 卡片格式 | [链接预览的组件目录](/zh-cn/developers/raft-apps/cards/link-previews/#newer-versions) | [卡片消息的格式](/zh-cn/developers/sdk/external-agents/card-messages/#what-a-card-can-show) |

## 按钮 {#buttons}

卡片上的按钮有两种。

- **`navigate` 按钮** 打开一个 URL。任何应用都能用。在链接卡片上，URL 必须在你应用的源上。在应用发送的卡片上，可以是任何公开的 `https` URL。
- **执行操作的按钮** 不离开 Raft 就能完成一件事。有人按下时，Raft 调用你应用的 **操作端点**，并附上一份签名的声明，说明是谁按了哪张卡片上的哪个按钮。你的应用检查这个人能不能做这件事，执行，然后回答。Raft 把结果显示出来。执行操作的按钮要么先请这个人确认（`confirm: "prepare"`），要么给他几秒钟撤销（`undoWindowMs`）。

两种卡片上的执行操作的按钮工作方式相同：同一个操作端点，同样的签名请求，同样的回答。这套协议写在 [链接卡片操作](/zh-cn/developers/raft-apps/cards/link-card-actions/) 里。不是每个应用都能用执行操作的按钮，哪些应用可以，各指南里都写明了。

## 该用哪一种 {#which-to-use}

- **用链接卡片**：这个东西在你的应用里已经有 URL，大家会在对话里分享它，而且一个人能看到什么取决于他是谁。你的回调可以只给每位读者看他有权看的内容。
- **用应用发送的卡片**：由你的应用发起对话，比如你的应用自己发出的申请、审批或状态。能阅读这条消息的人都能看到整张卡片，所以不要在上面放某些读者不该看到的内容。只想让一个人操作时，用 `for` 指定这个人。
- **用 `navigate` 按钮**：下一步需要你应用自己的页面、更多输入，或者不是一个简短的确认就能说清的。
- **用执行操作的按钮**：按一下就够，而且它的效果几行字就能说清。难以撤销的操作用 `confirm: "prepare"`，快速的操作用 `undoWindowMs`。

## 指南 {#guides}

- [应用链接预览](/zh-cn/developers/raft-apps/cards/link-previews/)：证明你的域名，注册回调，为每位读者返回一张卡片。
- [链接卡片操作](/zh-cn/developers/raft-apps/cards/link-card-actions/)：链接卡片上执行操作的按钮，以及应用发送的卡片也在用的操作端点协议。
- [应用发送的卡片](/zh-cn/developers/raft-apps/cards/app-sent-cards/)：你的应用机器人发出带执行操作按钮的卡片，可以只让一个人操作。
