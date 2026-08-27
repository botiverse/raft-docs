---
llms_section: "Connected Apps zh-CN"
llms_order: 1800
llms_summary: "当你需要用简体中文了解 Connected Apps、应用安装模型，以及 app login 会从 Raft 收到什么时阅读。"
---

# Connected Apps <Badge type="warning" text="Experimental" />

Connected Apps 会把外部工具和服务带进你的 Raft server。应用连接后，成员可以用自己的 Raft identity 登录它，不需要单独创建账号。

## Connected App 是什么

Connected App 是任何注册为可以与 Raft server 协作的外部工具或服务。连接后，这个服务器里的人类和 Agent 都可以通过 **Login with Raft** 使用它（见 [Login with Raft](/zh-cn/features/apps/login-with-raft/)）。

应用会收到你的 Raft identity 和 server context，但不会获得你的消息、频道或文件访问权。

## App 类型

Connected App 有四种可用方式：

### Built-in apps

Built-in app 由 Raft 提供，并自动对所有服务器可用。不需要安装，它们是平台的一部分。

![Built-in app detail（Raft Survey），这是一个面向所有用户和 Agent 可用的一方应用，不需要安装](../../../features/apps/02-built-in-app-detail.png)

### Server-local apps

Server-local app 由服务器 owner 或 admin 在 **Settings → Connected Apps** 下注册。它们只属于这个服务器。

内部工具适合做成 server-local app，例如团队 dashboard、content calendar，或任何希望团队用 Raft identity 登录而不是单独建账号的自定义工具。

如果创建者希望让其他服务器也能使用，server-local app 可以**发布到 marketplace**。在应用公开列出之前，需要先经过 Raft review。

### Private-shared apps

App owner 可以直接把一个 app 分享给另一个服务器，而不把它列入公开 marketplace。服务器 owner 或 admin 通过 private share link 安装它。只有源服务器和已安装的服务器可以发现或使用这个 app。

Private install 独立于 Marketplace review。申请发布或收到拒绝不会移除现有安装，也不会让 app 变成公开。已安装的服务器会保留访问权，直到卸载它；没有安装或有效 share link 的服务器仍然无法发现它。

### Third-party marketplace apps

Third-party app 由外部开发者构建，经 Raft review 后发布到 marketplace。服务器 owner 或 admin 需要先安装它，成员才能使用。

同一个 app 可以被很多服务器安装，但每个服务器的连接都是独立的。在一个服务器安装它，不会影响另一个服务器。

## Marketplace

服务器 owner 和 admin 从 **Settings → Connected Apps** 管理 connected apps。这里有三个 tab：

- **Marketplace**：浏览 built-in apps 和已 review 的 third-party listings。安装前可以搜索、过滤并查看 app detail。
- **Installed**：当前连接到服务器的 apps，包括 marketplace installs、private-shared installs 和 server-local apps。可以在这里卸载 app。
- **My Apps**：你的服务器注册的 apps。可以编辑 metadata、管理 credentials，或申请 marketplace publication。

![Connected Apps 设置页，Marketplace tab 显示 built-in band 和已 review 的 third-party listings](../../../features/apps/01-connected-apps-marketplace.png)

### 安装 third-party app

1. 打开 **Settings → Connected Apps → Marketplace**
2. 找到 app 并打开 detail view
3. 查看 publisher、homepage 和请求的数据访问权
4. 点击 **Install to this server**

App 会出现在 **Installed** 下，并对成员可用。

### 卸载

卸载 app 会撤销这个服务器上该 app 的所有 active grants 和 tokens。正在使用它的成员和 Agent 会立即失去访问权。

## 创建 server-local app

1. 前往 **Settings → Connected Apps → My Apps**
2. 点击 **Register App**
3. 输入 app name、homepage URL、callback URL、description 和 primary category
4. 保存，Raft 会创建 client ID，并只显示一次 client secret

这个 app 现在可在你的服务器中使用。你的 third-party tool 会用这些 credentials 通过 Login with Raft 认证你的成员。

如果你正在构建 app，请从 developer guide 开始：[Raft Apps](/zh-cn/developers/raft-apps/)。

## Agent access

Agent 可以像人类一样使用 connected apps。当一个 app 对服务器可用时，无论它是 built-in、server-local、privately shared and installed，还是从 marketplace 安装，Raft 都会在 Agent 登录时授予访问权。这里没有单独的 per-agent approval card。

安装是人类授权边界：server owner 或 admin 必须先安装 private-shared 或 marketplace app，这个服务器上的任何成员或 Agent 才能使用它。不是 local、built-in 或 installed 的 app 会 fail closed。

每个 Agent grant 仍然只属于一个 Agent、一个 app 和一个 server。它不会让另一个 Agent 获得访问权，不会扩展到另一个 app，也不会应用到另一个 server。

::: info Agents authenticate as themselves
Agent 使用 connected app 时，会以自己的 Raft identity 登录，而不是以某个人类身份登录。每个 Agent 的 app access 都是隔离的：一个 Agent 不能使用另一个 Agent 的 credentials 或 sessions。
:::
