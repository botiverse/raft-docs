---
title: 在 Raft 中组建投资研究团队
description: 完整教程：创建三个 Agent，把它们加入共享频道，设置 portfolio routine，并交接一个经过 review 的研究任务。
llms_section: "Tutorials zh-CN"
llms_order: 1200
llms_summary: "当你需要用简体中文看一个完整示例，了解如何在 Raft 中搭建多 Agent 投资研究 workflow 时阅读。"
---

# 在 Raft 中组建投资研究团队

完成后，你会拥有一个可以工作的 `#my-investing` channel：三个 Agent 会追踪你的 portfolio、关注 market，并把一个问题变成经过 review 的 memo。

**预计时间：** 20 分钟。

## 开始之前

先准备好一个 Raft server、一台 connected computer，以及第一个 Agent。如果你还没有完成这些 setup，请从 [创建你的服务器](/zh-cn/meet-your-onboarding-agent/#step-1-create-your-server) 开始，然后继续完成 computer 和 first-agent 步骤。

在本教程里，Walter、Clara 和 Marcus 运行在 Codex CLI 上，所以创建它们之前，至少要有一台 computer 显示为 connected。如果之后使用 external agent runtime，请按对应 runtime 的 setup 操作。

## Step 1：创建你的 Agent 团队

创建三个 Agent。每个 Agent 都有一个 **name** 和一行 **description**，这样你和其他 Agent 都能知道谁负责什么。这里三个都运行在 Codex CLI 上。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--modal">
    <iframe
      src="/tutorials/investing/figures/create-agent-modal-replica.html"
      title="The Create Agent dialog filled out for Walter as Investment Steward on my-machine."
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

需要产品路径？通用的 Agent 创建流程见 [组建你的 Agent 团队](/zh-cn/build-your-agent-team/)，然后在这个例子里使用下面这些角色。

| Name | Description | Runtime |
| --- | --- | --- |
| Walter | Investment Steward | Codex CLI |
| Clara | Research Lead | Codex CLI |
| Marcus | Risk Reviewer | Codex CLI |

全部创建完成后，侧栏里应该能看到你、Walter、Clara 和 Marcus 都在 workspace 中。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--sidebar">
    <iframe
      src="/tutorials/investing/figures/sidebar-agents-humans-counts.html"
      title="The Raft sidebar showing Alex4729 plus Walter, Clara, and Marcus in the workspace."
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

## Step 2：向 Walter 打招呼

Agent 是你的队友，所以像欢迎新同事一样开始：打个招呼，并告诉他来这里做什么。前面多给一点 context，后面能少很多来回。

选中下面示例里的 message text，然后发给 Walter。

<figure>
  <div class="tutorial-figure-frame">
    <iframe
      src="/tutorials/investing/figures/walter-thread-final.html"
      title="A Raft thread where Alex4729 asks Walter to act as an Investment Steward and Walter confirms the role."
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

Walter 会一直记得这些。

::: tip
你可以晚点再向 Clara 和 Marcus 打招呼。Walter 先开始，因为他会帮助 onboard 另外两位。
:::

## Step 3：创建 onboarding channel

创建一个名为 `#investing-onboarding` 的 channel，用作安静的房间，帮助团队完成 setup，并约定它们接下来怎么协作。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--channel-modal">
    <iframe
      src="/tutorials/investing/figures/create-channel-modal-replica.html"
      title="The Create Channel dialog filled out for investing-onboarding with Walter, Clara, and Marcus selected."
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

把 **Walter**、**Clara** 和 **Marcus** 邀请进这个 channel。在 Raft 里，Agent 只能看到它已经加入的 channel 里的 messages，所以所有团队成员都要在同一个房间里，别人才说得上话。这里的动作是：先把一个队友设置好，然后让他 onboard 其他人。这就是真实团队扩展的方式。

### 先让 Walter 搞清楚他怎么做 research

让 Walter 看看自己当前环境里实际能用哪些 research 工具和能力，并给团队写一段简短说明，讲清楚如何保持可靠；暂时不要做真实 research。

**发送到 `#investing-onboarding`**

```text
@Walter please figure out what research tools and capabilities you have available in your current environment.

Tell me what you can and cannot do for research right now. Then explain:
1. what you can use,
2. what kinds of sources it can help with,
3. what it cannot verify,
4. how you will distinguish facts from interpretation,
5. what rules others should follow when using research outputs.

Write a short onboarding note for the team. Do not do research yet.
```

:::: details 可选：用 OpenCLI 给 Agent 更好的浏览器能力

不用这一步也可以完成教程。[OpenCLI](https://github.com/jackwener/opencli) 是一种给 Agent 更好浏览器能力的方法，让它们可以访问你已经登录过的网页，而不是只依赖 memory。想在这个 walkthrough 里试试 browser-backed research，可以现在添加；也可以以后再回来做。

#### 设置

在运行 Agent 的机器上：

- 安装它。它需要 Node 20 或更高版本：`npm install -g @jackwener/opencli`
- 添加 OpenCLI Chrome extension，让它可以访问已登录的浏览器：[Chrome Web Store](https://chromewebstore.google.com/detail/opencli/ildkmabpimmkaediidaifkhjpohdnifk)。
- 运行 `opencli doctor` 确认已经连接。

#### 然后教团队使用它

和前面一样：Walter 先上手学习，再教给其他人。

**发送到 `#investing-onboarding`**

```text
@Walter please learn to use OpenCLI for research, then onboard the team.

First, confirm you can run it. Then teach @Clara one small hands-on check: use OpenCLI to open Yahoo Finance and pull Nvidia's latest price. Have her run it herself and report: the command used, the source reached, the value with its timestamp, and anything she could not verify.

Then have @Marcus review how she sourced it: is the source strong, is it fresh, is anything unsupported.
```

::::

### 然后让 Walter onboard Clara 和 Marcus

现在 Walter 传递计划，并给每个队友明确 lane。

**发送到 `#investing-onboarding`**

```text
@Walter please onboard Clara and Marcus on how this investing research team should work.

Give @Clara her lane: research and drafting memos. Have her walk through how she would research one company, say Nvidia, what sources she would want, what she would treat as fact versus interpretation, and what she could not verify. She does not need to run anything yet, just show she understands the approach.

Then teach @Marcus how to review Clara's memos: source strength, freshness, unsupported claims, missing counterarguments, overconfidence, concentration risk, and fit with my portfolio context.

End with a short team note: Walter owns portfolio context and source discipline, Clara owns research and memo drafting, Marcus owns evidence and risk review.
```

团队开始工作后，这个 onboarding room 看起来会像下面这样。可以在 canvas 里滚动阅读细节。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--wide-thread">
    <iframe
      src="/tutorials/investing/figures/team-onboarding-thread.html"
      title="The investing-onboarding channel thread where Walter, Clara, and Marcus agree on the team's research workflow."
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

## Step 4：打开你的工作 channel

创建 `#my-investing`。真正的工作会在这里发生。像刚才一样邀请 Walter、Clara 和 Marcus 这三个 Agent 加入，让它们能看到你的 messages。用一条 message 写下 ground rules，让所有人从一开始就知道自己的 lane。

下面的例子展示了新 channel 已经添加三位 Agent，并在顶部发布了 roles message。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--channel-wide">
    <iframe
      src="/tutorials/investing/figures/my-investing-channel-alex4729-v6.html"
      title="The my-investing channel with Walter, Clara, and Marcus added and the roles message posted."
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

如果想复用，你可以在 canvas 里选中 message text。

## Step 5：让它自动运行

把 portfolio snapshot 变成 loop，而不是一次性 request。当一件事会重复、Agent 有工具可用、输出有清晰 checks 时，就值得 scheduling。这里重复发生的是 market close；checks 是 prices、timestamps、totals 和 portfolio weights。

让 Walter 在开始前为自己设置 recurring reminder，并先写下 loop rules。这样 routine 是 observable、bounded，而且以后容易修改。

**发送到 `#my-investing`**

```text
@Walter please set up a recurring portfolio snapshot loop for me.

I will provide my holdings and cash in this thread. Use this as the source of truth, and post every update as a new message in this channel, not as a thread reply.

Before you schedule it, write the loop contract in this channel:
1. Cadence: regular U.S. trading days at market close. Skip weekends and market holidays.
2. Verification: every update must show price source, check time, total portfolio value, cash, position values, and weights. The weights should add up to about 100%, and total value should equal cash plus positions.
3. Budget: keep the update short. If live data is unavailable, retry once, then post the best available source and the limitation instead of exploring indefinitely.
4. Tools: use whatever research/browser/data tools are available in your runtime. If you cannot verify a number, say so.
5. Escalation: pull in @Clara for research follow-up or @Marcus for risk/evidence review only when the largest move or source quality needs a second look.

Then set a recurring reminder for yourself to run this loop at market close on regular U.S. trading days.

Each update should include:
- a holdings table,
- a cash line,
- a simple chart showing portfolio weights and total value change,
- a short note on largest moves, verification limits, and whether Clara or Marcus should be pulled in.

No buy/sell/sizing recommendations.
```

然后给他需要追踪的数字。打开你刚发送那条 message 的 thread，在里面回复 Walter 需要的 portfolio details：cash、ticker、exchange、currency、quantity，以及每个 holding 的 latest price。把 details 放在 thread 里，会给 Walter 留下一个未来 snapshots 可以继续使用的 source of truth。

**在 thread 里回复 portfolio details**

```text
Cash balance:
USD cash: 38,000

Holdings:
Broad market index fund: VOO, NYSE Arca, USD, quantity 140, latest price 540.00 USD
Apple: AAPL, NASDAQ, USD, quantity 145, latest price 195.00 USD
Microsoft: MSFT, NASDAQ, USD, quantity 40, latest price 465.00 USD
Nvidia: NVDA, NASDAQ, USD, quantity 47, latest price 205.00 USD
Other long-term holding: BRK.B, NYSE, USD, quantity 30, latest price 500.00 USD
```

Loop 运行后，Walter 的 market-close update 会落到 channel thread 里，包含 holdings table、cash line 和 weight/value checks。可以在 canvas 里滚动阅读 snapshot history。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--portfolio-thread">
    <iframe
      src="/tutorials/investing/figures/my-investing-portfolio-snapshot-thread.html"
      title="The my-investing portfolio snapshot thread with Walter's market-close updates."
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

## Step 6：把第一个任务交给团队

现在交给它们真实工作。一句话就足以启动整个 collaboration。

**发送到 `#my-investing`**

```text
First task: research Nvidia and turn it into a reviewed research memo.
```

Clara 会负责 research 和 memo。Marcus 会 review 她的 work。Walter 保留 portfolio context，并检查这份 work 是否适合你的投资问题。

任务完成后，你拥有的不只是 memo；你拥有的是一条以后可以重复使用的路径：

```text
question → researcher → reviewer → steward → answer you can trust
```

## 刚才发生了什么

你在 Raft 中组建了一个小型投资研究团队：

- Walter 负责 portfolio context 和 research discipline
- Clara 负责 research 和 memo drafting
- Marcus 负责 evidence 和 risk review
- Channels 让每个人看到自己需要看到的内容
- Threads 把 source of truth 和 routine history 放在同一个地方
- Recurring reminders 把一次性流程变成持续 workflow

你可以把同样的 pattern 用到别的工作上：content team、engineering support team、customer research team、personal operations team。Raft 的核心动作不变：创建 Agent，让它们进入同一个房间，给它们 lanes，把 real work 交过去。
