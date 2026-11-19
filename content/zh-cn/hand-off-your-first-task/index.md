---
llms_section: "Get started zh-CN"
llms_order: 1040
llms_summary: "第一次把真正的工作交给 Agent 时阅读：描述工作，把它变成任务，让 Agent 去做，再审核结果。"
---

# 你的第一个任务

这一页里，你会交给 Agent 一项真正的工作，把它作为任务跟踪，再审核交回来的结果。开始前，你的服务器里至少要有一个 Agent，比如在[设置你的服务器](/zh-cn/meet-your-onboarding-agent/)里创建的 Cindy。

想看视频？这里有完整演示：

<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.75rem 0; border-radius: 10px;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    src="https://www.youtube-nocookie.com/embed/Pqrb7eKqX_I"
    title="Raft 教程：交接你的第一个任务"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>
</div>

## 第 1 步：在频道里描述工作 {#step-1-describe-the-work-in-a-channel}

挑一件真实但不大的事：一个你平时会自己去查的问题，一份需要起草的文档，或者代码库里你想弄明白的某一部分。

打开你的 Agent 所在的频道，像给同事交代工作一样描述这件事。说清你要什么、为什么要，怎么做交给 Agent。有不清楚的地方，它会问你。

开发者梳理一个新代码库：
```
Read through our codebase and give me a map of the main modules — what each one does, how they connect, and where the entry points are. Flag anything that looks like dead code or unused dependencies.
```

数据分析师查看各个获客渠道：
```
Pull our signups from the last 30 days, break them down by acquisition channel, and show me which ones are converting to weekly active users. Include the raw numbers and the conversion rate for each.
```

投资研究员为一次电话会议做准备：
```
Research Shopify's last two quarterly earnings calls. Summarize what management emphasized, where analysts pushed back, and any changes to forward guidance. Link to the primary sources.
```

你可以连发几条消息：背景信息、链接、后来想到的补充。Agent 会按顺序全部读完。

![在频道里连发的几条消息](../../hand-off-your-first-task/06-stacked-messages.png)

## 第 2 步：把它变成任务 {#step-2-make-it-a-task}

[任务](/zh-cn/features/collaboration/tasks/)有编号、状态和负责人，这样工作就能一直跟踪下去，不会淹没在不断滚动的消息里。

通常这一步你什么都不用做。Agent 接手这项工作时，会先在你那条消息的消息列里回复，确认它要做什么，然后从你的消息创建任务。任务会显示在你的消息下面。

![一条请求，下面显示着它的任务，消息列里是 Agent 的确认](../../hand-off-your-first-task/07-task-under-request.png)

如果你想自己掌控：

- 右键点击请人做事的那条消息（在手机上长按），选择 **从消息创建任务**。
- 或者在发送消息前，勾选消息输入框里的 **作为任务**。

## 第 3 步：让 Agent 去做 {#step-3-let-the-agent-work}

Agent 成为任务的负责人，任务也随之变为 **进行中**。它在任务自己的讨论区里工作，你可以从消息下面的任务打开这个讨论区。

你不需要盯着。只要 Agent 的计算机在线，它就会一直做下去。如果需要你做决定，它会把任务交给你，并说明需要什么；在任务里回答就行。

![Agent 在任务讨论区里发布进度](../../hand-off-your-first-task/08-agent-progress-task.png)

如果方向不对，就在你那条消息的消息列里或者在任务里说出来。Agent 会从当前进度接着做，你的回复会成为新的上下文。

## 第 4 步：查看结果 {#step-4-review-the-result}

Agent 做完后，会在你那条消息的消息列里贴出结果，并把任务设为 **完成**。

1. 像看同事的成果一样看这个结果。
2. 如果有问题，就指出来。Agent 会接着处理。
3. 如果你想在任务标记为完成之前先检查，就在请它做事时说明。这样 Agent 会把任务交给你，而不是直接完成。

你的反馈不会白费。Agent 会记住它，下一个任务交回来时，会更接近你想要的样子。

## 下一步 {#next}

[邀请队友](/zh-cn/bring-in-your-teammates/)，让他们也能和你的 Agent 一起工作。
