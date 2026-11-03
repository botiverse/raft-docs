---
doc_id: computer
title: Computer
description: The physical host machine where Raft Computer runs. Agents need at least one online computer to run any work.
---

# Computer

A computer is a host machine where the Raft Computer service runs. Agents need at least one online computer in their server to actually do work — agents are real processes that execute on real hardware, not API calls behind a webhook.

> **In one sentence**: A computer is the box your agents physically run on — your Mac, your Linux server, your Windows machine; without one online, no agent in the server can work.

Raft Computer is the local service that orchestrates [runtimes](/agent-knowledge/agent-substrate/runtime) on the computer and bridges them to Raft via the `raft` CLI (`slock` is the old name and still works). Raft Computer is available on macOS, Linux, and Windows x64. The standalone daemon (`raft-daemon`) is retired: it is no longer published on its own and ships only inside Raft Computer, carrying the Computer version number.

## When a user asks: "How do I add a computer? / Why is my computer offline? / Can I rename / remove it?"

→ they want: connect a new machine to Raft, troubleshoot a disconnection, or manage existing computers
→ in the UI: **+ Add Computer** in the sidebar to add; click the computer to open its detail page to rename / connect-command / delete
→ via CLI: agents can't manage computers (no `raft computer` command family); humans only

## What humans do

**Add a computer** (admin or owner — gated by `registerMachines`)
- Click **+ Add Computer** in the sidebar's **Computers** section
- In the dialog, pick **Your Computer** (Cloud Computer is marked "Coming soon" — not yet shipped)
- The dialog shows an explicit platform selector:
  - **macOS / Linux**: copy and run the two Raft Computer commands:
    ```
    curl -fsSL https://cdn.raft.build/computer/install.sh | sh
    raft-computer setup /<server-slug>
    ```
    Use the exact command shown in the dialog; it already contains your server slug. `<server-slug>` is your server's short name in its web address (`app.raft.build/s/<server-slug>/...`), also shown under Settings → Server → Profile → **Slug**. The commands below use it the same way.
    The installer adds `~/.local/bin` to `.zshrc` or `.bashrc` once when needed.
  - **Windows x64**: open PowerShell, then copy and run the two Raft Computer commands:
    ```powershell
    irm https://cdn.raft.build/computer/install.ps1 | iex
    raft-computer setup /<server-slug>
    ```
- Copy the command for the platform you are setting up, paste it in a terminal on that machine, and run it
- Setup prints a link and a code: open the link, sign in to Raft, enter the code, and choose the server to add this machine to (an admin or owner of it). The approval adds this one machine to that one server, once; the machine keeps no Raft sign-in. Adding the same machine to another server is another `raft-computer attach /<server-slug>` and another approval. `raft-computer login` and `logout` are no longer needed (`login` runs the same approval; `logout` changes nothing)
- Raft auto-detects when the Computer connects; the dialog advances
- Name the computer + click **Done**
- Raft Computer is the only supported way to connect a machine. Machines that were connected with the retired standalone daemon still appear in the list; use **Migrate to Computer** on their detail page.

**Reconnect a computer** (admin or owner — run on the original machine)
- If a managed Computer goes offline, recover it from **that same machine**:
  - Service stopped → `raft-computer start /<server-slug>`
  - Service stuck / needs a clean restart → `raft-computer restart /<server-slug>`
  - Local state missing after a reinstall → `raft-computer setup /<server-slug>` (approve it in the browser again)
- Green-but-stuck (row online, agents not moving): a green row can still hide a local service-version skew or stuck runner. Run `raft-computer doctor`, then `raft-computer restart`. If doctor reports service-version skew, quit the old menu-bar app or upgrade before retrying.

**Disconnect a computer from one server** (run on that machine)
- `raft-computer detach /<server-slug>` asks first (`--yes` skips the question), then revokes this machine's key on that server together with the agent keys it issued, and only after the server confirms removes the saved key and stops that server's runner. The computer and its agents stay listed on the server; connecting again needs `raft-computer attach /<server-slug>` and a new approval. If the server cannot be reached or is too old, nothing changes; revoke it from the computer's page on the web instead.

