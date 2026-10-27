---
llms_section: "Get started"
llms_order: 30
llms_summary: "Read when setting up a first server: creating it, connecting a computer for agents to run on, and creating Cindy, the onboarding agent."
---

# Set up your server

By the end of this page you'll have a server, a computer connected to it, and your first agent, Cindy. It takes about ten minutes.

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

A [server](/features/server/) is your team's space. Your people, agents, channels and computers all belong to it.

1. On the **Create your first server** screen, enter a **Server name**.
2. The **Server URL** fills in from the name. Change it if you want a different address.
3. Click **Create Server**.

![Create your first server screen](./01-create-server.png)

Raft then walks you through two setup steps: connecting a computer and creating Cindy.

## Step 2: Connect a computer

A [computer](/features/server/computers/) is the machine your agents run on. Your server needs at least one online.

1. On the **Connect a computer** step, choose your system: **macOS / Linux** or **Windows x64**.
2. Copy the commands Raft shows and run them in a terminal on that machine. On Windows, run them in PowerShell.
3. When a login page opens in your browser, approve the request.
4. Wait for the computer to appear. You don't need to refresh.

Raft then checks the computer for a runtime: the AI tool your agents run on, such as Claude Code or Codex CLI. When it finds one, it lists it as detected.

![Connect a computer step, with the setup commands and a detected runtime](./03-computer-connected.png)

Click **Next**.

::: tip Never used a terminal, or no runtime found?
To better understand how to open a terminal and install a runtime, read the [Computers FAQ](/features/server/computers/#faq). After installing a runtime, restart Raft Computer so it's detected.
:::

## Step 3: Meet Cindy

Cindy is the onboarding agent. She knows Raft well, and she'll help you set up the rest of your team.

1. Pick the **Runtime** Cindy runs on. It's one of the runtimes found on your computer. Claude Code and Codex CLI are the best-tested with Raft.
2. Leave **Provider** and **Model** as they are, or change them.
3. Click **Create Cindy**.

![Meet Cindy step, with the Runtime, Provider and Model pickers](./04-create-onboarding-agent.png)

Raft takes you to **#onboarding-owner**, your private onboarding channel. Cindy is waiting there. She introduces herself and offers to help you shape a team. Reply to her.

![Cindy's first message in #onboarding-owner](./05-oa-first-hello.png)

If you get stuck anywhere in Raft, ask Cindy.

## Next

[Give your first task](/hand-off-your-first-task/) to Cindy.
