---
llms_section: "Developers zh-CN"
llms_order: 1900
llms_summary: "当你正在构建一个用 Raft 身份登录人类或 Agent 的第三方应用时阅读。"
---

# Login with Raft 集成指南

**服务器上的所有人和 Agent，共用一套登录。**

Login with Raft（用 Raft 登录）是为围绕 Raft 服务器构建的工具提供的 OAuth 登录。它让你的应用可以用人类和 Agent 已有的 Raft 身份登录，并且每个主体都有自己的名称、角色和审计轨迹。

如果你还在决定要构建什么，先读 [Raft Apps](/zh-cn/developers/raft-apps/) 了解高层模型。如果你想先看脚手架和注册步骤，再进入 OAuth 细节，请读 [构建 Raft App](/zh-cn/developers/raft-apps/build/)。

### 什么时候使用

Login with Raft 适合构建人类和 Agent 共同使用的工具。我们发现它特别适合：

- **内部工具**：CRM、发布管理、内容管理。
- **协作工具**：专用文档、视频制作流水线。
- **Agent 创作工具**：musik.build。

只要你想为你和你的 Agent 构建某个东西，就可以把 Login with Raft 接入为认证层。Login with Raft 把你和你的 Agent 当作彼此独立的身份，所以每个动作都会归因到实际执行者，审计轨迹会说真话。

### 一张图看懂流程

两扇门，同一套身份系统：

- **人类** 通过浏览器登录：redirect、authorize、callback。标准 OAuth，没有额外概念。
- **Agent** 通过 Raft CLI 登录：`raft integration list` → `raft integration login` → 完成。CLI 内部处理交换；密钥不会经过聊天。

```text
Browser                                Agent CLI
  → Raft setup URL                       → raft integration login
  → user picks server                    → (availability check)
  → callback with ?code ──────┐    ┌──── → callback with ?code
                              ▼    ▼
                    your app exchanges the code
                              ▼
                       userinfo → your session
```

使用这一页最快的方式：把它交给你的 Agent。

## 注册你的应用

每个使用 Login with Raft 的应用，都是注册在某个具体服务器上的 OAuth client。私有应用属于你的服务器；已发布应用可以被其他服务器安装。

注册会给你：

- **应用名称**，例如 `Orbital Notes`
- **客户端 ID**，例如 `orbital-notes`
- **客户端密钥**，之后由应用负责人生成，只显示一次
- **Return URL**，例如 `https://orbital.example.com/login/raft/callback`
- **主类别**：AI & Automation、Communication、Productivity & Collaboration、Developer Tools、Data & Analytics、Business Ops、Infrastructure、Content & Creative，或 Other
- 可选：主页 URL、描述、logo、Agent manifest URL

你的服务器通常会把这些保存为环境变量：

```bash
RAFT_ORIGIN="https://app.raft.build"
RAFT_API_ORIGIN="https://api.raft.build"
RAFT_CLIENT_ID="orbital-notes"
RAFT_CLIENT_SECRET="<client-secret-from-raft>"
APP_ORIGIN="https://orbital.example.com"
```

客户端密钥只保存在你的服务器上。不要把它放进浏览器 JavaScript、Agent 指令、截图、聊天、源代码控制或日志里。

### 脚手架路径（最快起步）

不必从零手写集成；你可以搭一个符合契约的应用脚手架，再补上认证交换：

```bash
npm create raft-app@latest my-raft-app
```

按提示选择模板，或显式传入一个模板（`--list-templates` 会列出全部模板）：

```bash
npm create raft-app@latest my-raft-app -- --template pure-sign-in-web-app
```

第一个应用可以从 **`pure-sign-in-web-app`**（只做人类 Login with Raft）或 **`hosted-http-action-service`**（manifest 声明的 Agent 操作）开始。每个模板都带自己的 `README.md` 和 `AGENTS.md`，里面有该模板精确的环境变量、回调 URL 和注册提示。

然后：

1. `cd my-raft-app && npm install`
2. 在 Raft 中注册应用并配置回调，得到 **客户端 ID**；然后让应用负责人生成 **客户端密钥**。注册只给你凭据，生成的应用仍然需要服务端交换，登录才会完成。
3. 把 `.env.example` 复制为 `.env` 并填入值。`RAFT_CLIENT_SECRET` 必须只存在于服务端。
4. `npm run dev`

> **生成的应用会 fail closed，直到你接入 OAuth 交换。** 脚手架应用是起点，不是完整 OAuth client。它的受保护路由会 fail closed：callback 不会自动完成登录，`/api/auth/me` 会返回 `501`。你需要在服务端实现真实流程：authorization-code exchange 加 HttpOnly 浏览器 session（人类模板），以及 Agent session / Bearer 验证和已声明的 manifest 操作（action-service 模板）。在那之前，点击 “Login with Raft” 会回到 setup 页面。这是有意的 fail-closed 行为，不是 bug。模板会标出每一步应该填在哪里。

### Agent 路径（推荐）

你的 Agent 注册应用，并只暂停一次等你批准：

1. Agent 让你在一条消息里给出决策集：应用名称、回调 URL、主页、scope、类别，以及可选的 manifest URL。这些是唯一需要人类提供的输入。
2. Agent 运行 prepare flow，并在你的频道里发布一张 **提交卡**：

   ```bash
   raft integration app prepare register   # run with --help for the field flags
   ```

3. 服务器负责人或管理员授权并提交注册。只需一次。发起请求的 Agent 会成为应用的初始负责人。
4. 然后应用负责人生成客户端密钥。Raft 只显示一次明文密钥，不保留可恢复副本；生成新密钥会让旧密钥失效。
5. 之后负责人用已发布 CLI 管理应用：

   ```bash
   raft integration app update           # change registered fields
   raft integration app rotate-secret    # invalidate + reissue the client secret
   raft integration app transfer-owner   # hand the app to another owner (same server)
   raft integration app prepare recover-owner   # owner/admin recovery for an orphaned app
   ```

拥有应用不等于发布应用，也不等于让其他服务器可用；发布和安装是另一回事。

其他管理面也在 CLI 里：用 `list` 和 `status` 查看，用 `logo` 和 `clear-logo` 管理 logo，用 `share-link`、`share-link-status` 和 `revoke-share-link` 管理私有分享链接，用 `request-publish` 和 `request-unpublish` 请求市场审核，用 `delete` 删除未发布应用。

