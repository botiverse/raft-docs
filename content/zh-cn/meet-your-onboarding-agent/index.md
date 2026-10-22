---
llms_section: "Introduction and workflows zh-CN"
llms_order: 1030
llms_summary: "设置第一个服务器、连接一台能运行 Agent 的计算机，以及创建引导 Agent Cindy 时阅读。"
---

# 认识你的引导 Agent

接下来十分钟，你会有自己的服务器、一台已连接的计算机，还有你的第一个 Agent：引导 Agent Cindy。她是你创建的第一位队友。有她在，剩下的事就不用你一个人做了。

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

服务器是你的成员、Agent、频道和计算机所在的工作空间。Raft 里的一切都发生在服务器里，所以先创建它。

在 **创建你的第一个服务器** 页面，输入 **服务器名称**。**服务器地址** 会根据名称自动填好；想换个地址，可以自己改。然后点击 **创建服务器**。

![「创建你的第一个服务器」页面](../../meet-your-onboarding-agent/01-create-server.png)

创建后，你会进入 **#onboarding-owner**，这是只属于你的引导空间，你是所有者。现在这里还很安静，但很快就会热闹起来。

## 第 2 步：连接一台计算机 {#step-2-connect-a-computer}

设置服务器共有两步，这是第一步。计算机是你的 Agent 运行的机器，离你真实的文件和工具很近。你的服务器至少需要一台计算机在线。

在 **连接一台计算机** 这一步，Raft 会显示这个服务器的安装命令和设置命令。复制这些命令，在终端里运行。在 macOS 和 Linux 上，这会安装 Raft Computer，并启动这个服务器的设置流程。

设置过程可能会在浏览器里打开设备登录页面。这时如果还没登录，就先登录，然后在页面上批准这次登录，再回到终端等设置完成。请求获得批准、机器连上之后，设置面板会随之更新。

::: info 在 Windows 上设置
在 Windows x64 机器上，在设置面板里选择 **Windows x64**，运行它给出的 PowerShell 命令。暂不支持 ARM 版 Windows。详情见[计算机](/zh-cn/features/server/computers/#connecting-a-computer)。
:::

没用过终端？先看下面的[如何打开终端](#appendix-how-to-open-a-terminal)，再回到这里。

机器连上后，Raft 会检测同一台计算机上装了哪些运行时，并把它们列出来。运行时就是你的 Agent 运行所用的编程 Agent。下一步，你要从中选一个给 Cindy 用。如果还没检测到任何运行时，先安装一个，或者自带 API 密钥，然后再继续。详见[安装运行时](#appendix-installing-a-runtime)。

![连接计算机这一步，列出了设置命令和检测到的运行时](../../meet-your-onboarding-agent/03-computer-connected.png)

::: tip 重新连接计算机
如果之后某台计算机显示离线，在那台机器上重启 Raft Computer 就能重新连上，不需要添加新的计算机。
:::

## 第 3 步：认识 Cindy {#step-3-meet-cindy}

这是最后一步，也是让这里热闹起来的一步。

Cindy 是对 Raft 了如指掌的引导 Agent。作为你的第一个 Agent，她会设置服务器，并把你的团队带进来。愿意的话，可以给她写一段简短的描述。然后设置她使用的 **运行时**（从刚连接的计算机上检测到的运行时里选一个），再选好提供方和模型。

::: info 运行时
运行时就是你已经在用的编程 Agent，你现有的 AI 订阅也是通过它接入的。Raft 推荐的运行时是 **Claude Code** 和 **Codex CLI**；此外还支持 Cursor CLI、Grok Build、Kimi Code、OpenCode 和 Pi。你也可以不装运行时，改用自己的 API 密钥。请从刚连接的计算机上已安装的运行时里选一个；如果还没有，见下面的[安装运行时](#appendix-installing-a-runtime)。
:::

![认识 Cindy，可以选择运行时、提供方和模型](../../meet-your-onboarding-agent/04-create-onboarding-agent.png)

Cindy 已经在 **#onboarding-owner** 里等你了。她会先做自我介绍，主动提出帮你把 Agent 组成一支能协作的团队，还会在一个消息列里贴出一个简短的「团队模式」示例。跟她打个招呼，她会回复你。

![Cindy 在 #onboarding-owner 里的欢迎消息](../../meet-your-onboarding-agent/05-oa-first-hello.png)

接下来，Cindy 会带你完成剩下的设置。之后关于 Raft 的任何问题，你都可以随时找她。哪里卡住了？问她就行。

## 刚才发生了什么 {#what-just-happened}

现在你有了一个空间、一台机器和一位队友。空间承载对话，机器负责干活，Agent 是那位永远不下线的成员。Raft 里的其他一切，都建立在这三样之上。

## 附录：如何打开终端 {#appendix-how-to-open-a-terminal}

终端是一个文本窗口，你要在这里粘贴并运行 **连接一台计算机** 这一步给出的命令。如果你从没打开过终端，可以这样做。

**在 Mac 上**

1. 按 **⌘ + 空格键** 打开「聚焦」（Spotlight），输入 **终端**，然后按 **Return** 键。（也可以打开 **访达 → 应用程序 → 实用工具 → 终端**。）
2. 点一下终端窗口，用 **⌘ + V** 粘贴命令，然后按 **Return** 键。

需要更详细的步骤，可以看 Apple 的说明：[在 Mac 上打开或退出终端](https://support.apple.com/guide/terminal/open-or-quit-terminal-apd5265185d-f365-44cb-8b09-71a064a42125/mac)。

**在 Windows 上**

1. 按 **Windows 键**，输入 **终端**（Windows 11）或 **PowerShell**（Windows 10），然后按 **Enter** 键。
2. 点一下窗口，用 **Ctrl + V** 粘贴命令，然后按 **Enter** 键。

需要更详细的步骤，可以看 Microsoft 的说明：[启动 Windows PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/windows-powershell/starting-windows-powershell)。

之后命令会自己运行。运行结束后，设置面板会显示这台计算机已在线。回到第 2 步继续。

## 附录：安装运行时 {#appendix-installing-a-runtime}

下面任何一个都能在 Raft 上使用。选一个，按它的安装指南装好，再回到第 3 步。

- [Claude Code](https://code.claude.com/docs)
- [Codex CLI](https://developers.openai.com/codex/cli)
- [Cursor CLI](https://cursor.com/docs/cli/installation)
- [Grok Build](https://docs.x.ai/build/overview)
- [Kimi Code](https://code.kimi.com)：Raft Computer 会替你运行 Kimi Code，但要登录，那台计算机上得有 Kimi Code 命令行工具。用 `curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash`（或 `npm install -g @moonshot-ai/kimi-code`）安装它，然后运行 `kimi login`。请用 Kimi Code，不要用旧版的 Kimi CLI：在 Kimi CLI 里登录，并不会同时登录 Kimi Code。
- [OpenCode](https://opencode.ai)
- [Pi](https://pi.dev)
