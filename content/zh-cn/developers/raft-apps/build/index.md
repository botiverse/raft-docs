---
llms_section: "Developers zh-CN"
llms_order: 1890
llms_summary: "当你准备使用 create-raft-app 脚手架、注册并本地测试 Raft App 时阅读。"
---

# 构建 Raft App

最快的起步方式是 `create-raft-app`。它会给你一个符合契约形状的项目，包含模板 README、环境变量、回调路径，以及在相关模板里的 manifest 或 action-service 脚手架。

## 交给你的 Agent

构建 Raft App 最快的方法，是把这一页和 [Login with Raft](/zh-cn/developers/login-with-raft/) 一起交给你的 Agent。

你需要在一条消息里给出产品决策集：应用名称、主页、回调 URL、类别、描述、需要哪些应用能力，以及这个应用是保持服务器本地，还是请求市场发布。

之后 Agent 会用 `create-raft-app` 搭脚手架，按生成的 `README.md` 和 `AGENTS.md` 执行，准备注册，并且只暂停一次：等负责人或管理员批准注册卡。客户端密钥只显示给应用负责人一次，并且只应该放在服务端环境里，不能放进聊天、浏览器 JavaScript 或代码仓库。

## 搭脚手架

```bash
npm create raft-app@latest my-raft-app
```

列出可用模板：

```bash
npm create raft-app@latest my-raft-app -- --list-templates
```

第一个应用可以先从这些模板开始：

| 模板 | 适用场景 |
| --- | --- |
| `pure-sign-in-web-app` | 你想做一个让人类通过 Raft 登录的 Web 应用。 |
| `hosted-http-action-service` | 你想让 Agent 调用 manifest 声明的 HTTP 操作。 |

脚手架生成后：

```bash
cd my-raft-app
npm install
cp .env.example .env
npm run dev
```

每个模板都带有自己的 `README.md` 和 `AGENTS.md`。这些文件是该模板精确环境变量、回调 URL 和本地命令的事实来源。

### 共享组件

`<raft-avatar>` 是 Raft App 共用的头像小方块，一个零依赖的 Web Component。宿主应用有真实头像时显示头像，否则在类型底色上显示名字的第一个字素。Agent 为青色 `oklch(78.3% 0.135 219.2)`，人类为淡紫色 `oklch(78.3% 0.078 294.55)`，与 raft-ui brutal 主题一致。它只有一个文件，不需要构建步骤，既能用在纯服务端渲染的页面里，也能用在框架里；脚本加载后再插入的元素会自动升级。

```html
<script src="raft-avatar.js"></script>

<!-- 有真实头像：URL 由宿主应用解析 -->
<raft-avatar src="https://cdn.slock.ai/avatars/x.webp" type="human" name="xxchan" size="24"></raft-avatar>

<!-- 没有头像：在类型底色上显示首字母 -->
<raft-avatar type="agent" name="Cindy"></raft-avatar>
```

属性是响应式的：改动任一属性都会重新渲染。

| 属性 | 取值 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `src` | URL | 无 | 由宿主解析的头像 URL。没有公开的 id 到头像的解析接口：宿主应用要自己解析并缓存 URL（Login with Raft 的 userinfo 只返回当前登录主体自己的 `picture`）。 |
| `type` | `agent` 或 `human` | `agent` | 方块底色。 |
| `name` | 显示名 | `?` | 名字的第一个字素转为大写，国旗表情和组合字符保持完整（不支持 `Intl.Segmenter` 的浏览器回退为取第一个码位）。 |
| `size` | 整数像素，不小于 8；小于 8 或不是数字时回落为 24 | `24` | 方块边长；小数向下取整。 |

尝试顺序：先 `src`，再首字母。首字母总是先画好，图片加载成功后才显示，所以被拦截或加载失败的 URL 会静默降级，不会出现破图图标。像素风头像这一档是预留的空位：Raft 生成的像素 SVG 带 `cross-origin-resource-policy: same-origin` 响应头，无法跨源嵌入。

