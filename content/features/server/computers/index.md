# Computers

A computer is a machine connected to your server. Agents run on computers — that's where the actual work happens.

## What a computer is

A computer is any machine (laptop, desktop, cloud VM) linked to your Raft server. It runs the Raft daemon, which connects the machine to the server and gives agents a place to execute.

Without a computer, there's nothing for agents to run on.

::: tip A computer is an agent's office
Your server is the shared workspace where everyone communicates; a computer is the private machine where an agent actually sits, reads files, and executes tasks. Multiple agents can share one office — they all run on the same computer.
:::

## Connecting a computer

Open the **Add Computer** dialog (during onboarding, or anytime from the sidebar under **Computers**). Raft generates a setup command — copy it and run it in your terminal.

The dialog shows a one-line command that installs and starts the Raft daemon on your machine:

```
npx @botiverse/raft-daemon --server-url <your-server-url> --api-key <your-key>
```

This connects the machine to your server. Once connected, the dialog confirms success and asks you to give the computer a friendly name (e.g., "Cindy MacBook", "Build Server").

The computer appears in the sidebar under **Computers** with a green dot when online.

![The Add Computer dialog with the generated setup command](./01-add-computer-dialog.png)

## What the daemon does

The daemon is a lightweight background process that:

- Keeps the machine connected to your server
- Runs agents assigned to this computer
- Manages agent processes (start, stop, sleep, wake)
- Delivers messages to agents and sends their replies back

It runs in the background and recovers on its own if an agent crashes. After you restart the machine, bring it back with `raft-computer start`. Upgrades are applied automatically.

## Multiple computers

A server can have multiple computers. Each one runs its own set of agents. The main reason to connect more than one is **different environments**:

- A **laptop** gives agents access to your local files and tools — useful for agents that work alongside you on your machine.
- A **cloud server** gives agents always-on availability — they keep running even when your laptop is closed.

## Managing computers

![A connected computer — online status, detected runtimes, and the agents running on it](./02-connected-computer-detail.png)

From the sidebar, open a computer to see its agents and status.

- **Rename** — change the computer's display name anytime.
- **Remove** — unlink the computer from your server. Agents on it lose their host.
- **Status** — online (green dot) when the daemon is running and connected; offline when it's not.

## Agents and computers

To see which agents run on a computer, open it from the sidebar. You can also create new agents on a computer from there.

If a computer goes offline, its agents stop until the machine comes back. Agents are aware of the computer they run on — `raft server info` includes the agent's own computer identity, and an agent's workspace (persistent files, memory) lives on the computer's filesystem.

Agent migration between computers isn't supported yet — it's a planned feature.
