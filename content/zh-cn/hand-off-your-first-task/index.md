---
llms_section: "Introduction and workflows zh-CN"
llms_order: 1040
llms_summary: "需要把第一个真正的任务交给 Agent，并处理后续跟进时阅读。"
---

# 交接你的第一个任务

你已经有了服务器、一台已连接的计算机，还有一个会回话的 Agent。现在来看看它到底能做什么：交给它一项真正的工作，看它把做完的结果交回来。

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

## 第 1 步：描述工作 {#step-1-describe-the-work}

挑一件真实但不大的事：一个你平时会自己去查的问题，一份需要起草的文件，或者代码库里你想弄明白的某一部分。

然后在频道里告诉你的 Agent，就像跟同事交代事情一样。提示词不需要写得完美。说清你要什么、为什么要，怎么做就交给 Agent。有不清楚的地方，它会问你。

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

![在频道里连发几条消息](../../hand-off-your-first-task/06-stacked-messages.png)

你可以接着发：背景信息、链接、后来想到的补充。Agent 读频道时，会按顺序读到你发的所有内容。

## 第 2 步：把它变成任务 {#step-2-make-it-a-task}

一条请人做事的消息可以变成任务：任务有编号、状态和负责人，这样工作就能一直跟踪下去，不会淹没在不断滚动的消息里。右键点击这条消息（在手机上长按），选择 **转为任务**。任务一开始无人认领；你的 Agent 会认领它，然后开始工作。

::: info 任务状态
任务会依次经过四个状态：**待办** → **进行中** → **待确认** → **完成**。Agent 边做边更新状态；**待确认** 表示在等队友处理。
:::

任务上会显示 Agent 是负责人，状态也变成了 **进行中**。

## 第 3 步：放手让它做 {#step-3-let-it-run}

这一步需要练习：走开。Agent 边做边在任务的消息列里发进度。只要你的计算机开着，不管你看不看，它都会一直做下去。去泡杯咖啡，十分钟后再回来看看。

![Agent 在任务消息列里发布进度](../../hand-off-your-first-task/07-agent-progress-thread.png)

如果 Agent 没做完就停了，或者结果不是你想要的，就在消息列里回复。告诉它哪里不对、缺了什么。它会从停下的地方接着做，你说的话都会成为新的上下文。

你回来时，消息列里已经有了进展，而你并没有在一旁盯着。

## 第 4 步：审核并收尾 {#step-4-review-and-close}

Agent 做完后，会把任务设为 **待确认**，并贴出结果。接下来轮到你：像看同事的成果一样看它。做得好，就说一声，并把任务标记为 **完成**。不好，就在消息列里指出哪里不对，Agent 会接着改。

这些反馈不会白费。你的 Agent 会记住它们，下一个任务交回来时，会更接近你想要的样子。

任务已经标记为完成，而这份工作不是你做的。

## 刚才发生了什么 {#what-just-happened}

你刚走完了 Raft 里所有工作都遵循的循环：描述、交接、放手、审核。更大的事，比如多个 Agent、整个项目、耗时更长的工作，都是同一个循环，只是规模更大。
