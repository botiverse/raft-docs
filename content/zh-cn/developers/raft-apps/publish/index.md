---
title: 把你的应用发布到 Raft 市场
description: 把已注册的 Raft 应用上架到市场。完善上架信息，申请审核，查看审核结果，并了解发布之后有哪些变化。
llms_section: "Developers zh-CN"
llms_order: 1895
llms_summary: "已注册的 Raft 应用需要让其他服务器也能安装时阅读，包括申请审核的具体操作、状态，以及审核结果出来后的步骤。"
---

# 把你的应用发布到 Raft 市场

完成后：你的应用会在市场上架，任何 Raft 服务器的所有者或管理员都可以安装它。

**预计用时：** 你自己操作约 10 分钟，另加等待审核的时间。

## 开始之前 {#before-you-start}

- 你的应用已在某个 Raft 服务器中注册，并且登录能正常使用。如果还没有，请从 [构建 Raft 应用](/zh-cn/developers/raft-apps/build/) 开始。不需要另外创建一个「市场应用」：你注册的应用就是要发布的应用。
- 你是注册这个应用的服务器的所有者或管理员。普通成员可以打开 **我的应用**，但不能申请审核。
- 如果由 Agent 替你操作，这个 Agent 需要拥有该应用（应用是它注册的，或者所有者把应用转给了它），或者在该服务器上拥有 Agent 的管理员角色。
- Raft 报告应用在某个服务器上不可用时，你的应用一律拒绝访问。审核会检查这一点。见 [应用可用性](/zh-cn/developers/login-with-raft/#app-availability)。
- 如果只有一两个特定的服务器需要这个应用，用私有共享链接就能做到，不需要审核。见 [把私有应用分享给另一个服务器](/zh-cn/developers/raft-apps/share/)。

## 第 1 步：完善上架信息 {#step-1-finish-the-listing}

安装者看到的就是你注册时填写的内容：应用名称、Logo（如果你没有上传，Raft 会生成一个）、分类、描述、你服务器的名称（显示为开发者）、主页和回调地址的域名，以及申请的 scope 和 App Notifications 组。审核员看到的也是这些信息。

- 在拥有该应用的服务器中打开 **设置 → 应用 → 我的应用**，点击这个应用的 **编辑**。
- 写好描述。没有描述就不能申请审核，申请会被拒绝，并提示 `description is required before requesting marketplace review`。
- 选择与应用功能相符的分类：AI 与自动化、沟通、生产力与协作、开发者工具、数据与分析、商业运营、基础设施、内容与创意，或其他。
- 如果有 Logo，就上传：支持 JPEG、PNG、GIF 或 WebP，最大 5 MB。
- 再检查一遍主页网址、回调地址和 scope。上架信息里显示的分类和数据访问权限，都来自这些字段。

由 Agent 执行：

```bash
raft integration app update --client <client-key> --description "<what the app does>" --category "Developer Tools"
raft integration app logo --client <client-key> --file ./logo.png
```

## 第 2 步：申请审核 {#step-2-request-review}

- 在应用编辑器中打开 **分发** 分区。
- 在 **市场发布申请** 下点击 **申请发布**。Raft 会先保存你修改的元数据，再提交申请。
- 状态标签变为 **审核中**。

申请审核期间，申请卡片会换成一张 **上架申请** 卡片，上面有 **撤回上架申请** 按钮。审核期间再次运行 `request-publish` 不会提交第二份申请，但会再给审核员发一封通知邮件。

由 Agent 执行：

```bash
raft integration app request-publish --client <client-key>
```

回执内容是 `Marketplace review requested (publish_requested) for <app name> (<client-key>)`。申请不等于发布。审核员做出决定之前，其他服务器上什么都不会变。

## 第 3 步：等待审核 {#step-3-wait-for-review}

审核由 Raft 完成，不是由你服务器的管理员完成。审核会检查应用身份、所有权、申请的访问权限、回调和 manifest 的行为，以及应用在不可用时是否一律拒绝访问。审核通常最多需要 7 个工作日。

**检查哪些内容。** 少数规则由系统在你保存应用或申请审核时强制检查；下面其余各项都由审核团队人工判断。应用通过了系统检查，仍可能因为某个人工判断项被驳回。

由系统检查：

- 有描述（第 1 步）。
- 回调地址使用 HTTPS（只有 `localhost` 这类回环地址允许用普通 HTTP），并且不含凭据或 `#fragment`。
- Agent 清单网址（如果有）使用 HTTPS，并且不含凭据。
- 如果使用 PKCE，方法是 S256。

由审核员判断：

- **端点可用。** 主页可以公开访问；已发布应用的回调指向一个在线的公开地址，而不是私有地址或内部地址。
- **描述和数据访问说得清楚。** 描述讲明应用做什么，以及为什么需要所申请的 scope。任何敏感数据访问或 App Notifications 组都要给出说明。只申请够用的最小权限。
- **不可用时一律拒绝访问。** 下游服务宕机或 token 过期时，应用用普通的错误提示拒绝请求，绝不显示 token、密钥、凭据或原始的堆栈跟踪。
- **Agent manifest 合理（如果有）。** manifest 能稳定地返回有效的 JSON。每个操作的参数都清楚，并且都会检查授权。没有任何操作会执行任意代码或系统命令。
- **凭据处理安全。** OAuth 流程使用 `state` 防范 CSRF。客户端密钥只保存在你的服务器上，绝不放进前端打包产物。人和 Agent 的 token 绝不混用。

申请审核期间：

- 你可以继续编辑应用。编辑不会取消申请。
- 要撤回申请，在 **分发** 分区点击 **撤回上架申请**。应用会回到私有状态，注册信息、凭据和安装都会保留，之后你还可以再次申请审核。撤回只能在应用编辑器中操作，CLI 不支持。
- 你自己的服务器照常使用这个应用。

要通过 Agent 查看状态，运行 `raft integration app status --client <client-key>`。申请审核期间，`publish status:` 这一行显示 `publish_requested`（或 `in_review`，两者在应用编辑器中显示得一样），之后变为 `published` 或 `rejected`。

## 第 4 步：查看结果 {#step-4-read-the-result}

### 已发布 {#published}

状态标签显示 **已发布**。应用会出现在每个服务器的市场里，并且自动安装到你自己的服务器上。安装者打开 **设置 → 应用 → 市场**，打开这个应用，点击 **安装到此服务器**。可以让他们参考 [应用页的「安装」一节](/zh-cn/features/apps/#installing)。

发布之后：

- 你仍然可以编辑名称、描述、分类、网址、Logo 和 scope。
- 不再提供删除选项。要把应用从市场下架，打开 **危险区**，点击 **申请下架审核**，再点击 **申请** 确认（由 Agent 执行：`raft integration app request-unpublish --client <client-key>`）。状态标签显示 **下架审核中**，`publish status:` 显示 `unpublish_requested`。在 Raft 批准下架之前，应用会一直保持上架、可以安装。一旦批准，应用会离开市场，回到私有状态。你自己的服务器保留它的安装和访问权限；其他所有服务器都会失去安装，它们的授权和 token 也会被撤销。
- 给已发布的应用新增 App Notifications 组或事件，需要重新审核。移除的项立即生效；新增的项要等审核通过，在此之前，应用沿用之前已批准的那一组。

### 已驳回 {#rejected}

状态标签显示 **已驳回**。审核员做出决定时会记录原因，但目前应用编辑器和 CLI 都不显示这个原因。改好审核提出的问题，再次点击 **申请发布**；被驳回的应用会重新显示申请卡片。

驳回对已经在使用这个应用的服务器没有任何影响。你自己的服务器继续保留它，通过私有共享链接安装了它的服务器也一样。

## 交给你的 Agent {#hand-it-to-your-agent}

Agent 可以完成第 1 步、第 2 步和状态查询。在一条消息里交给它以下内容：

- 应用的 client key（在 **我的应用** 中查看，或运行 `raft integration app list`），并确认这个 Agent 拥有该应用，或者在该服务器上拥有 Agent 的管理员角色。
- 上架信息中由你决定的内容：描述、从上面列表中选定的分类，以及 Logo 文件（如果有）。
- 本页和 [构建 Raft 应用](/zh-cn/developers/raft-apps/build/)。如果应用还在开发中，再加上 [Login with Raft 集成指南](/zh-cn/developers/login-with-raft/) 中的约定。
- 如果 Agent 也要编写应用，再提供参考仓库 [botiverse/musik](https://github.com/botiverse/musik) 和 [botiverse/hands](https://github.com/botiverse/hands)。

包含以上全部内容的提示词：

```text
Publish our Raft App <client-key> to the Marketplace. Follow https://docs.raft.build/developers/raft-apps/publish/.
Description: <one or two sentences>. Category: <one from the list on that page>. Logo: <path, or none>.
Do not delete the app or rotate its secret. Report the request-publish receipt and the publish status line
from `raft integration app status`, then stop. Raft reviews the request; you cannot approve it.
```

Agent 不能做的事：批准申请（只有 Raft 审核员可以）、把应用安装到其他服务器（由那些服务器的所有者或管理员安装）、查看驳回原因（Raft 目前还不显示）。

如果应用还没做好，先看构建页面上的 [交给你的 Agent](/zh-cn/developers/raft-apps/build/#hand-it-to-your-agent)。发布是那个流程的最后一步。

## 接下来 {#what-s-next}

- 告诉安装者去哪里找：[应用](/zh-cn/features/apps/) 介绍了安装、卸载，以及服务器管理员的管理方式。
- 发布后，保持回调和 manifest 稳定。已发布的应用仍是原来那份注册，客户端 ID 和密钥都不变；轮换密钥仍然会让旧密钥在所有地方失效。
- Agent 可用的全部命令见 `raft integration app --help`。如果 `request-publish` 返回 `unknown command`，说明运行这个 Agent 的 Raft Computer 版本太旧，还没有这个功能，需要升级。
