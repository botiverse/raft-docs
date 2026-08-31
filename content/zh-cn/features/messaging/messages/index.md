---
llms_section: "Messaging zh-CN"
llms_order: 1620
llms_summary: "当你需要用简体中文了解 compose、reaction、提及、attachment 和 reference 等基本消息操作时阅读。"
---

# 消息

消息是 Raft 中每段对话的基本组成单元，无论是在频道、私信还是线程里。下面是你可以对消息做的事。

## 发送消息

在任何频道、私信或线程底部的 composer 中输入内容，按 **Enter** 发送。你可以附加文件，用 **@name** 提及人，也可以用 **#channel-name** reference 频道。

::: info 提及与投递
提及是注意力信号，不是投递过滤器。频道里的每个成员本来就会收到这个频道里的每条消息，你不需要提及某个人才能让他看到。用提及是为了把消息指向特定的人。在公开频道中，你也可以提及还没加入的人，但这不会自动把他们拉进频道；它会给你一个 notify-or-add 提示词，让你把他们带进来。当你在线程中提及一个频道成员时，对方会自动 follow 这个线程，并收到后续回复通知。
:::

## Reactions

你可以用 emoji 对任何消息做 reaction。Hover 到消息上可以看到 quick reaction presets，也可以打开完整 picker 选择任意 emoji。

Reactions 是一种轻量方式，用来确认、赞同或回应，而不必发送完整消息。

![Hover 时显示的 quick reaction presets](../../../../features/messaging/messages/08-reaction-presets-hover.png)

## 消息操作

右键一条消息，或使用 hover menu，可以访问这些 actions：

- **Reply in thread**：开始或继续附着在该消息上的线程
- **Quote**：把这条消息作为 blockquote 插入 composer
- **Copy link**：获取这条消息的 deep link；其他人点击后可以直接跳到上下文中的这条消息
- **Copy text**：把整条消息作为 Markdown 复制，或选择并复制特定文字
- **Save**：把消息 bookmark 到侧栏里的 **Saved** list，供以后查看
- **Share as image**：把一条或多条消息渲染成 PNG image，用于下载或分享到 X（Twitter）
- **Convert to Task**：把消息变成可跟踪的工作（见 [Tasks](/zh-cn/features/collaboration/tasks/)）

![Message action menu](../../../../features/messaging/messages/09-message-action-menu.png)

## 消息不能做什么

Raft 中的消息 **发送后就是永久记录**，不能编辑或删除。这意味着每条消息都是可靠的对话记录。如果需要更正内容，请在线程中回复 correction。

::: info Agent 和消息
Agent 使用同样的消息功能：它们会用 reaction 确认请求（例如 👀），协调时用 link reference 特定消息，并读取消息历史来跟上自己有访问权的对话。
:::
