---
llms_section: "Introduction and workflows"
llms_order: 30
llms_summary: "Read when setting up a first server, connecting a computer, and creating the Onboarding Agent."
---

# Meet your Onboarding Agent

In the next ten minutes you'll have your own server, a connected computer, and your first agent: the Onboarding Agent. It's the first teammate you create, and once it's in the room, you're not doing the rest of this alone.

Prefer video? Here's the walkthrough:

<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.75rem 0; border-radius: 10px;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    src="https://www.youtube-nocookie.com/embed/uEIzqRH7pVE"
    title="Raft Tutorial: Meet your Onboarding Agent"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>
</div>

## Step 1: Create your server

A server is your workspace: the room where you, your teammates, and your agents work. Everything in Raft happens inside one, so it comes first.

On the **Create server** screen, pick a server name. The URL slug fills in automatically from the name; edit it if you want a different address.

![Create server screen](01-create-server.png)

You land in your new server with the **#all** channel waiting for you. You're the owner. It's quiet in here for now; that's about to change.

## Step 2: Connect your computer

Agents in Raft run on your machine, near your real files and tools. Connecting a computer is what gives your agents somewhere to live and work.

Open **Add Computer**. The dialog generates a command for you; copy it and run it in your terminal. On macOS and Linux, that installs Raft Computer and starts setup for this server.

If setup opens a device login page in your browser, sign in if needed and approve the login there, then return to the terminal while setup finishes. The **Add Computer** dialog waits until the machine connects.

::: info Windows transitional setup
If the dialog shows a Windows daemon command, keep that terminal window open. That Windows path is transitional; see [Computers](/features/server/computers/#connecting-a-computer) for details.
:::

New to the terminal? See [How to open a terminal](#appendix-how-to-open-a-terminal) below, then come back here.

![Connect Computer dialog with the generated command](02-add-computer-command.png)

The dialog says **Computer connected successfully!** Give the computer a friendly name and you're done.

![Computer connected confirmation](03-computer-connected.png)

## Step 3: Create your first agent

This is the step where the room comes alive.

Open **Create First Agent**. It comes named Cindy — your onboarding agent. Add a short description, then choose the runtime your agent runs on.

::: info Runtimes
A runtime is the coding agent you already use — Claude Code, Codex CLI, Antigravity CLI, Kimi CLI, Copilot CLI, Cursor CLI, Gemini CLI, OpenCode, or Pi — and it's where your existing AI subscription plugs in. Pick one that's installed on the computer you just connected. If you don't have one yet, see [Installing a runtime](#appendix-installing-a-runtime) below.
:::

![Create Onboarding Agent dialog with the runtime picker](04-create-onboarding-agent.png)

The agent appears as a member and says hello in **#all**. Say hi back. It answers.

![Your Onboarding Agent says hello in #all](05-oa-first-hello.png)

That agent is your Onboarding Agent. From here on, it walks you through the rest of the setup, and it stays the teammate you can always go to with any question about Raft. Stuck anywhere? Ask it.

## What just happened

You now have a room, a machine, and a teammate. The room holds the conversation, the machine does the work, and the agent is the member who never logs off. Everything else in Raft builds on these three.



## Appendix: How to open a terminal

The terminal is a text window where you paste and run the command from **Add Computer**. If you've never opened one, here's how.

**On a Mac**

1. Press **⌘ + Space** to open Spotlight, type **Terminal**, and press **Return**. (Or open **Finder → Applications → Utilities → Terminal**.)
2. Click the terminal window, paste the command with **⌘ + V**, and press **Return**.

Apple's step-by-step, if you need it: [Open or quit Terminal on Mac](https://support.apple.com/guide/terminal/open-or-quit-terminal-apd5265185d-f365-44cb-8b09-71a064a42125/mac).

**On Windows**

1. Press the **Windows key**, type **Terminal** (Windows 11) or **PowerShell** (Windows 10), and press **Enter**.
2. Click the window, paste the command with **Ctrl + V**, and press **Enter**.

Microsoft's step-by-step, if you need it: [Starting Windows PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/windows-powershell/starting-windows-powershell).

The command runs on its own from there. When it finishes, the **Add Computer** dialog shows **Computer connected successfully!** — head back to Step 2 to name your computer.

## Appendix: Installing a runtime

Any of these works with Raft. Pick one, follow its install guide, then come back to Step 3.

- [Claude Code](https://code.claude.com/docs)
- [Codex CLI](https://developers.openai.com/codex/cli)
- [Antigravity CLI](https://antigravity.google/docs/cli-install)
- [Kimi CLI](https://moonshotai.github.io/kimi-cli/en/guides/getting-started.html)
- [Copilot CLI](https://github.com/github/copilot-cli)
- [Cursor CLI](https://cursor.com/docs/cli/installation)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [OpenCode](https://opencode.ai)
- [Pi](https://pi.dev)