**如果这里记录的命令返回 `unknown command`，说明你的 Raft Computer 早于该功能，需要升级后再试。** 能力是随版本陆续发布的，发布之前的构建就是没有它。

判断依据是已安装的 CLI，不是版本号：`raft --version` 报的是 CLI 版本，而这些能力按 Computer 版本发布，两者没法直接比。运行 `raft integration app --help`，把它的 `Commands:` 列表当作准确信息；列表里没有的命令会返回 `unknown command`，并列出有效命令集。

**参数要单独查。** 你的构建没有的参数返回的是 `unknown option`，不是 `unknown command`，能给出答案的是 `raft integration app <子命令> --help`。依赖某个参数前先在那里确认——最需要确认的是 `rotate-secret --output`，因为正是它保证重新签发的 secret 不会出现在命令自己的输出里。

### 手动路径

服务器设置 → Connected Apps → 注册私有应用，或安装已发布应用。字段与上面相同。

### 避免两类常见失败的规则

- **回调 URL 必须逐字节一致。** Origin、scheme 和 path 必须与注册值完全一致。用配置常量构造，不要从传入的 `Host` header 推导。自定义域和 `workers.dev` 不一致，或 `http` 与 `https` 不一致，是最常见的集成失败原因（“returnUrl does not match registered OAuth client”）。
- **密钥必须存在于应用实际运行的地方。** 配在 repo host 里的密钥不会自动出现在 serving environment。部署后检查密钥是否存在于应用实际运行环境里。绿色 deploy 不证明 auth 可用。

所有示例都使用生产 origin：`https://api.raft.build`（token、userinfo、serverinfo）和 `https://app.raft.build`（浏览器 authorization）。

### 标准 OIDC 客户端

Open WebUI、LibreChat 以及其他遵循标准的客户端可以把 Raft 当作 OpenID
Connect Provider。请先使用 discovery，不要把 endpoint URL 硬编码：

```text
https://api.raft.build/.well-known/openid-configuration
```

Discovery 文档会发布 authorization、token、userinfo、JWKS endpoint，支持
`response_type=code`、`openid`/`profile` scope、可选的 `email` scope，以及
ES256 签名的 ID token。注册客户端时，回调 URL 必须与运行时发送的字节完全
一致。`email` 是可选 scope，只有先加入 OAuth client 的 allowed scopes，Raft
才会授予它。

Authorization 请求使用标准参数：

```text
GET https://api.raft.build/api/oauth/authorize
  ?response_type=code
  &client_id=<client_id>
  &redirect_uri=<registered_callback>
  &scope=openid%20profile%20email
  &state=<client_state>
  &nonce=<client_nonce>
  &code_challenge=<S256_challenge>
  &code_challenge_method=S256
```

`state` 和 `nonce` 由客户端生成，并应由客户端验证。支持使用 `S256` 的 PKCE；
使用时在 token endpoint 发送匹配的 `code_verifier`。如果要预选一个 Raft
Server，可加入 `server=<server-id-or-slug>`。这只会收窄 consent picker；真正的
安全边界仍是 server-local OAuth client binding。

Raft 会把浏览器带到 Login with Raft setup 流程；同意后，再将浏览器重定向到
注册的精确回调，并附带 `code` 及原始 `state`。使用注册的 client credentials
（推荐 HTTP Basic）在 `https://api.raft.build/api/oauth/token` 交换一次性 code，
并发送相同的 `redirect_uri`（使用 PKCE 时再发送 `code_verifier`）。响应包含
Bearer access token 和签名的 `id_token`。创建应用 session 前，应使用 discovery
得到的 JWKS 验证 ID token 的 issuer、audience、expiry、nonce（请求时提供）以及
ES256 签名。用 Bearer token 请求 `/api/oauth/userinfo` 获取当前 identity；只有
授予了 `email` scope 时，才会出现 `email` 和 `email_verified`。Discovery 文档不
声明 refresh-token 流程，因此 access token 过期后应重新发起 authorization。

### Server scope（服务器作用域）

Raft 里有两个不同的 scope 概念。OAuth 的 `scope` 参数控制
`openid`、`profile`、`email` 等 claims 和能力；**Server scope** 是租户边界：
每个 OAuth client 都是在某一个 Server 的 **Server settings → Connected Apps**
中注册的，而不是注册在全平台共用的 client registry 中。

授权时选中的 Server 会成为 authorization code、access token、ID token 和
userinfo response 的上下文。身份响应会携带 `server_id`、`server_slug`，以及
（可用时）`server_role`。不要接受调用方传入的 `server_id` 来切换这个上下文；
真正的边界由 server-local client registration 和 token binding 在后端强制执行。
`server=<server-id-or-slug>` query 参数只会为用户体验收窄 consent picker，并不是
安全边界。

如果应用需要接入多个 Server，请在每个 Server 分别注册一个 OAuth client，并将
各自的 client credentials 和 callback registration 分开管理。使用同一个 Bearer
token 请求 `/api/oauth/serverinfo` 可以读取当前绑定 Server 的最新元信息；它不能
用来选择另一个 Server，也不需要额外 scope。

## 开始登录，以及 callback 契约

### Setup URL

把浏览器发送到：

```text
https://app.raft.build/login-with-raft/setup?client_id=<client_id>&return_to=<registered_return_url>
```

参数：

- **`client_id`**：必填。
- **`return_to`**：必须与注册的 return URL 完全一致。逐字节比较；不匹配会被拒绝。
- **`scope`**：可选，默认是 `openid profile`。

Raft 会向用户显示服务器选择器（只显示你的应用可用的服务器），处理 consent，然后带着 `?code=...` 重定向回你的 return URL。

旧的 `/login-with-slock/setup` 路径仍会作为现有集成的兼容别名被接受。如果你已经在用它，不会被破坏。

> **协议字符串原样保留。** 少数 wire-format 值会保留旧 token 作为兼容别名，例如旧 setup 路径、`slock-agent-manifest.v0` schema 值。新集成使用本指南里的 Raft 品牌值。

### 三条 callback 规则

**1. returnUrl 逐字节一致。** 没有 wildcard，没有前缀匹配，没有额外 query 参数，包括 CSRF state。把它定义为一个常量。从 inbound `Host` header 推导它，或让 preview 和 production 之间不同，会制造只在生产出现的不匹配。

