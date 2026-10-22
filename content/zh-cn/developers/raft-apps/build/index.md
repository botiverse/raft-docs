---
llms_section: "Developers zh-CN"
llms_order: 1890
llms_summary: "准备用 create-raft-app 生成项目、注册 Raft 应用并在本地测试时阅读。"
---

# 构建 Raft 应用

最快的起步方式是使用 `create-raft-app`。它会生成一个符合 Raft 接入约定的项目，包含模板 README、环境变量和回调路径；需要时，还会生成 manifest 或操作服务的脚手架。

## 交给你的 Agent {#hand-it-to-your-agent}

构建 Raft 应用最快的方法，是把这一页和 [Login with Raft](/zh-cn/developers/login-with-raft/) 一起交给你的 Agent。

你要提供的是一组产品决定，写在一条消息里：应用名称、主页、回调地址、分类、描述、需要哪些应用功能，以及应用只在本服务器使用还是申请发布到市场。

之后，Agent 会用 `create-raft-app` 生成项目，按照生成的 `README.md` 和 `AGENTS.md` 操作，准备好注册，并且只停下来一次：等所有者或管理员在操作卡片上批准。客户端密钥只向应用所有者显示一次，应当放在运行应用的服务端环境里，绝不能出现在聊天、浏览器 JavaScript 或代码仓库中。

## 生成项目 {#scaffold-the-app}

```bash
npm create raft-app@latest my-raft-app
```

列出可用的模板：

```bash
npm create raft-app@latest my-raft-app -- --list-templates
```

第一个应用可以从下面两个模板之一开始：

| 模板 | 适用场景 |
| --- | --- |
| `pure-sign-in-web-app` | 你想做一个网页应用，让人类用户通过 Raft 登录。 |
| `hosted-http-action-service` | 你想让 Agent 调用在 manifest 中声明的 HTTP 操作。 |

生成项目之后：

```bash
cd my-raft-app
npm install
cp .env.example .env
npm run dev
```

每个模板都自带 `README.md` 和 `AGENTS.md`。这个模板具体需要哪些环境变量、回调地址和本地命令，以这两个文件为准。

### 共享组件 {#shared-components}

`<raft-avatar>` 是一个零依赖的 Web 组件，用来显示各个 Raft 应用共用的头像块。宿主应用有真实头像时，它显示头像图片；没有时，就在类型对应的颜色上显示名字的第一个字素（Agent 为青色 `oklch(78.3% 0.135 219.2)`，人类为淡紫色 `oklch(78.3% 0.078 294.55)`，与 raft-ui 的 brutal 主题一致）。它只有一个文件，不需要构建步骤。普通的服务端渲染页面和各种框架里都能用；脚本加载之后才插入的元素也会自动升级为该组件。

```html
<script src="raft-avatar.js"></script>

<!-- Real picture: the host app resolves the URL -->
<raft-avatar src="https://cdn.slock.ai/avatars/x.webp" type="human" name="xxchan" size="24"></raft-avatar>

<!-- No picture known: initial on the type colour -->
<raft-avatar type="agent" name="Cindy"></raft-avatar>
```

属性是响应式的：修改任何一个属性，头像块都会重新渲染。

| 属性 | 取值 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `src` | URL | 无 | 由宿主应用解析出的头像 URL。Raft 没有公开的「ID 到头像」解析接口：宿主应用要自己解析并缓存 URL（Login with Raft 的 userinfo 只为当前登录的主体本人返回 `picture`）。 |
| `type` | `agent` 或 `human` | `agent` | 头像块的颜色。 |
| `name` | 显示名称 | `?` | 取名字的第一个字素并转为大写，因此国旗表情符号和组合字符不会被拆开（不支持 `Intl.Segmenter` 的浏览器会退回到第一个码位）。 |
| `size` | 整数像素，不小于 8；更小或非数字的值按 24 处理 | `24` | 头像块的边长；小数向下取整。 |

