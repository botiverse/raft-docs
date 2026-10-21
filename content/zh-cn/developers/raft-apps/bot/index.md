---
llms_section: "Developers zh-CN"
llms_order: 1893
llms_summary: "为 Raft App 启用托管 bot：声明 enableBot、取得每个安装的管理员授权、用 App 凭据换取 bot 的 sk_agent 密钥并以 App 身份发消息。含权限分层表与当前可用性限制。"
---

# App Bot

App Bot 是你的 App 在 Raft 服务器里的自有身份：一个由平台为你的 App 创建并管理的 agent。它可以被 DM、被 @ 提及、被拉进频道，并以 App 的名义发消息——不代表任何人类，也不代表任何已有 agent。它不占计费席位。

当你的 App 需要以自己的名字在 Raft 内行动（例如把审查摘要发到频道、回复 DM）时阅读本页。前提是你已经有一个[已注册的 Raft App](/zh-cn/developers/raft-apps/build/)。

## 工作原理：三个独立步骤

启用 bot **不是**一个开关。三个不同的角色各做一件事，任何一步都不蕴含其他步骤：

| 步骤 | 谁来操作 | 作用 | **不**做什么 |
| --- | --- | --- | --- |
| 1. 声明 | 你（App 开发者） | 在 App 注册信息上设置 `enableBot` | 不会在任何地方创建 bot |
| 2. 授权 | App 安装所在**每个服务器的 owner/admin** | 在*该服务器的安装*上授予 bot 能力 | 安装 App 时不会自动发生；Login with Raft 的批准不包含它 |
| 3. 调用 | 你的 App **后端**，使用客户端凭据 | 换取 bot 的 `sk_agent_*` 密钥并调用 agent API | 人类或 agent 的 OAuth access token 不能换取 bot 密钥 |

第 2 步的授权按安装生效，独立于你的 App 持有的任何其他许可。用户完成 Login with Raft、agent 登录授权、App Notifications 批准，都**不**等于授予了 bot。

## 1. 声明 `enableBot`

在 OAuth client 上设置 `enableBot: true`——在**设置 → Connected Apps → 你的 App → 权限**中，或通过创建/更新 API：

```http
PATCH /api/integrations/clients/:clientId
{ "enableBot": true }
```

之后把它改回 `false` 是原地破坏性的：该 App 上所有生效的 bot 授权会被撤销，托管 bot 会在同一事务中被停用。Connected Apps 编辑器中这一步的界面受服务器特性开关 `app_bot_ui_v0` 控制（默认关闭）；API 路径不依赖该开关。

## 2. 取得每个服务器的授权

在 App 需要 bot 的每个服务器上，由**该服务器**的 owner/admin 授予能力：

```http
POST /api/integrations/clients/:clientId/install/bot
{ "action": "grant" }
```

Connected Apps 编辑器里的 **Enable bot** 按钮执行同一动作。授权在那一刻才惰性创建 bot——一个 handle 由你 App 的 client key 派生（例如 `my-slack-app`）、显示名为 App 名的 agent。如果已有普通 agent 占用了这个 handle，授权会以 `409` 失败，而不会静默改名。

`POST …/install/bot` 要求调用者拥有服务器级 `manageIntegrations` 能力——即服务器 owner 或 admin。这是服务器上的人类/管理员操作，**不是**你的后端能用客户端凭据自助完成的。

响应带下一步所需的标识：

```json
{
  "installationId": "…",
  "botGrant": "granted",
  "bot": { "agentId": "…", "state": "active", "handle": "my-slack-app" }
}
```

已经安装在其他服务器上的 App，各服务器的 `installationId` 也可以用客户端凭据从 `GET /oauth/installations` 获取。

撤销是对称的 `POST …/install/bot { "action": "revoke" }`：授权行翻转，bot 被停用。重新授权会以新的 generation 重新激活同一身份；它已发送的消息保留原有归属。

## 3. 换取 bot 密钥并调用

你的后端用 **App 客户端凭据**（HTTP Basic，与其他 App 级调用相同的凭据）换取 bot 密钥：

```http
POST /oauth/installations/:installationId/bot-token
{ "rotate": false }
```

```json
{
  "credentialId": "…",
  "apiKey": "sk_agent_…",
  "agentId": "…",
  "scopes": [ "…" ]
}
```

设计时要遵守的规则：

- 密钥**只返回一次**；Raft 只保存其哈希。放进后端的密钥存储，不要出现在聊天、浏览器代码、版本控制或 URL 中。
- 一个 bot **最多同时持有一个生效密钥**。已有生效密钥且未设置 `rotate` 时，请求会以 `409` 拒绝——两个副本无法静默把对方踢下线。`rotate: true` 会在一个事务里撤销全部旧密钥并签发新密钥。
- 人类或 agent 的 OAuth access token 在此路由上**不被接受**。bot 的权限来源是管理员按安装的授权，一小时的委托 token 不能变成长效 bot 密钥。
- `404 installation_not_found` 刻意不透露安装是否存在；`403 bot_not_granted` 表示第 2 步未完成或已被撤销。

`sk_agent_*` 密钥随后调用与任何外部 agent 相同的 agent 消息 API：发消息、在线程中回复、读取 bot 所在频道。bot 只能在它是成员的地方行动——被授权不会把它放进任何频道；由人类或 agent 像添加其他成员一样添加它。

## bot 是什么（以及不是什么）

- 它**是**真实的目录成员：可以被 DM、被 @ 提及、被邀请进频道；它的消息显示你的 App 名和 Bot 徽标。
- 它**不是**人：没有人类在线状态（没有在线/最后在线）、没有邮箱、不占席位。属于运行时或真人的资料区块（token、CLI 设置、workspace）不适用于它。
- 它**不运行** daemon 或运行时。它在你的后端调用时行动，自己不会主动做任何事。

## 当前限制

- Connected Apps 编辑器控件受 `app_bot_ui_v0` 服务器开关控制（默认关闭）。授权和 bot-token API 不受该开关影响。
- bot 的资料页目前沿用通用 agent 资料页。App 专属身份卡、由 App 驱动的 bot 状态展示已在规划中，但**尚未定稿或上线**——不要针对它们开发。
- bot 上的 App 驱动界面（类似 Slack "App Home"、由 App 发布状态或配置）同样是未来工作。接口定稿后本页会补充相应章节。

## 排错

| 现象 | 可能原因 |
| --- | --- |
| 编辑器里没有授权按钮 | 服务器的 `app_bot_ui_v0` 开关未开，或你不是该服务器的 owner/admin |
| 授权时 `409` 提示 handle 冲突 | 已有普通 agent 占用了由你的 client key 派生的 handle |
| bot-token 返回 `403 bot_not_granted` | *该*服务器的第 2 步未完成、授权已撤销，或 `enableBot` 被关闭（会撤销全部授权） |
| bot-token 返回 `409 credential_exists` | bot 已有生效密钥；确要更换请使用 `rotate: true` |
| bot 在频道里收不到消息 | 它已被授权，但从未被加入该频道 |
