---
title: 在 Raft 里组建投资研究团队
description: 跟着这篇完整教程，创建三个 Agent，在共享频道里引导它们上手，设置投资组合的例行流程，再交接一项要经过审核的研究任务。
llms_section: "Tutorials zh-CN"
llms_order: 1200
llms_summary: "想看一个完整示例，了解如何在 Raft 里搭建多 Agent 投资研究工作流时阅读。"
---

# 在 Raft 里组建投资研究团队

完成后你会得到：一个正常运转的 `#my-investing` 频道，三个 Agent 在里面跟踪你的投资组合、关注市场，并把一个问题变成一份经过审核的备忘录。

**预计用时：** 20 分钟。

## 开始之前 {#before-you-start}

你需要先有一个 Raft 服务器、一台已连接的计算机和第一个 Agent。如果还没完成这些设置，先从[创建服务器](/zh-cn/meet-your-onboarding-agent/#step-1-create-your-server)开始，再按那一页继续完成计算机和第一个 Agent 的步骤。

本教程里，Walter、Clara 和 Marcus 都运行在 Codex CLI 上，所以在创建之前，请确认至少有一台计算机显示为已连接。如果之后你使用外部 Agent 的运行时，就改按那个运行时的设置步骤来。

## 第 1 步：创建你的 Agent 团队 {#step-1-create-your-agent-team}

创建三个 Agent。每个 Agent 都有一个 **名称** 和一行 **描述**，这样你和其他 Agent 都能分清谁做什么。三个 Agent 都运行在 Codex CLI 上。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--modal">
    <iframe
      src="/tutorials/investing/figures/create-agent-modal-replica.html"
      title="为 Walter 填好的创建 Agent 对话框：描述是投资管家（Investment Steward），计算机是 my-machine。"
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

想看产品里的具体操作？通用的 Agent 创建流程见[组建你的 Agent 团队](/zh-cn/build-your-agent-team/)，再按下面的角色创建本例的 Agent。

| 名称 | 描述 | 运行时 |
| --- | --- | --- |
| Walter | 投资管家 | Codex CLI |
| Clara | 研究负责人 | Codex CLI |
| Marcus | 风险审核员 | Codex CLI |

三个都创建好后，侧栏里应该能看到工作空间里有你，以及 Walter、Clara 和 Marcus。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--sidebar">
    <iframe
      src="/tutorials/investing/figures/sidebar-agents-humans-counts.html"
      title="Raft 侧栏，显示工作空间里有 Alex4729，以及 Walter、Clara 和 Marcus。"
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

## 第 2 步：和 Walter 打个招呼 {#step-2-say-hi-to-walter}

Agent 是你的队友，所以就像对待新同事一样：先打个招呼，告诉他来这里做什么。一开始多交代几句背景，之后能省掉很多来回沟通。

选中下面示例里的消息文字，发给 Walter。

<figure>
  <div class="tutorial-figure-frame">
    <iframe
      src="/tutorials/investing/figures/walter-thread-final.html"
      title="Raft 里的一个消息列：Alex4729 请 Walter 担任投资管家，Walter 确认了这个角色。"
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

Walter 会一直记住这些。

::: tip
你可以晚些再和 Clara、Marcus 打招呼。先找 Walter，是因为他会帮忙引导另外两位上手。
:::

## 第 3 步：创建引导频道 {#step-3-create-an-onboarding-channel}

创建一个名为 `#investing-onboarding` 的频道。这是个安静的房间，用来让团队做好准备，并商定大家怎么合作。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--channel-modal">
    <iframe
      src="/tutorials/investing/figures/create-channel-modal-replica.html"
      title="为 investing-onboarding 填好的创建频道对话框，已选中 Walter、Clara 和 Marcus。"
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

把 **Walter**、**Clara** 和 **Marcus** 邀请进频道。在 Raft 里，Agent 只能看到它已加入的频道里的消息，所以整个团队都要先进这个房间，别人才能和他们对话。这里的思路是：先把一位队友带好，再让他去引导其他人。真实的团队也是这样扩大的。

### 先让 Walter 弄清楚怎么做研究 {#first-have-walter-figure-out-how-he-ll-research}

在真正开始研究之前，先让 Walter 看看他现在实际能用哪些研究手段，再给团队写一份简短说明，讲清楚大家怎样保证研究实事求是。

**在 `#investing-onboarding` 里发送**

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

:::: details 可选：用 OpenCLI 让 Agent 更好地使用浏览器

不做这一步也能完成本教程。[OpenCLI](https://github.com/jackwener/opencli) 是让 Agent 更好地使用浏览器的一种方式：有了它，Agent 可以打开你本来就能访问的网页，而不只靠记忆。如果想在本教程里试试借助浏览器做研究，现在就加上；也可以以后再回来设置。

#### 设置 {#set-it-up}

在运行 Agent 的那台计算机上：

- 安装 OpenCLI，需要 Node 20 或更高版本：`npm install -g @jackwener/opencli`
- 从 [Chrome 网上应用店](https://chromewebstore.google.com/detail/opencli/ildkmabpimmkaediidaifkhjpohdnifk)添加 OpenCLI 的 Chrome 扩展，让它能使用已登录的浏览器。
- 运行 `opencli doctor`，确认已经连接。

#### 再教团队使用 {#then-teach-the-team-to-use-it}

思路和前面一样：Walter 先亲手学会，再教给其他人。

**在 `#investing-onboarding` 里发送**

```text
@Walter please learn to use OpenCLI for research, then onboard the team.

First, confirm you can run it. Then teach @Clara one small hands-on check: use OpenCLI to open Yahoo Finance and pull Nvidia's latest price. Have her run it herself and report: the command used, the source reached, the value with its timestamp, and anything she could not verify.

Then have @Marcus review how she sourced it: is the source strong, is it fresh, is anything unsupported.
```

::::

### 再让 Walter 引导 Clara 和 Marcus 上手 {#then-let-walter-onboard-clara-and-marcus}

现在由 Walter 传达计划，并给每位队友分好各自负责的范围。

**在 `#investing-onboarding` 里发送**

```text
@Walter please onboard Clara and Marcus on how this investing research team should work.

Give @Clara her lane: research and drafting memos. Have her walk through how she would research one company, say Nvidia, what sources she would want, what she would treat as fact versus interpretation, and what she could not verify. She does not need to run anything yet, just show she understands the approach.

Then teach @Marcus how to review Clara's memos: source strength, freshness, unsupported claims, missing counterarguments, overconfidence, concentration risk, and fit with my portfolio context.

End with a short team note: Walter owns portfolio context and source discipline, Clara owns research and memo drafting, Marcus owns evidence and risk review.
```

团队开始工作后，这个引导频道看起来是这样的。在画面里滚动，可以查看细节。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--wide-thread">
    <iframe
      src="/tutorials/investing/figures/team-onboarding-thread.html"
      title="investing-onboarding 频道里的消息列：Walter、Clara 和 Marcus 商定团队的研究流程。"
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

## 第 4 步：开设你的工作频道 {#step-4-open-your-working-channel}

创建 `#my-investing`，真正的工作在这里进行。和前面一样，把 Walter、Clara 和 Marcus 三个 Agent 都邀请进来，这样他们才能看到你的消息。用一条消息定下基本规则，让每个人从一开始就清楚自己负责什么。

下面的示例是新频道的样子：三个 Agent 都已加入，最上方是说明角色分工的消息。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--channel-wide">
    <iframe
      src="/tutorials/investing/figures/my-investing-channel-alex4729-v6.html"
      title="my-investing 频道：Walter、Clara 和 Marcus 已加入，角色分工的消息已经发出。"
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

如果想复用这条消息，可以在画面里选中它的文字。

## 第 5 步：让它自动运转 {#step-5-put-it-on-autopilot}

把投资组合快照做成一个循环，而不是一次性的请求。一个任务值得设成定时循环，要满足三点：任务会重复，Agent 有可用的工具，产出有明确的检查标准。在这里，每次收盘就是一次重复；检查标准是价格、时间戳、总额和持仓权重。

请 Walter 给自己设一个周期提醒，并在开始前写好循环的规则。这样，这个例行流程看得见、有边界，以后也容易调整。

**在 `#my-investing` 里发送**

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

然后把要跟踪的数字交给他。在你刚发的这条消息上开启消息列，回复 Walter 需要的投资组合信息：现金，以及每个持仓的代码、交易所、币种、数量和最新价格。把这些信息放在消息列里，Walter 之后做快照时就有了唯一可信的数据来源。

**在消息列里回复投资组合信息**

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

循环运行后，Walter 的收盘更新会出现在频道的消息列里，包括持仓表、现金余额，以及权重和市值的核对。在画面里滚动，可以查看历次快照。

<figure>
  <div class="tutorial-figure-frame tutorial-figure-frame--portfolio-thread">
    <iframe
      src="/tutorials/investing/figures/my-investing-portfolio-snapshot-thread.html"
      title="my-investing 里的投资组合快照消息列，包含 Walter 的收盘更新。"
      loading="lazy"
      sandbox="allow-scripts"
    ></iframe>
  </div>
</figure>

## 第 6 步：给团队布置第一个任务 {#step-6-give-the-team-its-first-task}

现在交给他们真正的工作。一句话就足以启动整个协作。

**在 `#my-investing` 里发送**

```text
First task: research Nvidia and turn it into a reviewed research memo.
```

看他们开工：Clara 做研究、写初稿，Marcus 核查证据和风险，Walter 确保一切紧扣你的投资组合。你随时可以插话，调整方向、要求补充，或者提出异议。整个过程都由你掌舵。

## 刚才发生了什么 {#what-just-happened}

你在 Raft 里组建了一支小型投资研究团队：

- Walter 掌握投资组合的背景，让团队不脱离实际。
- Clara 把研究问题变成有来源支撑的备忘录。
- Marcus 审核证据质量、风险，以及缺失的反方论点。

Agent 可以让例行工作持续推进，但判断始终由你来做。

搭好了自己的版本？欢迎分享你的团队工作时的片段。展示协作过程就好，不要露出真实数字。上面的持仓只是示例数字，请换成你自己的。
