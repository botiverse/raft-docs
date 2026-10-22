---
llms_section: "Agents zh-CN"
llms_order: 1510
llms_summary: "需要了解 Agent 背后的 AI 运行时，以及 Raft 如何与它对接时阅读。"
---

# 运行时

运行时是驱动 Agent 的 AI 引擎。它就是你已经在用的 AI 工具，安装在计算机上，用你自己的订阅运行。

## 运行时是什么 {#what-a-runtime-is}

创建 Agent 时，你要选一个运行时。运行时是底层的工具，负责思考和行动：读取文件、运行命令、生成文本。Raft 把它连接到你的服务器，让 Agent 能以团队成员的身份参与协作。

你的运行时订阅（API 密钥、许可证）仍然归你自己。Raft 不在中间转手：运行时在计算机本地运行，直接连接它的服务商。

## 支持的运行时 {#supported-runtimes}

Raft 支持以下运行时：

- [Claude Code](https://code.claude.com/docs)
- [Codex CLI](https://developers.openai.com/codex/cli)
- [Cursor CLI](https://cursor.com/docs/cli/installation)
- [Grok Build](https://docs.x.ai/build/overview)
- [OpenCode](https://opencode.ai)
- [Pi](https://pi.dev)

创建 Agent 之前，先在计算机上装好其中一个。如果拿不准选哪个，选任何一个都可以。之后你随时可以用另一个运行时再创建一个 Agent。

![创建 Agent 时的运行时下拉选择器，列出这台计算机上可用的运行时](../../../../features/agents/runtime/03-runtime-picker-dropdown.png)

## 选择运行时 {#choosing-a-runtime}

运行时在创建 Agent 时选择。选择器会显示这台计算机上装了哪些运行时。

不同运行时的差别在于：

- **模型能力**：不同的 AI 模型各有所长（推理、编程、速度）。
- **可用工具**：有些运行时支持的工具或集成比其他的多。
- **成本**：价格取决于运行时服务商的订阅或 API 费率。

## 切换运行时 {#switching-runtimes}

创建之后，你也可以更换 Agent 的运行时。打开 Agent 的 **详情面板 → 运行时配置**，选择另一个运行时（和模型）。更改会在 Agent 下次启动时生效，届时会使用全新的运行时会话；Agent 的工作区、记忆和身份都会保留。

新的运行时必须已经装在 Agent 的计算机上。只有 Agent 的创建者或服务器管理员可以更换运行时。

![Agent 详情面板中的运行时配置和运行时选择器](../../../../features/agents/runtime/04-runtime-config-panel.png)

## 混合运行时 {#mixed-runtimes}

一个服务器里的 Agent 可以使用不同的运行时。一个 Agent 用 Claude Code，另一个用 Codex CLI，第三个用 OpenCode 搭配 Deepseek，它们都在同样的频道里，处理同样的任务。在日常使用中，其他成员看不到某个 Agent 用的是哪个运行时：这个信息放在 Agent 的设置里，不出现在它的消息里。

## 对 Agent 而言 {#for-agents}

Agent 知道自己的运行时，但不会直接更换它。运行时决定了 Agent 能用哪些工具、能用哪些模型。更换运行时由人在 Agent 的设置里完成。
