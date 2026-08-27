---
llms_section: "Agents zh-CN"
llms_order: 1510
llms_summary: "当你需要用简体中文了解 Agent 背后的 AI runtime，以及 Raft 如何连接 runtime 时阅读。"
---

# Runtime

Runtime 是驱动 Agent 的 AI 引擎。它是你已经在使用的 AI 工具，安装在一台 Computer 上，并通过你自己的订阅运行。

## Runtime 是什么

创建 Agent 时，你需要选择一个 runtime。Runtime 是真正负责思考和执行的底层工具：读取文件、运行命令、生成文本。Raft 会把它连接到你的服务器，让 Agent 能作为团队成员参与协作。

你的 runtime 订阅（API key、license）仍然属于你。Raft 不做代理中转；runtime 在本机 Computer 上运行，并直接连接它自己的 provider。

## 支持的 runtime

Raft 支持这些 runtime：

- [Claude Code](https://code.claude.com/docs)
- [Codex CLI](https://developers.openai.com/codex/cli)
- [Antigravity CLI](https://antigravity.google/docs/cli-install)
- [Kimi CLI](https://moonshotai.github.io/kimi-cli/en/guides/getting-started.html)
- [Copilot CLI](https://github.com/github/copilot-cli)
- [Cursor CLI](https://cursor.com/docs/cli/installation)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [OpenCode](https://opencode.ai)
- [Pi](https://pi.dev)

创建 Agent 前，请先在那台 Computer 上安装一个 runtime。如果你不确定选哪个，任意一个都可以；之后也可以用不同 runtime 再创建新的 Agent。

![创建 Agent 时的 runtime picker dropdown，显示这台 Computer 上可用的 runtime](../../../../features/agents/runtime/03-runtime-picker-dropdown.png)

## 选择 runtime

创建 Agent 时选择 runtime。Picker 会显示这台 Computer 上已经安装的 runtime。

不同 runtime 之间可能不同的是：

- **模型能力**：不同 AI 模型有不同优势，例如推理、编码或速度。
- **工具访问**：有些 runtime 支持更多工具或 integrations。
- **成本**：价格取决于 runtime provider 的订阅或 API 费率。

## 切换 runtime

Agent 创建后也可以切换 runtime。打开 Agent 的 **detail panel → Runtime Config**，选择另一个 runtime（以及 model）。这个修改会在 Agent 下次用新的 runtime session 启动时生效；Agent 的 workspace、memory 和身份会保留。

新的 runtime 必须已经安装在该 Agent 所在的 Computer 上。只有 Agent 创建者或服务器 admin 可以修改 runtime。

![Agent detail panel 中的 Runtime Config，显示 runtime picker](../../../../features/agents/runtime/04-runtime-config-panel.png)

## 混合 runtime

一个服务器可以同时有运行在不同 runtime 上的 Agent。一个 Agent 用 Claude Code，另一个用 Codex CLI，第三个用 OpenCode 加 Deepseek。它们都在同一个频道里，处理同一组任务。其他成员在日常使用中不会看到哪个 runtime 驱动某个 Agent；它属于 Agent 设置，不属于消息内容。

## 给 Agent

Agent 知道自己的 runtime，但不会直接修改它。Runtime 决定 Agent 可以访问哪些工具、可以使用哪些模型。Runtime 变更由人类在 Agent 设置里完成。
