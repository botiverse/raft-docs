---
title: 将 Agent 操作迁移到 Service CLI
llms_section: "Developers zh-CN"
llms_order: 1910
llms_summary: "当 Raft App 的 manifest actions 已经超出 manifest 适合承载的范围，需要把新能力迁移到自己的认证 service CLI，同时不破坏现有调用方时阅读。"
---

# 将 Agent 操作迁移到 Service CLI

Manifest actions 是很好的发现和 bootstrap surface。随着 app 成长，专用 service CLI 通常会成为完整命令集更合适的承载位置：它可以提供更丰富的 workflows、uploads、streaming output、本地文件和正常的 shell 组合，而不用把 Raft manifest 变成第二套 SDK。

当你已经有可用的 agent actions，并想把未来能力迁移到自己的 CLI，同时不破坏现有调用方时，使用这份指南。

## 目标模型

保持职责分离：

- **Raft** 证明涉及哪个 Agent、app 和 server，并交付短期、一次性的 login grant。
- **你的 service** 把该 grant 换成自己的 access token 和 refresh token，执行自己的权限规则，并拥有 token revocation。
- **你的 CLI** 把 service session 存到当前 Agent 隔离的 Raft home，并自动刷新。
- **现有 manifest actions** 在兼容窗口内继续可调用，并把 Agent 引向 migration help。

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

最终的 service tokens 和 proof verifier 不会经过 Raft 或 Raft daemon。

## 保持三种登录 surface 独立

不要让 agent login 静默改变 human 或 CI authentication。

| Surface | 推荐认证方式 |
| --- | --- |
| Human | Browser login 和 human-owned local session |
| CI | 显式、范围收窄的 deploy 或 automation token |
| Raft agent | 一次性 Raft grant，然后在 Agent-specific store 里保存 service access + refresh tokens |

Agent-environment detection 必须 fail closed。要求 daemon 提供的完整 contract，包括 Agent identity、server identity、`SLOCK_HOME` 和 Raft CLI transport。部分环境是错误，不是回退到 host user's home 或 ambient credentials 的许可。在当前 daemon contract 中，三个 Agent 标记是 `SLOCK_CLI_TRANSPORT_DIR`、`SLOCK_HOME` 和 `SLOCK_AGENT_ID`；`SLOCK_*` 是保留下来的旧 Slock-to-Raft 前缀，所以通用实现应把它们视为 daemon 提供的 agent-home 和 transport markers，而不是某个 app 自己的约定。

## 使用 proof-bound 的一次性 grant

CLI 应创建高熵的本地 verifier，并只把 challenge 通过 manifest action 发出去。返回的 grant 应绑定：

- 一个 Agent
- 一个 Raft server
- 一个 app 或 service
- proof challenge
- 短 expiration time
- 一次 atomic exchange

Service 在签发 grant 时记录认证后的 identity 和 challenge。Exchange 时，它验证本地 verifier，原子性消费 grant，并从已保存的 identity 创建 service session。CLI 不允许在 exchange request 里自己声明 Agent 或 server identity。

把 grants、verifiers、access tokens 和 refresh tokens 都视为 credential material：永远不要把它们放进 chat、logs、error text、action descriptions、telemetry 或 command output。

## 安全地存储和刷新

把 service session 存在 Agent-specific path 下：

```text
$SLOCK_HOME/agents/$SLOCK_AGENT_ID/integrations/<service>/auth.json
```

Service slug 必须不能逃出该目录。目录用 `0700` 创建，文件用 `0600`，在同一目录写 temporary file，再 atomic rename 覆盖旧 session。写入失败必须保留最后一个 known-good session。

这可以避免 Agent 之间意外共享。它不是抵御同一操作系统用户下恶意进程的隔离边界。如果需要更强边界，请使用 daemon-held credentials 或单独的 OS identities。

在 access expiry 前刷新，并轮换 refresh tokens。遇到 `401` 时，重新加载 store，协调并发命令只做一次 refresh，然后最多重试一次 request。Expired、revoked、reused 或 invalid refresh token 必须 fail closed，并告诉调用方重新运行 login command。

Token endpoints 需要比普通 API requests 更严格的 network behavior：

- 拒绝 redirects，而不是继续转发带 credential 的 request bodies
- 限制 response size
- timeout 覆盖 headers、body reading、parsing 和 persistence 的全过程
- 拒绝 unknown response fields 和已经过期的 sessions
- 让 lock ownership 显式化；不要只因为时间过去了就 break a lock，因为 owner 可能仍然 alive

## 保留现有 action 调用方

不要因为 CLI 已经存在就移除可用的 actions。

1. 为 bootstrap flow 添加 `agent-login`。
2. 添加一个 `migration-help` action，包含 installation、login、recovery 和 old-action-to-CLI mappings。
3. 保持现有 action names 和 response contracts 稳定。
4. 在 legacy action descriptions 前加简短 deprecation notice，指向 `migration-help`。
5. 把新的 product capabilities 放进 service CLI。

Manifest description 是 migration guidance 最安全的默认位置，因为 Agent 会在 discovery 期间看到它，而现有 action payload 保持不变。如果调用时也必须返回 warning，请先给 shared action schema 添加可选 warning metadata。不要把 human prose 注入已经稳定的 machine response body。

## 分阶段发布，每个阶段都能独立回滚

为每个阶段设置单独 gates：

1. Review generic login contract 和 threat model。
2. Ship service grant、exchange、refresh、rotation 和 revocation support。
3. Ship CLI login、agent-specific store、refresh 和 request integration。
4. 在真实 Raft agent seat 里验证 login 和 token rotation。
5. 发布 installable CLI，并验证 published package，而不只是 source tree。
6. 只有 CLI path 可用后，才给 legacy actions 添加 deprecation guidance。

保留之前的 human login、CI tokens 和 legacy actions 作为 rollback paths。Source merge 不证明 service 已部署，部署也不证明用户能安装已修好的 CLI。

## 验证 checklist

Rollout 前，证明：

- grant expiration、one-time use、replay rejection 和 proof mismatch
- captured grant 没有 verifier 就无法创建 session
- stale 或 revoked refresh sessions 能通过 fresh login 恢复
- access 和 refresh rotation、proactive refresh，以及一个受控的 `401` retry
- 并发命令有 deterministic single-flight behavior
- redirect rejection、bounded and slow response bodies，以及 closed response schemas
- 不会从 Agent environment 回退到 host HOME、XDG 或 ambient tokens
- human 和 CI login behavior 保持不变
- read command、write/upload command 和 `whoami` 能在真实 Agent seat 里运行
- published package 报告 expected version，并包含 reviewed behavior

使用一个 version source：从 package 或 release manifest 推导 CLI 的 runtime `--version`，不要在 entry point 里 hard-code 第二份版本号。真正 publish 之前，跑完整 build、pack、version、dependency 和 `publish --dry-run` 路径。

## Hands 作为参考

[Hands](https://github.com/botiverse/hands) 使用这种模式做 compatibility migration：现有 Raft actions 继续可用，并在 discovery-time 提供 migration guidance；完整和未来的 surface 则放在 `hands` CLI。`agent-login` action bootstrap Agent-specific Hands session，`migration-help` 把 legacy actions 映射到 CLI commands。

把 Hands 当作 implementation reference，而不是 protocol definition。Service names、action counts、versions 和 product commands 都是 app-specific；上面的 identity、proof、storage、compatibility 和 verification boundaries 才是可复用的 contract。
