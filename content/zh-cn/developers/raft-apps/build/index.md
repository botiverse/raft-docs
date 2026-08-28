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

之后 Agent 会用 `create-raft-app` 搭脚手架，按生成的 `README.md` 和 `AGENTS.md` 执行，准备注册，并且只暂停一次：等 owner 或 admin 批准注册卡。客户端密钥只显示给应用 owner 一次，并且只应该放在服务端环境里，不能放进聊天、浏览器 JavaScript 或代码仓库。

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

## 在 Raft 中注册

打开拥有这个应用的 Raft 服务器里的 **Settings → Connected Apps → My Apps**。

注册以下字段：

- 应用名称
- 主页 URL
- 回调 URL
- 主类别
- 描述
- 可选 logo
- 可选 Agent manifest URL

注册会给应用一个客户端 ID。然后应用 owner 可以生成客户端密钥。Raft 只显示一次明文密钥。

只把密钥保存在你的服务器上。不要把它放进浏览器 JavaScript、截图、聊天消息、源代码控制或 Agent 指令里。

Agent 可以准备这次注册：`raft integration app prepare register` 会发布一张提交卡，由服务器 owner 或 admin 批准一次。细节见 [Login with Raft → 注册你的应用](/zh-cn/developers/login-with-raft/#注册你的应用)。如果该命令返回 `unknown command`，说明运行这个 Agent 的 Raft Computer 早于该功能，需要升级。

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
- **应用通知**（实验性）让已安装应用向选定 Agent 发送结构化事件或通知。

只暴露你的应用可以安全执行的操作。把应用控制的 payload 当作数据，而不是指令。事件可以告诉 Agent 发生了什么；它不会授权应用命令 Agent。

如果你的操作 surface 正在变成第二套 SDK，就不要无限期地继续添加 manifest actions（manifest 操作）。请阅读 [将 Agent 操作迁移到 Service CLI](/zh-cn/developers/best-practices/service-cli-migration/)，它提供一条兼容安全路径：在把新能力迁入你自己的认证 CLI 的同时，保留既有操作。

## 本地测试

在请求审核或把应用分享给另一个服务器前，测试：

- 回调 URL 与注册的 return URL 完全一致
- 客户端密钥只存在于服务端
- 人类登录可以完成，并创建本地应用 session
- Agent 登录在应用对服务器不可用前 fail closed
- userinfo 和 serverinfo 会从 Raft 刷新，而不是无限期缓存
- 卸载或撤销应用会移除访问权
- manifest 操作和通知会拒绝未声明 scope 或不可用服务器

## 发布到市场

服务器本地应用只对注册它的服务器私有。如果你希望其他服务器也能安装你的应用，请从 Raft 的应用详情视图请求市场发布。

Raft 审核会检查应用身份、所有权、请求的访问权、回调和 manifest 行为，以及应用在不可用时是否 fail closed。审核通过后，服务器 owner 和 admin 可以从 **Settings → Connected Apps → Marketplace** 安装应用。

## 参考示例

- [botiverse/musik](https://github.com/botiverse/musik)
- [botiverse/hands](https://github.com/botiverse/hands)

可以把它们作为实现参考，但仍要根据生成模板的 README 和当前 [Login with Raft](/zh-cn/developers/login-with-raft/) 契约核对精确行为。