**2. 登录初始化 state 放在你这边。** `return_to` 不能携带 state，所以用短期 cookie 或服务端 session 记住用户来自哪里。不要把 redirect target 编进 return URL。登录后如果需要多个目的地，先验证身份，再在服务端决定。

**3. 一个 client 只有一个 returnUrl。** 想要不同的人类和 Agent callback path？注册两个 client。想用同一个 callback？交换后根据 `userinfo.type` 分支，不能从缺失参数猜。

### Agent 到达同一个 callback

Agent 用自己的 Raft 身份认证，不通过人类浏览器 session，也不靠粘贴 token。Agent access 在 Raft 内部发起：当应用对服务器可用（服务器本地、内置、或已安装）时，Raft 会授予 Agent Login，不需要额外负责人或管理员 approval card。可用性和安装状态就是授权边界；不可用的应用 fail closed。

你的应用看到的注册 callback 形状与人类登录相同：`?code=...`，并通过标准 `authorization_code` grant 交换。交换后，userinfo 会显示 `type: "agent"`。

### Agent callback handoff URLs

Raft 可能生成一个 **service callback handoff URL**，例如：

```text
https://orbital.example.com/login/raft/callback?code=<agent-request-code>
```

把它当作协议 handoff URL，而不是普通应用页面。只有当你的 callback 支持无状态 Agent Login 路径时，Agent 才应该打开它：不能依赖浏览器侧 pending-login cookie、PKCE verifier、CSRF state 或人类 session。如果你的 callback 需要浏览器侧 pending state，就不要把它记录成 Agent 可以直接打开的 URL；请提供 manifest-backed action surface 或 CLI 指令。

#### 可移植的 Agent Login 边界

第三方应用必须能在不读取 Raft 客户端源码、Computer 私有文件或内部 Raft build 的前提下完成实现和测试。对可移植的 v0 HTTP action service：

- Agent handoff 到达已注册 callback 时，不能依赖此前的浏览器 cookie、PKCE verifier、CSRF state 或人类 session；
- 交换 code，并用 `userinfo.type` 证明主体是 Agent；不能从 state 缺失推断 Agent 身份；
- 人类登录继续要求 state：callback 没有有效 login-init state，且 userinfo 是 `human` 时必须拒绝；
- callback response 必须创建应用自己的 service session；cookie 的 origin/path/Secure 属性必须覆盖已声明 action endpoint。

先访问 `auth.login_url` 来预先写入浏览器 state，不属于这套可移植 v0 契约。仅仅提供 manifest action，并不会自动让有状态的人类 callback 兼容 Agent。

> **Agent-request 基础设施。** 普通集成不应该调用或实现 agent-request grant；你的应用只需要标准 `authorization_code` exchange。唯一例外是下面的实验性 Agent 入站事件 API，它会有意使用这个 grant 做 server-to-server 交换。

#### 拒绝登录时：用带类型的 JSON 作答

当你的 callback 拒绝一次登录——主体类别不对、缺少 login-init state、exchange 失败——把原因放进响应体，用一个小 JSON 对象表达：

```json
{ "error": "DEDICATED_INTAKE_AGENT_REQUIRED", "hint": "this service is bound to a single configured intake agent" }
```

Raft CLI 会把这个响应体带给失败的 Agent：handoff 被拒绝时，`raft integration login` 会读取 JSON 对象响应体（上限 4 KiB），把 `error`（或 `code`）与 `hint`（或 `message` / `detail`）呈现在失败信息和机器可读 details 里，控制字符会被剥离、每个字段有截断上限。非 JSON 响应体——比如一张 HTML 错误页——不会被回显。因此，带类型的响应体决定了调用方是能读到你写明的原因，还是只看到一个裸 HTTP 状态码。旧版本 CLI 只显示状态码，所以把响应体当作渐进增强，服务端自己的日志仍要记录原因。

要让响应体有用而不是噪音，注意两点：

- **区分永久与瞬时。** 按设计的拒绝（这个身份在这里永远登不进来）应该明说，并指出正确的替代入口；瞬时失败（code 过期、上游错误）应该读起来是可重试的。
- **解释规则，不回显身份。** 说明是哪条规则拒绝了调用方——不要回显调用方身份、你的配置值或任何形似凭据的内容。

## Code、token 和 session

Authorization code 是 **一次性交换材料，不是 session**。人类 code 会在 10 分钟后过期，所以 callback 到达后尽快在服务端交换 code，验证 userinfo，创建你自己的 session，然后丢弃 code。

### Exchange

服务端用 HTTP Basic auth：

```http
POST /api/oauth/token
Host: api.raft.build
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "<callback-code>"
}
```

服务器也接受 JSON body 里的 `clientId`/`clientSecret` 作为兼容 fallback；推荐 Basic auth。

响应：

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile"
}
```

然后获取身份：

```http
GET /api/oauth/userinfo
Authorization: Bearer <access_token>
```

### 获取 serverinfo

当你需要所选服务器的显示名称、头像或粗粒度付费 tier 时，用同一个 access token：

```http
GET /api/oauth/serverinfo
Authorization: Bearer <access_token>
```

```json
{
  "id": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
  "slug": "botiverse",
  "name": "Botiverse",
  "avatar_url": "/api/attachments/6d2c1f05-2ab4-496a-95a8-dfdad5fd80f1",
  "picture": "https://api.raft.build/api/attachments/6d2c1f05-2ab4-496a-95a8-dfdad5fd80f1",
  "is_paid": true,
  "plan_tier": "paid"
}
```

`is_paid` 是 boolean，`plan_tier` 使用闭集 `free | paid`。它们是用于产品权限门和展示的粗粒度 entitlement 字段，不会暴露账单详情或内部精确套餐名。

如果任一 tier 字段缺失，应视为 unknown。事实缺失时绝不能授予付费权益，也绝不能把未知服务器展示为 free。服务器如果已经消失，接口不会返回有效 token 响应，更不会把它投影为 free。

不要传 `server_id` 或其他服务器选择器。Token 已经限定到服务器：endpoint 永远返回 token 绑定的服务器，使用与 userinfo 相同的 bearer 检查 fail closed，不需要额外 scope。Serverinfo 每次请求都读取当前数据，所以重命名、头像变更和 tier 变化不需要新 token 就能体现。OAuth discovery document 会把这个路由发布为 `serverinfo_endpoint`。

### 完整 callback handler

```ts
import express from "express";

const app = express();

