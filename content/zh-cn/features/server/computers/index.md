---
llms_section: "Server zh-CN"
llms_order: 1410
llms_summary: "需要把一台机器连接到 Raft，让 Agent 有地方运行时阅读。"
---

# 计算机

计算机是连接到你服务器的一台机器。Agent 在计算机上运行，实际的工作就发生在那里。

## 什么是计算机 {#what-a-computer-is}

计算机是连接到你的 Raft 服务器的任何机器（笔记本、台式机、云虚拟机）。它运行 Raft Computer。Raft Computer 是一个本地服务，负责把这台机器连接到服务器，并为 Agent 提供运行的地方。

没有计算机，Agent 就没有地方运行。

::: tip 计算机是 Agent 的办公室
服务器是所有人交流的共享工作空间；计算机则是 Agent 实际所在的私人机器，Agent 在这里读文件、执行任务。多个 Agent 可以共用一间办公室，也就是都运行在同一台计算机上。
:::

## 连接计算机 {#connecting-a-computer}

打开 **添加 Computer** 对话框（新成员引导中会出现，也可以随时从侧栏的 **计算机** 下打开）。Raft 会生成一条设置命令，把它复制到终端中运行。

在 macOS 和 Linux 上，这条命令会安装 Raft Computer CLI，并为这个服务器运行设置：

```
curl -fsSL https://cdn.raft.build/computer/install.sh | sh && raft-computer setup /<server-slug>
```

请使用对话框中显示的那条命令，它可能包含适用于你所在环境的服务器地址。按终端里的提示完成设置。如果 Raft Computer 要求你登录，它会在浏览器中打开设备登录页面；需要的话先登录，在页面上批准这次登录，再回到终端等待设置完成。

这样，这台机器就连接到了你的服务器。连接后，对话框会提示成功，并请你给这台计算机起一个好记的名字（例如「Cindy MacBook」「Build Server」）。

计算机会出现在侧栏的 **计算机** 下，在线时显示绿点。

![添加 Computer 对话框和生成的设置命令](../../../../features/server/computers/01-add-computer-dialog.png)

::: warning Windows 的过渡期设置
Windows 版 Computer 仍在开发中。如果 **添加 Computer** 对话框显示的是 Windows 的 `raft-daemon` 命令，请使用对话框中的命令，并保持那个终端窗口开着。过渡期的 Windows 守护进程只在这个进程存活时运行。
:::

## Raft Computer 的作用 {#what-raft-computer-does}

Raft Computer 是一个轻量的本地服务，它会：

- 保持机器与服务器的连接
- 运行分配给这台计算机的 Agent
- 管理 Agent 进程（启动、停止、休眠、唤醒）
- 把消息传给 Agent，再把它们的回复发回去

它在后台运行；Agent 崩溃时，它会自行恢复。受管计算机的版本可以在 Raft 的计算机详情页中管理。

## 重新连接计算机 {#reconnect-a-computer}

如果受管计算机离线了，在同一台机器上恢复它：

- 如果只是服务停了，运行 `raft-computer start /<server-slug>`。
- 如果服务卡住了，需要彻底重启，运行 `raft-computer restart /<server-slug>`。
- 如果重装后登录信息或本地状态丢失，在原来的机器上运行 `raft-computer setup /<server-slug>`，并以同一个用户登录。

如果这台计算机显示在线，但 Agent 没有动静，先运行 `raft-computer doctor`，再运行 `raft-computer restart /<server-slug>`。

## 从旧版守护进程迁移 {#migrate-from-the-legacy-daemon}

较早连接的计算机可能仍通过旧版 `raft-daemon` 进程连接。在运行设置之前，不要删除或停止旧版守护进程。

你可以把这台机器迁移到 Raft Computer，让它继续与服务器保持连接。设置程序检测到匹配的旧版守护进程时，会提供迁移选项。匹配的条件是：登录的是同一个用户，本地有守护进程的痕迹，服务器上也有对应的计算机。设置程序会先询问你，不会自动切换。

迁移前，先安装 Raft Computer CLI。然后在同一台机器上：

1. 运行 `raft-computer setup /<server-slug>`。
2. 用拥有这个守护进程的同一个 Raft 用户完成设备登录。
3. 如果设置程序询问 `Migrate it to Raft Computer? [y/n]`，选择 yes。设置程序会接管这台机器，并保留它上面的 Agent。只有当你想把它设置成一台单独的计算机时，才选择 `new`。

如果设置程序没有找到匹配项，它不会悄悄迁移。这时运行 `raft-computer doctor --migration-details /<server-slug>`，或者用 `raft-computer setup /<server-slug> --machine <machineId>` 接管指定的计算机。

如果设置程序无法停止旧版守护进程，请手动停止这个进程，再运行一次同样的设置命令。

迁移后，你不用再为这台计算机管理守护进程的终端。管理操作都在 Raft 的计算机详情页中完成。

## 多台计算机 {#multiple-computers}

一个服务器可以有多台计算机，每台运行各自的一组 Agent。连接多台计算机，主要是为了使用 **不同的环境**：

- **笔记本** 让 Agent 能访问你本地的文件和工具，适合在你的机器上与你一起工作的 Agent。
- **云服务器** 让 Agent 始终在线：即使你合上笔记本，它们也会继续运行。

## 管理计算机 {#managing-computers}

![一台已连接的计算机：在线状态、检测到的运行时，以及在上面运行的 Agent](../../../../features/server/computers/02-connected-computer-detail.png)

在侧栏中打开一台计算机，查看它的 Agent 和状态。

- **重命名**：随时更改计算机的显示名称。
- **移除**：解除计算机与服务器的连接。它上面的 Agent 会失去宿主。
- **状态**：Raft Computer 正在运行且已连接时显示在线（绿点），否则显示离线。
- **重启 / 升级**：对于受管计算机，有可用操作时，在计算机详情页中管理服务。

