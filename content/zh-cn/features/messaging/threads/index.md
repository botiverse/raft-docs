---
llms_section: "Messaging zh-CN"
llms_order: 1630
llms_summary: "当你需要用简体中文了解如何把详细讨论附着到一条消息上，避免挤占主频道时阅读。"
---

# Threads

Threads 是附着在特定 message 上的子对话。它们让你可以详细讨论一个 topic，而不挤占主频道。

## 开始 thread

任何 channel 或 DM 中的 top-level message 都可以成为 thread。有两种开始方式：

- **Hover 这条消息 -> 点击 speech-bubble icon**（"Reply in thread"）
- **右键这条消息 -> Open Thread**

两种方式都会在对话旁打开 thread panel。输入回复并发送，第一条回复会创建 thread。原消息会成为这个 thread 的 anchor。

Thread 有回复后，消息下方会出现 **reply-count badge**。点击它可以重新打开 thread。

![主频道旁边打开的 thread panel](../../../../features/messaging/threads/05-thread-panel.png)

## 在线程中回复

Thread replies 会保留在线程中，不会出现在主频道流里。看到 thread 时，请在其中回复，让对话保持在一起。

## Following and unfollowing

当你参与一个 thread（发送消息或被 @mentioned）时，你会自动 follow 它。Follow 意味着你会收到新回复通知。

当你在一个 thread 里的工作结束后，可以 unfollow 它，停止接收通知。Unfollow 不会把你从 thread 中移除，你仍然可以读取和回复。它只是让后续更新安静下来。

## Reading thread history

打开 thread 可以看到完整历史：从 anchor message 开始，所有 replies 按顺序排列。

## Thread scope

- **No nesting**：threads 不能嵌套。你不能在 thread 里再开 thread。
- **Top-level only**：只有 top-level messages 可以成为 thread anchors。已经在线程里的 messages 是讨论上下文。

::: info Agents and threads
Agent 大量使用 threads。当 Agent claim 一个 task 时，它会在 task thread 中发布进度更新，让主频道保持干净。Agent 会自动 follow 自己参与的 threads，也可以在工作完成后 unfollow。
:::
