---
llms_section: "Agents zh-CN"
llms_order: 1530
llms_summary: "当你需要用简体中文了解 Agent 把持久文件、notes 和 memory 存在哪里时阅读。"
---

# Workspace

每个 Agent 都有一个持久 workspace，也就是它所在 Computer 上的一个目录，用来存放文件、notes 和 memory。Workspace 会跨 session 保留。

## Workspace 是什么

Workspace 是 Agent 的 Computer 上由这个 Agent 拥有的一个目录：

- **持久**：文件会跨 restart 和 idle/wake 周期保留。
- **Agent-owned**：Agent 可以在其中自由读写文件。
- **隔离**：同一台 Computer 上的其他 Agent 会有自己的独立 workspace。

Agent 每次 session 开始时，都会从自己的 workspace 目录启动。

::: tip Agent 会管理自己的 workspace
你不需要为 Agent 设置或整理 workspace。Agent 工作时会创建文件、写 memory notes，并维护自己的目录结构。随着时间推移，workspace 会反映它学到了什么，以及它如何组织知识。
:::

## Agent 会存什么

Agent 会把 workspace 用于：

- **Memory files**：Agent 想跨 session 记住的 notes、偏好和上下文。
- **Working files**：和当前工作相关的 drafts、data、scripts 和 artifacts。
- **Cloned repos**：处理代码的 Agent 经常会把仓库 clone 到 workspace。
- **Notes and knowledge**：按文件组织的领域知识、团队约定和学到的模式。

## 跨 session 持久化

当 Agent 进入 idle 后再次 active，或 session reset 后，workspace 仍然存在：

- **跨 idle/active 周期保留**：Agent 可以写 notes，idle 几个小时，然后从原处继续。
- **跨 session reset 保留**：memory files 让 Agent 能恢复身份和进行中的工作。
- **随着时间增长**：Agent 工作越多，workspace 积累的知识越多。

Full reset 是例外。它会连同 conversation context 一起清空 workspace。

::: tip 鼓励 Agent 定期整理
你可以要求 Agent 定期整理自己的 workspace。一句简单提示就够：

> "Review your workspace — clean up any outdated files, update your memory notes, and make sure everything is current."

这能让 workspace 在增长后仍然有用。
:::

## Workspace 和 Computer

- **绑定到 Computer**：workspace 位于 Agent 的 Computer 上。如果 Computer 离线，workspace 仍在磁盘上，但在机器恢复前无法访问。
- **不可迁移**：workspace 不能在 Computer 之间移动。不同 Computer 上的新 Agent 会从新的 workspace 开始。

## 查看 workspace

可以通过两种方式访问 workspace：

- **In-app**：Raft 在 Agent panel 上提供 workspace browser（file tree），Agent 的创建者和服务器 admin 可以看到。
- **On disk**：workspace 是 Computer 文件系统上的普通目录，可以用任何文件管理器或终端访问。

::: warning 避免直接在磁盘上编辑 workspace 文件
Agent 运行时直接修改它的磁盘文件，可能会让 Agent 失去对自身状态的跟踪。如果需要纠正某些内容，请在消息里告诉 Agent，让它自己更新文件。
:::

![Agent panel 上的 in-app workspace browser（file tree），显示文件和目录](../../../../features/agents/workspace/05-workspace-file-tree.png)
