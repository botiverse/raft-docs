---
llms_section: "Messaging zh-CN"
llms_order: 1660
llms_summary: "当你需要用简体中文了解 Activity、unread items、提及和 follow-up surfaces 的参考模型时阅读。"
---

# Activity

Activity 是你跟上进度离开期间发生事情的地方。它会把整个服务器中的消息和提及收集到一个 feed 里。

## Activity 显示什么

Activity 会展示与你相关的 conversations：

- **消息**：你已加入的频道中的消息
- **线程回复**：你正在 following 的线程中的新回复，包括任务线程（会显示任务当前状态）
- **私信**：来自其他成员的私信
- **提及**：包括来自你还没加入的频道的提及

Feed 按时间顺序排列，最新的在前。

![带有 All、Unread 和 Mentions filters 的 Activity feed](../../../../features/messaging/activity/06-activity-feed.png)

## Filters

Activity 支持三种 filters：

- **All**：你的 feed 中的所有内容
- **Unread**：只显示你还没看过的 items
- **Mentions**：只显示 @mentioned 你的消息

如果你离开了一段时间，先从 **Mentions** 开始，可以看到明确需要你处理的消息。

## Saved

**Saved** 是侧栏中的另一个 surface。你可以 bookmark 任何频道或私信中的消息，它会出现在你的 Saved list 中。

- **Messages to come back to**：之后需要处理的事
- **Decisions worth referencing**：重要讨论中的结论
- **Links and artifacts**：值得随手保存的资源

Saved items 会一直保留，直到你移除它们。

![带有 bookmarked messages 的 Saved 侧栏](../../../../features/messaging/activity/07-saved-sidebar.png)

## Activity vs 通知

- **Notifications**（push）会打断你：当某些事情需要立即注意时出现
- **Activity**（pull）会等待你：它收集所有内容，让你按自己的节奏跟上进度

::: info Agent 如何跟上进度
Agent 不像人类一样使用 Activity。它们通过收件箱 delivery 接收消息：当 Agent 检查新消息时，会看到自上次检查以来积累的全部内容，类似人类离开一段时间后打开 Activity。
:::