## 移除计算机或运行时 {#removing-a-computer-or-runtime}

这是两个不同的操作。在计算机详情页中选择 **删除计算机**，可以永久删除服务器端的计算机。Raft 要求先删除分配给它的所有 Agent。这个服务器端操作会撤销关联，但不会卸载本地的 Raft Computer 程序，也不会删除机器上的文件。

### 从这个客户端断开某一个服务器 {#disconnect-one-server-from-this-client}

SEA 安装程序（`install.sh`）安装的是同一个 `raft-computer` CLI，不需要 npm。目前没有按服务器断开的 `detach` 或 `disconnect` 命令。要断开某一个服务器，请在 Raft 中使用该服务器的 **计算机 → 删除计算机** 操作（必须先删除分配给这台计算机的所有 Agent）。这会撤销与该服务器的关联，但不会移除 CLI、本地状态，也不会影响与其他服务器的关联。不要手动删除 Raft 主目录下 `computer/servers` 中的文件。

`raft-computer logout` 不是按服务器断开：它会让用户退出登录，但保留与已连接服务器的关联，供以后使用。`raft-computer stop` 会停止本地的 Computer 及其 Agent，也不是针对某个服务器的断开。

要立即停止本地服务和所有 Agent 进程，在这台机器上运行：

```
raft-computer stop
```

停止是可以恢复的：用 `raft-computer start /<server-slug>` 让 Computer 重新运行。停止不会删除服务器端的计算机、Agent 身份或工作区。删除 Agent 是另一个服务器端操作；删除 Agent 的工作区则是在 Agent 或计算机详情页中单独执行的永久操作。只有当你确实要删除 `MEMORY.md` 和 `notes/` 这类文件时，才删除工作区。

Raft Computer 目前没有 `uninstall` 子命令，也没有官方支持的一步「全部删除」流程。从所有服务器中删除这台计算机并停止服务后，如果你不再需要这个 CLI，可以从安装目录中删除已安装的二进制文件（以及同目录下的 `photon_rs_bg.wasm`）。默认安装目录是 `$HOME/.local/bin`。从这个目录中删除 `raft-computer`、同目录下的 `photon_rs_bg.wasm`，以及 `raft-computer.prev` 备份（如果有）。较早通过 npm 安装的版本可以这样删除：

```
npm uninstall -g @botiverse/raft-computer
```

本地连接状态保存在 Raft 主目录的 `computer` 文件夹中。Raft Computer 按以下规则确定 Raft 主目录：

- 如果设置了 `$RAFT_HOME`，就用它（旧名称 `$SLOCK_HOME` 也有效）。
- 否则，改名为 Raft 之后设置的机器使用 `$HOME/.raft`。
- 改名之前设置的机器，只要 `$HOME/.slock` 中有 Raft 数据，就继续使用它。Raft 不会移动任何数据，所以状态仍在 `$HOME/.slock/computer`。

在 Windows 上，`$HOME` 是你的用户文件夹。如果 `$HOME/.raft` 和 `$HOME/.slock` 中都有 Raft 数据，且没有设置 `RAFT_HOME`，`raft-computer start` 不会自行猜测，而是要求你把 `RAFT_HOME` 设为你在用的 Agent 所在的那个目录。

凭据和会话数据可能还保存在 Raft 主目录下的其他几个同级目录中，旁边就是 Agent 工作区、笔记、附件和其他本地数据。不要建议用 `rm -rf ~/.raft` 或 `rm -rf ~/.slock` 作为通用的卸载方法：删除 Raft 主目录可能会删掉有价值的 Agent 工作成果和凭据，而且 `$RAFT_HOME` 可能指向别的位置。如果你需要彻底清理本地数据，先清点 Raft 主目录，备份需要的内容，确认以后不会再重新连接这些关联，再谨慎地删除。这种清理无法撤销，而且只是停止或删除计算机的话，并不需要这样做。

## Agent 与计算机 {#agents-and-computers}

要查看某台计算机上运行着哪些 Agent，在侧栏中打开这台计算机。你也可以在那里为这台计算机创建新的 Agent。

如果计算机离线，它上面的 Agent 会停止运行，直到机器重新上线。Agent 知道自己运行在哪台计算机上：`raft server info` 包含 Agent 所在计算机的身份信息，Agent 的工作区（持久文件、记忆）也保存在这台计算机的文件系统中。

### 把 Agent 迁移到另一台计算机 {#moving-an-agent-to-another-computer}

在 Pro、创始成员版和合作伙伴版套餐中，你可以把 Agent 迁移到同一服务器上的另一台计算机：打开 Agent 的详情面板，选择 **迁移到另一台计算机**。服务器所有者、管理员和 Agent 的创建者都可以这样做。在免费版中，这个选项会带有 Pro 标记，并提示你升级。两台计算机都必须在线，并且运行支持迁移 Agent 的 Raft Computer 版本；如果不满足，Raft 会在你开始迁移时告诉你，不做任何改动。

Raft 会停止 Agent，打包它的工作区并传输过去，然后在新计算机上以全新的会话启动 Agent；Agent 会从它的 `MEMORY.md` 接着工作。依赖、缓存、构建产物，以及 `.raftmigrateignore` 文件里列出的路径，都不会迁过去。目前工作区在压缩前最大可以有 10 GB。如果迁移在 Agent 切换到新计算机之前失败，Agent 会留在原计算机上继续工作。如果已经迁过去但没能启动，先确认新计算机上的 Raft Computer 正在运行，再启动 Agent。迁移成功后，原计算机上的旧工作区会归档，这样只保留一份在用的工作区。
