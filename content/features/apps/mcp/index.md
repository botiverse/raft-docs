---
llms_section: "Apps"
llms_order: 820
llms_summary: "Read when your agents should use a remote MCP server's tools (Notion, Linear, your own): adding an MCP App, connections, agent access, and the authorize card."
---

# MCP Apps

An MCP App gives your agents the tools of a remote [MCP](https://modelcontextprotocol.io) server, such as Notion or Linear. An owner or admin adds it once, and agents then use its tools like any other.

## The App and its connections

- **The App** is the MCP server, added under **Settings → Applications** with **Register App**. Choose Notion or Linear from **Recommended by Raft**, or paste the public `https` address of any remote MCP server that uses Streamable HTTP.
- **A connection** is the account or API key the App calls the server with, for example "Team Notion". An App can have several.
- **The server default** is the connection agents use unless they're set to a specific one.

Raft makes the calls for your agents. Sign-ins and API keys stay with Raft; agents never see them.

## Agent access

Every agent gets access when the App is added. On an agent's **Apps** tab you can **Revoke** it, **Grant Access** again, or **Change connection**.

- **Whose connection.** An agent can use the server default, or a connection created by the person who created the agent. Nobody can point their agent at a teammate's sign-in.
- **No fallback.** If an agent's connection is signed out or deleted, its calls are refused until someone signs in again or picks another connection.

::: info How agents use this
If an agent calls an App it can't use yet, Raft posts an **Authorize MCP connection** card in that conversation for someone who manages the agent. The agent isn't told when the card closes, so ask it to try again.
:::

## FAQ

### Can an agent add an MCP App by itself?

No. An owner or admin adds the App once. After that, you can ask an agent to "connect our Linear", and an **Authorize MCP connection** card appears in the conversation.

### Do agents see our Notion or Linear password or API key?

No. Sign-ins and API keys stay with Raft, which calls the MCP server for your agents.

### I granted access on the card, but the agent didn't continue. Why?

The agent isn't told when the card closes. Ask it to try again.

### Can my agent use a connection a teammate signed in with?

Only if that connection is the server default. Otherwise an agent can use only connections created by the person who created it.

### Why does my agent get refused after I deleted a connection?

Agents pinned to a deleted connection don't fall back to the server default. On the agent's **Apps** tab, click **Change connection** and choose **Use the server default** or another connection.

### Can I use an MCP server on our private network?

No. The address must be public; Raft won't call addresses on a private network.

### Which agents get MCP tools?

Agents running on a computer and cloud agents. [External agents](/features/agents/external/) get them only if their credential includes the `mcp` scope.

### Are there limits on MCP servers and tools?

Yes. Raft won't add an MCP server with more than 200 tools. A tool result larger than 512 KB, or a call that takes longer than 20 seconds, gives the agent an error instead of a result.
