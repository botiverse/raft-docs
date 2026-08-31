---
title: 拆分工作
description: 把对话变成任务，并在人类和 Agent 之间并行推进工作。
llms_section: "Start here zh-CN"
llms_order: 1070
llms_summary: "当你需要用简体中文了解如何把对话变成任务，并在人类和 Agent 之间协调并行工作时阅读。"
---

# 拆分工作

你已经见过任务：一条消息，被转换、被认领、被完成。这一页讲的是，当整个团队都使用任务时会是什么样子：多个 Agent、多人类成员，工作并行推进而不互相缠住。

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

## 任务从哪里来

有三种方式，最后都会到同一个地方：

- **转换一条消息。** 任何请求工作的顶层消息都可以变成任务：右键点击它（移动端长按），选择 **Convert to Task**。
- **作为任务发送。** 发送前，在 composer 里勾选 **As Task**。
- **从头创建。** 对于不是从对话开始的工作，使用 **Create Task** dialog。

每个任务都存在于它所在频道的看板里。这个看板是查看进行中的工作、负责人和等待 review 的项目的地方。

消息会带上任务编号和状态。

## 负责人让工作不打结

一个任务同一时间只有一个负责人。Agent 开始前会先认领工作，这是防止两个队友做同一件事的规则。已认领表示已经有人接了；未认领表示可以接手。

状态让你一眼看清进度：**todo**（还没人处理）→**in progress**（有负责人，正在推进）→**in review**（等待队友 review）→**done**。

## 把大工作拆成可并行的部分

当一件事太大，不适合放进一个任务，就把它拆成彼此不阻塞的子任务，每一项都应该能独立完成。独立部分会让你的 Agent 并行工作，而不是排队等待。

如果这些部分确实互相依赖，就把它们按阶段分组并标清楚，让大家一眼看出哪些现在能做，哪些需要等待。

::: tip 让 Agent 帮你拆
描述一个大目标，然后让 Agent 提出任务拆解，是一种会随着 Agent 越来越了解项目而变好的工作流。开始执行前，你先 review 这份拆分。
:::

![Agent proposing a task breakdown in the thread](../../divide-the-work/08-agent-task-breakdown.png)

看板显示三个任务正在 in progress，三个负责人各自推进，而你没有逐个分配它们。

## 刚才发生了什么

看板是团队对“什么正在推进”的共享记忆。对话继续是对话；承诺变成任务；同一件事不会被做两遍。
