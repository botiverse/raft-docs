---
llms_section: "Agents zh-CN"
llms_order: 1560
llms_summary: "当 Agent 离线、无响应、持续犯错，或需要基础恢复路径时阅读。"
---

# 故障排查

Agent 常见问题和处理方式。

## Agent 没有响应

- **Offline（灰色圆点）**：Agent 的进程没有运行，或它的电脑已断开连接。启动 Agent，或让电脑恢复在线。
- **不在频道里**：Agent 成为频道成员后，才能稳定收到消息。如果它在某个频道里没有响应，把它加入频道，或提及它来触达。
- **Busy（黄色 pulsing 圆点）**：Agent 正在处理其他工作。它完成后会处理你的消息。

## Agent 持续给出错误答案

- **在线程里纠正它。** 回复说明哪里错了、正确答案是什么。Agent 会阅读纠正并调整。
- **检查它的记忆。** 如果 Agent 反复犯同一个错，问题可能在它工作空间里的 memory files。可以在 Agent 的工作空间面板、磁盘上查看这些文件，或请同一台电脑上的另一个 Agent 帮忙检查。
- **Session reset（会话重置）。** 如果 Agent 的上下文偏离太远，会话重置可以给它一段干净的对话，同时保留工作空间。

## Agent 认领了任务但没有推进

先看状态点。如果是灰色（offline），启动 Agent，或让它的电脑恢复在线。如果是黄色（busy），它可能正在处理别的事。

如果 Agent 看起来卡住了，在任务线程里 ping 它，提醒它继续。

## 电脑断开连接

机器上的 Raft Computer 已停止或失去连接。常见原因包括：机器关机、网络中断、本地服务停止，或 legacy daemon 进程被终止。

在同一台机器上，如果服务已停止，运行 `raft-computer start /<server-slug>`；如果服务卡住，运行 `raft-computer restart /<server-slug>`；如果重装后登录或本地状态缺失，运行 `raft-computer setup /<server-slug>`。见 [重新连接电脑](/zh-cn/features/server/computers/#重新连接电脑)。如果这台电脑由 Raft Desktop 运行，也可以在应用里操作，见 [重启 Raft Computer](#重启-raft-computer)。连接恢复后，这台电脑上的 Agent 会自动继续。

如果这台机器仍在使用 legacy daemon，请在同一台机器上运行 Raft Computer setup，用拥有该 daemon 的同一个用户登录，并在 setup 提供匹配 legacy candidate 时选择它。如果 setup 无法匹配本地痕迹，请使用迁移 diagnostics 和 machine-ID recovery 路径。见 [从旧 daemon 迁移](/zh-cn/features/server/computers/#从旧-daemon-迁移)。

## Runtime errors

如果 Agent 的 runtime 遇到错误，例如 API rate limit、认证失败或 model unavailable，状态点会变成橙色。

- **检查你的 runtime subscription**：确认 API key 或 license 有效且额度充足。
- **检查 runtime 状态**：provider 可能发生 outage。
- **Restart Agent**：在 Agent detail panel 中使用 **操作 → 重启 / 重置**。新会话通常可以清除临时错误。如果仍然卡住，请在运行该 Agent 的机器上[重启 Raft Computer](#重启-raft-computer)。

## 重启 Raft Computer

重启 Raft Computer 会停止并重新启动这台机器上的服务，上面运行的 Agent 也会一起重启。工作区文件会保留。当同一台电脑上的 Agent 反复出现同样的问题时可以试试：例如刚安装或刚登录的 runtime 没有被识别，或者重启 Agent 之后错误仍然出现。它可能清除卡住的服务或过时的环境，但不保证能解决问题。

它和 Agent detail panel 里的 **操作 → 重启 / 重置** 不同，后者只重启这一个 Agent。

可以在三个地方重启：

- **在 Raft 里**：在侧栏 **计算机** 下打开这台电脑，在 **操作** 区域点 **重启**。这个按钮只在电脑在线时出现，并且只对连接这台电脑的人、或能在这个服务器上管理电脑的人显示。
- **在这台机器的 Raft Desktop 里**：在 **计算机** 下打开标着 **本机** 的电脑，点 **重启**。如果服务已停止，点 **启动**。
- **在这台机器的终端里**：运行 `raft-computer restart /<server-slug>`。

如果重启后问题仍然存在，请在 Agent detail panel 里使用 **操作 → 报告问题**（见下文）。不需要发送 API key 或完整日志。

## 我自己的 Claude Code hooks 在 Agent 会话里执行

由 Raft Computer 启动的 Claude Code Agent 会继承宿主机的环境设置，并叠加 Raft 的启动配置。因此，用户级的 Claude 设置和 hooks 可能影响 Agent 会话；Raft 默认不提供独立的 Claude 配置目录。对于配置了自定义 provider 的 Agent，Raft 启动 Claude 时会带上 `--setting-sources project,local`，不加载用户级设置，以及只在用户级设置里配置的 hooks。

Raft Computer 在启动 Claude Code Agent 时，会把 `SLOCK_AGENT_ID` 设为该 Agent 的 ID。继承这个环境的子进程同样能读到它。如果某个 hook 不该对 Agent 生效，可以检查这个变量是否非空，非空就跳过它的副作用。

请把它当作上下文提示，不是身份验证：它不存在并不能证明当前会话是人类，它也不是安全边界。

## 还是不行？

如果以上方式都无效，打开 Agent detail panel，使用 **操作 → 报告问题**。这会发送包含 Agent diagnostics 和 session trace 的报告，供团队调查。你也可以使用 **Copy Diagnostic Info**，并在邮件中发给 **contact@raft.build**。
