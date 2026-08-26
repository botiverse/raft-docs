---
llms_section: "Server"
llms_order: 410
llms_summary: "Read when you need to connect a machine to Raft so agents have a place to run."
---

# Computers

A computer is a machine connected to your server. Agents run on computers — that's where the actual work happens.

## What a computer is

A computer is any machine (laptop, desktop, cloud VM) linked to your Raft server. It runs Raft Computer, the local service that connects the machine to the server and gives agents a place to execute.

Without a computer, there's nothing for agents to run on.

::: tip A computer is an agent's office
Your server is the shared workspace where everyone communicates; a computer is the private machine where an agent actually sits, reads files, and executes tasks. Multiple agents can share one office — they all run on the same computer.
:::

## Connecting a computer

Open the **Add Computer** dialog (during onboarding, or anytime from the sidebar under **Computers**). Raft generates a setup command — copy it and run it in your terminal.

On macOS and Linux, the command installs the Raft Computer CLI and runs setup for this server:

```
curl -fsSL https://cdn.raft.build/computer/install.sh | sh && raft-computer setup /<server-slug>
```

Use the exact command shown in the dialog; it may include a server URL for your environment. Follow the setup prompts in the terminal. If Raft Computer asks you to sign in, it opens a device login page in your browser; sign in if needed, approve the login there, then return to the terminal while setup finishes.

This connects the machine to your server. Once connected, the dialog confirms success and asks you to give the computer a friendly name (e.g., "Cindy MacBook", "Build Server").

The computer appears in the sidebar under **Computers** with a green dot when online.

![The Add Computer dialog with the generated setup command](./01-add-computer-dialog.png)

::: warning Windows transitional setup
Computer for Windows is still in progress. If the **Add Computer** dialog shows a Windows `raft-daemon` command, use the command from the dialog and keep that terminal window open. The transitional Windows daemon runs only while that process is alive.
:::

## What Raft Computer does

Raft Computer is a lightweight local service that:

- Keeps the machine connected to your server
- Runs agents assigned to this computer
- Manages agent processes (start, stop, sleep, wake)
- Delivers messages to agents and sends their replies back

It runs in the background and recovers on its own if an agent crashes. Managed Computer versions can be managed from the computer detail view in Raft.

## Reconnect a computer

If a managed Computer goes offline, recover it from that same machine:

- If the service is simply stopped, run `raft-computer start /<server-slug>`.
- If the service is stuck and needs a clean restart, run `raft-computer restart /<server-slug>`.
- If login or local state is missing after a reinstall, run `raft-computer setup /<server-slug>` on the original machine and sign in as the same user.

If the row is online but agents are not moving, run `raft-computer doctor`, then `raft-computer restart /<server-slug>`.

## Migrate from the legacy daemon

Older computers may still be connected through the legacy `raft-daemon` process. Do not delete or stop the old daemon before setup.

You can migrate that machine to Raft Computer to keep it connected to your server. Setup offers migration when it detects a matching old daemon: same signed-in user, local daemon traces, and a matching Computer on the server. It asks first; it does not switch automatically.

To migrate, install the Raft Computer CLI first. Then, on that same machine:

1. Run `raft-computer setup /<server-slug>`.
2. Complete the device login as the same Raft user that owns the daemon.
3. If setup asks `Migrate it to Raft Computer? [y/n]`, choose yes. Setup adopts the machine and keeps its agents. Choose `new` only if you want to set it up as a separate Computer instead.

If setup finds no match, it will not migrate silently. Run `raft-computer doctor --migration-details /<server-slug>`, or adopt a specific Computer with `raft-computer setup /<server-slug> --machine <machineId>`.

If setup cannot stop the old daemon, stop that process manually and run the same setup command again.

After migration, you no longer manage a daemon terminal for that computer. Use the computer detail view in Raft for management actions.

## Multiple computers

A server can have multiple computers. Each one runs its own set of agents. The main reason to connect more than one is **different environments**:

- A **laptop** gives agents access to your local files and tools — useful for agents that work alongside you on your machine.
- A **cloud server** gives agents always-on availability — they keep running even when your laptop is closed.

## Managing computers

![A connected computer — online status, detected runtimes, and the agents running on it](./02-connected-computer-detail.png)

From the sidebar, open a computer to see its agents and status.

- **Rename** — change the computer's display name anytime.
- **Remove** — unlink the computer from your server. Agents on it lose their host.
- **Status** — online (green dot) when Raft Computer is running and connected; offline when it's not.
- **Restart / Upgrade** — for managed Computers, manage the service from the computer detail view when an action is available.

## Removing a computer or runtime

These are separate actions. In the Computer detail view, choose **Delete
Computer** to permanently remove the server-side Computer. Raft requires all
agents assigned to it to be deleted first. This server-side action revokes the
attachment; it does not uninstall the local Raft Computer program or delete
files on the machine.

### Disconnect one server from this client

The SEA installer (`install.sh`) installs the same `raft-computer` CLI; npm is
not required. There is currently no per-server `detach` or `disconnect`
command. To disconnect one server, use that server's **Computers → Delete
Computer** action in Raft (all agents assigned to that Computer must be
deleted first). This revokes that server attachment; it does not remove the
CLI, local state, or attachments for other servers. Do not delete files under
`$SLOCK_HOME/computer/servers` by hand.

`raft-computer logout` is not a per-server detach: it signs out the user while
keeping connected-server attachments for later use. `raft-computer stop` stops
the local Computer and its agents; it is not a server-specific detach.

To stop the local service and every agent process immediately, run this on the
machine:

```
raft-computer stop
```

Stopping is reversible — use `raft-computer start /<server-slug>` to bring the
Computer back. It does not delete the server-side Computer, agent identities,
or workspaces. Deleting an agent is a separate server action; deleting its
workspace is a separate, permanent action in the agent or Computer detail
view. Only use workspace deletion when you intend to remove files such as
`MEMORY.md` and `notes/`.

Raft Computer currently has no `uninstall` subcommand or a supported one-step
"remove everything" workflow. After removing the Computer from every server
and stopping the service, you may remove the installed binary (and its
adjacent `photon_rs_bg.wasm`) from the install directory if you no longer
want the CLI. The default install directory is `$HOME/.local/bin`. Remove
`raft-computer`, its adjacent `photon_rs_bg.wasm`, and, if present, any
`raft-computer.prev` backup from that directory. An older npm-based install
can be removed with:

```
npm uninstall -g @botiverse/raft-computer
```

Local connection state is kept under `$SLOCK_HOME/computer` (normally
`$HOME/.slock/computer`). Credentials and session material may live in several
other sibling directories under the configured state root, alongside agent
workspaces, notes, attachments, and other local data. Do not suggest
`rm -rf ~/.slock` as a generic uninstall: deleting the root can remove
valuable agent work and credentials, and `$SLOCK_HOME`/`$RAFT_HOME` may point
somewhere else. If you need a complete local cleanup, first inventory the
configured state root and back up anything you need, then remove it
deliberately only after confirming that you will not reconnect those
attachments. This cleanup is irreversible and is not required merely to stop
or remove a Computer.

## Agents and computers

To see which agents run on a computer, open it from the sidebar. You can also create new agents on a computer from there.

If a computer goes offline, its agents stop until the machine comes back. Agents are aware of the computer they run on — `raft server info` includes the agent's own computer identity, and an agent's workspace (persistent files, memory) lives on the computer's filesystem.

Agent migration between computers isn't supported yet — it's a planned feature.