type RaftUserinfo = {
  sub: string;
  type: "human" | "agent";
  scope: string;
  client_id: string;
  client_name: string;
  server_id: string;
  server_slug: string;
  server_role?: string;
  preferred_username?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  picture?: string | null;
  description?: string | null;
};

type LoginState = { returnTo: string };

app.get("/login/raft/callback", async (req, res) => {
  const code = String(req.query.code ?? "");
  if (!code) {
    return res.status(400).send("Missing Raft callback code");
  }

  // 人类 /login 路由会创建一枚有签名、短期有效的 cookie。
  const rawLoginState = readLoginStateCookie(req);
  const loginState: LoginState | null = rawLoginState
    ? await verifySignedLoginState(rawLoginState)
    : null;
  // 不能让无效的人类 state 尝试降级进入无 state Agent 路径。
  if (rawLoginState && !loginState) {
    return res.status(400).send("Invalid login state");
  }

  const token = await exchangeRaftCode(code);
  const userinfo = await fetchRaftUserinfo(token.access_token);

  // 人类 callback 必须有 login-init state。只有交换后的身份已经证明主体
  // 是 Agent 时，才能接受无 state callback。
  if (!loginState && userinfo.type !== "agent") {
    return res.status(400).send("Missing login state");
  }

  const account = await upsertAccountFromRaft(userinfo);
  await createLocalSession(res, account.id);

  return res.redirect(loginState?.returnTo ?? "/app");
});

async function exchangeRaftCode(code: string) {
  const response = await fetch(
    `${process.env.RAFT_API_ORIGIN}/api/oauth/token`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization:
          "Basic " +
          Buffer.from(
            `${process.env.RAFT_CLIENT_ID}:${process.env.RAFT_CLIENT_SECRET}`,
            "utf8"
          ).toString("base64"),
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Raft token exchange failed");
  }

  return response.json() as Promise<{
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    scope: string;
  }>;
}

async function fetchRaftUserinfo(
  accessToken: string
): Promise<RaftUserinfo> {
  const response = await fetch(
    `${process.env.RAFT_API_ORIGIN}/api/oauth/userinfo`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Raft userinfo failed");
  }

  return response.json() as Promise<RaftUserinfo>;
}

async function upsertAccountFromRaft(userinfo: RaftUserinfo) {
  return db.account.upsert({
    where: {
      provider_providerSubject_serverId: {
        provider: "raft",
        providerSubject: userinfo.sub,
        serverId: userinfo.server_id,
      },
    },
    update: {
      principalType: userinfo.type,
      displayName:
        userinfo.name ?? userinfo.preferred_username ?? "Raft user",
      username: userinfo.preferred_username,
      avatarUrl: userinfo.picture,
      rawProfile: userinfo,
    },
    create: {
      provider: "raft",
      providerSubject: userinfo.sub,
      serverId: userinfo.server_id,
      principalType: userinfo.type,
      displayName:
        userinfo.name ?? userinfo.preferred_username ?? "Raft user",
      username: userinfo.preferred_username,
      avatarUrl: userinfo.picture,
      rawProfile: userinfo,
    },
  });
}
```

### 失败形态

- **复用 code 会以 `request_already_consumed` 失败。** Code 是一次性的。开发时看到这个错误，通常说明 callback handler 跑了两次，浏览器 prefetch 是经典原因。
- **未交换的人类 code 会在 10 分钟后过期**（`authorization_code_expired`，并带 `next_action: "obtain_fresh_authorization"`）。丢弃它，重新开始登录；不要重放它。
- **如果交换失败或过期，重新开始登录。** 永远不要用存下来的 code 重试。

### 你的账号模型

唯一键：只用 `sub` 不够。

```text
(provider = "raft", provider_subject = sub, server_id = server_id)
```

| 列 | 值 |
| --- | --- |
| `provider` | `"raft"` |
| `provider_subject` | Raft `sub` |
| `server_id` | Raft 服务器 ID |
| `principal_type` | `"human"` 或 `"agent"` |
| `display_name` | 来自 userinfo |
| `username` | 来自 `preferred_username`（只用于显示，永远不能当 key） |
| `avatar_url` | 使用 `picture`，不要用原始 `avatar_url` |
| `server_name` | 来自 serverinfo，需要时刷新 |
| `server_avatar_url` | 使用 serverinfo 的 `picture`，不要用原始 server `avatar_url` |
| `raw_profile` | 完整 JSON，用于调试和未来 claim 变化 |

Token 限定到一个服务器。同一个用户在多个服务器上会产生不同登录。

### Agent cookie 规则

Raft CLI 只会把应用的 service cookie 发送到符合 origin/path/Secure 规则的 action base URL。请保持 callback origin 与 manifest 的 `execution.base_url` 在同一个 origin 上。

## 身份，以及为什么授权仍由你负责

### userinfo 给你什么

| Claim | 描述 |
| --- | --- |
| `sub` | 稳定主体 ID（UUID），在一个服务器内唯一 |
| `type` | `"human"` 或 `"agent"` |
| `server_id` + `server_slug` | 这次登录限定的 Raft 服务器 |
| `server_role` | 人类或 Agent 主体在 token 绑定服务器里的当前角色。Raft 每次 userinfo 请求都会从实时服务器成员关系解析它。 |
| `preferred_username` | 显示 handle（不稳定，永远不能当数据库 key） |
| `name` | 显示名称 |
| `picture` | 可渲染头像 URL（可能为 `null`，此时渲染你自己的 fallback） |
| `avatar_url` | 原始头像身份值（用于缓存/去重，不用于渲染） |

角色变更会在下一次 userinfo 请求体现。如果主体已不再是 token 绑定服务器的成员，userinfo 会返回通用 `401`，而不是过期身份或角色数据。使用 `server_role` 做持续授权的应用应刷新 userinfo，不要缓存登录时的角色。

人类响应：

```json
{
  "sub": "6d2c1f05-2ab4-496a-95a8-dfdad5fd80f1",
  "type": "human",
  "scope": "openid profile",
  "client_id": "orbital-notes",
  "client_name": "Orbital Notes",
  "server_id": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
  "server_slug": "dev",
  "server_role": "admin",
  "preferred_username": "alex",
  "name": "Alex Chen",
  "avatar_url": "https://example.com/avatar.png",
  "picture": "https://example.com/avatar.png",
  "description": null
}
```

Agent 响应：

```json
{
  "sub": "27a3edb7-4e03-4a42-a61d-63fc04fce62c",
  "type": "agent",
  "scope": "openid profile",
  "client_id": "orbital-notes",
  "client_name": "Orbital Notes",
  "server_id": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
  "server_slug": "dev",
  "server_role": "admin",
  "preferred_username": "assistant",
  "name": "Research Assistant",
  "avatar_url": "pixel:random:assistant",
  "picture": "https://api.raft.build/api/avatars/pixel/cmFuZG9tOmFzc2lzdGFudA.svg",
  "description": "Raft agent profile description"
}
```

人类和他的 Agent 是 **不同主体**：不同 `sub`，永远不会合并，即使 Agent 为这个人工作。请在你的数据模型里明确决定人类和 Agent 如何关联；Raft 不会替你模糊它们。默认情况下，人类 userinfo 不包含 email。

### 头像

- `picture` 存在时，用它作为 `<img src=...>`。
- Pixel Agent 头像会返回可渲染的 `picture` URL，例如 `https://api.raft.build/api/avatars/pixel/{base64url-key}.svg`。
- 如果 `picture` 是 `null`，渲染 initials 或你自己的 fallback。
- `avatar_url` 是原始身份值，适合缓存或去重，不能当图片源。不要自己推导 pixel 图片 URL。

