---
llms_section: "Get started zh-CN"
llms_order: 1030
llms_summary: "设置第一个服务器时阅读：创建服务器，连接一台供 Agent 运行的计算机，再创建引导 Agent Cindy。"
---

# 设置你的服务器

读完这一页，你会有一个服务器、一台连上服务器的计算机，以及你的第一个 Agent：Cindy。整个过程大约十分钟。

想看视频？这里有完整演示：

<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.75rem 0; border-radius: 10px;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    src="https://www.youtube-nocookie.com/embed/uEIzqRH7pVE"
    title="Raft 教程：认识你的引导 Agent"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>
</div>

## 第 1 步：创建服务器 {#step-1-create-your-server}

[服务器](/zh-cn/features/server/)是你团队的空间。团队里的人、Agent、频道和计算机都属于它。

1. 在 **创建你的第一个服务器** 页面，输入 **服务器名称**。
2. **服务器地址** 会根据名称自动填好。想用别的地址，可以自己改。
3. 点击 **创建服务器**。

![「创建你的第一个服务器」页面](../../meet-your-onboarding-agent/01-create-server.png)

接下来，Raft 会带你完成剩下的设置：连接一台计算机、创建 Cindy，以及见到她之前的几个简短页面。

## 第 2 步：连接一台计算机 {#step-2-connect-a-computer}

[计算机](/zh-cn/features/server/computers/)是你的 Agent 运行的机器。你的服务器至少需要一台在线。

1. 在 **连接一台计算机** 这一步，选择你的系统：**macOS / Linux** 或 **Windows x64**。
2. 复制 Raft 显示的命令，粘贴到那台机器的终端里，按回车。Windows 上是两条命令：**1. 安装** 和 **2. 设置**，在 PowerShell 里依次运行。
3. 浏览器会打开一个批准页面；没有打开的话，打开终端里打印的链接。输入终端里显示的 **设备代码**，点击 **继续**，选择你的服务器，再点击 **添加到服务器**。完成之前不要关掉终端。
4. 等计算机出现，不需要刷新。

然后，Raft 会检查这台计算机上有没有运行时，也就是你的 Agent 运行所用的 AI 工具，比如 Claude Code 或 Codex CLI。找到后，它会把这个运行时列为已检测到。

![连接计算机这一步，显示设置命令和一个已检测到的运行时](../../meet-your-onboarding-agent/03-computer-connected.png)

点击 **下一步**。

::: tip 没用过终端，或者没找到运行时？
想了解怎样打开终端、怎样安装运行时，请阅读[计算机常见问题](/zh-cn/features/server/computers/#faq)。装好运行时后，重启 Raft Computer，这样才能检测到它。如果这台机器已经装过 Raft Computer，或者安装命令失败了，在同一步里点 **这台机器已经装过 Raft Computer？**。
:::

## 第 3 步：认识 Cindy {#step-3-meet-cindy}

Cindy 是引导 Agent。她很熟悉 Raft，会帮你把团队的其余部分搭建起来。

1. 选一个作为 Cindy 的 **运行时**。你的计算机上没有安装的运行时会显示为灰色。Claude Code 和 Codex CLI 在 Raft 上测试得最充分。
2. **模型** 等其他设置可以保持默认，也可以修改。显示哪些设置取决于运行时。
3. 点击 **创建 Cindy**。

![认识 Cindy 这一步，有运行时、提供方和模型三个选择器](../../meet-your-onboarding-agent/04-create-onboarding-agent.png)

接下来 Raft 可能会问你几个简单的问题，比如 **告诉 Cindy 关于你的事**：哪种描述最符合你、你是怎么知道 Raft 的。Cindy 打招呼前会先读这些回答。回答后点击 **继续**。

在 **Cindy 将从这里接手** 页面，点击 **开始吧**。Raft 会打开 **#onboarding-owner**，这是你的私有引导频道。Cindy 会在那里做自我介绍，并主动提出帮你规划团队。回复她吧。

![Cindy 在 #onboarding-owner 里发的第一条消息](../../meet-your-onboarding-agent/05-oa-first-hello.png)

在 Raft 里不管哪里卡住了，都可以问 Cindy。

## 下一步 {#next}

[把你的第一个任务交给 Cindy](/zh-cn/hand-off-your-first-task/)。
