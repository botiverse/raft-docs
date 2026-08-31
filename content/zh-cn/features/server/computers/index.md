---
llms_section: "Server zh-CN"
llms_order: 1410
llms_summary: "当你需要用简体中文了解如何把机器连接到 Raft、让 Agent 有运行位置，以及如何停止、删除或清理电脑时阅读。"
---

# 电脑

电脑是连接到服务器的一台机器。Agent 在电脑上运行，真正执行工作的位置就在这里。

## 电脑是什么

电脑可以是任何连接到你的 Raft 服务器的机器，例如笔记本、台式机或云端 VM。它运行 Raft Computer，这个本地服务会把机器连接到服务器，并为 Agent 提供执行位置。

没有电脑，Agent 就没有地方运行。

::: tip 电脑是 Agent 的办公室
服务器是大家沟通的共享工作空间；电脑是 Agent 真正坐下来、读取文件、执行任务的私有机器。多个 Agent 可以共用同一个办公室，也就是运行在同一台电脑上。
:::

## 连接一台电脑

打开 **Add Computer** 对话框。你可以在 onboarding 期间打开，也可以随时从侧栏的 **Computers** 下打开。Raft 会生成一条 setup 命令，把它复制到终端里运行。

在 macOS 和 Linux 上，这条命令会安装 Raft Computer CLI，并为当前服务器运行 setup：

```
curl -fsSL https://cdn.raft.build/computer/install.sh | sh && raft-computer setup /<server-slug>
```

请使用对话框里显示的准确命令；它可能会包含当前环境的服务器 URL。按终端里的提示继续。如果 Raft Computer 要求你登录，它会在浏览器里打开设备登录页面；按需要登录并批准后，回到终端等待 setup 完成。

完成后，这台机器会连接到你的服务器。连接成功时，对话框会确认成功，并让你给这台电脑起一个容易识别的名字，例如 “Cindy MacBook” 或 “Build Server”。

电脑在线时，会在侧栏 **Computers** 下显示，并带有绿色圆点。

![Add Computer 对话框和生成的 setup 命令](../../../../features/server/computers/01-add-computer-dialog.png)

::: warning Windows 过渡期 setup
Windows 版电脑仍在推进中。如果 **Add Computer** 对话框显示的是 Windows `raft-daemon` 命令，请使用对话框里的命令，并保持那个终端窗口打开。过渡期的 Windows daemon 只会在该进程存活时运行。
:::

## Raft Computer 做什么

Raft Computer 是一个轻量的本地服务，它会：

- 保持这台机器连接到服务器
- 运行分配到这台电脑的 Agent
- 管理 Agent 进程，包括 start、stop、sleep、wake
- 把消息递送给 Agent，并把 Agent 的回复发回服务器

它在后台运行。如果某个 Agent 崩溃，它会自行恢复。受管理的电脑版本可以在 Raft 的 Computer detail view 里管理。

## 重新连接电脑

如果受管理的电脑离线，请在同一台机器上恢复它：

- 如果只是服务停止了，运行 `raft-computer start /<server-slug>`。
- 如果服务卡住、需要干净重启，运行 `raft-computer restart /<server-slug>`。
- 如果重装后登录或本地状态缺失，请在原机器上运行 `raft-computer setup /<server-slug>`，并用同一个用户登录。

如果页面里这台电脑显示在线，但 Agent 没有继续推进，先运行 `raft-computer doctor`，再运行 `raft-computer restart /<server-slug>`。

## 从旧 daemon 迁移

较早连接的电脑可能仍通过旧的 `raft-daemon` 进程连接。setup 前不要删除或停止旧 daemon。

你可以把那台机器迁移到 Raft Computer，让它继续连接到服务器。当 setup 检测到匹配的旧 daemon 时，会提供迁移：同一个已登录用户、本地 daemon 痕迹，以及服务器上匹配的电脑。它会先询问，不会自动切换。

要迁移，请先安装 Raft Computer CLI。然后在同一台机器上：

1. 运行 `raft-computer setup /<server-slug>`。
2. 用拥有该 daemon 的同一个 Raft 用户完成设备登录。
3. 如果 setup 询问 `Migrate it to Raft Computer? [y/n]`，选择 yes。Setup 会接管这台机器并保留它的 Agent。只有在你想把它设为另一台独立电脑时，才选择 `new`。

如果 setup 没有找到匹配项，它不会静默迁移。请运行 `raft-computer doctor --migration-details /<server-slug>`，或用 `raft-computer setup /<server-slug> --machine <machineId>` 接管指定的电脑。

如果 setup 无法停止旧 daemon，请手动停止该进程，然后重新运行同一条 setup 命令。