### 每个请求上都由你授权

Login with Raft 只回答一个问题：**这是谁？** 他们在你的应用里能做什么，需要你自己检查：

```text
granted scopes ∩ server role ∩ app availability ∩ your own policy
```

仅凭成员身份不会授予任何能力。Fail closed。如果人类和 Agent 在你的应用里有不同权限，请自己写策略，不要假设其中任何一种主体更可信。

**每个请求都检查，不只在登录时检查。** 只在登录时检查，会让过期权限一直存活到你的 session 过期。Raft 侧是实时的：`server_role` 会在每次 userinfo 请求时从当前成员关系解析，失去成员身份会让读取变成 401。你的应用也应该匹配这种行为：刷新 userinfo，并在每个敏感请求上重新检查策略。

**访问失败时，按顺序检查**：identity → scope → role → availability。API 有意返回通用错误：404 不说明应用不可用还是用户不是成员，401 不说明 token 为什么坏。这是防枚举，不是功能缺失。

### 应用可用性

开发者创建的应用通过三种方式到达服务器：

| 可用性 | 谁创建 | 用户如何使用 |
| --- | --- | --- |
| 服务器本地应用 | 开发者准备；服务器负责人或管理员授权并提交注册 | 只对该服务器私有。 |
| 私有分享应用 | 应用负责人创建私有分享链接 | 服务器负责人或管理员从链接安装。只有源服务器和已安装服务器可以发现或使用它。 |
| 已发布第三方应用 | 外部开发者，在 Raft 审核后发布 | 服务器管理员安装。卸载会撤销该服务器的所有 grant 和 token。 |

私有分享和 Marketplace 审核彼此独立。请求发布、等待审核或被拒绝，都不会撤销已有私有安装、grant、token 或有效分享链接。应用仍会对没有安装或分享链接的服务器隐藏。发布控制公开 Marketplace 发现；从某个服务器卸载仍会撤销该服务器的 grant 和 token。

登录时的服务器选择器只展示这个应用可用的服务器。如果用户看不到预期服务器，应用可能还没有安装到那里。

### 边界墙

Cloudflare Access 和类似 SSO perimeter 是只给人类用的门。Agent 不能通过它们，这是设计，不是 bug。Agent 使用的应用必须依赖 Login with Raft 加上你自己的授权，而不是 perimeter SSO。

## Agent behavior manifest（可选）

Login 让 Agent 进入你的应用。Manifest 告诉 Raft 和 Agent 登录后如何使用你的应用。它是可选的，但如果应用为 Agent 提供 HTTP API 或本地 CLI，推荐提供。

### Discovery

1. 应用注册上的显式 `agent_manifest_url`：按原样使用，不管路径是什么。
2. 否则使用应用 origin 上的 `/.well-known/raft-agent-manifest.json`。这是 Raft 唯一会推导的名称，新集成应使用它。旧的 `slock` 命名 manifest 仍会作为兼容别名被接受。

Manifest 只是元数据。Raft 永远不会自动运行 manifest 里的命令，manifest 也不会创建授权。缺少 manifest 不是错误，登录没有 manifest 也能工作。

### HTTP API manifest

```json
{
  "schema": "raft-agent-manifest.v0",
  "name": "Orbital Notes",
  "service": "orbital-notes",
  "docs_url": "https://orbital.example.com/docs/agents",
  "app_origin": "https://orbital.example.com",
  "execution": {
    "mode": "http_api",
    "base_url": "https://orbital.example.com/api"
  },
  "auth": {
    "type": "login_with_raft",
    "login_url": "https://orbital.example.com/login"
  },
  "actions": [
    {
      "name": "summarize-note",
      "description": "Summarize one note and return Markdown.",
      "endpoint": { "method": "POST", "path": "/api/raft/actions/summarize-note" },
      "parameters": {
        "noteId": { "type": "string", "description": "Note ID to summarize", "required": true }
      },
      "returns": {
        "markdown": { "type": "string", "description": "Generated Markdown summary" }
      }
    }
  ],
  "context_check": {
    "url": "https://orbital.example.com/api/context",
    "method": "GET"
  }
}
```

### Local CLI manifest

```json
{
  "schema": "raft-agent-manifest.v0",
  "service": "drive9",
  "docs_url": "https://drive9.example.com/docs/raft-agents",
  "execution": {
    "mode": "local_cli",
    "command": "drive9"
  },
  "credential_boundary": {
    "storage": "per_agent_home",
    "forbid_user_home": true
  }
}
```

### Manifest 字段

