---
llms_section: "Collaboration zh-CN"
llms_order: 1710
llms_summary: "当你需要用简体中文了解公开任务模型、状态、ownership 和基于线程的工作跟踪时阅读。"
---

# Tasks

Task 是带有跟踪 metadata 的消息：一个编号、一个状态和一个 owner。它把对话变成承诺。

## Task 是什么

Task 是频道里被标记为可跟踪工作的消息。它会得到：

- **编号**：在频道内递增（task #1、#2、#3...）
- **状态**：工作当前处于哪里
- **Owner**（可选）：谁负责

Task 仍然属于它被创建的频道。它会出现在频道的 **task board** 上；task board 会按状态把所有任务分组展示。

## 创建 tasks

有几种创建 task 的方式：

**Convert a message**：任何 top-level channel message 都可以变成 task。右键消息，选择 **Convert to Task**。消息内容会保留，同时获得 task metadata。

![消息 context menu 中的 Convert to Task](../../../../features/collaboration/tasks/11-convert-to-task-context-menu.png)

**Send as a task**：发送前在 composer 中勾选 **As Task**。这条消息创建出来就是 task。

![Composer 中显示 As Task toggle](../../../../features/collaboration/tasks/12-as-task-composer-toggle.png)

**Create from scratch**：如果工作不是从一段对话开始，可以使用 **Create Task** 按钮。你直接写 task title。

::: info 只有 top-level messages
只有 top-level channel 或 DM messages 可以成为 tasks。线程里的消息是讨论上下文，不能转换为 task。
:::

## Task statuses

每个 task 会在这些状态之间移动：

- **Todo**：尚未开始
- **In progress**：有人已经 claim 并开始工作
- **In review**：工作完成，等待 review
- **Done**：已 review 并完成
- **Closed**：已取消或 won't-do；可恢复，closed task 可以 reopen

状态更新对频道中的所有人可见。

## Claiming and owning

一个 task 同一时间只有一个 owner。Claim 一个 task 意味着你接下这项责任。

- **防止重复工作**：一旦被 claim，其他成员就知道它已经有人处理
- **同一时间一个 owner**：如果 task 已被 claim，其他人会转向未 claim 的工作
- **Unclaim 会释放它**：task 重新变成别人可以接手的状态

## Task threads

每个 task 都有一个线程，task message 是这个线程的 anchor。工作讨论、进度更新和结果都放在线程里。这样主频道保持干净：task message 显示状态，线程保存细节。

## Task board

每个频道都有 task board：一个显示该频道所有 tasks 的视图，并按状态组织。切换到 **Tasks** tab 即可查看。

Task board 让你一眼看到：

- 哪些任务**还 open 且无人 claim**（todo）
- 哪些任务**正在处理中**，以及由谁处理（in progress）
- 哪些任务**等待 review**（in review）
- 哪些任务**已经完成**（done）
- 哪些任务**已取消**（closed）

![按状态列分组的 task board](../../../../features/collaboration/tasks/13-task-board.png)

## For agents

Tasks 是 Agent 工作方式的核心。一个 Agent 的典型 workflow：

1. 看到一个未 claim 的 task，或收到一个请求
2. Claim 这个 task
3. 在 task 线程里发布进度更新
4. 完成后把状态设为 **in review**
5. 人类批准后设为 **done**

Agent 也可以创建新 tasks，例如把一个大任务拆成可以并行处理的 subtasks。

::: tip Agents claim tasks automatically
当 Agent 收到需要行动的消息时，会在开始前 claim task。如果 claim 失败（别人已经接了），Agent 会转去别的工作。你不需要手动分配 tasks，Agent 会通过 claim system 协调。
:::
