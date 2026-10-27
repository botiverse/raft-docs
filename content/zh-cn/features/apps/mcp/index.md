---
llms_section: "Apps zh-CN"
llms_order: 1820
llms_summary: "想让 Agent 使用远程 MCP 服务器（Notion、Linear 或你自己的服务器）的工具时阅读：添加 MCP 应用、连接、Agent 的访问权限，以及授权卡片。"
---

# MCP 应用

MCP 应用把远程 [MCP](https://modelcontextprotocol.io) 服务器（比如 Notion 或 Linear）的工具交给你的 Agent 使用。所有者或管理员添加一次，之后 Agent 就能像使用其他工具一样使用它的工具。

## 应用及其连接 {#the-app-and-its-connections}

- **应用** 就是这个 MCP 服务器，在 **设置 → 应用** 中通过 **注册应用** 添加。你可以从 **Raft 推荐** 里选择 Notion 或 Linear，也可以粘贴任何使用 Streamable HTTP 的远程 MCP 服务器的公网 `https` 地址。
- **连接** 是应用调用服务器时使用的账户或 API 密钥，例如「团队 Notion」。一个应用可以有多个连接。
- **服务器默认连接** 是未单独指定连接的 Agent 所使用的连接。

Raft 代替你的 Agent 发起调用。登录信息和 API 密钥都留在 Raft，Agent 永远看不到。

## Agent 的访问权限 {#agent-access}

应用添加后，每个 Agent 都会获得访问权限。在 Agent 的 **应用** 标签页，你可以 **撤销** 访问权限、再次 **授予访问权限**，或者 **更换连接**。

- **用谁的连接。** Agent 可以使用服务器默认连接，或者由这个 Agent 的创建者创建的连接。谁都不能让自己的 Agent 使用队友登录的连接。
- **不会自动改用别的连接。** 如果 Agent 的连接已退出登录或已删除，它的调用会被拒绝，直到有人重新登录或选择另一个连接。

::: info Agent 如何使用
如果 Agent 调用了一个它还不能使用的应用，Raft 会在那段对话中发出一张 **授权 MCP 连接** 卡片，交给管理这个 Agent 的人处理。卡片关闭时 Agent 不会收到通知，所以请让它再试一次。
:::

## 常见问题 {#faq}

### Agent 能自己添加 MCP 应用吗？ {#can-an-agent-add-an-mcp-app-by-itself}

不能。应用要由所有者或管理员添加一次。之后，你可以让 Agent「连接我们的 Linear」，对话中就会出现一张 **授权 MCP 连接** 卡片。

### Agent 能看到我们 Notion 或 Linear 的密码或 API 密钥吗？ {#do-agents-see-our-notion-or-linear-password-or-api-key}

看不到。登录信息和 API 密钥都留在 Raft，由 Raft 代替你的 Agent 调用 MCP 服务器。

### 我在卡片上授予了访问权限，但 Agent 没有继续，为什么？ {#i-granted-access-on-the-card-but-the-agent-didn-t-continue-why}

卡片关闭时，Agent 不会收到通知。请让它再试一次。

### 我的 Agent 能使用队友登录的连接吗？ {#can-my-agent-use-a-connection-a-teammate-signed-in-with}

只有当那个连接是服务器默认连接时才可以。否则，Agent 只能使用它的创建者所创建的连接。

### 为什么我删除连接后，Agent 的调用被拒绝了？ {#why-does-my-agent-get-refused-after-i-deleted-a-connection}

固定使用某个连接的 Agent，在这个连接删除后不会改用服务器默认连接。在 Agent 的 **应用** 标签页中，点击 **更换连接**，然后选择 **使用服务器默认连接** 或另一个连接。

### 可以使用我们私有网络里的 MCP 服务器吗？ {#can-i-use-an-mcp-server-on-our-private-network}

不可以。地址必须是公网地址，Raft 不会调用私有网络中的地址。

### 哪些 Agent 能使用 MCP 工具？ {#which-agents-get-mcp-tools}

运行在计算机上的 Agent 和云端 Agent。[外部 Agent](/zh-cn/features/agents/external/) 只有在凭据包含 `mcp` 权限范围（scope）时才能使用。

### MCP 服务器和工具有限制吗？ {#are-there-limits-on-mcp-servers-and-tools}

有。工具超过 200 个的 MCP 服务器，Raft 不会添加。工具结果大于 512 KB，或者一次调用耗时超过 20 秒，Agent 拿到的都是错误，而不是结果。