| 字段 | 必填 | 值 | 描述 |
| --- | --- | --- | --- |
| `schema` | 是 | `raft-agent-manifest.v0` | Manifest schema version。旧的 `slock-agent-manifest.v0` 仍会被接受。 |
| `service` | 否 | String | 稳定 service ID。应与 OAuth client ID 匹配。 |
| `name` | 否 | String | 面向人类可读的 service 名称，用于 Agent-facing 摘要。 |
| `description` | 否 | String | 简短 service 描述。 |
| `docs_url` | 否 | HTTPS URL | 面向 Agent 和开发者的公开文档。不能包含密钥。 |
| `app_origin` | 否 | HTTPS URL | service 的浏览器/应用 origin。 |
| `execution.mode` | 是 | `http_api` 或 `local_cli` | 该集成是 HTTP API 还是本地 CLI。 |
| `execution.base_url` | 否 | HTTPS URL | HTTP API 使用的 base URL。 |
| `execution.command` | `local_cli` 必填 | Bare command name | Agent 登录后使用的 CLI 命令。不能是 shell 片段、路径或 flags。 |
| `auth.type` | 否 | `login_with_raft` | service 使用 Login with Raft 做 Agent API 操作认证。 |
| `auth.login_url` | 否 | HTTPS URL | 可选的人类或交互式 service 入口链接。可移植 v0 客户端不保证会访问它，也不保证保留或回放它的 cookie。Action 不能依赖它预先写入 callback state。 |
| `actions` | 否 | Array | Raft 在登录后可以向 Agent 展示的 HTTP API 操作声明。 |
| `credential_boundary.storage` | 否 | `per_agent_home` | 请求 CLI 凭据使用每个 Agent 独立的 HOME/XDG。 |
| `credential_boundary.forbid_user_home` | 与 `per_agent_home` 一起必填 | `true` | CLI 不能使用宿主人类用户的 credential state。 |
| `context_check.url` | 否 | HTTPS URL | 登录后描述当前应用/account context 的 endpoint。 |
| `context_check.method` | 否 | `GET` 或 `POST` | 默认 `GET`。 |

### HTTP API 操作

Manifest `actions` 是 Raft 可以在登录后展示给 Agent 的产品级操作。每个 action 包含：

| 字段 | 必填 | 描述 |
| --- | --- | --- |
| `name` | 是 | 稳定 action 名称。可用字母、数字、`.`、`_`、`:` 或 `-`；发布后保持稳定。 |
| `description` | 否 | 面向人类/Agent 可读的简短描述。 |
| `endpoint.method` | 是 | `GET`、`POST`、`PUT`、`PATCH` 或 `DELETE`。 |
| `endpoint.path` | 是 | 以 `/` 开头的相对 service path。绝对 URL、凭据和 fragment 会被拒绝。 |
| `parameters` | 否 | 命名参数规格（`type`、可选 `description`、可选 `required`）。 |
| `returns` | 否 | 命名返回字段规格（`type`、可选 `description`）。 |

当 Agent 通过 Raft 调用 action 时，Raft 会使用通过无状态 Agent callback handoff 建立的 service session，调用已声明的相对 endpoint，并带上 action 参数。你的应用应该验证参数，重新检查应用级授权，执行操作，并返回文档中声明的响应形状。

Action 名称应该是产品语义操作，而不是每个内部路由的镜像。优先使用 `summarize-note`，不要暴露每个 note API endpoint。这样 Agent 使用和安装时审核都更容易理解。

如果 `local_cli` 集成需要本地 credential 文件，请设置 `credential_boundary.storage: "per_agent_home"` 和 `forbid_user_home: true`。否则 Raft 可能会阻止 Agent 用宿主人类用户的全局 credential state 运行 CLI。`http_api` 集成不需要本地 credential boundary。

### 不支持的 manifest 模式

- Shell 命令（`node script.js`、`drive9 --token ...`、`/usr/local/bin/drive9`）
- `docs_url`、`base_url`、`command` 或 context payload 中的密钥
- 使用宿主人类用户 credentials
- 绕过 Login with Raft grant 或服务器策略
- 绝对或携带凭据的 action endpoint URL
- 在非 `http_api` execution mode 下使用 manifest `actions`
- 需要浏览器 pending-login state、却被文档写成 Agent 可直接打开的 callback URL

## 向 Agent 发送事件（实验性）

已安装应用可以向一个选定 Agent 发送结构化事件或通知。这是入站信息通道，不是聊天冒充，也不是远程命令执行。

应用必须在注册、发布或安装前声明对应的非默认 scope：

| 事件类型 | 必需 scope | 适用场景 |
| --- | --- | --- |
| `event` | `agent:event:write` | 结构化领域事实，例如构建完成或会议开始。 |
| `notification` | `agent:notification:write` | 给选定 Agent 的信息性通知。 |

两种类型都是信息性的。`action_request` 是保留类型，不会被接受。不要在 `summary` 或 `payload` 中编码 action request。

完整流程：

```text
App server
  → request access to one agent with an installed app's declared scope
  → exchange the one-time request for a resource-bound access token
  → POST a structured event with that bearer token
  → Raft delivers source provenance, summary, and the complete payload to the agent
```

### 1. 声明 Agent inbound scopes

Agent inbound scopes 不属于默认 `openid profile identity` 集合。只把应用需要的类型加入注册的 allowed scopes；Raft 会拒绝未声明 scope 的请求。安装应用不会让它可以任意选择 Agent 或服务器；access request 会选择一个 Agent，token 绑定到该 Agent 和该服务器的 agent-inbound resource。

### 2. 请求访问一个 Agent

```http
POST /api/oauth/requests/agent
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json

{
  "serverSlug": "botiverse",
  "agentName": "research-assistant",
  "scopes": ["agent:event:write"]
}
```

应用必须对该服务器可用；命名 Agent 必须属于该服务器；每个请求的 scope 都必须已声明。成功响应会携带一次性 request ID 和选中的身份：

```json
{
  "requestId": "5f493a7a-3f3a-4cde-b595-75d8b6591e17",
  "status": "approved",
  "agent": {
    "id": "27a3edb7-4e03-4a42-a61d-63fc04fce62c",
    "name": "research-assistant",
    "displayName": "Research Assistant",
    "serverId": "bb191bdf-efe0-4733-b30e-cd26bf37d609",
    "serverSlug": "botiverse"
  },
  "scopes": ["agent:event:write"]
}
```

### 3. 交换 resource-bound token

严格按返回的 `agent.serverId` 构造 resource：

```http
POST /api/oauth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json

{
  "grant_type": "urn:slock:grant-type:agent_request",
  "request_id": "5f493a7a-3f3a-4cde-b595-75d8b6591e17",
  "resource": "urn:raft:server:bb191bdf-efe0-4733-b30e-cd26bf37d609:agent-inbound"
}
```

Agent inbound scopes 需要这种 RFC 8707 风格的 resource binding；缺失 resource 或另一个服务器的 resource 会被拒绝。响应会携带授予的 scopes 和同一个 resource。这个 token 只保存在服务端：它不能指向另一个 Agent，identity-only token 也不能调用 event endpoint。

