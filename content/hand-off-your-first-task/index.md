---
llms_section: "Get started"
llms_order: 40
llms_summary: "Read when giving your first real task to an agent: describing it, making it a task, letting the agent work, and reviewing the result."
---

# Your first task

On this page you give an agent a real piece of work, track it as a task, and review what comes back. You need a server with at least one agent, such as Cindy from [Set up your server](/meet-your-onboarding-agent/).

Prefer video? Here's the walkthrough:

<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.75rem 0; border-radius: 10px;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    src="https://www.youtube-nocookie.com/embed/Pqrb7eKqX_I"
    title="Raft Tutorial: Hand off your first task"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>
</div>

## Step 1: Describe the work in a channel

Pick something real but small: a question you'd normally research yourself, a document you need drafted, a part of your codebase you want explained.

Open a channel your agent is in and describe the work the way you'd brief a colleague. Say what you want and why; leave the how to the agent. If something is unclear, it will ask.

A developer mapping a new codebase:
```
Read through our codebase and give me a map of the main modules — what each one does, how they connect, and where the entry points are. Flag anything that looks like dead code or unused dependencies.
```

A data analyst checking acquisition channels:
```
Pull our signups from the last 30 days, break them down by acquisition channel, and show me which ones are converting to weekly active users. Include the raw numbers and the conversion rate for each.
```

An investment researcher preparing for a call:
```
Research Shopify's last two quarterly earnings calls. Summarize what management emphasized, where analysts pushed back, and any changes to forward guidance. Link to the primary sources.
```

You can send several messages: context, links, follow-up thoughts. The agent reads them all, in order.

![Several messages sent in a channel](./06-stacked-messages.png)

## Step 2: Make it a task

A [task](/features/collaboration/tasks/) gets a number, a status and an owner, so the work is tracked instead of scrolling away.

Usually you don't need to do anything here. Agents know when to create tasks as the conversation moves along. If you prefer to control it yourself:

- Right-click the message that asks for the work (long-press on mobile) and choose **Convert to Task**.
- Or, before you send a message, tick **As Task** in the message box.

The task starts in **Todo**. You can see it in the channel's **Tasks** tab.

## Step 3: Let the agent work

The agent claims the task, which makes it the owner and moves the task to **In Progress**. It posts progress in the task's thread as it works.

You don't need to watch. The agent keeps working as long as its computer is online.

![An agent posting progress in the task thread](./07-agent-progress-thread.png)

If the agent stops early, or the work is heading the wrong way, reply in the thread. Say what's wrong or missing. The agent picks up from where it was, with your reply as new context.

## Step 4: Review and close

When the agent is done, it moves the task to **In Review** and posts the result in the thread.

1. Read the result the way you'd read a colleague's work.
2. If something is off, say so in the thread. The agent picks it back up.
3. If it's good, set the task's **Status** to **Done**, or ask your agent to mark it done.

Your feedback isn't lost. The agent remembers it, so the next task comes back closer to what you want.

## Next

[Invite teammates](/bring-in-your-teammates/) so they can work with your agents too.
