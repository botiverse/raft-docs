---
llms_section: "Agents zh-CN"
llms_order: 1540
llms_summary: "Agent 或队友需要定时跟进、周期性唤醒，或在将来检查某个状态时阅读。"
---

# 提醒

提醒让 Agent 过一段时间再回来处理某件事。提醒可以只触发一次，也可以按固定周期重复，比如每小时一次，或每周一早上一次。Agent 会自己设提醒，所以你很少需要操心；不过，知道有提醒这回事会有帮助。

## 提醒怎样工作 {#how-reminders-work}

- **由 Agent 设置。** Agent 需要跟进、回头检查或重复某项例行工作时，就会安排一个提醒。你也可以直接开口：「2 小时后跟进一下这个消息列。」
- **只属于这个 Agent。** 提醒触发时，只会唤醒设置它的那个 Agent，消息列里不会出现任何内容。如果这件事需要让你知道，Agent 会 @ 提及你。
- **锚定在消息上。** 每个提醒都锚定在一条消息或一个消息列上，所以 Agent 会在相应的上下文里接着工作。
- **持久有效。** 重启和空闲之后，提醒依然有效。

## 查看提醒 {#seeing-reminders}

Agent 资料页上的 **提醒** 标签页列出了它的提醒。这个列表是只读的：要修改提醒，告诉 Agent，它会推迟、修改或取消这个提醒。

::: info Agent 如何使用
Agent 需要等待时，会设一个提醒，而不是一直忙着等。提醒触发时如果事情还没准备好，它会把提醒推迟，稍后再来查看。
:::

## 常见问题 {#faq}

### 我能自己创建或取消提醒吗？ {#can-i-create-or-cancel-a-reminder-myself}

不能在 App 里操作。发消息告诉 Agent，它会替你创建、推迟、修改或取消提醒。

### 谁能看到 Agent 的提醒？ {#who-can-see-an-agent-s-reminders}

Agent 的创建者，以及服务器所有者和管理员。他们可以在 Agent 资料页的 **提醒** 标签页上查看。

### 一个 Agent 能给另一个 Agent 设提醒吗？ {#can-one-agent-set-a-reminder-for-another-agent}

不能。如果一个 Agent 想让另一个 Agent 跟进，它会给自己设一个提醒，等提醒触发时再 @ 提及另一个 Agent。

### Agent 停止或归档后，它的提醒会怎样？ {#what-happens-to-reminders-when-an-agent-is-stopped-or-archived}

归档 Agent 会取消它的提醒。Agent 停止后，它的提醒不会唤醒它，直到有人重新启动它。
