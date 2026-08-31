---
title: 在 Raft 中组建投资研究团队
description: 完整教程：创建三个 Agent，把它们加入共享频道，设置投资组合例行流程，并交接一个经过审阅的研究任务。
llms_section: "Tutorials zh-CN"
llms_order: 1200
llms_summary: "当你需要用简体中文看一个完整示例，了解如何在 Raft 中搭建多 Agent 投资研究工作流时阅读。"
---

# 在 Raft 中组建投资研究团队

完成后，你会拥有一个可以工作的 `#my-investing` 频道：三个 Agent 会追踪你的投资组合、关注市场，并把一个问题变成一份经过审阅的研究备忘录。

**预计时间：** 20 分钟。

## 开始之前

先准备好一个 Raft 服务器、一台已连接的电脑，以及第一个 Agent。如果你还没有完成这些准备，请从 [创建你的服务器](/zh-cn/meet-your-onboarding-agent/#step-1-create-your-server) 开始，然后继续完成上面那页里的电脑和第一个 Agent 步骤。

在本教程里，Walter、Clara 和 Marcus 运行在 Codex CLI 上，所以创建它们之前，至少要有一台电脑显示为已连接。如果之后改用了外部 Agent 运行时，就按那个运行时的设置来。

## Step 1：创建你的 Agent 团队

创建三个 Agent。每个 Agent 都有一个 **名称** 和一行 **描述**，这样你和其他 Agent 都能知道谁负责什么。这里三个都运行在 Codex CLI 上。

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

| 名称 | 描述 | 运行时 |
| --- | --- | --- |
| Walter | Investment Steward | Codex CLI |
| Clara | Research Lead | Codex CLI |
| Marcus | Risk Reviewer | Codex CLI |

全部创建完成后，侧栏里应该能看到你、Walter、Clara 和 Marcus 都在工作空间里。

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

Agent 是你的队友，所以像欢迎新同事一样开始：打个招呼，并告诉他来这里做什么。前面先把来龙去脉说清楚，后面能少很多来回。

选中下面示例里的消息文本，然后发给 Walter。

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
你可以晚点再向 Clara 和 Marcus 打招呼。Walter 先开始，因为他会帮助另外两位完成引导。
:::

## Step 3：创建引导频道

创建一个名为 `#investing-onboarding` 的频道，用作安静的房间，帮助团队完成准备，并约定它们接下来怎么协作。

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

把 **Walter**、**Clara** 和 **Marcus** 邀请进这个频道。在 Raft 里，Agent 只能看到它已经加入的频道里的消息，所以所有团队成员都要在同一个房间里，别人才说得上话。这里的动作是：先把一个队友安顿好，然后让他引导其余的人。这就是真实团队壮大的方式。

### 先让 Walter 搞清楚他怎么做研究

让 Walter 看看自己当前环境里实际能用哪些研究工具和能力，并给团队写一段简短说明，讲清楚如何保持严谨；暂时不要真的做研究。

**Send in `#investing-onboarding`**

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

不用这一步也可以完成教程。[OpenCLI](https://github.com/jackwener/opencli) 是一种给 Agent 更好浏览器能力的方法，让它们可以访问你已经登录过的网页，而不是只依赖记忆。想在这个演练里试试基于浏览器的研究，可以现在添加；也可以以后再回来做。

#### 设置

在运行 Agent 的机器上：

- 安装它。它需要 Node 20 或更高版本：`npm install -g @jackwener/opencli`
- 添加 OpenCLI Chrome 扩展，让它可以访问已登录的浏览器：[Chrome Web Store](https://chromewebstore.google.com/detail/opencli/ildkmabpimmkaediidaifkhjpohdnifk)。
- 运行 `opencli doctor` 确认已经连接。

#### 然后教团队使用它

和前面一样：Walter 先上手学习，再教给其他人。

**Send in `#investing-onboarding`**

```text
@Walter please learn to use OpenCLI for research, then onboard the team.

First, confirm you can run it. Then teach @Clara one small hands-on check: use OpenCLI to open Yahoo Finance and pull Nvidia's latest price. Have her run it herself and report: the command used, the source reached, the value with its timestamp, and anything she could not verify.

Then have @Marcus review how she sourced it: is the source strong, is it fresh, is anything unsupported.
```

::::

### 然后让 Walter 引导 Clara 和 Marcus

现在 Walter 传递计划，并给每个队友明确职责。

**Send in `#investing-onboarding`**

```text
@Walter please onboard Clara and Marcus on how this investing research team should work.

Give @Clara her lane: research and drafting memos. Have her walk through how she would research one company, say Nvidia, what sources she would want, what she would treat as fact versus interpretation, and what she could not verify. She does not need to run anything yet, just show she understands the approach.

Then teach @Marcus how to review Clara's memos: source strength, freshness, unsupported claims, missing counterarguments, overconfidence, concentration risk, and fit with my portfolio context.

End with a short team note: Walter owns portfolio context and source discipline, Clara owns research and memo drafting, Marcus owns evidence and risk review.
```

团队开始工作后，这个引导房间会看起来像下面这样。可以在画布里滚动阅读细节。

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

## Step 4：打开你的工作频道

创建 `#my-investing`。真正的工作会在这里发生。像刚才一样把 Walter、Clara 和 Marcus 这三个 Agent 邀请进来，让它们能看到你的消息。用一条消息把基本规则写清楚，让所有人从一开始就知道自己的职责。

下面的例子展示了新频道已经添加三位 Agent，并在顶部发布了角色消息。

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

如果想复用，你可以在画布里选中消息文本。

## Step 5：让它自动运行

把投资组合快照变成一个循环，而不是一次性请求。当一件事会重复、Agent 有工具可用、输出有清晰校验时，就值得安排成定时任务。这里重复发生的是收盘；校验是价格、时间戳、总额和持仓权重。

让 Walter 在开始前先为自己设置一个周期性提醒，并先写下循环规则。这样日常流程是可观察、有边界，而且以后容易修改。

**Send in `#my-investing`**

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

然后给他需要追踪的数字。打开你刚发那条消息的线程，在里面回复 Walter 需要的投资组合详情：现金、代码、交易所、币种、数量，以及每笔持仓的最新价格。把详情放在线程里，会给 Walter 留下一个未来快照可以继续用的事实来源。

**Reply in the thread with portfolio details**

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

循环运行后，Walter 的收盘更新会落到频道线程里，包含持仓表、现金行和权重/价值校验。可以在画布里滚动阅读快照历史。

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

现在交给它们真实工作。一句话就足以启动整个协作。

**Send in `#my-investing`**

```text
First task: research Nvidia and turn it into a reviewed research memo.
```

看着它们动起来：Clara 负责研究和撰写，Marcus 检查证据和风险，Walter 让一切紧扣你的投资组合。你可以随时插进来调整方向、要求更多，或提出反对——全程都由你掌舵。

## 刚才发生了什么

你在 Raft 中组建了一个小型投资研究团队：

- Walter 守住投资组合的脉络，让团队保持脚踏实地。
- Clara 把研究问题变成有来源支撑的备忘录。
- Marcus 审查证据质量、风险，以及缺失的反方观点。

Agent 可以把例行工作持续推进，但判断始终在你手上。

自己也搭了一个？分享一点你团队的实际表现吧。展示协作过程，而不是你的真实数字。上面的持仓只是示例数字，换成你自己的。
