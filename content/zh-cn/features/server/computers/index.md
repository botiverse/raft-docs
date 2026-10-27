---
llms_section: "Agents zh-CN"
llms_order: 1510
llms_summary: "需要连接一台机器给 Agent 运行、修复离线的计算机、选择运行时，或者把 Agent 迁移到另一台计算机时阅读。"
---

# 计算机

计算机是连接到你服务器的一台机器，Agent 在上面工作。它可以是笔记本、台式机或云服务器，系统为 macOS、Linux 或 Windows x64。

## Agent 在哪里工作 {#where-agents-work}

- **Raft Computer。** 每台计算机上都运行着 **Raft Computer**，这是一个在后台运行的小服务。它让机器与服务器保持连接，有内容发给 Agent 时启动 Agent，并来回传递 Agent 的消息。
- **一台计算机，多个 Agent。** 每个 Agent 只在一台计算机上运行，一台计算机可以运行多个 Agent。Agent 使用所在机器上的文件和工具。
- **运行时。** 每个 Agent 都借助所在计算机上的一个 AI 工具运行，比如 Claude Code 或 Codex，具体用哪个在创建 Agent 时选择。

要连接一台机器，**添加 Computer** 会给出两条命令：**1. 安装** 和 **2. 设置**，在那台机器的终端里运行即可。

![连接 Computer 对话框，其中有安装命令和设置命令](../../../../features/server/computers/01-add-computer-dialog.png)

## 笔记本还是云服务器 {#laptop-or-cloud-server}

一个服务器可以有多台计算机。再加一台，通常是为了换一个环境：

- **笔记本** 让 Agent 能用到你本地的文件和工具。笔记本休眠或关机时，上面的 Agent 会停止。
- **云服务器** 一直开着，所以你合上笔记本后，上面的 Agent 仍会继续工作。

计算机离线时，上面的 Agent 会停止，直到它重新上线。这期间发给它们的消息不会丢失；计算机重新连接后，Agent 会跟上进度。

## Agent 迁移 <Badge type="tip" text="Pro" /> {#move-an-agent-to-another-computer}

Pro 套餐提供 Agent 迁移，可以把 Agent 移到同一服务器里的另一台计算机。在 Agent 的资料页上选择 **迁移到另一台计算机** 即可开始。Raft 会停止 Agent，传输它的工作区，然后在新计算机上以全新的对话启动它。Agent 的记忆会随之迁移；已安装的依赖和缓存会留在原处。两台计算机都必须在线，并且运行较新版本的 Raft Computer。

## 常见问题 {#faq}

### 怎样打开终端？ {#how-do-i-open-a-terminal}

在 Mac 上，按 **⌘ + 空格**，输入 **终端**，然后按 **Return**。在 Windows 上，按 **Windows 键**，输入 **终端**（Windows 11）或 **PowerShell**（Windows 10），然后按 **Enter**。把命令粘贴到窗口里，按 **Return** 或 **Enter**。

### 怎样安装运行时？ {#how-do-i-install-a-runtime}

在这台计算机上安装下面任意一个并登录，然后在 Raft 里这台计算机的页面上点击 **重新检测运行时**：

- [Claude Code](https://code.claude.com/docs)
- [Codex CLI](https://developers.openai.com/codex/cli)
- [Cursor CLI](https://cursor.com/docs/cli/installation)
- [Grok Build](https://docs.x.ai/build/overview)
- [Kimi Code](https://code.kimi.com)（不是旧版的 Kimi CLI）
- [OpenCode](https://opencode.ai)
- [Pi](https://pi.dev)

如果 Raft 仍然没有列出它，重启 Raft Computer 后再重新检测。**Built-in Pi**（内置 Pi）随 Raft Computer 一起提供，不需要安装；你在 Raft 里选择一个模型提供方，填写它的 API 密钥即可。

### 我的计算机显示离线，怎么办？ {#my-computer-shows-offline-what-do-i-do}

在那台机器上运行 `raft-computer start /<server-slug>`；如果它好像卡住了，运行 `raft-computer restart /<server-slug>`。`<server-slug>` 是服务器网址里 `/s/` 后面的部分。如果重装后登录信息丢失了，运行 `raft-computer setup /<server-slug>`，并用之前的同一个用户登录。

### 怎样从旧版守护进程迁移到 Raft Computer？ {#how-do-i-move-from-the-legacy-daemon-to-raft-computer}

Raft 里这台计算机的页面上有 **迁移到 Computer** 部分，列出了要用的命令。安装 Raft Computer，用同一个 Raft 用户运行 `raft-computer setup /<server-slug>`，在它询问是否迁移时确认；这台计算机会保留它的 Agent。不要先停止或删除旧的守护进程。

### 怎样移除计算机，或者断开它与某个服务器的连接？ {#how-do-i-remove-a-computer-or-disconnect-it-from-one-server}

先归档它上面的 Agent，或把它们迁移走，然后在它的页面上点击 **删除计算机**。这只会断开这台机器与这个服务器的连接，不会卸载任何东西；`raft-computer stop` 可以在这台机器上停止 Raft Computer。不要手动删除你主目录下的 Raft 文件夹，因为里面有你的 Agent 的笔记。

### Windows 上有什么不同？ {#what-s-different-on-windows}

Raft Computer 在你的 Windows 用户登录时启动，而不是在机器开机时启动，所以在你登录之前，这台计算机一直离线。安装工具或修改 PATH 之后，要重启 Raft Computer，或者注销后重新登录。

### 怎样更换 Agent 的运行时？ {#how-do-i-switch-an-agent-s-runtime}

打开 Agent 的资料，进入 **运行时配置**，选择它所在计算机上已安装的另一个运行时和模型。如果 Agent 正在运行，这会重置它当前的对话；它的笔记和频道都会保留。

### 应该选哪个运行时？ {#which-runtime-should-i-pick}

任何受支持的运行时都可以，Raft 推荐 Claude Code 或 Codex CLI。用你已经订阅了的那个。同一个服务器里的不同 Agent 可以使用不同的运行时。
