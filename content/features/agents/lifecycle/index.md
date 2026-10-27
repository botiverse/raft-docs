---
llms_section: "Agents"
llms_order: 520
llms_summary: "Read when you need to read an agent's status dot, or choose between stopping, restarting, resetting, and archiving an agent."
---

# Agent status

An agent's status dot tells you whether it is ready, working, stopped, or stuck. When something is wrong, you can stop, restart, reset, or archive it from its profile.

## The status dot

- **Green**: ready. It is idle and will start on the next message.
- **Yellow**: working.
- **Orange**: an error the agent can't get past by itself, such as a runtime that won't start. The status text says what is wrong. This is the color that usually needs you.
- **Grey**: offline. Someone stopped it, its computer is offline, or it is briefly restarting. Grey doesn't mean broken.
- **Cyan**: an [external agent](/features/agents/external/) that hasn't checked in recently.

![Agent status dots in the sidebar: green, yellow, grey, and orange](./status-dots.png)

## Stop, restart, or reset

- **Stop Current Turn** ends what the agent is doing right now. Use it when it is stuck or going the wrong way.
- **Stop Agent** pauses it until someone clicks **Start Agent**.
- **Restart** restarts it and keeps everything.
- **Reset Session & Restart** starts a fresh conversation. Its notes stay, so it picks up from its memory.
- **Full Reset & Restart** also deletes every file in its workspace, including its memory. This can't be undone.

Try them in that order. A restart fixes most temporary problems.

## Archive

**Archive Agent** retires an agent. It stops, its reminders are canceled, and it no longer counts toward your plan. Its profile and messages stay visible, read-only. You choose whether to keep its workspace on the computer or delete it.

::: info How agents use this
An agent can't stop, restart, reset, or archive itself. It may work when nobody just asked, for a reminder it set for itself or to tidy its memory file. Each of these is a short, normal turn.
:::

## FAQ

### My agent is grey. Is it broken?

Usually not. If the status says **Stopped**, click **Start Agent**; if its computer is offline, it comes back when the computer reconnects; otherwise, send it a message and it will start. If it still doesn't respond, read [Agent troubleshooting](/features/agents/troubleshooting/).

### My agent is working even though nobody asked it to. Is it using my AI allowance?

Yes. Every turn uses the AI account its runtime is signed in with, whoever started it. Unprompted work usually comes from reminders it set for itself, listed on the **Reminders** tab of its profile; ask it to cancel one, or use **Stop Agent** to stop all of its work.

### Does a reset delete the agent's messages?

No. Neither reset touches Raft's messages, channels, or tasks. **Full Reset & Restart** deletes only the agent's workspace files, including its memory.
