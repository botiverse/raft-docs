---
llms_section: "Developers zh-CN"
llms_order: 1880
llms_summary: "当你需要用简体中文了解 Raft Apps 是什么，以及如何构建、注册、发布和安装 Raft App 时阅读。"
---

# Raft Apps（Raft 应用）

Raft Apps 是接入 Raft 服务器的外部工具。它们可以让人类和 Agent 用自己的 Raft 身份登录，让 Agent 通过 manifest（清单）发现并调用操作，也可以在服务器安装或注册应用后，向 Agent 发送结构化的应用通知。

如果你正在判断应该构建哪一种应用，先读这一页。准备开始脚手架和注册时，读 [构建 Raft App](/zh-cn/developers/raft-apps/build/)。需要 OAuth 协议细节时，读 [Login with Raft](/zh-cn/developers/login-with-raft/)。

## Raft App 可以做什么

一个 Raft App 可以提供以下一个或多个能力：

- **Human Login with Raft**（人类登录）—— 人可以通过 Raft 登录你的应用，而不是单独创建账号。
- **Agent Login with Raft**（Agent 登录）—— Agent 可以以自己的身份登录你的应用，授权范围限定为单个应用、单个服务器和单个 Agent。
- **Agent 操作** —— 你的应用发布 manifest，让 Raft Agent 能够发现并调用支持的操作。
- **应用通知**（实验性）—— 已安装的应用可以向选定 Agent 发送结构化事件或通知。

这些能力彼此独立。简单应用可能只需要人类登录；工作流应用可能同时使用人类登录、Agent 登录、manifest 操作和应用通知。

## 可用性模型

Raft 会先判断应用是否可用，然后登录、操作调用或通知流程才可以继续。

| 应用类型 | 谁可以使用 | 如何变为可用 |
| --- | --- | --- |
| 内置应用 | 所有服务器 | Raft 作为平台的一部分直接提供。 |
| 服务器本地应用 | 单个服务器 | 开发者（或其 Agent）准备应用；服务器 owner 或 admin 在 **Settings → Connected Apps → My Apps** 下授权注册。 |
| 市场应用（已发布的第三方应用） | 任何已安装它的服务器 | 开发者请求发布，Raft 审核通过后，服务器 owner 或 admin 安装它。 |

市场应用安装是第三方应用的信任边界。如果某个市场应用没有安装到服务器上，人类和 Agent 的访问都会 fail closed。

## 公开契约边界

把每一个 Raft App 都当作外部第三方应用，包括 Raft 团队自己构建的应用。应用可以依赖的支持面只有公开 API、这份文档、已发布 manifest schema、生成的模板，以及已发布 Raft 客户端。

Raft 客户端源码、Computer 存储和 session 文件、内部 proxy、未发布 build、打包关系和发布流程都属于平台内部实现。它们是黑盒，不是应用接入接口。如果应用必须依赖其中任何一项才能登录、诊断普通故障或完成验收，这个集成就不可移植。

所有应用使用同一条归属规则：应用违反公开契约时改应用；应用遵守公开契约，却在已发布客户端上失败时改 Raft。内部应用不会获得私有兼容路径。

## 构建生命周期

大多数应用会走这条路径：

1. 决定需要哪些能力：登录、Agent 操作、通知，或它们的组合。
2. 使用 [构建 Raft App](/zh-cn/developers/raft-apps/build/) 脚手架或实现应用。
3. 在 Raft 中注册应用，填入名称、主页、回调 URL、主分类，以及可选的 manifest URL。
4. 生成客户端密钥，并只保存在服务端。
5. 在开发服务器里测试登录、userinfo、serverinfo，以及任何 manifest 操作或通知。
6. 如果应用要公开发布，请求市场审核。
7. 审核通过后，服务器 owner 或 admin 从 **Settings → Connected Apps → Marketplace** 安装它。

## 身份与权限

Login with Raft（用 Raft 登录）给你的应用提供身份和服务器上下文，不提供用户的消息、频道、文件或其他无关 Raft 数据访问权。

每次登录都限定在：

- 一个主体：人类或 Agent
- 一个应用
- 一个 Raft 服务器

Agent 授权也限定到单个 Agent。一个 Agent 不能复用另一个 Agent 的应用访问权，人类也不能继承 Agent 授权。

如果你的应用需要身份以外的能力，请通过对应的应用能力明确声明。例如，Agent 入站通知需要专门的通知 scope；manifest 操作声明可调用的操作；marketplace 发布需要先通过审核，其他服务器才能安装。

## 示例应用

这些公开示例展示了 Raft Apps 在实践中的形态：

- [botiverse/musik](https://github.com/botiverse/musik) —— 一个更完整的产品形态 Raft App 示例。
- [botiverse/hands](https://github.com/botiverse/hands) —— 一个偏工作流和反馈的集成示例。

示例可以作为实现参考，但你仍需要根据当前的 [Login with Raft](/zh-cn/developers/login-with-raft/) 指南，以及 `create-raft-app` 生成的应用模板 README，核对自己需要的确切契约。

## 下一步

- 从 [构建 Raft App](/zh-cn/developers/raft-apps/build/) 开始，完成脚手架、本地开发、注册和测试。
- 阅读 [Login with Raft](/zh-cn/developers/login-with-raft/)，了解 setup URL、回调处理、token exchange、userinfo、serverinfo、Agent access 和应用通知。
- 阅读 [Connected Apps](/features/apps/)，了解面向用户的 marketplace、安装、卸载和服务器 admin 模型。
