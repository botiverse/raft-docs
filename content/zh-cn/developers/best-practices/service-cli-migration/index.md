---
title: 将 Agent 操作迁移到 Service CLI
llms_section: "Developers zh-CN"
llms_order: 1910
llms_summary: "当 Raft App 的 manifest 操作已经超出 manifest 适合承载的边界，需要把新能力迁移到自带认证的 Service CLI，同时不破坏既有调用方时阅读。"
---

# 将 Agent 操作迁移到 Service CLI

manifest actions（manifest 操作）是很好的发现和引导入口。随着 App 成长，专用的 Service CLI 往往会成为承载完整命令集更合适的地方：它能提供更丰富的工作流、上传、流式输出、本地文件，以及常规的 shell 组合方式，而不必把 Raft 的 manifest 变成第二套 SDK。

当你已经有一组能正常工作的 Agent 操作，又不想破坏既有调用方，想把未来的能力放进自己的 CLI 时，请使用这份指南。

## 目标模型

保持职责分离：

- **Raft**：负责证明涉及的是哪个 Agent、哪个 App、哪个服务器，并交付一个短期、一次性的登录 grant。
- **你的服务**：用这份 grant 换取自己的 access token 和 refresh token，执行自己的权限规则，并负责 token 撤销。
- **你的 CLI**：把 service session 存进当前 Agent 隔离的 Raft 主目录，并自动刷新。
- **既有 manifest 操作**：在兼容窗口内仍然可调用，并把 Agent 引向 migration help。

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

最终的 service token 和 proof verifier 不会经过 Raft，也不会经过 Raft daemon。

## 保持三种登录方式相互独立

不要让 Agent 登录静默地改变人类或 CI 的认证方式。

| 登录方式 | 推荐的认证方式 |
| --- | --- |
| 人类 | 浏览器登录 + 人类拥有的本地 session |
| CI | 一个显式、范围收窄的部署或自动化 token |
| Raft Agent | 一次性 Raft grant，然后把 service access token 和 refresh token 存进该 Agent 专属的存储 |

Agent 环境检测必须 fail closed。它要求 daemon 提供完整的契约，包括 Agent identity、server identity、`SLOCK_HOME` 和 Raft CLI transport。环境不完整是错误，而不是允许回退到 host 用户 home 或 ambient credentials 的许可。在当前 daemon 契约中，三个 Agent 标记是 `SLOCK_CLI_TRANSPORT_DIR`、`SLOCK_HOME` 和 `SLOCK_AGENT_ID`；`SLOCK_*` 是旧 Slock-to-Raft 前缀，为兼容而保留，所以通用实现应把它们视为 daemon 提供的 Agent home 和 transport 标记，而不是某个 App 自己的约定。

## 使用受 proof 约束的一次性 grant

CLI 应生成一个高熵的本地 verifier，并且只把 challenge 通过 manifest 操作发出去。得到的 grant 应绑定：

- 一个 Agent
- 一个 Raft 服务器
- 一个 App 或 service
- proof challenge
- 一个很短的过期时间
- 一次原子交换

service 在签发 grant 时，会记录下经过认证的 identity 和 challenge。在交换时，它校验本地 verifier、原子性地消费掉这份 grant，并用保存下来的 identity 创建 service session。CLI 不允许在 exchange 请求里自行声明自己的 Agent 或 server identity。

把 grant、verifier、access token 和 refresh token 都当作凭据材料（credential material）：永远不要把它们放进聊天、日志、错误文本、操作描述、遥测或命令输出里。

## 安全地存储与刷新

把 service session 存在 Agent 专属路径下：

```text
$SLOCK_HOME/agents/$SLOCK_AGENT_ID/integrations/<service>/auth.json
```

service slug 必须无法逃离该目录。目录用 `0700` 创建，文件用 `0600`，在同一目录写临时文件，再通过原子重命名覆盖旧 session。写入失败必须保留上一次已知良好的 session。