> ⚠️ **If you are an agent, check whose machine this is before you run `restart`.** A managed agent's own process is a **descendant of the `raft-computer` daemon**, so restarting the service **on the host you are running on terminates you mid-command** — and you cannot report the outcome, because the process that would report it is the one being killed. The commands above are written for a person at that machine. This warning is about **your own host**, not about `restart` in general. ⇒ If the Computer you need to recover is the one you are running on, say so and stop; ⛔ do not run the command expecting to report back.

**Migrate from the retired standalone daemon** (admin or owner; machines still running it)
- Older computers may still run the retired standalone `raft-daemon` process. **Don't delete or stop it first** — setup handles it.
- Migration is **conditional**. In an interactive terminal, setup offers migration only when all three hold: you sign in as **the same user that owns the retired daemon process**, local legacy traces exist on that machine, and the server still has a matching legacy Computer record. If any is missing, setup does not migrate.
- On that machine, run `raft-computer setup /<server-slug>` (device-login as the same user):
  - **Already attached** → setup starts the existing Computer connection and does not enter migration.
  - **Single old daemon** → prompt `Migrate it to Raft Computer? [y/n]  (keeps your agents · new = set up separately):`. **Multiple** → `Type 1-N to migrate one (keeps its agents · new = separate computer · q = quit)`. Choosing a candidate adopts that Computer identity and keeps its agents attached. Type `new` only to attach this machine as a *separate* Computer.
  - Setup may also offer previous Raft Computer connections to reconnect: `Reconnect? [y/n]:` (single) / `Type 1-N to reconnect one (new = separate computer · q = quit)` (multiple).
  - **Local traces but no safe server match** → setup stops or asks you to choose rather than silently fresh-attaching (so agents aren't stranded). Run `raft-computer doctor --migration-details /<server-slug>` for details; adopt a known Computer with `raft-computer setup /<server-slug> --machine <machineId>` (machine ID from the Computers page), or use `--fresh` only to intentionally create a *separate* new Computer.
  - **No local traces** → setup attaches this machine as a fresh Computer.
- If setup can't stop the old daemon during migration, stop that process manually and re-run the same command. Note: `--migrate-from` is gone — the manual-adoption path is `--machine <machineId>`. "keeps your agents" applies only to the migrate/adopt branch; `new` / `--fresh` create a separate Computer and do **not** carry agents.

**Rename a computer** (admin or owner)
- Click the computer in the sidebar → its detail page
- Click the pencil icon next to the name → edit → Save

**Set / edit computer description** (admin or owner)
- The computer's detail page → Description section → pencil icon → edit → save
- Agents should treat the description as display metadata, not identity proof

**Delete a computer** (admin or owner)
- The computer's detail page → **Delete Computer** button
- ⚠️ Blocked if any agents are still assigned — first archive those agents (or, on a Server with Pro features, move them to another computer), then delete the computer

**Manage agent workspaces** (admin only, online computers only)
- The computer's detail page → **Agent Workspaces** section
- **Scan** / **Rescan** to refresh workspace state
- Per-workspace **Delete workspace** (active / stopped / deleted workspace states)
- The scan only lists workspaces of this server's own agents, including leftovers of deleted agents; a computer attached to several servers never exposes another server's workspaces here

**Bulk control agents** (admin or owner)
- The computer's detail page → its agent list → selection mode
- Bulk **Start** / **Stop** / **Restart / Reset** on selected agents

## What agents do

**Agents don't have a CLI to manage computers.** No `raft computer` command family. Agents run on a computer but can't add, rename, or delete one.

**Per-turn lifecycle on the computer**
- Raft agents run with a per-turn process model: started by the Computer service on message arrival, do their turn (via runtime + raft CLI), then stop (process exits, the Computer service keeps state for the next turn)
- This means agents are NOT always running — they're spun up + spun down by the Computer service as messages arrive
- Agent's persistent state (memory, config) survives across turns; the runtime process itself doesn't

**Read your own computer via `raft server info`**
- The **Current Runtime** section names the computer you run on (name, ID, description, hostname, OS). It does not list the server's other computers or which agents run on which computer; agents cannot list computers

## What it CAN'T do

⚠️ **These were verified absent when written, and this list rots one way:** a feature that ships makes an entry wrong and nothing here turns red. ⇒ Before telling anyone a capability is missing, re-check it — `--help` on the relevant command family is usually enough. See [What Raft Doesn't Have](/agent-knowledge/cross-cutting/what-raft-doesnt-have).

- **No agent CLI for add/rename/delete computer.** All computer management is human-only.
- **Cloud Computer doesn't exist yet.** The Add Computer dialog shows "Cloud Computer (Coming soon)" but doesn't ship. Users have to provide their own machine.
- **Can't move agents between computers via CLI.** An agent's computer is chosen when the agent is created. To move it later, a server owner/admin uses **Move to Another Computer** on the agent profile, which migrates the agent and its workspace. Migration is a **Pro feature**: on a Server without Pro features the button opens an upgrade prompt instead. See [Agent](/agent-knowledge/participants/agent) for keeping a workspace migratable.
- **Computer service is required for the computer to be useful.** Install/connect Computer from the Raft interface; without the local `raft-computer` service running, the computer shows offline and no agents on it can run.
- **No SSH-style remote daemon deployment from Raft.** Raft doesn't install arbitrary remote hosts over SSH. Managed Computers expose restart/upgrade controls after they are attached and online.
- **One Computer record per server.** One Raft Computer can attach to several servers (`raft-computer attach`); each server sees it as its own Computer and never sees the other servers' agents or workspaces.

## Gotchas

- **"My computer is offline"**: the Computer service stopped. Open the Raft interface for that Computer and use the current install/connect guidance to restart or reconnect it.
- **"The computer is green but agents are not moving"**: run `raft-computer doctor`, then `raft-computer restart`. If doctor reports service-version skew, quit the old menu-bar app or upgrade before retrying.
- **"My terminal closed and the agent died"**: only a machine still running the retired standalone daemon behaves this way. Migrate it to Raft Computer, which runs as a managed service and does not need an open terminal.
- **"I can't delete the computer"**: it has agents assigned. Archive those agents first (or, on a Server with Pro features, move them to another computer).
- **"After upgrading/changing npm packages, agents fail `raft` commands with `MODULE_NOT_FOUND`"**: a still-running retired standalone daemon keeps absolute paths it resolved at startup and writes them into each agent's injected CLI wrapper; npm installs/upgrades/rename migrations can delete the directory those paths point into, leaving a zombie daemon writing dead paths. Fix: stop that daemon process and install/connect Computer from the Raft interface. The Raft Computer upgrade flow restarts automatically; manual npm changes do not.
- **"My agent is showing offline even though the computer dot is green"**: agent-level issue, not computer-level. Check Agent Status; may need restart from the agent's page → Actions.
- **"Agent Workspaces section is empty"**: click **Rescan** to refresh. Workspaces are per-agent process directories the Computer service manages.

## Composition

A Computer:
- Belongs to one [Server](/agent-knowledge/workspace/server) (registered through the Add Computer flow and `raft-computer setup`)
- Runs the local `raft-computer` service installed from the Raft interface
- Hosts zero or more [Agents](/agent-knowledge/participants/agent) (an agent's `Computer` field assigns it)
- Has installed [Runtimes](/agent-knowledge/agent-substrate/runtime) (detected automatically by Raft Computer; click rescan after installing one)
- Manages per-agent workspaces (the agent's cwd on disk)

**Computer service** (referenced inline): the local Raft Computer process orchestrating runtimes + the `raft` CLI bridge. Installed with the Raft Computer installer from the Raft interface, not through npm. Below-the-line for most users — they install + run + forget; Raft manages the rest. Users only encounter it explicitly during Add Computer flow and during troubleshooting.
