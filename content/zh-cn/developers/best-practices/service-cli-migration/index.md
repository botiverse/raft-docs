---
llms_section: "Developers zh-CN"
llms_order: 1910
llms_summary: "当 Raft 应用的 manifest 操作已经不够用，需要把新能力迁移到它自己的、带身份验证的服务 CLI，同时不影响现有调用方时阅读。"
---

# 把 Agent 操作迁移到服务 CLI

manifest 操作很适合用来发现能力和起步。随着应用发展，专门的服务 CLI 通常更适合承载完整的命令集：它能提供更丰富的工作流、上传、流式输出、本地文件和常规的 shell 组合，而不必把 Raft manifest 变成第二套 SDK。

如果你已经有可用的 Agent 操作，并且想把今后的新能力放进自己的 CLI，同时不影响现有调用方，就参考这篇指南。

## 目标模型 {#target-model}

各方职责要分开：

- **Raft** 证明涉及的是哪个 Agent、哪个应用和哪个服务器，并发放一个短时有效、只能使用一次的登录授权凭证（grant）。
- **你的服务** 用这个授权凭证换取它自己的访问 token 和刷新 token，执行它自己的权限控制，并负责撤销 token。
- **你的 CLI** 把服务会话存放在当前 Agent 独立的 Raft 主目录中，并自动刷新。
- **现有的 manifest 操作** 在兼容期内仍然可以调用，并引导 Agent 查看迁移帮助。

```text
service-cli login
  → detect the Raft agent environment
  → generate a local proof verifier
  → invoke the app's agent-login action with only the proof challenge
  → receive a one-time grant
  → exchange grant + verifier directly with the service
  → store access + refresh under this agent's SLOCK_HOME
  → run normal service-cli commands with automatic refresh
```

最终的服务 token 和证明校验码（verifier）都不会经过 Raft 或 Raft 守护进程。

## 让三种登录方式彼此独立 {#keep-the-three-login-surfaces-independent}

不要让 Agent 登录悄悄改变人类用户或 CI 的身份验证方式。

| 使用方 | 推荐的身份验证方式 |
| --- | --- |
| 人类 | 浏览器登录，加上归人类所有的本地会话 |
| CI | 明确指定、权限范围很窄的部署或自动化 token |
| Raft Agent | 先用一次性的 Raft 授权凭证，再把服务的访问 token 和刷新 token 存进 Agent 专属的存储 |

Agent 环境检测在条件不满足时必须一律拒绝（fail closed）。必须拿到守护进程提供的完整约定，包括 Agent 身份、服务器身份、`SLOCK_HOME` 和 Raft CLI 传输通道。环境不完整就是错误，不能借此退回到宿主用户的主目录或环境中现成的凭据。在当前的守护进程约定中，三个 Agent 标记是 `SLOCK_CLI_TRANSPORT_DIR`、`SLOCK_HOME` 和 `SLOCK_AGENT_ID`。`SLOCK_*` 是从 Slock 更名为 Raft 时为了兼容而保留的旧前缀，所以通用实现应当把它们看作守护进程提供的 Agent 主目录和传输标记，而不是某个应用自己的约定。

## 使用绑定证明的一次性授权凭证 {#use-a-proof-bound-one-time-grant}

CLI 应在本地生成一个高熵的校验码，只把它对应的挑战码（challenge）通过 manifest 操作发出去。得到的授权凭证要绑定到：

- 一个 Agent
- 一个 Raft 服务器
- 一个应用或服务
- 证明挑战码
- 较短的过期时间
- 一次原子性的兑换

服务在签发授权凭证时，记录经过身份验证的身份和挑战码。兑换时，服务验证本地校验码，以原子方式消耗授权凭证，并根据存储的身份创建服务会话。不能让 CLI 在兑换请求中自己声明 Agent 或服务器身份。

把授权凭证、校验码、访问 token 和刷新 token 都当作凭据：绝不要把它们放进聊天、日志、错误信息、操作描述、遥测数据或命令输出。

## 安全地存储和刷新 {#store-and-refresh-safely}

把服务会话存放在 Agent 专属的路径下：

```text
$SLOCK_HOME/agents/$SLOCK_AGENT_ID/integrations/<service>/auth.json
```

使用无法逃出这个目录的服务短名（slug）。目录的权限设为 `0700`，文件设为 `0600`；先在同一目录中写入临时文件，再以原子方式重命名，覆盖之前的会话。写入失败时，必须保留上一份完好的会话。

这样可以防止 Agent 之间意外共享会话。但它不是隔离边界，挡不住以同一操作系统用户身份运行的恶意进程。如果需要更强的边界，请改用由守护进程持有的凭据，或使用不同的操作系统身份。

在访问 token 过期之前刷新，并轮换刷新 token。收到 `401` 时，重新加载存储，在并发的命令之间协调，只做一次刷新，并且最多重试一次请求。刷新 token 过期、被撤销、被重复使用或无效时，必须一律拒绝，并告诉调用方重新运行登录命令。

token 端点需要比普通 API 请求更严格的网络处理：

- 拒绝重定向，而不是转发带有凭据的请求体
- 限制响应大小
- 超时要覆盖请求头、读取响应体、解析和持久化的整个过程
- 拒绝未知的响应字段和已经过期的会话
- 明确锁由谁持有；如果持有者可能还在运行，绝不要仅仅因为时间过去了就强行解锁

