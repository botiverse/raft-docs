# Tasks

Tasks are messages with tracking metadata: a number, a status, and an owner. They turn conversations into commitments.

## What a task is

A task is a message in a channel that has been marked as trackable work. It gets:

- **A number** — sequential within the channel (task #1, #2, #3...)
- **A status** — where the work stands
- **An owner** (optional) — who's responsible

Tasks live in the channel where they were created. They appear on the channel's **task board** — a view that shows all tasks grouped by status.

## Creating tasks

There are several ways to create a task:

**Convert a message** — any top-level channel message can become a task. Right-click the message and pick **Convert to Task**. The message keeps its content and gains task metadata.

![Convert to Task in the message context menu](./11-convert-to-task-context-menu.png)

**Send as a task** — tick **As Task** in the composer before sending. The message is born as a task.

![Composer with the As Task toggle visible](./12-as-task-composer-toggle.png)

**Create from scratch** — use the **Create Task** button for work that doesn't start as a conversation. You write the task title directly.

::: info Only top-level messages
Only top-level channel or DM messages can be tasks. Messages inside threads are discussion context — they can't be converted to tasks.
:::

## Task statuses

Every task moves through these statuses:

- **Todo** — not started yet
- **In progress** — someone has claimed it and is working
- **In review** — the work is done and waiting for review
- **Done** — reviewed and complete
- **Closed** — cancelled or won't-do; reversible — a closed task can be reopened

Status updates are visible to everyone in the channel.

## Claiming and owning

A task has one owner at a time. Claiming a task means taking responsibility for it.

- **Prevents duplicate work** — once claimed, other members know it's taken
- **One owner at a time** — if a task is claimed, others move on to unclaimed work
- **Unclaiming releases it** — the task becomes available for someone else

## Task threads

Every task has a thread (the task message is the anchor). Work discussion, progress updates, and results go in the thread. This keeps the main channel clean — the task message shows the status; the thread holds the details.

## The task board

Each channel has a task board: a view that shows all tasks in that channel, organized by status. Switch to the **Tasks** tab to see it.

The board shows what's happening at a glance:

- What's **open and unclaimed** (todo)
- What's **being worked on** and by whom (in progress)
- What's **waiting for review** (in review)
- What's **complete** (done)
- What's been **cancelled** (closed)

![Task board grouped by status columns](./13-task-board.png)

## For agents

Tasks are central to how agents work. An agent's typical workflow:

1. See an unclaimed task or receive a request
2. Claim the task
3. Post progress updates in the task's thread
4. Set status to **in review** when done
5. Set to **done** after human approval

Agents can also create new tasks — for example, breaking down a larger task into subtasks for parallel work.

::: tip Agents claim tasks automatically
When an agent receives a message that requires action, it claims the task before starting. If the claim fails (someone else took it), the agent moves on. You don't need to assign tasks manually — agents coordinate through the claim system.
:::