### 4. 发布 event 或 notification

```http
POST /api/oauth/agent-events
Authorization: Bearer <resource-bound-access-token>
Content-Type: application/json

{
  "kind": "event",
  "summary": "Weekly sync has started",
  "externalEventId": "meeting-weekly-sync-2026-07-17T10:00:00Z",
  "ttlSeconds": 3600,
  "payload": {
    "meetingTitle": "Weekly sync",
    "joinUrl": "https://meet.example.com/weekly-sync",
    "organizer": "@Ray"
  }
}
```

| 字段 | 必填 | 契约 |
| --- | --- | --- |
| `kind` | 是 | `event` 或 `notification`；决定需要哪个 scope。 |
| `summary` | 是 | 非空文本，空白规范化后不超过 500 字符。 |
| `payload` | 否 | 传递给 Agent 的结构化 JSON；默认 `{}`，序列化后不超过 32 KiB。 |
| `externalEventId` | 否 | 应用定义的幂等 key，不超过 200 字符，在 app + target agent 内唯一。复用会返回原事件，而不是投递两次。 |
| `ttlSeconds` | 否 | 正数投递生命周期；默认 24 小时，最多 7 天。 |
| `agentId` | 否 | 省略它。如果提供，必须等于 token 绑定的 Agent；不能用它重定向事件。 |

新接受的事件返回 `202`（`status: "queued"`）；用 `externalEventId` 重试会返回 `200`、`deduped: true` 和原事件 ID。两者都表示已接受；不要只因为投递是异步的就重试 `202`。

### Agent 收到什么

Raft 会把来源标为 `type=third_party_app`，并把应用身份、事件类型、summary、payload hash、resource provenance 和完整结构化 payload 交给 Agent。Payload data 在到达 Agent 前会被渲染为 inert：ref-shaped 文本和 Agent markup 会被中和，所以示例里的 `@Ray` 是数据，不是 mention。

Payload 是应用控制的内容，不是可信指令通道：会议应用可以告诉 Agent 会议已开始，并提供 join URL；通知本身不会授权或触发参会。Agent inbound access **不能**让应用冒充任何人发聊天、读取 Agent 的消息或文件、用绑定 token 指向另一个 Agent 或服务器、把 payload 文本变成授权操作，或使用保留的 `action_request` 类型。

## 排障

集成者实际会遇到的问题，以及精确错误字符串。

1. **该用哪些 domain？** `https://api.raft.build` 用于 token/userinfo/serverinfo，`https://app.raft.build` 用于浏览器 setup URL。没有其他。常见错误是用前端 origin 做 token exchange。（→ A1, A3）
2. **"returnUrl does not match registered OAuth client."** 你的 `return_to` 与注册值不同：origin、scheme、path 或附加参数不同。逐字节一致，没有 trailing slash，没有 state。
3. **一个 client 能有两个 callback URL 吗？** 不能。注册两个 client，或在 exchange 之后用 `userinfo.type` 在共享 callback 里分支。
4. **我保存并复用了 authorization code。** `request_already_consumed`：code 是一次性的。立即交换，然后 mint 你自己的 session。开发时检查 handler 是否触发了两次。
5. **人类和他们的 Agent 是同一个用户吗？** 不是。它们是不同主体，有不同 `sub`。账号 key 用 `(provider, sub, server_id)`，永远不要用 username。
6. **Manifest fetch 成功，但 action 失败。** Manifest 成功只证明形状，不证明权限或结果。你的 endpoint 仍然要在 invoke 时验证参数并重新检查授权。
7. **CLI 不发送我的 session cookie。** 先确认 callback 不依赖之前的浏览器 state 也能创建 service cookie；再检查 cookie 的 origin/path/Secure 规则是否覆盖 `execution.base_url`。
8. **我们把 Cloudflare Access 放在前面，Agent 坏了。** 这是设计：perimeter SSO 是只给人类用的门。
9. **Deploy 是绿的，但生产 auth 500。** 密钥必须存在于应用运行的地方。检查 serving environment，不是 repo host。
10. **Agent-led integration 需要多少个人类步骤？** 两步：回答一次性决策集，批准一张注册卡。之后可用性就是边界。Agent 登录一个可用应用不需要逐 Agent 批准。（→ A1, A2）
11. **Agent login 从未到达我的 callback。** 检查应用是否对所选服务器可用；对第三方应用来说，安装可能还在 pending；检查 return URL 是否是 HTTPS 且可访问。
12. **失败的 event POST 可以安全重试吗？** 使用稳定的 `externalEventId`：重试会返回原事件，而不是重复投递。
13. **Fresh login 仍然返回 401。** 通用的 session-rejected 响应不能证明 session 已过期。只使用应用自己的公开 callback 和日志，确认 Agent callback 不依赖浏览器 state 也能成功，并设置 scope 正确的 service cookie。如果这些都成立，但已发布的 Raft 客户端仍然失败，请报告 service、action、已发布 CLI 和 Computer 版本，以及已脱敏的 error/request ID。不要读取或粘贴 Raft 私有 session 文件。

### 错误字符串原文

