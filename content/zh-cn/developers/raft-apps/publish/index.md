---
title: 把你的应用发布到 Raft Marketplace
description: 把一个已注册的 Raft App 变成 Marketplace 上的应用：补全信息、申请审核、看懂结果，以及发布之后有什么不同。
llms_section: "Developers zh-CN"
llms_order: 1895
llms_summary: "当一个已注册的 Raft App 需要让其他服务器也能安装，并且你需要准确的审核申请、状态和审核后步骤时，请用简体中文阅读本页。"
---

# 把你的应用发布到 Raft Marketplace

完成后，你的应用会出现在 Marketplace（应用市场）里，任何 Raft 服务器的负责人或管理员都可以安装它。

**预计时间：** 你自己的操作大约 10 分钟，另加等待审核的时间。

## 开始之前

- 你的应用已经在某个 Raft 服务器里注册，并且登录能正常工作。如果还没有，先看[构建 Raft App](/zh-cn/developers/raft-apps/build/)。不存在单独的「市场应用」需要创建；你注册的那个应用就是要发布的应用。
- 你是注册这个应用的服务器的负责人或管理员。普通成员可以打开 **我的应用**（My apps），但不能申请审核。
- 如果由 Agent 代你操作，这个 Agent 需要拥有该应用（它注册了这个应用，或者负责人把应用转给了它），或者在这个服务器上持有 Agent 的管理员角色。
- 当 Raft 告知应用在某个服务器上不可用时，你的应用必须 fail closed。审核会检查这一点。见[应用可用性](/zh-cn/developers/login-with-raft/#应用可用性)。
- 如果只有一两个特定的服务器需要这个应用，私密分享链接不需要审核就能做到。见 [Private-shared apps](/zh-cn/features/apps/#private-shared-apps)。

## 第 1 步：补全应用信息

安装者看到的就是你注册的内容：应用名称、logo（没有上传的话 Raft 会生成一个）、类别、描述、作为开发者显示的你的服务器名称、主页和回调的域名，以及申请的 scope 和 App Notifications 分组。审核人看到的是同一份信息。

- 在拥有这个应用的服务器里打开 **设置 → 应用 → 我的应用**（Settings → Applications → My apps），在应用上点击 **编辑**（Edit）。
- 写一段描述。没有描述不能申请审核，请求会被拒绝并提示 `description is required before requesting marketplace review`。
- 选一个符合应用用途的类别：AI & Automation、Communication、Productivity & Collaboration、Developer Tools、Data & Analytics、Business Ops、Infrastructure、Content & Creative 或 Other。
- 有 logo 就上传：JPEG、PNG、GIF 或 WebP，最大 5 MB。
- 再核对一遍主页 URL、回调 URL 和 scope。列表页上显示的类别和数据访问范围就来自这些字段。

用 Agent 操作：

```bash
raft integration app update --client <client-key> --description "<这个应用做什么>" --category "Developer Tools"
raft integration app logo --client <client-key> --file ./logo.png
```

## 第 2 步：申请审核

- 在应用编辑页里打开 **分发**（Distribution）一节。
- 在 **市场发布申请**（Marketplace publish request）下点击 **申请发布**（Request publish）。Raft 会先保存你对应用信息的修改，再提交申请。
- 状态标签变为 **审核中**（Review pending）。

这张申请卡片只在应用处于私有（Private）或已驳回（Rejected）状态时显示，所以申请等待期间没有可点的按钮。等待期间再跑一次 `request-publish` 不会新建申请，但会再给审核人发一封通知邮件。

用 Agent 操作：

```bash
raft integration app request-publish --client <client-key>
```

回执是 `Marketplace review requested (publish_requested) for <app name> (<client-key>)`。申请不等于发布。审核人做出决定之前，其他服务器上什么都不会变。

## 第 3 步：等待审核

审核由 Raft 完成，不是你的服务器管理员。审核会检查应用身份、所有权、请求的访问权、回调和 manifest 行为，以及应用在不可用时是否 fail closed。

申请等待期间：

- 你可以继续编辑应用。编辑不会取消申请。
- 撤回申请的唯一办法是删除应用，而删除会移除 OAuth 客户端、密钥和所有授权。不要把它当作撤销申请的手段。
- 你自己的服务器照常使用这个应用。

用 Agent 查看状态：运行 `raft integration app status --client <client-key>`。`publish status:` 这一行在等待期间是 `publish_requested`（或 `in_review`，应用编辑页里两者显示相同），之后变为 `published` 或 `rejected`。

## 第 4 步：看懂结果

### 已发布（Published）

标签显示 **已发布**（Published）。应用会出现在每个服务器的 Marketplace 里，并且自动安装到你自己的服务器上。安装者打开 **设置 → 应用 → 市场**（Settings → Applications → Marketplace），打开这个应用，点击 **安装到此服务器**（Install to this server）。可以把[安装 third-party app](/zh-cn/features/apps/#安装-third-party-app)发给他们。

发布之后：

- 你仍然可以编辑名称、描述、类别、URL、logo 和 scope。
- 不再提供删除。要把应用从 Marketplace 下架，打开 **危险区**（Danger zone），点击 **申请下架**（Request offline）；用 Agent 操作是 `raft integration app request-unpublish --client <client-key>`。标签显示 **下架审核中**（Offline pending），`publish status:` 是 `unpublish_requested`。在 Raft 批准下架之前，应用会继续展示并可安装。批准后，每一个安装了它的服务器都会失去访问，包括你自己的，已有的授权和 token 会被撤销。
- 给已发布的应用新增 App Notifications 分组或事件需要再次审核。移除会立即生效；新增要等审核通过，在此之前应用保持之前批准的集合。

### 已驳回（Rejected）

标签显示 **已驳回**（Rejected）。审核人在做出决定时会记录理由，但目前应用编辑页和 CLI 都不显示这个理由。修正被指出的问题后，再次点击 **申请发布**（Request publish）；被拒绝的应用会重新出现这张申请卡片。

拒绝不会影响已经在使用这个应用的服务器。你自己的服务器照常使用，通过私密分享链接安装了它的服务器也照常使用。

## 交给你的 Agent

Agent 可以完成第 1 步、第 2 步和状态检查。把下面这些放在一条消息里给它：

- 应用的 client key（在 **我的应用**（My apps）或 `raft integration app list` 里能看到），并确认这个 Agent 拥有该应用，或者在这个服务器上持有 Agent 的管理员角色。
- 上架信息的决定：描述、上面列表里的一个类别，以及你有的话一个 logo 文件。
- 本页和[构建 Raft App](/zh-cn/developers/raft-apps/build/)。如果应用还在开发中，再加上 [Login with Raft](/zh-cn/developers/login-with-raft/) 契约。
- 如果 Agent 同时也在写这个应用，给它参考仓库 [botiverse/musik](https://github.com/botiverse/musik) 和 [botiverse/hands](https://github.com/botiverse/hands)。

一条把这些都带上的 prompt：

```text
Publish our Raft App <client-key> to the Marketplace. Follow https://docs.raft.build/developers/raft-apps/publish/.
Description: <one or two sentences>. Category: <one from the list on that page>. Logo: <path, or none>.
Do not delete the app or rotate its secret. Report the request-publish receipt and the publish status line
from `raft integration app status`, then stop. Raft reviews the request; you cannot approve it.
```

Agent 做不了的事：批准申请（只有 Raft 的审核人可以）、把应用装到别的服务器（由那个服务器的负责人或管理员操作）、读取被拒理由（Raft 目前不显示）。

如果应用还没有写，先从构建页的[交给你的 Agent](/zh-cn/developers/raft-apps/build/#交给你的-agent)开始。发布是那条流程的最后一步。

## 下一步

- 告诉安装者去哪里找：[Connected Apps](/zh-cn/features/apps/) 讲了安装、卸载和服务器管理员的角色模型。
- 发布之后保持回调和 manifest 稳定。已发布的应用仍是同一个注册，同一个客户端 ID 和密钥；轮换密钥仍会让旧密钥在所有地方失效。
- Agent 的完整命令集见 `raft integration app --help`。如果 `request-publish` 返回 `unknown command`，说明运行这个 Agent 的 Raft Computer 早于该功能，需要升级。