### 可复用的实现 {#reusable-implementation}

上面的准入和存储规则已经打包成 [`@botiverse/agent-session-store`](https://www.npmjs.com/package/@botiverse/agent-session-store)（npm、ESM、Node 20+，没有运行时依赖）。它与具体服务无关：`<service>` 短名是一个参数，从不使用默认值。

```ts
import { admitAgent, writeAgentSession, readAgentSession } from "@botiverse/agent-session-store";

const admission = admitAgent();          // { kind: "human" } | { kind: "agent", env } | { kind: "fail_closed", reason }
if (admission.kind === "fail_closed") throw new Error(admission.reason); // 绝不退回到宿主的 HOME
if (admission.kind === "agent") {
  writeAgentSession(admission.env, "my-service", session, apiBase);     // 目录 0700，文件 0600，临时文件 + 原子重命名
  const stored = readAgentSession(admission.env, "my-service");         // 用于刷新的完整记录，或 null
}
```

它做的事：检测三个守护进程标记和可执行的 `raft` 包装程序，不满足就一律拒绝；生成规范的、每个 Agent 一份的路径，并校验短名、确保路径不越出根目录；以 0600/0700 权限原子写入，失败时保留之前的会话；为存储的 `raft-cli-agent-session.v1` 记录提供带类型的读取函数。

它刻意不做的事：PKCE、`agent-login` 调用、兑换和刷新请求、跨进程的刷新锁，以及任何 HTTP 请求。这些都留在各个服务 CLI 中，这样任何服务的协议都不会渗进共享包。目前有两个 CLI 在使用它：[`@botiverse/hands-cli`](https://www.npmjs.com/package/@botiverse/hands-cli) 和 [`@botiverse/testbed-cli`](https://www.npmjs.com/package/@botiverse/testbed-cli)；后者原样采用了它，第一次实际运行就完成了 Agent 登录。

## 保留现有操作的调用方 {#preserve-existing-action-callers}

不要因为有了 CLI 就移除仍然可用的操作。

1. 添加 `agent-login`，用于起步（bootstrap）登录流程。
2. 添加一个 `migration-help` 操作，包含安装、登录、恢复的说明，以及旧操作与 CLI 命令的对应关系。
3. 保持现有操作的名称和响应约定不变。
4. 在旧操作的描述前加上简短的弃用提示，指向 `migration-help`。
5. 把新的产品能力放进服务 CLI。

manifest 描述是放迁移指引最稳妥的默认位置，因为 Agent 在发现阶段就能看到它，现有操作的载荷也保持不变。如果调用方还必须在调用时收到警告，请先在共享的操作 schema 中加入可选的警告元数据。不要往已经确立的机器响应体里塞给人读的文字。

## 分阶段发布，每个阶段都能单独回退 {#release-in-independently-reversible-stages}

每个阶段单独把关：

1. 审核通用的登录约定和威胁模型。
2. 上线服务端对授权凭证、兑换、刷新、轮换和撤销的支持。
3. 上线 CLI 的登录、Agent 专属存储、刷新和请求集成。
4. 在一个真实的 Raft Agent 上验证登录和 token 轮换。
5. 发布可安装的 CLI，并验证已发布的包，而不只是源码树。
6. 在 CLI 这条路可用之后，再给旧操作加上弃用指引。

保留原有的人类登录、CI token 和旧操作，作为回滚的途径。源码合并不代表服务已经部署，部署也不代表用户已经能安装修复后的 CLI。

## 验证清单 {#verification-checklist}

上线之前，要证明：

- 授权凭证会过期、只能使用一次、重放会被拒绝、证明不匹配会被拒绝
- 被截获的授权凭证没有校验码就无法创建会话
- 过期或被撤销的刷新会话可以通过重新登录恢复
- 访问 token 和刷新 token 的轮换、提前刷新，以及一次受控的 `401` 重试
- 并发命令下行为确定、只执行一次的刷新（single-flight）
- 拒绝重定向，限制响应体大小并能应对缓慢的响应体，响应 schema 是封闭的
- 不会从 Agent 环境退回到宿主的 HOME、XDG 或环境中现成的 token
- 人类和 CI 的登录行为保持不变
- 在一个真实的 Agent 上，一条读取命令、一条写入或上传命令，以及 `whoami` 都能正常工作
- 已发布的包报告预期的版本号，并且包含审核过的行为

版本号只用一个来源：CLI 运行时的 `--version` 从它的包或发布 manifest 中取得，不要在入口文件里再硬编码一份。正式发布之前，完整走一遍构建、打包、版本、依赖和 `publish --dry-run` 的流程。

## 以 Hands 为参考 {#hands-as-a-reference}

[Hands](https://github.com/botiverse/hands) 用这种模式做了一次兼容迁移：它现有的 Raft 操作仍然可用，并在发现阶段给出迁移指引；它完整的功能和今后的新功能都放在 `hands` CLI 中。`agent-login` 操作为 Agent 建立专属的 Hands 会话，`migration-help` 把旧操作对应到 CLI 命令。

把 Hands 当作实现参考，而不是协议定义。服务名称、操作数量、版本和产品命令都因应用而异；上面讲的身份、证明、存储、兼容和验证这几条边界，才是可复用的约定。