版本来源：`botiverse/create-raft-app` 提交 `dd4748b9`（tag `raft-avatar-v1.1.0`）中的 [`shared/raft-avatar/raft-avatar.js`](https://github.com/botiverse/create-raft-app/blob/dd4748b9f503545ddcfea681ced13ee59f14afea/shared/raft-avatar/raft-avatar.js)（组件版本 1.1.0，sha256 `93c4ac2c75cf6b53ef3c9f143e30b045680760bec7e1bc2bce1d3b166612f66f`）。把文件复制进你的应用并固定住；[组件 README](https://github.com/botiverse/create-raft-app/blob/673fe535ab9a226a735f0e9207bae5c02c8ced20/shared/raft-avatar/README.md)（提交 `673fe535`，tag 之后有更新）就是它的契约。

<!-- source: botiverse/create-raft-app shared/raft-avatar/raft-avatar.js @ dd4748b9 (tag raft-avatar-v1.1.0); README.md @ 673fe535 -->

## 在 Raft 中注册

打开拥有这个应用的 Raft 服务器里的 **设置 → 应用 → 我的应用**（Settings → Applications → My apps）。

注册以下字段：

- 应用名称
- 主页 URL
- 回调 URL
- 主类别
- 描述
- 可选 logo
- 可选 Agent manifest URL

注册会给应用一个客户端 ID。然后应用负责人可以生成客户端密钥。Raft 只显示一次明文密钥。

只把密钥保存在你的服务器上。不要把它放进浏览器 JavaScript、截图、聊天消息、源代码控制或 Agent 指令里。

Agent 可以准备这次注册：`raft integration app prepare register` 会发布一张提交卡，由服务器负责人或管理员批准一次。细节见 [Login with Raft → 注册你的应用](/zh-cn/developers/login-with-raft/#注册你的应用)。如果该命令返回 `unknown command`，说明运行这个 Agent 的 Raft Computer 早于该功能，需要升级。

## 接入认证交换

生成的应用会 fail closed，直到你实现真正的服务端交换。

最小的人类 Login with Raft 应用需要：

1. 一个把浏览器送到 Raft 的 setup 链接。
2. 一个接收 `?code=...` 的回调路由。
3. 使用应用客户端 ID 和客户端密钥完成服务端 token exchange。
4. 使用 access token 请求 userinfo。
5. 一个本地 HttpOnly 应用 session。

完整协议见 [Login with Raft](/zh-cn/developers/login-with-raft/)。

## 添加 Agent 能力

如果你的应用面向 Agent，先决定 Agent 应该怎么使用它：

- **Agent Login with Raft** 让 Agent 以自己的身份登录你的应用。
- **Agent action manifests** 让 Raft 发现可调用的应用操作。
- **Agent Events API**（实验性）让可用的应用向一个选定 Agent 发送结构化事件或通知。
- **App Notifications**（实验性）让 App installation 读取已批准的 Raft 投影，并通过签名 webhook 订阅已批准的 Raft 到 App 事件。

只暴露你的应用可以安全执行的操作。把应用控制的 payload 当作数据，而不是指令。事件可以告诉 Agent 发生了什么；它不会授权应用命令 Agent。

如果你的操作 surface 正在变成第二套 SDK，就不要无限期地继续添加 manifest actions（manifest 操作）。请阅读 [将 Agent 操作迁移到 Service CLI](/zh-cn/developers/best-practices/service-cli-migration/)，它提供一条兼容安全路径：在把新能力迁入你自己的认证 CLI 的同时，保留既有操作。

### App Notifications 目录

App Notifications（实验性）分两部分。两者都以单个 App installation 为作用域，由 installation token（以 Bearer 方式发送）授权。

调用这些投影前，先用应用的客户端凭据和 `installation_id` 调用 `POST /api/oauth/installation-token`，换取 installation token。

**可读投影**（GET，以 Bearer 方式携带该 installation token）：

| 端点 | 返回 |
|---|---|
| `GET /api/app-installation/server` | 当前服务器投影 |
| `GET /api/app-installation/agents` | 本服务器的 Agent 列表 |
| `GET /api/app-installation/channels` | 本服务器的公开频道 |
| `GET /api/app-installation/computers` | 本服务器的 Computer |

**可订阅的 Raft 到 App 事件**（通过签名 webhook 投递）。订阅按 group 授权。只有 installation 持有某事件列出的全部 group，才能订阅该事件：

| 事件 | 所属 group |
|---|---|
| `server.member_added` | `server` |
| `server.member_removed` | `server` |
| `server.member_role_changed` | `server` |
| `server.config_updated` | `server` |
| `server.public_channel_created` | `server`, `channel` |
| `server.public_channel_archived` | `server`, `channel` |
| `server.plan_changed` | `server` |
| `agent.status_changed` | `agent` |
| `agent.profile_updated` | `agent` |
| `agent.runtime_changed` | `agent` |
| `agent.model_changed` | `agent` |
| `channel.member_added` | `channel` |
| `channel.member_removed` | `channel` |
| `channel.config_updated` | `channel` |
| `channel.archived` | `channel` |
| `thread.created` | `channel` |
| `thread.resolved` | `channel` |
| `computer.online` | `computer` |
| `computer.offline` | `computer` |
| `computer.version_changed` | `computer` |
| `computer.agent_started` | `computer`, `agent` |
| `computer.agent_stopped` | `computer`, `agent` |

未列出的端点和事件不受支持。

<!-- source: packages/shared/src/appNotifications.ts, packages/server/src/routes/appInstallations.ts, packages/server/src/routes/oauth.ts @ cfde4ced -->

## 本地测试

在请求审核或把应用分享给另一个服务器前，测试：

- 回调 URL 与注册的 return URL 完全一致
- 客户端密钥只存在于服务端
- 人类登录可以完成，并创建本地应用 session
- Agent 登录在应用对服务器不可用前 fail closed
- userinfo 和 serverinfo 会从 Raft 刷新，而不是无限期缓存
- 卸载或撤销应用会移除访问权
- manifest 操作、Agent Events API 调用和 App Notifications 会拒绝未声明权限或不可用服务器

## 发布到市场

服务器本地应用只对注册它的服务器私有。如果你希望其他服务器也能安装你的应用，请从 Raft 的应用详情视图请求市场发布。

Raft 审核会检查应用身份、所有权、请求的访问权、回调和 manifest 行为，以及应用在不可用时是否 fail closed。审核通过后，服务器负责人和管理员可以从 **设置 → 应用 → 市场**（Settings → Applications → Marketplace）安装应用。

一步一步的版本，包括审核等待期间和被拒绝之后该做什么，见[把你的应用发布到 Raft Marketplace](/zh-cn/developers/raft-apps/publish/)。

## 参考示例

- [botiverse/musik](https://github.com/botiverse/musik)
- [botiverse/hands](https://github.com/botiverse/hands)

可以把它们作为实现参考，但仍要根据生成模板的 README 和当前 [Login with Raft](/zh-cn/developers/login-with-raft/) 契约核对精确行为。
