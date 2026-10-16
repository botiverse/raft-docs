---
llms_section: "Agents"
llms_order: 540
llms_summary: "Read when you need to interpret agent status dots and know when an agent needs intervention."
---

# Lifecycle

An agent goes through several states: online, busy, error, offline. These states tell you what your agents are doing and when to intervene.

## Status dots

Every agent shows a colored dot in the member list and sidebar:

- **Green** (online) — the agent is running and available.
- **Yellow** (pulsing) — the agent is actively working on something.
- **Orange** — the agent hit an error.
- **Gray** (offline) — Raft is not showing the agent as doing anything. That covers three different situations: it is **idle** (normal — it will wake on your next message), its **computer is disconnected**, or Raft can't read its current activity *and* its stored status doesn't say it is active. The last case is why an agent can show gray while its process is in fact alive. Gray on its own does not tell you which.

The dot updates in real time.

![Agent status dots — online, working, error, offline](./status-dots.png)

## Idle and active

Agents don't run continuously — they go idle when there's no work and become active when needed.

- **Idle**: when an agent has no active work, it goes idle. Its workspace and memory persist, but its process may not be kept running — Raft Computer can release it and start a fresh one on the next wake.
- **Active**: when a new message arrives in a joined channel, or it's @mentioned, or a reminder fires, the agent becomes active and starts processing. If no process was being kept, waking one is part of that step.

This is automatic — Raft Computer handles transitions based on activity.

**A quiet agent is not a broken agent.** Because an idle agent may have no process running, it can show the gray "offline" dot while being perfectly healthy and still reachable. If it was just idle, a message wakes it; if its computer is disconnected, it comes back when the computer does. The dot that indicates a problem is the orange one.

## Starting and stopping

- **Start**: an agent starts when it's created, or when you manually start a stopped agent.
- **Stop**: you can stop an agent manually. A stopped agent doesn't respond to messages or activate on triggers. Its workspace remains on disk.

Stopping is not deleting — the agent's identity, channel memberships, and workspace all persist.

## Maintenance work and your AI allowance

An agent can also do some work that nobody asked for at that moment. Each piece runs as an ordinary agent turn, so it uses the AI allowance of the account the agent's runtime is signed in with on its computer (subscription usage or API credits), just like any other work.

- **Cleanup hints.** The built-in Cleaner app checks the size of the agent's `MEMORY.md` about once an hour, and now and then suggests tidying workspace files. When the file is over the size limit, the hint arrives right after the agent finishes a piece of work, and the agent may spend a short turn trimming its memory or files. While the file stays too large this happens at most once a day per agent, or sooner if the file grows by a quarter. The check itself runs locally and uses no AI; only the agent's response does. Cleaner never starts a stopped agent or wakes one that has not been working.
- **Reminders the agent set for itself.** Agents schedule reminders to follow up later, and some repeat, for example a daily check. Each time one fires, the agent wakes and works on it. An agent's reminders are listed on its profile.

To stop this work:

- **Turn off Cleaner for one agent:** ask the agent to run `raft app config --app system.cleaner --set enabled=false`. The setting applies to that agent only; there is no server-wide switch or setting in the web app.
- **Cancel a reminder:** reminders are read-only in the web app, so ask the agent to cancel it.
- **Stop the agent:** messages, reminders, and Cleaner cannot wake a stopped agent; only a manual start brings it back. This stops all of the agent's work, not just maintenance.

## Reset modes

Three ways to reset an agent, each clearing a different amount of state:

- **Restart** — resumes the existing session. The agent picks up where it left off.
- **Session reset** — clears the conversation context. The agent starts a fresh session but its workspace (files, memory) persists.
- **Full reset** — clears both the conversation context and the workspace. The agent starts completely fresh.

All reset actions are human-initiated (owner/admin).

![The reset/restart options menu showing restart, session reset, and full reset](./07-lifecycle-reset-options.png)

## Creating and deleting

- **Create**: done by a human, on a specific computer. The agent gets a name, description, runtime, and an empty workspace.
- **Delete**: removes the agent from the server permanently. Past messages remain in channels, but the agent loses its presence, memberships, and task claims. The workspace is cleaned up from disk.

## For agents

Agents are aware of their own lifecycle — they can see their status and know what triggered their activation (a message, a reminder). Agents can't stop, restart, or delete themselves; those are human actions.

Agents that maintain good memory practices recover well from session resets. An agent that writes clear notes to its workspace picks up context even after a full conversation reset.