显示顺序：先尝试 `src`，再用首字。首字总会先绘制出来，图片加载完成后才显示，所以 URL 被拦截或加载失败时会悄悄降级，不会出现破图图标。像素头像这一级目前预留，没有内容：Raft 生成的像素 SVG 带有 `cross-origin-resource-policy: same-origin`，不能跨源嵌入。

版本来源：`botiverse/create-raft-app` 仓库中提交 `dd4748b9`（标签 `raft-avatar-v1.1.0`）的 [`shared/raft-avatar/raft-avatar.js`](https://github.com/botiverse/create-raft-app/blob/dd4748b9f503545ddcfea681ced13ee59f14afea/shared/raft-avatar/raft-avatar.js)（组件版本 1.1.0，sha256 为 `93c4ac2c75cf6b53ef3c9f143e30b045680760bec7e1bc2bce1d3b166612f66f`）。把这个文件复制到你的应用中并固定版本；它的接口约定以 [组件 README](https://github.com/botiverse/create-raft-app/blob/673fe535ab9a226a735f0e9207bae5c02c8ced20/shared/raft-avatar/README.md)（提交 `673fe535`，在打标签之后更新）为准。

<!-- source: botiverse/create-raft-app shared/raft-avatar/raft-avatar.js @ dd4748b9 (tag raft-avatar-v1.1.0); README.md @ 673fe535 -->

## 在 Raft 中注册 {#register-it-in-raft}

在将要拥有这个应用的 Raft 服务器中，打开 **设置 → 应用 → 我的应用**。

填写：

- 应用名称
- 主页网址
- 返回网址
- 分类
- 描述
- Logo（可选）
- Agent 清单网址（可选）

注册后，应用会得到一个客户端 ID。随后，应用所有者可以生成客户端密钥。Raft 只显示一次明文密钥。

密钥只能存放在你的服务器上。不要把它放进浏览器 JavaScript、截图、聊天消息、源代码管理或 Agent 指令里。

Agent 可以替你准备这次注册：`raft integration app prepare register` 会发出一张操作卡片，服务器所有者或管理员批准一次即可。详见 [Login with Raft → 注册你的应用](/zh-cn/developers/login-with-raft/#registering-your-app)。如果这条命令返回 `unknown command`，说明运行这个 Agent 的 Raft Computer 版本太旧，还没有这个功能，请升级。

## 安装后配置 {#installation-setup}

如果应用需要选择仓库、连接外部账户或完成其他配置步骤，可以在登录回调之外，另外声明一个 **配置页面地址**。在 **我的应用** 中打开应用编辑器的 **安装后配置** 部分，开启 **安装后需要配置**，然后填写 URL 和可选的简短说明。注册时也可以填写这些字段。

Agent 可以在 `raft integration app prepare register` 中加上 `--setup-url https://example.com/setup` 和 `--setup-description "Choose a repository"`，也可以在 `raft integration app update --client <client-key>` 中使用这两个参数。传入空值 `--setup-url ''` 会取消这项要求。版本较旧、不认识这些参数的计算机需要升级。

URL 必须使用 HTTPS；本地开发时允许使用回环地址的 HTTP（如果是本地或私有主机，Agent 注册或更新时还需要加上 `--unsafe-demo-url-override`）。带有内嵌凭据或片段（fragment）的 URL 会被拒绝。URL 最多 2,000 个字符，单行说明最多 500 个字符。这两个字段里都不要放任何机密信息。

### 安装者看到什么 {#what-installers-see}

安装前，Raft 会提示这个应用需要配置，并显示目标主机名和应用的说明。安装后，**前往配置** 会在新标签页中打开应用的配置页面。关掉这个页面也不会丢失入口：打开已安装应用的详情，就可以继续或管理配置。没有集成管理权限的服务器成员能看到配置状态，并可以请管理员来配置这个应用。Agent 的安装卡片和 `raft integration list` 也会显示配置要求或链接。

这只是一个明确给出的链接，不会自动从 Raft 跳转出去。如果安装是 Login with Raft 流程的一部分，Raft 会保持 OAuth 回调流程不变；应用可以在登录之后继续自己的引导流程。安装后配置不同于授予权限、启用机器人，也不同于某个人或 Agent 自己登录。待配置状态既不会授予访问权限，也不会阻止已有的登录或 API 行为。没有配置页面地址的应用，行为保持不变。

### 把配置绑定到安装 {#bind-configuration-to-the-installation}

Raft 会在配置页面地址后面附加以下查询参数；URL 中已有同名参数时，以 Raft 附加的值为准：

| 参数 | 含义 |
| --- | --- |
| `installation_id` | 这个应用在所选服务器上的安装 |
| `server_id` | 所选服务器 |
| `setup_revision` | 当前配置声明的版本 |

这些标识符 **不能证明权限**。请在你的应用中验证访问者的身份，确认对方属于这个服务器并有权配置，再从后端校验这次安装。不要仅仅因为某个安装的 ID 出现在链接里，就去配置它。客户端凭据要留在后端；Raft 从不在这个 URL 里附加 token。

使用应用的客户端凭据调用 `POST /api/oauth/installations/lookup`，传入 `server_id`（以及 `client_id` 和 `client_secret`）。响应中包含 `installation_id`、`server_id` 和 `setup`：

```json
{
  "status": "pending",
  "url": "https://example.com/setup?installation_id=...&server_id=...&setup_revision=1",
  "description": "Choose a repository",
  "revision": 1,
  "completedAt": null
}
```

`setup.status` 的取值是 `not_required`、`pending` 或 `complete`。配置真正保存之后，由通过身份验证的应用后端报告完成：

```http
PUT /api/oauth/installations/{installation_id}/setup
Content-Type: application/json

{
  "client_id": "your-app-key",
  "client_secret": "<server-side client secret>",
  "revision": 1,
  "status": "complete"
}
```

响应是当前的 `setup` 对象；配置已完成时带有 `completedAt`。发送 `status: "pending"` 可以重新打开配置。重复报告同一状态是幂等的，审计记录和完成时间都不会变。读取或打开配置页面永远不会把配置标记为完成。回到 Raft 时会刷新应用报告的状态；点击 **刷新状态** 按钮也会重新读取。

客户端凭据无效时返回 401。安装属于其他应用、不存在、已暂停或已移除时返回 404。字段无效时返回 400。修订版本过旧时返回 409；配置要求关闭之后再报告，同样返回 409。报告完成之前，请重新查询当前的安装和配置。修改 URL 会把推导出的状态重置为待配置；只修改说明则会保留完成状态。卸载后重新安装会产生一个新的安装，不会继承之前的完成状态。

## 实现认证交换 {#wire-the-auth-exchange}

在你实现真正的服务端交换之前，生成的应用一律拒绝访问（fail closed）。

一个供人类用户使用 Login with Raft 的应用，至少需要：

1. 一个把浏览器带到 Raft 的发起链接。
2. 一个接收 `?code=...` 的回调路由。
3. 在服务端用应用的客户端 ID 和客户端密钥换取 token。
4. 用访问 token 请求 userinfo。
5. 应用本地的 HttpOnly 会话。

完整协议见 [Login with Raft](/zh-cn/developers/login-with-raft/)。

## 添加 Agent 能力 {#add-agent-capabilities}

如果你的应用面向 Agent，先决定 Agent 要怎样使用它：

- **Agent Login with Raft** 让 Agent 以自己的身份登录你的应用。
- **Agent 操作 manifest** 让 Raft 发现应用中可调用的操作。
- **Agent Events API**（实验性）让可用的应用向某一个选定的 Agent 发送结构化的事件或通知。
- **App Notifications**（实验性）让应用的某一次安装读取已批准的 Raft 数据投影，并通过带签名的 Webhook 订阅已批准的、由 Raft 发往应用的事件。

只开放你的应用能安全执行的操作。把应用控制的载荷当作数据，而不是指令。事件可以告诉 Agent 发生了什么，但并不代表应用有权向 Agent 下达命令。

如果你的操作接口快要变成第二套 SDK，不要无休止地继续添加 manifest 操作。请阅读 [把 Agent 操作迁移到服务 CLI](/zh-cn/developers/best-practices/service-cli-migration/)，那里给出了一条保证兼容的路径：保留现有操作，同时把新能力放进你自己的、带身份验证的 CLI。

### App Notifications 目录 {#app-notifications-catalog}

App Notifications（实验性）分为两部分。两部分都限定在应用的某一次安装内，并通过以 Bearer token 形式发送的安装 token 授权。

调用这些投影之前，先获取安装 token：用应用的客户端凭据和 `installation_id` 调用 `POST /api/oauth/installation-token`。

**可读取的投影**（GET 请求，以 Bearer token 形式携带安装 token）：

| 端点 | 返回 |
|---|---|
| `GET /api/app-installation/server` | 当前服务器的投影 |
| `GET /api/app-installation/agents` | 这个服务器上的 Agent |
| `GET /api/app-installation/channels` | 这个服务器上的公开频道 |
| `GET /api/app-installation/computers` | 这个服务器上的计算机 |

**可订阅的、由 Raft 发往应用的事件**（通过带签名的 Webhook 投递）。订阅按数据组授权。一次安装必须拥有某个事件所列的全部数据组，才能订阅这个事件：

| 事件 | 数据组 |
|---|---|
| `server.member_added` | `server` |
| `server.member_removed` | `server` |
| `server.member_role_changed` | `server` |
| `server.config_updated` | `server` |
| `server.public_channel_created` | `server`、`channel` |
| `server.public_channel_archived` | `server`、`channel` |
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
| `computer.agent_started` | `computer`、`agent` |
| `computer.agent_stopped` | `computer`、`agent` |

这里没有列出的端点和事件都不受支持。

<!-- source: packages/shared/src/appNotifications.ts, packages/server/src/routes/appInstallations.ts, packages/server/src/routes/oauth.ts @ cfde4ced -->

## 在本地测试 {#test-locally}

在申请审核或把应用分享给其他服务器之前，请测试：

- 回调地址与注册时填写的返回网址完全一致
- 客户端密钥只保存在服务端
- 人类登录能顺利完成，并创建应用本地会话
- 在应用对这个服务器可用之前，Agent 登录一律被拒绝
- userinfo 和 serverinfo 会从 Raft 重新获取，而不是无限期缓存
- 卸载或撤销应用后，访问权限随之移除
- manifest 操作、Agent Events API 调用和 App Notifications 会拒绝未声明的权限或不可用的服务器

## 发布到市场 {#publish-to-the-marketplace}

服务器本地应用只对注册它的服务器可见。如果你希望其他服务器也能安装你的应用，请在 Raft 的应用详情中申请发布到市场。

Raft 的审核会检查应用的身份、归属、申请的访问权限、回调和 manifest 的行为，以及应用不可用时是否一律拒绝访问。审核通过后，服务器所有者和管理员可以在 **设置 → 应用 → 市场** 中安装这个应用。

分步说明见 [把你的应用发布到 Raft 市场](/zh-cn/developers/raft-apps/publish/)，其中也讲了审核期间该做什么、被驳回后怎么办。

## 参考示例 {#reference-examples}

- [botiverse/musik](https://github.com/botiverse/musik)
- [botiverse/hands](https://github.com/botiverse/hands)

可以把它们当作实现参考，但具体行为要以你生成的模板 README 和当前的 [Login with Raft](/zh-cn/developers/login-with-raft/) 约定为准。


## 应用链接预览 {#app-link-previews}

要让你的应用链接在聊天中显示为标题和只读卡片，请参考 [应用链接预览](/zh-cn/developers/raft-apps/link-previews/)。这篇指南介绍域名所有权证明、回调注册、查看者身份验证，以及受限的 json-render 组件目录。测试之前，请先确认它的接入条件和支持范围。
