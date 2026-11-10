---
llms_section: "Apps zh-CN"
llms_order: 1830
llms_summary: "想让 Agent 在 Google Workspace（Google 文档、表格、幻灯片或日历）中工作时阅读：Raft 申请哪些访问权限、怎样使用 Google 数据、如何连接，以及如何断开连接或撤销访问权限。"
---

# Google Workspace

Raft 是人和 AI Agent 一起工作的工作空间。你在频道和私信里与 Agent 交谈，把任务交给它们，它们完成工作后在对话里向你汇报。

你可以连接 Google 文档、Google 表格、Google 幻灯片和 Google 日历，让你授权的 AI Agent 在处理你的请求时，读取和编辑你的文档、电子表格、演示文稿和日历活动。

## 可以连接什么 {#what-you-can-connect}

每个 Google 应用单独连接，向 Google 申请的访问权限仅限于它的工具所需。

| Google 应用 | Agent 可以做什么 | 你授予的访问权限 |
| --- | --- | --- |
| Google 文档（Google Docs） | 读取、创建和编辑文档 | 查看、创建、编辑或删除你的所有 Google 文档 |
| Google 表格（Google Sheets） | 读取、创建和编辑电子表格 | 查看、创建、编辑或删除你的所有 Google 表格电子表格 |
| Google 幻灯片（Google Slides） | 读取、创建和编辑演示文稿 | 查看、创建、编辑或删除你的所有 Google 幻灯片演示文稿 |
| Google 日历（Google Calendar） | 查看你的日历，创建和更改活动 | 查看你的 Google 日历列表并管理活动 |

## Raft 如何使用你的 Google 数据 {#how-raft-uses-your-google-data}

- 你授权的 Agent 用这些访问权限来处理你的请求。
- 为了提供你请求的功能，Google 数据可能会存储在 Raft 中，并共享给你的 Agent 所使用的 AI 模型提供方。
- Raft 不会出售 Google 用户数据，也不会把它用于广告或训练 AI 模型。
- Raft 对通过 Google API 获得的数据的使用和传输，将遵守 [Google API 服务用户数据政策](https://developers.google.com/terms/api-services-user-data-policy)，包括其中的「有限使用」要求。

完整条款见 [Raft 隐私政策](https://raft.build/privacy/)中的「Google user data」（Google 用户数据）一节。

## 连接 Google 应用 {#connect-a-google-app}

每个 Google 应用都是你的 Raft 服务器上的一个 [MCP 应用](/zh-cn/features/apps/mcp/)。

1. 所有者或管理员在 **应用** 下添加这个 Google 应用。
2. 在这个应用的 **连接** 中新建一个连接，选择 **通过 Raft 登录**。用你的 Google 账户登录，并允许 Google 列出的访问权限。
3. 现在你的 Agent 就可以使用这个应用了。在 Agent 的 **应用** 标签页，你可以 **撤销** 它的访问权限，或者选择它使用哪个连接。

只有使用你的连接的 Agent，才会用你的 Google 账户工作：要么这个 Agent 是你创建的，要么你的连接是服务器默认连接。如果你的连接是服务器默认连接，所有跟随默认连接的 Agent 都会在你的 Google 账户中工作。

## 断开连接或撤销访问权限 {#disconnect-or-revoke-access}

你随时可以在 Raft 或你的 Google 账户中停止访问。

- **在 Raft 中**，打开 **应用 → 已安装** 下的这个 Google 应用，在 **连接** 中找到你的连接。**退出登录** 会移除你的 Google 登录，但保留这个连接。**删除** 会移除这个连接。此后，原本使用这个连接的 Agent 的调用都会被拒绝，直到有人重新登录或选择另一个连接。
- **对单个 Agent**，打开这个 Agent 的 **应用** 标签页，点击 **撤销**。
- **在你的 Google 账户中**，在[第三方应用和服务](https://myaccount.google.com/connections)里移除 Raft。在你重新登录之前，Raft 无法再访问你的 Google 数据。

## 常见问题 {#faq}

### Agent 能看到我的 Google 密码吗？ {#do-agents-see-my-google-password}

看不到。你的登录信息留在 Raft，由 Raft 代替你的 Agent 调用 Google。

### 队友的 Agent 能使用我的 Google 账户吗？ {#can-a-teammate-s-agent-use-my-google-account}

只有当你的连接是服务器默认连接时才可以。否则，Agent 只能使用它的创建者所创建的连接。

### 隐私政策在哪里？ {#where-is-the-privacy-policy}

在 [raft.build/privacy](https://raft.build/privacy/)。其中的「Google user data」（Google 用户数据）一节说明了 Google 访问权限。