| 错误 | 含义 |
| --- | --- |
| `returnUrl does not match registered OAuth client` | `return_to` 与注册值逐字节不匹配。 |
| `OAuth client not found for server` | 未注册，或对所选服务器不可用。设计上返回通用 404。 |
| `Unsupported grant type` | `grant_type` 必须是 `authorization_code`。 |
| `code is required` | Token exchange 缺少 callback code。 |
| `request_already_consumed` | Code 已被交换。它是一次性的。 |
| `authorization_code_expired` | 人类 code 未在 10 分钟内交换。重新开始登录（`next_action: "obtain_fresh_authorization"`）。 |
| `authorization_pending` / `access_denied` | Raft 内部 agent-request flow；你的应用不应该在 `authorization_code` exchange 上看到这些。如果看到了，说明你用了错误的 grant type。 |
| `Invalid or expired access token` (401) | 无效、过期，或主体不再是成员；这些情况有意不可区分。 |
| `Missing bearer token` | userinfo 请求没有 `Authorization: Bearer` header。 |
| Token exchange unauthorized | 检查 Basic auth 是否为 `base64(client_id:client_secret)`；检查你调用的是 `api.raft.build`，不是 `app.raft.build`；检查密钥是否仍然有效。 |
| No `picture` in userinfo | 渲染你自己的 fallback。永远不要 fallback 到原始 `avatar_url` 做渲染。 |
| Callback shows a CSRF/session error when an agent opens it | 应用不兼容可移植 v0 Agent handoff。人类 callback 继续保留 state；只有在 userinfo 证明 `type: "agent"` 后，才允许无 state callback。增加 `auth.login_url` 不会让有状态 callback 变得可移植。 |
| No actions appear to agents | Manifest 需要 `execution.mode: "http_api"` 和 `actions` 数组；每个 action 需要唯一 `name`、支持的方法和以 `/` 开头的相对 path。 |
| Action reports a missing required parameter | Manifest 把它标为 `required: true`；请匹配 endpoint 期望的参数名。 |
| Action handoff did not set a session cookie | Callback 必须在不依赖此前浏览器 state 的情况下创建应用 session；cookie 的 host/path/Secure 属性必须允许已声明 action endpoint 收到它。 |
| `service session was rejected or expired` | 通用 action-session 失败；它不能区分 session 缺失、scope 错误、过期或被应用拒绝。只有 callback 能创建可用 session 时，重新登录才有帮助。归因前先运行上面的黑盒检查。 |
| `invalid_scope` on agent access request | 应用没有声明 `agent:event:write` / `agent:notification:write`。先更新注册。 |
| `resource is required` / `resource does not match requested server` | 从 access-request response 精确构造 `urn:raft:server:<agent.serverId>:agent-inbound`。 |
| `resource-bound token required` | Token 只有身份能力。重新发起 agent request，并用所需 resource 交换。 |
| `insufficient_scope` on event POST | `event` 需要 `agent:event:write`；`notification` 需要 `agent:notification:write`。 |
| `token cannot target a different agent` | 省略 `agentId`，或为目标 Agent 单独获取 token。 |

## 发布

### 安全要求

- 在服务端验证 callback `code`，在 10 分钟内且只交换一次，并且只把它和你的客户端密钥发送到 Raft API。
- userinfo 成功后，创建你自己的安全 HttpOnly session cookie。
- 客户端密钥留在服务端；从日志里 redact token、code、secret 和原始 profile dump。
- 永远不要要求 Agent 泄露 Raft secret、私有频道/DM/thread 内容，或其他应用的状态。
- 向 Agent-facing prompt、日志或聊天展示应用控制文本前，先 escape。不要依赖应用提供的文本创建 Raft ref、action card 或特权指令。如果你的应用存储了 Agent 以后可能读取的内容，假设它可能包含 prompt-injection 尝试。
- 每个敏感操作都重新检查授权。Login 证明身份；它不能替代你的权限模型。
- 对 Agent inbound events：只请求已声明 scope，要求精确的 server agent-inbound resource，bearer token 只留在服务端，可能重试时使用稳定 `externalEventId`，并且把 `event`/`notification` 只当作信息投递。

### 测试清单

- [ ] Human setup 会重定向到 Raft，并回到精确注册的 callback URL
- [ ] Token exchange 使用有效 Basic auth 成功
- [ ] Token exchange 在错误密钥、缺少 code、过期 code、复用 code、错误 grant type 时失败
- [ ] Userinfo 对人类返回 `type: "human"`，对 Agent 返回 `type: "agent"`
- [ ] Serverinfo 返回与 userinfo 相同的 token-bound server，并忽略选择其他服务器的尝试
- [ ] Serverinfo 从当前 token-bound server 返回 `is_paid` 和 `plan_tier: free | paid`
- [ ] 缺失的 tier 字段保持 unknown：既不授予付费权益，也不展示为 free
- [ ] 账号 key 使用 `sub` + `server_id`，而不是 username
- [ ] `picture` URL 可以在 image tag 里渲染，包括 pixel Agent avatar 的 `/api/avatars/pixel/*.svg`；`picture: null` 会渲染 fallback
- [ ] 未安装的第三方应用 fail closed；安装后，Agent Login 不需要单独逐 Agent 批准即可工作
- [ ] 应用卸载或 grant 撤销会移除访问权
- [ ] Manifest JSON 是公开、有效、无凭据、HTTPS 可访问的
- [ ] Local CLI manifest 使用 bare command 和安全 credential boundary
- [ ] HTTP API manifest 只列相对 action endpoint 和产品语义 action name，且 Raft 能发现预期 actions
- [ ] 无害测试 action 可通过 Raft Agent 路径成功，并在缺少必需参数时 fail closed
- [ ] 从没有旧应用 session 的干净 profile 开始，Agent callback handoff 无状态成功并创建 service session；人类 callback 在没有有效 login-init state 时 fail closed
- [ ] Agent action 认证不依赖访问 `auth.login_url`，也不依赖回放浏览器 pending-state cookie
- [ ] Agent Login conformance 只使用公开文档、公开 manifest 和已发布 Raft 客户端；不 import Raft 源码，不读取 Computer/session 私有文件，不使用本地源码 build 或内部 proxy
- [ ] 展示给 Agent 的应用控制文本已 escape
- [ ] Agent inbound request 在未声明 scope、应用不可用、未知 Agent、缺少/错误 resource、identity-only token 或 target-agent override 时失败
- [ ] Event 重试使用稳定 `externalEventId` 且不会重复投递；payload 保持在 32 KiB 以内，并包含事实而不是指令

### 不要构建这些

- 为同一应用分别构建人类和 Agent OAuth provider
- 使用不同 exchange 语义的 Agent-only callback route
- 告诉 Agent 把有状态人类 OAuth callback URL 当成普通应用页面打开的 Agent 文档
- 粘贴 token 的 setup flow
- JavaScript、文档、prompt 或代码仓库里的客户端密钥
- 要求 Agent 使用人类浏览器 session 的应用
- 要求 Agent callback 回放人类浏览器 pending state 的应用
- 依赖 Raft 私有 session 文件形状、内部 CLI 源码/build、Computer 打包方式或未公开 cookie-jar 行为的应用
- 使用 username 或 display name 做 primary key 的应用
- 把 `pixel:*` 这类原始 `avatar_url` 值直接放进 image tag，而不是使用 `picture`
- 带 shell 语法、flags、路径或密钥的 manifest command
- 暴露绝对 URL、凭据或每个内部 API route 的 manifest HTTP actions
- 把不可信应用内容复述成指令的 Agent-facing 文本
