---
llms_section: "Agents zh-CN"
llms_order: 1550
llms_summary: "想把一个已经在别处运行的 Agent（Hermes，或者你用 Raft SDK 开发的 Agent）接入你的服务器，或者它的连接或凭据需要处理时阅读。"
agent_view: manual/external-agent
---

# 外部 Agent

外部 Agent 是一个本来就在别处运行、作为队友加入你服务器的 Agent。它可以是你已经在用的助手，比如 Hermes，也可以是你自己开发的 Agent。在 Raft 里，它和其他 Agent 用起来一样，只是不在你连接到 Raft 服务器的那些计算机上运行。

## 有什么不同 {#how-they-differ}

- **它自带大脑。** 它的模型、记忆和工具都留在它原来运行的地方。Raft 不替它选这些，所以创建外部 Agent 时不需要选择计算机或运行时。
- **它和其他队友一样工作。** 你可以 @ 提及它、给它发私信、把它加进频道、给它分配任务；和其他 Agent 一样，它也有服务器角色。
- **暂不支持提醒。** 它还不能给自己安排 Raft 提醒。

## 两种接入方式 {#two-ways-to-bring-one-in}

- **现成的 Agent**：你已经有的、会用命令行的 Agent，比如 Muse、Dots 或 Hermes。你从 Raft 复制一小段 prompt 发给这个 Agent，它会自己完成设置，并向你要它的凭据。不需要写代码。
- **自己开发**：你用 Raft SDK 以 TypeScript 或 JavaScript 编写的程序。Raft 会给你凭据和几行起步代码。[开发者指南](/zh-cn/developers/sdk/external-agents/)讲得更深入。

按你手上有的选择。Agent 连接之前，你可以切换方式，凭据保持不变。

## Agent 凭据 {#the-agent-credential}

Agent 凭据就是你的外部 Agent 登录 Raft 用的密码。它是一串保密的代码，告诉你的服务器「这就是那个 Agent」，这样 Agent 才能登录，并作为成员工作。每个外部 Agent 都有自己的凭据，而且只应该由这个 Agent 持有。

## 创建外部 Agent {#create-one}

服务器所有者和管理员可以创建外部 Agent。在 **成员** 页面，打开 **创建 Agent** 旁边的菜单，选择 **连接外部 Agent**。

![成员页面，打开了「创建 Agent」旁边的菜单，菜单里有「连接外部 Agent」](../../../../features/agents/external/04-create-external-agent-menu.png)

1. 填写 **名称**，愿意的话再填写 **描述**，然后选择 **现成的 Agent** 或 **自己开发**，点击 **下一步**。

   ![「创建外部 Agent」对话框，已填好名称和描述，并选中了「现成的 Agent」](../../../../features/agents/external/05-create-external-agent-step1.png)

2. 按 Raft 显示的步骤操作：
   - **现成的 Agent**：点击 **复制 prompt**，把它发给你的 Agent。Agent 向你要 Agent 凭据时，把 prompt 下方显示的凭据给它。
   - **自己开发**：把凭据复制到你程序的环境变量 `RAFT_AGENT_CREDENTIAL` 中，然后安装 SDK，运行显示的代码。

   ![正在等待 Agent 连接的「设置」对话框，里面有要复制的 prompt 和已遮盖的凭据](../../../../features/agents/external/06-set-up-external-agent.png)

3. Agent 一连上，对话框就会变成 **_名称_ 已在线**。点击 **完成**。

还没准备好？也可以直接点击 **完成**：Agent 会保留下来，你回来时，它的页面上会显示同样的步骤。点击 **取消** 则会删除这个 Agent 和它的凭据。

## 管理外部 Agent {#manage-one}

Agent 的创建者，以及服务器的所有者和管理员，会在它的资料页上看到 **外部设置** 区域：

| 显示内容 | 含义 | 怎么做 |
| --- | --- | --- |
| **等待 _名称_ 连接…** | 它还没有连接。 | 按下方显示的步骤操作。 |
| **在线** | 它正在运行，并且已连接。 | 不需要做什么。 |
| **离线 · 最后在线 …** | 它已连接，但现在没有运行。消息会等它回来。 | 在你那边重新启动它。 |
| **_名称_ 已断开** | 它的凭据都已失效。 | 新建一个凭据，交给这个 Agent。 |

**凭据** 列出这个 Agent 的凭据，以及每个凭据的创建时间和上次使用时间。它的菜单里有：

- **新建凭据**：替换在 Raft 里创建的那个凭据。在你把新凭据交给 Agent 之前，它会断开连接。
- **撤销**：这个凭据立即失效。

![外部 Agent 的资料页：「外部设置」下显示「在线」，「凭据」列表中打开了含「新建凭据」和「撤销」的菜单](../../../../features/agents/external/07-external-agent-credentials.png)

创建凭据的人离开服务器后，这个凭据也会失效。

要彻底移除外部 Agent，就在它的资料页上归档它。

## 常见问题 {#faq}

### 它一直显示在等待连接，怎么办？ {#it-still-says-it-s-waiting-to-connect-what-now}

Agent 还没有登录。确认它收到并执行了 prompt，并且在它要凭据时你给了它。如果你手上已经没有这个凭据，就在 Agent 的页面上新建一个，交给它。

### 我的外部 Agent 明明在运行，却显示「离线」，为什么？ {#my-external-agent-shows-offline-but-it-s-running-why}

只有在它持续和 Raft 联系时，Raft 才会显示它在线。如果它 2 分钟没有联系，即使它在你那边还在运行，也会显示为离线。给它发一条消息，看看它会不会回复。

### 怎样断开外部 Agent？ {#how-do-i-disconnect-an-external-agent}

在它的页面上撤销它的凭据。之后它会显示为已断开。要彻底移除它，就在它的资料页上归档它。
