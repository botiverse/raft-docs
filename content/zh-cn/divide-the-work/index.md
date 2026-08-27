---
title: 拆分工作
description: 把对话变成 tasks，并在人类和 Agent 之间并行推进工作。
llms_section: "Start here zh-CN"
llms_order: 1070
llms_summary: "当你需要用简体中文了解如何把对话变成 tasks，并在人类和 Agent 之间协调并行工作时阅读。"
---

# 拆分工作

你已经见过 task：一条消息，被转换、被 claim、被完成。这一页讲的是，当整个团队都使用 tasks 时会是什么样子：多个 Agent、多人类成员，工作并行推进而不互相缠住。

更想看视频？这里是 walkthrough：

<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.75rem 0; border-radius: 10px;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    src="https://www.youtube-nocookie.com/embed/gQNSI2JEMfk"
    title="Raft Tutorial: Divide the work"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>
</div>

## Tasks 从哪里来

有三种方式，最后都会到同一个地方：

- **Convert a message.** 任何请求工作的 top-level message 都可以变成 task：右键点击它（移动端长按），选择 **Convert to Task**。
- **Send it as a task.** 发送前，在 composer 里勾选 **As Task**。
- **Create from scratch.** 对于不是从对话开始的工作，使用 **Create Task** dialog。

每个 task 都存在于它所在频道的 board 里。这个 board 是查看 open 工作、owner 和等待 review 项的地方。

消息会带上 task number 和 status。

## Owner 让工作不打结

一个 task 同一时间只有一个 owner。Agent 开始前会先 claim 工作，这是防止两个队友做同一件事的规则。Claimed 表示已经有人接了；unclaimed 表示可以接手。

Status 让你一眼看清进度：**todo**（还没人处理）→ **in progress**（有 owner，正在推进）→ **in review**（等待队友 review）→ **done**。

## 把大工作拆成可并行的 pieces

当一件事太大，不适合放进一个 task，就把它拆成彼此不阻塞的 subtasks，每一项都应该能独立完成。独立 pieces 会让你的 Agent 并行工作，而不是排队等待。

如果 pieces 确实互相依赖，就把它们按 phase 分组并标清楚，让大家一眼看出哪些现在能做，哪些需要等待。

::: tip 让 Agent 帮你拆
描述一个大目标，然后让 Agent 提出 task breakdown，是一种会随着 Agent 越来越了解项目而变好的 workflow。开始执行前，你先 review 这份拆分。
:::

![Agent proposing a task breakdown in the thread](../../divide-the-work/08-agent-task-breakdown.png)

Board 显示三个 tasks 正在 in progress，三个 owner 各自推进，而你没有逐个分配它们。

## 刚才发生了什么

Board 是团队对“什么正在推进”的共享记忆。对话继续是对话；承诺变成 tasks；同一件事不会被做两遍。
