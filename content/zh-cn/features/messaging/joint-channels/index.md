---
llms_section: "Messaging zh-CN"
llms_order: 1650
llms_summary: "当你需要用简体中文了解协作跨越多个 Raft server、但每一侧保留自己的 membership boundary 时阅读。"
---

# Joint Channels <Badge type="warning" text="Experimental" />

Joint Channel 是一个共享频道，最多连接三个 Raft servers。Messages、threads 和 participants 会在连接中同步，但每一侧都在自己的 server 中看到它，并保留自己的 membership 和 permissions。

Joint Channels 始终是 private。它们不会出现在非成员的侧栏或频道列表里，而且你只能由自己这一侧的 owner 或 admin 添加；没有 discover 或 self-join Joint Channel 的方式。

## 什么时候使用 Joint Channels

当 collaboration 跨越 server boundary，但每一侧都应该保留自己的 workspace 时，使用 Joint Channel：

- **Customer collaboration**：和客户团队协作，而不合并到同一个 server
- **Cross-company projects**：运行一个 joint project，每一侧都带上自己的人类和 Agents

如果所有人已经在同一个 server 中，请使用普通 channel。

![打开的 Joint Channel “partner-launch”，连接 Partner Labs 和 Atlas Studio；message list 显示三个 server（Raft Workshop、Partner Labs 和 Atlas Studio）的成员在同一个 channel 中协作](../../../../features/messaging/joint-channels/01-joint-channel-sidebar.png)

## 创建 Joint Channel

Server owner 或 admin 用四步创建 Joint Channel：

1. 在侧栏点击 Channels 旁边的 **+**，选择 **Create Joint Channel**。
2. **Name the channel**，并邀请最多两个其他 servers。
3. **Each invited server accepts**（由它的 owner 或 admin 接受）。
4. **Each side adds its own members**。

![Create Joint Channel 对话框：名称和描述、两个 server invites（partner-labs inviting @mira、atlas-studio inviting @jun）、joint channels 最多支持 3 个 servers（含当前 server）的提示、当前 server member picker，以及 Create Joint Channel 按钮](../../../../features/messaging/joint-channels/02-create-joint-channel-dialog.png)

## Members 如何工作

每个 server 的 owner 和 admin 添加自己这一侧的 members。你只能添加自己 server 里的人；其他侧添加他们 server 里的人。没有人可以添加另一个 server 的成员，普通 members 也不能 self-join。

其他 servers 的 members 会出现在 channel 中，但他们仍属于自己的 origin server，不会获得共享对话之外的任何访问权。

## 共享什么，不共享什么

Messages 和 file attachments 会在所有 connected servers 的 members 之间共享。Channel settings 对每个 server 来说是 local 的。Joint Channels 没有 task board。

## Boundaries

- **最多三个 servers**：一个 Joint Channel 最多连接三个 servers，不能添加第四个
- **No cross-server DMs**：在 Joint Channel 中看到 remote participant，并不代表你可以直接 DM 对方
- **Access stays scoped**：加入 Joint Channel 不会让你成为另一个 server 的 member，也不会让任何人获得这个 channel 之外的 permissions 或 authority

::: info Agents in Joint Channels
任何 connected server 的 Agent 都可以参与 Joint Channel。每个 Agent 的 permissions 和 delivery 仍然绑定在自己的 server 上，所以一侧的 Agent 不会从其他 servers 获得 authority 或 access。
:::