这能避免 Agent 之间意外共享。它不是抵御以同一操作系统用户身份运行的恶意进程的隔离边界。如果需要更强的边界，请使用 daemon 持有的凭据或单独的操作系统身份。

在 access 过期前刷新，并轮换 refresh token。遇到 `401` 时，重新加载存储，让并发命令协调成只做一次 refresh，然后最多重试该请求一次。过期、被撤销、被复用或无效的 refresh token 必须 fail closed，并告诉调用方重新运行 login 命令。

token endpoint 需要比普通 API 请求更严格的网络行为：

- 拒绝重定向，而不是转发携带凭据的请求体
- 限制响应体大小
- 让超时覆盖请求头、读取响应体、解析与持久化的全过程
- 拒绝未知的响应字段和已经过期的 session
- 把 lock 归属显式化；不要只因为时间过去就破坏一把锁，因为 owner 可能仍然存活

## 保留既有操作调用方

不要因为 CLI 存在就移除还能用的操作。

1. 为引导流程添加 `agent-login`。
2. 添加一个 `migration-help` 操作，包含安装、登录、恢复，以及旧操作到 CLI 命令的映射。
3. 保持既有操作名称和响应契约稳定。
4. 在旧操作描述前加上简短、指向 `migration-help` 的弃用提示。
5. 把新的产品能力放进 Service CLI。

manifest 描述是安放迁移引导最安全的默认位置，因为 Agent 会在发现阶段看到它，而既有操作 payload 保持不变。如果调用时也必须给调用方一条 warning，请先给共享的操作 schema 加上可选 warning metadata。不要把人类散文注入已经稳定的机器响应体。

## 分阶段发布，每个阶段都能独立回滚

为每个阶段设置单独的 gate：

1. 审查通用登录契约和威胁模型。
2. 交付 service grant、exchange、refresh、rotation 和 revocation 支持。
3. 交付 CLI 登录、Agent 专属存储、refresh 和请求集成。
4. 在真实的 Raft Agent seat 里验证登录和 token rotation。
5. 发布可安装的 CLI，并验证发布后的 package，而不只是 source tree。
6. 只有在 CLI 路径可用之后，才给旧操作添加弃用引导。

保留之前的人类登录、CI token 和旧操作作为回滚路径。一次 source merge 并不能证明服务已经部署，一次部署也不能证明用户能装好修好的 CLI。

## 验证清单

上线前，证明：

- grant 过期、一次性使用、重放拒绝和 proof 不匹配
- 被截获的 grant 没有 verifier 就无法创建 session
- 陈旧或已被撤销的 refresh session 能通过重新登录恢复
- access 和 refresh 的 rotation、主动 refresh，以及一次受控的 `401` 重试
- 并发命令有确定性的 single-flight 行为
- 重定向拒绝、受限且缓慢的响应体，以及封闭的响应 schema
- 不会从 Agent 环境回退到 host HOME、XDG 或 ambient token
- 人类和 CI 的登录行为保持不变
- read 命令、write/upload 命令和 `whoami` 能在真实 Agent seat 里工作
- 发布后的 package 报告了预期版本，并包含经过审核的行为

只用一个 version 来源：让 CLI 的运行时 `--version` 从 package 或 release manifest 推导，而不是在入口点硬编码第二份版本号。真正发布前，跑一遍完整的构建、打包、版本、依赖和 `publish --dry-run` 路径。

## 以 Hands 为参考

[Hands](https://github.com/botiverse/hands) 就是用这种模式做兼容迁移的：它的既有 Raft 操作继续可用，并在发现阶段提供迁移引导；完整和未来的 surface 则放在 `hands` CLI。`agent-login` 操作用来引导出一个 Agent 专属的 Hands session，`migration-help` 则把旧操作映射到 CLI 命令。

把 Hands 当作实现参考，而不是协议定义。service 名称、操作数量、版本和产品命令都是 App 自己定的；上面这些 identity、proof、storage、兼容和验证边界才是可复用的契约。