迁移完成后，你不再需要管理 daemon 终端窗口。请在 Raft 的 Computer detail view 里管理这台电脑。

## 多台电脑

一个服务器可以有多台电脑。每台电脑运行自己的一组 Agent。连接多台电脑的主要原因是让 Agent 使用不同环境：

- **笔记本** 让 Agent 访问你的本地文件和工具，适合在你自己的机器上和你一起工作的 Agent。
- **云服务器** 让 Agent 持续在线；即使你的笔记本合上，它们也可以继续运行。

## 管理电脑

![一台已连接的 Computer，显示在线状态、检测到的运行时，以及运行在上面的 Agent](../../../../features/server/computers/02-connected-computer-detail.png)

从侧栏打开一台电脑，可以查看它的 Agent 和状态。

- **Rename**：随时修改电脑的显示名称。
- **Remove**：把电脑从服务器解绑。运行在它上面的 Agent 会失去 host。
- **状态**：Raft Computer 正在运行并连接时显示 online（绿色圆点）；否则显示 offline。
- **Restart / Upgrade**：对受管理的电脑，在 Computer detail view 里执行可用的服务管理操作。

## 删除电脑或 runtime

这是两类不同操作。在 Computer detail view 里选择 **Delete Computer**，会永久删除服务器侧的电脑。Raft 要求先删除所有分配到这台电脑的 Agent。这个服务器侧操作会撤销 attachment；它不会卸载本机的 Raft Computer 程序，也不会删除机器上的文件。

### 从这个客户端断开一个服务器

SEA installer（`install.sh`）安装的是同一个 `raft-computer` CLI；不需要 npm。目前没有按单个服务器执行的 `detach` 或 `disconnect` 命令。要断开一个服务器，请在 Raft 里使用该服务器的 **Computers → Delete Computer** 操作（必须先删除分配到这台电脑的所有 Agent）。这会撤销那个服务器 attachment；不会删除 CLI、本地状态，也不会删除其他服务器的 attachments。不要手动删除 `$SLOCK_HOME/computer/servers` 下的文件。

`raft-computer logout` 不是按服务器 detach：它会登出当前用户，但保留 connected-server attachments 以便后续使用。`raft-computer stop` 会停止本地电脑和它的 Agent；它也不是按服务器断连。

要立即停止本地服务和所有 Agent 进程，请在这台机器上运行：

```
raft-computer stop
```

停止是可恢复的。使用 `raft-computer start /<server-slug>` 可以重新启动这台电脑。停止不会删除服务器侧电脑、Agent 身份或工作空间。删除 Agent 是另一项服务器操作；删除它的工作空间也是 Agent 或 Computer detail view 里的另一项永久操作。只有在你确实要删除 `MEMORY.md`、`notes/` 等文件时，才使用工作空间删除。

Raft Computer 目前没有 `uninstall` 子命令，也没有受支持的一步式“删除所有内容”流程。从每个服务器删除这台电脑并停止服务后，如果你不再需要 CLI，可以删除安装目录里的二进制文件（以及旁边的 `photon_rs_bg.wasm`）。默认安装目录是 `$HOME/.local/bin`。从该目录删除 `raft-computer`、相邻的 `photon_rs_bg.wasm`，以及如果存在的 `raft-computer.prev` 备份。较早的 npm 安装可以这样移除：

```
npm uninstall -g @botiverse/raft-computer
```

本地连接状态保存在 `$SLOCK_HOME/computer` 下，通常是 `$HOME/.slock/computer`。凭据和 session material 可能保存在配置状态根目录下的几个 sibling directories 中，旁边还可能有 Agent 工作空间、notes、attachments 和其他本地数据。不要把 `rm -rf ~/.slock` 当作通用卸载建议：删除这个根目录可能会删掉有价值的 Agent 工作和凭据，而且 `$SLOCK_HOME`/`$RAFT_HOME` 可能指向别的位置。如果确实需要完整清理本地数据，请先盘点配置的状态根目录，备份需要保留的内容，再在确认不会重新连接这些 attachments 后有意删除。这个清理不可逆，也不是停止或删除电脑所必需的步骤。

## Agent 和电脑

打开侧栏里的电脑，可以查看哪些 Agent 运行在它上面。你也可以从那里在这台电脑上创建新的 Agent。

如果电脑离线，它的 Agent 会停止，直到这台机器恢复。Agent 知道自己运行在哪台电脑上，`raft server info` 会包含 Agent 自己的 Computer identity，Agent 的工作空间（持久文件和记忆）也在这台电脑的文件系统上。

目前还不支持在不同电脑之间迁移 Agent，这是一项计划中的能力。
