---
llms_section: "Developers zh-CN"
llms_order: 1893
llms_summary: "给应用的链接卡片加上执行操作的按钮。包括谁能使用（官方应用；服务器本地应用在它自己的服务器上，由能管理集成的人允许之后，并且只在逐次确认点击的客户端里）、注册 action_endpoint、带签名的 prepare、execute、status 请求以及 Raft 接受的回答、终态更新、修订版本与过期的点击、上限、一个审批示例和故障排查。"
---

# 链接卡片操作

链接卡片上可以有按钮。`navigate` 按钮打开你的源上的一个页面，任何应用都能用。本页讲的是执行操作的按钮：有人点击时，Raft 调用你应用的 **操作端点（action endpoint）**，并附上一份签名的声明，说明是谁点的、点的是哪张卡片上的哪个按钮。你的应用检查这个人能不能做这件事、卡片是否仍是最新的，然后执行。

请先读 [应用链接预览](/zh-cn/developers/raft-apps/link-previews/)。你需要一份可用的注册、一个能回答 [版本 2 请求](/zh-cn/developers/raft-apps/link-previews/#the-version-2-request) 的回调，并且 `preview_versions` 里包含 2。

## 谁能使用执行操作的按钮 {#who-can-use-acting-buttons}

每次读取卡片时，Raft 都会决定查看者能拿到哪些按钮；每次点击时还会再检查一次。

| 应用 | 执行操作的按钮 |
| --- | --- |
| 官方应用（Raft 批准为官方的应用），并且有生效的操作端点（已上架的应用，这个端点要先通过市场审核） | 在安装了它的每个服务器上都可用。 |
| 服务器本地应用：在你的服务器上创建，没有发布，也从未通过链接分享 | 只对从它自己的服务器阅读的人可用，要先由这个服务器上能管理集成的人 [允许它的卡片操作](#_2-allow-card-actions-on-your-own-server)，并且只在会为 Raft 没审核过的应用逐次确认点击的 Raft 客户端里可用。Raft 网页版支持，手机 App 从 1.24 版起支持。 |
| 其他任何应用 | 没有。Raft 只保留 `navigate` 按钮。 |

查看者用不了的按钮，Raft 会从这个人看到的卡片里删掉，而不是显示为禁用。在其他任何服务器上阅读的人，都拿不到服务器本地应用的执行操作的按钮。例如在联合频道里，来自另一个服务器的查看者就拿不到。

Raft 没有审核过服务器本地应用，所以这类应用的执行操作的按钮每按一次，Raft 都会请这个人确认。确认内容写明你的应用名，说明 Raft 没有审核过它，并说明你的应用会知道是谁按的。即使是带撤销倒计时的按钮，也会先请对方确认。只有显示这个确认的客户端才能拿到应用的执行操作的按钮；在其他客户端里，这个人只看到 `navigate` 按钮。

应用一旦有了 [私有分享链接](/zh-cn/developers/raft-apps/share/)，或者发布到了市场，就不再是只为你的服务器创建的应用，之后撤销链接也不会改变这一点。它在任何地方都不能再使用本服务器卡片操作，包括它自己的服务器。

只有人能点击。Agent 拿不到链接卡片。和任何预览一样，点击的人必须已经通过 Login with Raft 登录过你的应用，并且仍然能阅读这条消息。

**Raft 告诉你的应用是谁点的，但不替你决定谁可以执行。** 每次 prepare 和 execute 都要用你自己的权限规则检查这个人。

## 一次点击的过程 {#how-a-click-works}

1. 你的回调用一张带 `execute` 按钮的卡片回答版本 2 请求。
2. Raft 检查你的应用能否为这位查看者提供执行操作的按钮，为每个启用的 `execute` 按钮签一个只能用一次的 handle，交给查看者的客户端。这时还不保存任何东西。
3. 这个人点击按钮。如果是服务器本地应用，Raft 会请这个人确认这次点击，见上文。如果按钮带 `confirm: "prepare"`，Raft 向你的操作端点发一个 **prepare** 请求，再在自己的对话框里显示你的确认文字。如果按钮带 `undoWindowMs`，客户端会倒计时，同时显示 **撤销** 按钮。
4. Raft 用当前状态核对 handle，为这次点击记录一条 **操作记录（operation）**，并向你的操作端点发一个 **execute** 请求。
5. 你的应用检查、执行，并用一个状态回答。如果需要更长时间，就先回答 `accepted`，之后用 [终态更新](#_7-finish-later-with-a-terminal-update) 或在 [status 回答](#_8-answer-status-requests) 里报告结果。
6. Raft 把结果告诉这个人，并重新读取卡片。

## 1. 注册操作端点 {#_1-register-the-action-endpoint}

在你用 `PUT /api/oauth/link-preview` 发送的注册里加上 `action_endpoint`：

```json
{
  "origin":"https://your-app.example",
  "endpoint":"https://your-app.example/preview",
  "action_endpoint":"https://your-app.example/card-actions",
  "paths":["/pr"],
  "preview_versions":[1, 2, 3]
}
```

- 它遵循和 `endpoint` 相同的规则：在你注册的源上，使用 HTTPS，不带查询参数或片段。Raft 按规范化的形式保存它，所以 `https://your-app.example:443/card-actions` 和不带端口的写法是同一个 URL。
- **每次 `PUT` 都要带上它。** `PUT` 会替换整条注册，不带 `action_endpoint` 的请求会删除它，执行操作的按钮立即停止工作。
- `GET /api/oauth/link-preview` 返回已保存的值，字段名是 `actionEndpoint`。
- 没有发布的应用，新增或修改操作端点立即生效。已发布的应用，新增或修改操作端点要等市场审核：在此期间，已批准的端点继续生效；注册里用 `pendingActionEndpoint` 显示这次申请，被拒绝后还有 `actionEndpointRejectReason`。删除操作端点总是立即生效。
- 修改操作端点、源、预览的 `endpoint` 或路径集合，会让屏幕上已有的按钮全部失效；查看者的卡片重新读取后会拿到新的按钮。重复提交相同的注册不会改变任何东西。

prepare、execute 和 status 请求都发到这一个 URL，用请求体里的 `phase` 区分。

## 2. 在你自己的服务器上允许卡片操作 {#_2-allow-card-actions-on-your-own-server}

官方应用跳过这一步。服务器本地应用只注册操作端点还不够：要由你的服务器上有管理集成权限的人在应用的设置里允许它的卡片操作。对方确认的是准确的操作端点 URL，所以允许的就是 Raft 将要调用的。

他们在服务器设置里这个应用页面的**卡片按钮**区块操作，那里会显示操作端点，并请他们确认。

- 这项允许只针对这个准确的 URL。只要应用的操作端点指向别的地址，它的按钮就只能打开链接。如果端点改回已允许的 URL，按钮会重新执行操作。要使用别的 URL，需要有人允许那一个。
- 撤回允许后，执行操作的按钮立即关闭，别人已经打开的卡片也一样：下一次点击会被拒绝。
- 注册因为域名证明失败而被暂停期间，执行操作的按钮也会关闭。证明重新成功后会恢复。
- 即使已经允许，这些按钮也只在会为 Raft 没审核过的应用逐次确认点击的客户端里执行操作（[见上文](#who-can-use-acting-buttons)）。
- 在撤回之前刚被 Raft 接受的点击，仍可能到达你的端点。已经开始的操作记录，status 请求和终态更新照常工作。

## 3. 在卡片上加入执行操作的按钮 {#_3-add-acting-buttons-to-the-card}

按钮放在版本 2 或版本 3 回答的 `card` 里。`Button` 元素有这些属性：

| 属性 | 约定 |
| --- | --- |
| `label` | 1–40 个字符。 |
| `variant` | 可选：`default` 或 `ghost`。 |
| `action` | 按钮做什么，见下表。 |
| `disabledReason` | 可选，1–200 个字符。按钮显示为禁用，并显示这个原因。Raft 不为它签 handle。 |

| `action` | 谁能保留 | 点击后会怎样 |
| --- | --- | --- |
| `{"kind":"navigate", "url":"https://your-app.example/…"}` | 所有应用 | 打开这个 URL，它必须在你的源上。 |
| `{"kind":"read"}` | 能使用执行操作按钮的应用，以及没有操作端点的官方应用 | 重新读取卡片：Raft 向你的回调发一个新的版本 2 请求。 |
| `{"kind":"execute", "action_id":"merge", "confirm":"prepare"}` | 能使用执行操作按钮的应用 | 先发 prepare 请求，Raft 用对话框显示你的确认文字，然后 execute。 |
| `{"kind":"execute", "action_id":"approve", "undoWindowMs":5000}` | 能使用执行操作按钮的应用 | 先倒计时并显示 **撤销**（1000–10000 毫秒），然后 execute。没有 prepare。 |

- `execute` 操作必须恰好带 `confirm: "prepare"` 和 `undoWindowMs` 其中之一。两个都没有，或者两个都有，整个回答都会无效，查看者只看到普通链接。
- `action_id` 要符合 `^[a-z][a-z0-9_]{0,31}$`，并且在卡片的 `execute` 按钮之间不能重复。它只是操作的名字，不要把参数放进去。你的应用根据 `action_id` 和 `card_revision` 判断按钮的含义（[见下文](#revisions-and-stale-clicks)）。
- 一张卡片最多 4 个按钮。
- 难以撤销的操作用 `confirm: "prepare"`；简单的操作，短时间内能撤销就够了，用 `undoWindowMs`。
- 在回答里设置 `card_revision` 和 `business_revision`，这样你才能拒绝过期的点击。

**客户端能力。** 请求里的 `client_capabilities` 列出查看者的客户端能做什么。查看者要有 `button.v1` 才能拿到按钮，要有 `confirm.v1` 才能拿到带 `confirm` 的按钮，要有 `undo.v1` 才能拿到带 `undoWindowMs` 的按钮；其余的 Raft 会从这位查看者的卡片里删掉。网页版声明了这三项。服务器本地应用的执行操作的按钮还需要 `unreviewed_app.v1`：客户端会为 Raft 没审核过的应用逐次确认点击时，才声明这一项；没有它，查看者只拿到 `navigate` 按钮。你的应用不需要声明任何东西：这些是 Raft 和它的客户端之间的事。你始终可以发送完整的卡片。只有想在查看者拿不到的按钮位置显示别的内容时，才需要读 `client_capabilities`。

## 4. 验证请求 {#_4-verify-the-request}

Raft 发出的每个 prepare、execute 和 status 请求，都是发往你的操作端点的 HTTP **POST**，带 `Content-Type: application/json`、`Accept-Language` 请求头和 `Authorization: Bearer <assertion>`。这个断言是一个 ES256 JWT，和预览断言用同一套密钥签名。请用你配置的 Raft API 源上的发现文档里的 JWKS 验证它，例如 `https://api.raft.build/.well-known/openid-configuration`。绝不要根据未经验证的 token 声明来选择 JWKS URL。

**先检查请求体的字节，再解析：** 先对原始请求体计算哈希，和 `body_sha256` 比较。

| 头部字段或声明 | 必须做的检查 |
| --- | --- |
| `alg`、`kid` | `ES256`；用公布的、与之匹配的 Raft 密钥验证签名。 |
| `typ` | `raft-card-action+jwt`。预览断言在这里永远无效，这个断言在你的预览回调里也永远无效。 |
| `iss` | `<Raft API origin>/oidc/<server-id>`，其中 `<server-id>` 等于 `server_id` 声明。 |
| `aud` | `urn:raft:card-action:<your-client-key>`：你的 [域名文件](/zh-cn/developers/raft-apps/link-previews/#_1-prove-ownership-of-the-domain) 中写的 client ID。 |
| `token_use`、`type` | `card_action`、`human` |
| `phase` | `prepare`、`execute` 或 `status`；等于请求体里的 `phase`。 |
| `iat`、`nbf`、`exp` | 处于有效时间窗口内。断言最多有效 30 秒，execute 的断言可能更短。认领 execute 时再检查一次 `exp`（[第 6 步](#_6-answer-execute)）。 |
| `jti` | 每个请求都不同。把见过的值保留到它们过期，拒绝重复的。 |
| `body_sha256` | 请求体原始字节的 SHA-256 十六进制摘要。 |
| `url_sha256` | prepare 和 execute：请求体中 `url` 字符串按 UTF-8 编码后的 SHA-256 十六进制摘要。不要自己再规范化 URL。status 请求体没有 `url`。 |
| `message_id` | 卡片所在的 Raft 消息。 |
| `server_id`、`installation_id` | 你预期的服务器和安装。服务器本地应用只会收到它自己的服务器。 |
| `sub` | 点击的人：与 Login with Raft 相同的人类 ID。用它执行你的权限检查。在 status 请求里，它是当初点击的那个人。 |
| `server_role` | `owner`、`admin`、`member` 或 `guest`：Raft 签名时这个人在该服务器上的角色。它描述这一次请求，不是一项权限。缺失或其他值都按 `guest` 处理。 |

Raft 只通过 443 端口的 HTTPS 访问公开地址，从不跟随重定向，每次调用总共给 **2.5 秒**，包括 DNS 解析。你的回答必须是 HTTP `200`，带 `Content-Type: application/json`，最多 32 KiB 的严格 JSON：不能有重复的 key，key 里不能有控制字符，Unicode 必须合法，并且只能有下面每种回答列出的字段。其他情况，Raft 都当作没有回答。

请求体里的 `locale` 是查看者的语言，是一个 BCP 47 标签；`Accept-Language` 带的是同一个标签。确认文字和提示都用这种语言写；两者不一致时，以 `locale` 为准。

这个断言不是 OAuth 访问 token，也不是 ID token。只把它用于随它一起到达的那个请求。不要记录断言、原始请求体或私有的卡片内容。

下面是一个只在后端运行的 Node 示例，适用于服务器本地应用，用到了 [`jose`](https://github.com/panva/jose) 库。服务多个服务器的应用，要用每个请求的 `server_id` 声明检查 `iss`，而不是用一个配置好的服务器。

```js
import { createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

const RAFT = process.env.RAFT_API_ORIGIN; // 例如 https://api.raft.build
const discovery = await (await fetch(`${RAFT}/.well-known/openid-configuration`)).json();
const jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
const sha256 = (data) => createHash("sha256").update(data).digest("hex");

// rawBody：收到的原始请求体（Buffer），一个字节都不改。
export async function verifyCardAction(authorization, rawBody) {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const { payload } = await jwtVerify(token, jwks, {
    algorithms: ["ES256"],
    typ: "raft-card-action+jwt",
    issuer: `${RAFT}/oidc/${process.env.RAFT_SERVER_ID}`,
    audience: `urn:raft:card-action:${process.env.RAFT_CLIENT_ID}`,
    requiredClaims: ["iat", "nbf", "exp", "jti", "sub"],
  });
  if (payload.token_use !== "card_action" || payload.type !== "human") throw new Error("not a card action");
  if (payload.server_id !== process.env.RAFT_SERVER_ID) throw new Error("wrong Server");
  if (payload.installation_id !== process.env.RAFT_INSTALLATION_ID) throw new Error("wrong installation");
  if (payload.body_sha256 !== sha256(rawBody)) throw new Error("body changed");
  const body = JSON.parse(rawBody.toString("utf8"));
  if (body.phase !== payload.phase) throw new Error("phase mismatch");
  if (body.phase !== "status" && payload.url_sha256 !== sha256(body.url)) throw new Error("URL mismatch");
  return { claims: payload, body };
}
```

## 5. 回答 prepare {#_5-answer-prepare}

Raft 只为带 `confirm: "prepare"` 的按钮发 prepare，发生在显示对话框之前：

```json
{
  "version":2,
  "phase":"prepare",
  "url":"https://your-app.example/pr/123",
  "action_id":"merge",
  "card_revision":"r7",
  "claimed":{"business_revision":"b12"},
  "prepared_action_id":"5b1f0c9e-2d7a-4c1e-9f3b-8a6d2e4c7b10",
  "locale":"en"
}
```

prepare 不能改动你的业务数据。可以写簿记性质的记录，比如下面的 prepared 记录。

做和 execute 相同的检查：这个人（`sub`）现在可以执行这个操作，按你当前的规则这个操作仍然启用，并且对象当前的修订版本等于 `claimed.business_revision`。任何一项不通过，就拒绝：

```json
{"status":"refused","code":"NOT_ALLOWED"}
```

拒绝时可以带 `code` 和 `toast`，但这个人看到的是 Raft 的固定提示：操作没有执行。检查都通过时，准确描述 execute 将要做什么：

```json
{
  "status":"prepared",
  "description":{
    "prepared_action_id":"5b1f0c9e-2d7a-4c1e-9f3b-8a6d2e4c7b10",
    "action_id":"merge",
    "business_revision":"b12",
    "locale":"en",
    "read_at":"2026-11-10T09:30:00Z",
    "title":"Merge PR 123 into main?",
    "rows":[{"label":"Branch", "value":"fix-sign-in → main"}, {"label":"Method", "value":"Squash"}],
    "confirm_label":"Merge",
    "cancel_label":"Cancel"
  }
}
```

回答里只有这两个字段。

| 字段 | 必填 | 约定 |
| --- | --- | --- |
| `prepared_action_id`、`action_id` | 是 | 请求里的值。 |
| `business_revision` | 是 | 你刚刚读到的对象修订版本；1–512 个字符。 |
| `locale` | 是 | 你写这段文字所用的语言，BCP 47 标签。 |
| `read_at` | 是 | 你读取对象的时间：UTC 的 RFC 3339 格式，以 `Z` 结尾，小数部分可选、1–9 位，日期必须真实存在，例如 `2026-11-10T09:30:00.120Z`。Raft 原样保存你发送的值。 |
| `title` | 是 | 1–120 个字符。 |
| `body`、`fine_print` | 否 | 各 0–500 个字符。 |
| `rows` | 否 | 最多 8 项，每项是 `{ "label": …, "value": … }`，label 为 1–40 个字符，value 为 1–200 个字符。 |
| `confirm_label`、`cancel_label` | 是 | 各 1–40 个字符。 |
| `target`、`execution_mode`、`execution_account` | 否 | 字符串，供你自己记录。 |
| `terms` | 否 | 一个对象，最多 16 个字符串值。绝不要在里面放密钥等机密。 |

- 描述里只能有字符串、对象和数组：任何位置出现数字、布尔值或 `null` 都会使它无效，出现未知字段或缺少字段也一样。长度按 Unicode code point 计数。
- Raft 的对话框以纯文本显示 `title`、`body`、`rows`、`fine_print` 和你的两个按钮文字，上方是 Raft 自己的一行，写着你的应用名和域名。它不显示 `target`、`execution_mode`、`execution_account` 和 `terms`，所以这个人需要看到的每个值都要放进 `rows`。

**保存 prepared 记录。** 把你描述的内容以 `prepared_action_id` 为键保存 5 分钟，连同它的摘要：

```text
prepared_digest = lowercase hex( SHA-256( UTF-8( JCS(description) ) ) )
```

JCS 是 RFC 8785 定义的 JSON 规范化方案。Raft 对收到的描述计算同样的摘要，并在 execute 时发回来，这样你就知道这个人确认的正是你描述的内容。

如果你的回答超过 2.5 秒，或者回答无效，这个人会看到「应用无法准备此操作」，可以重试。Raft 不保存任何东西，也不记录操作记录。同一个按钮的两次 prepare 会产生两条各自独立的 prepared 记录；只有这个人确认的那一条会进入 execute。

## 6. 回答 execute {#_6-answer-execute}

```json
{
  "version":2,
  "phase":"execute",
  "url":"https://your-app.example/pr/123",
  "action_id":"merge",
  "card_revision":"r7",
  "claimed":{"business_revision":"b12"},
  "prepared_action_id":"5b1f0c9e-2d7a-4c1e-9f3b-8a6d2e4c7b10",
  "prepared_digest":"<64 lowercase hex characters>",
  "operation_id":"0d6e3a52-7c4b-4f8e-a1d9-3b5c7e9f2a14",
  "locale":"en",
  "update_token":"<opaque token>"
}
```

只有带 `confirm: "prepare"` 的按钮才有 `prepared_action_id` 和 `prepared_digest`。`operation_id` 标识这一次点击。`update_token` 让你在 10 分钟内为这条操作记录发送一次 [终态更新](#_7-finish-later-with-a-terminal-update)；请把它当作机密。

**一次点击就是一条操作记录，Raft 只发一次它的 execute。** 即使你的回答丢失，Raft 也永远不会重发 execute。查看者的客户端可能会重试它发给 Raft 的请求，Raft 会根据自己的记录回答这些重试，不会再次调用你。

按这个顺序检查：

1. 断言，见 [第 4 步](#_4-verify-the-request)。
2. **认领这条操作记录。** 以 `operation_id` 为键，用一个原子步骤（例如在唯一键下插入）检查 `exp` 还没过去，并记下你正在执行它。如果 `exp` 已经过去（请求等得太久了），什么都不做，回答 HTTP `401`。如果你已经认领过这个 `operation_id`，返回你记录的回答，不做别的。如果你已经 [把它标记为永不执行](#an-operation-you-have-no-record-of)，回答 `failed_not_sent`。
3. 这个人：`sub` 现在可以对这个对象执行这个操作。
4. 这个操作：按你当前的规则仍然启用，即使 `card_revision` 没变。
5. 修订版本：`card_revision` 是你发出的、对这个操作仍然有效的版本，并且对象当前的修订版本等于 `claimed.business_revision`。
6. 带 `confirm` 的按钮：`prepared_action_id` 对应的 prepared 记录存在、没有过期，摘要等于 `prepared_digest`。如果已经过期，用代码 `STALE_PREPARED` 拒绝。
7. 执行，以 `operation_id` 为键记录结果，然后回答。

用一个状态回答，只能用这几个字段：`status`（必填）、`code`（1–64 个字符）、`attribution`（1–200 个字符）和 `toast`（`{ "tone": "info" | "success" | "warning", "text": … }`，1–200 个字符）。

```json
{"status":"done"}
```

| `status` | 含义 | 这个人看到 |
| --- | --- | --- |
| `done` | 你已经执行了。 | 已完成。打开应用查看结果。 |
| `refused` | 你决定不执行：没有权限、卡片过期、操作已禁用或确认已过期。什么都没发生。 | 操作没有执行。 |
| `failed_not_sent` | 你尝试过，并且能保证什么都没发生。 | 操作没有执行。 |
| `accepted` 或 `executing` | 你接下了这件事，稍后完成。 | 应用已接受，正在完成。 |
| `unknown` | 你暂时还不知道它有没有发生。 | 结果尚未确认。 |
| 2.5 秒内没有回答、HTTP 状态码不是 `200`、回答无效、连接中断 | Raft 不知道结果。 | 结果尚未确认。 |

- `done`、`refused` 和 `failed_not_sent` 是终态。终态不会再改变。
- **没有回答永远不算成功。** Raft 把这条操作记录记为 `unknown`，之后通过 [status](#_8-answer-status-requests) 了解结果。只有当 Raft 的请求根本没有发出去时（你的端点 DNS 解析失败，或者地址不是公开地址），Raft 才会记为操作没有执行。
- 这个人看到的是 Raft 按状态给出的固定提示，不是你在 execute 回答里写的 `toast`、`code` 或 `attribution`。你自己的文字只能通过 status 回答传给对方。
- 如果这项工作可能超过大约两秒，立刻回答 `accepted`，稍后再完成。

## 7. 稍后用终态更新报告结果 {#_7-finish-later-with-a-terminal-update}

如果你回答的是 `accepted`、`executing` 或 `unknown`，一旦知道结果就把它发过来。在你的后端，像注册时一样以 **HTTP Basic** 方式用应用的客户端 ID 和密钥认证，然后调用 `POST /api/oauth/link-preview/card-updates`：

```json
{
  "update_token":"<the update_token from the execute request>",
  "update_id":"9a3c6f1e-update-1",
  "outcome":"done"
}
```

| 字段 | 约定 |
| --- | --- |
| `update_token` | 来自 execute 请求。从 Raft 发出 execute 起 10 分钟内有效，只能用于一次更新。 |
| `update_id` | 你为这次更新取的 ID：1–128 个字符，由字母、数字和 `. _ ~ : -` 组成。只取一次，并在发送前保存下来，重试时复用它。 |
| `outcome` | `done`、`refused` 或 `failed_not_sent`。 |
| `toast` | 可选，格式同 execute 回答。Raft 接受它但不显示；要显示你自己的文字，请在回答 status 请求时带上 toast。 |

请求体最多 8 KiB，是只含这些字段的严格 JSON。

| 回答 | 含义 |
| --- | --- |
| `200` `{ "operation_id", "state", "receipt_revision" }` | 已记录。`state` 是这条操作记录现在的状态。如果它已经是终态，这次更新会被记录，但不改变任何东西。 |
| `400` `INVALID_REQUEST` | 请求体无效。 |
| `401` `INVALID_CLIENT` | 客户端凭据错误，或者应用已被停用。 |
| `409` `UPDATE_CONFLICT` | 这个 token 已经用于另一个 `update_id` 或不同的内容。 |
| `410` `UPDATE_TOKEN_INVALID` | token 不存在、属于另一个应用、已经过期，或者已经和它的操作记录对不上。请改用 status 报告结果。 |
| `429` `RATE_LIMITED` 或 `LOCK_TIMEOUT` | 更新太频繁，或者 Raft 暂时繁忙。等 `Retry-After` 指定的时间后，用同一个 `update_id` 重试。 |
| `500` | 用同一个 `update_id` 重试。 |

用同一个 `update_id` 和相同的内容重试，会再次得到第一次的回答，即使 token 已经过期。应用被卸载之后、卡片操作被撤回之后、注册改变之后，Raft 仍然接受更新；但应用的凭据被停用之后就不再接受。

## 8. 回答 status 请求 {#_8-answer-status-requests}

Raft 发出 execute 之后，会在点击者的客户端询问进展时，向你的操作端点询问这条操作记录：消息还在屏幕上时，大约在点击后 2、5、15、60 秒，之后每 5 分钟一次，最长 24 小时；结果有变化时也会询问。每条操作记录每 2 秒最多询问一次。操作记录已经是终态时也可能询问：你的提示文字就是这样传给这个人的。

```json
{"version":2, "phase":"status", "operation_id":"0d6e3a52-7c4b-4f8e-a1d9-3b5c7e9f2a14", "locale":"en"}
```

按 [第 4 步](#_4-verify-the-request) 验证断言；`sub` 是当初点击的人。根据你的记录回答，字段和 execute 回答相同。`status` 是 `accepted`、`executing`、`done`、`refused`、`failed_not_sent`、`unknown` 和 `not_visible` 之一：

```json
{"status":"done", "toast":{"tone":"success", "text":"Merged into main."}}
```

- 终态会结束一条未完成的操作记录。`accepted` 或 `executing` 会把 `unknown` 的操作记录改为已接受。`unknown` 不改变任何东西。
- 如果 `sub` 已经不能再看到这个对象，回答 `not_visible`。Raft 就不显示任何私有内容。它从不表示「没有执行」。
- 只有当你的回答不是 `not_visible`，并且这个人仍然能阅读这条消息时，Raft 才显示你的 `toast`。Raft 不保存它。
- Raft 只询问 execute 当初发往的那个操作端点。如果你的注册里已经没有这个端点（你修改或删除了它，或者注册被暂停），Raft 就不再询问这条操作记录。有操作记录还没完成时，不要修改操作端点。
- 点击 24 小时后仍是 `accepted` 或 `unknown` 的操作记录会被标记为待核对。之后的终态 status 回答仍然可以结束它。Raft 永远不会重发 execute。

### 你没有记录的操作记录 {#an-operation-you-have-no-record-of}

status 请求可能针对一个你从未认领过的 `operation_id`：它的 execute 可能丢了，也可能还在路上。这种情况下绝不要回答 `not_visible`。二选一：

- 在你认领 execute 的同一个地方，用同一个原子步骤，为这个 `operation_id` 写一个「永不执行」标记。只有标记抢先写入时，才回答 `failed_not_sent`。如果是某个 execute 先认领了这条操作记录，就按那个 execute 的记录回答。标记写入之后，任何人对这个 `operation_id` 发来的 execute 都回答 `failed_not_sent`，并且什么都不做。标记至少保留 48 小时，并同时记下 `sub` 和 `installation_id`。
- 如果做不到原子操作，就回答 `unknown`。

你在认领时会拒绝 `exp` 已经过去的 execute，而这个 `exp` 永远不会晚于点击被接受后 10 分钟。所以 48 小时后删除标记，也不会放过迟到的 execute。

## 修订版本与过期的点击 {#revisions-and-stale-clicks}

每个执行操作的按钮都有一个 handle，是 Raft 读取卡片时签的。handle 只能用一次，最多有效 10 分钟，并且绑定了：

- 查看者、服务器、你的应用、它的安装和它的注册；
- 消息、消息的准确内容和链接；
- 查看者客户端的能力；
- 按钮：它的 `action_id` 和属性，以及是否需要确认；
- 卡片的 `card_revision` 和 `business_revision`。

如果 Raft 能看到的东西变了，它会拒绝这次点击，并为这个人重新读取卡片：消息被编辑或删除了，这个人不能再阅读它或撤销了登录，你的应用被卸载或停用了，或者你的注册改变了。handle 超过 10 分钟的点击也会这样被拒绝。

**Raft 看不到你的数据。** 它不拿 `card_revision` 或 `business_revision` 和任何东西比较，只是把它们传给你。在 handle 过期之前，对象变化之前读取的卡片上的点击，仍会带着旧的值到达你这里，所以要由你自己拒绝：

- `business_revision` 是卡片显示的那个对象的版本。对象每次变化都要改它，例如新的草稿、新的提交或状态变化。在 prepare 和 execute 时，如果当前版本和 `claimed.business_revision` 不同，就拒绝。
- `card_revision` 是卡片本身的版本。点击时不带任何参数，所以要让 `card_revision` 和 `action_id` 足以准确判断按钮的含义，例如用 `d42.v3` 表示「草稿 42，第 3 版」。
- 你后来禁用或删掉的按钮，在较旧的卡片上仍然可能被点击。请按你当前的规则判断，而不是按卡片上显示的内容。

两者都是你自己定的字符串，1–512 个字符。每次操作被拒绝或完成之后，查看者的客户端都会重新读取卡片，这个人就能看到它当前的状态。

## 上限 {#limits}

| 上限 | 值 | 超过时 |
| --- | --- | --- |
| prepare | 每人在每个服务器上每分钟 30 次 | `429` `RATE_LIMITED` |
| execute | 每人在每个服务器上每分钟 30 次，所有应用合计 | `429` `RATE_LIMITED` |
| 服务器本地应用的 execute | 另外，每人在每个服务器上对每个应用每分钟 10 次 | `429` `RATE_LIMITED` |
| 一个人未完成的操作记录 | 每个服务器 20 条，计入仍在进行或尚未确认的操作记录 | `429` `OPEN_OPERATIONS_CAP` |
| 一个安装未完成的操作记录 | 1,000 条，也计入等待核对的操作记录 | `429` `OPEN_OPERATIONS_CAP` |
| 一张卡片上未完成的操作记录 | 1 条：有一条未完成时，这张卡片上的其他点击会被拒绝 | `409` `VIEW_PENDING` |
| 发给你应用的 status 请求 | 每条操作记录每 2 秒最多 1 次 | Raft 根据自己的记录回答 |
| 终态更新 | 每个安装每分钟 600 次 | `429` `RATE_LIMITED`，带 `Retry-After` |

在浏览器里测试时，一次点击可能从 Raft 收到这些回答：

| 回答 | 含义 |
| --- | --- |
| `404` | 卡片操作暂不可用。客户端在本次会话中不再提供执行操作的按钮。 |
| `409` `VIEW_PENDING` | 这张卡片上之前的操作还没完成。 |
| `409` `HANDLE_USED` | 这个按钮已经用过。 |
| `410` `HANDLE_INVALID` | 卡片已过期（[见上文](#revisions-and-stale-clicks)）。客户端会重新读取它。 |
| `410` `PREPARED_INVALID` | 确认在 5 分钟后过期了，或者对不上。请重新点击。 |
| `410` `PROVIDER_NOT_ELIGIBLE` | 你的应用现在不能为这个人提供执行操作的按钮。对服务器本地应用来说：这个服务器上没有允许卡片操作，或者允许已被撤回。 |
| `429` `RATE_LIMITED`、`OPEN_OPERATIONS_CAP` | 达到了上面的某个上限。 |
| `429` `LOCK_TIMEOUT` | Raft 暂时繁忙；客户端会重试同一个请求。 |
| `502` `PREPARE_FAILED` | 你的 prepare 回答没有在 2.5 秒内到达，或者无效。 |

## 示例：批准一条回复草稿 {#example-approve-a-draft-reply}

Drafts 是一个服务器本地的客服应用。收到问题后，它写好一条回复，保存为草稿 42，然后 [以应用身份](/zh-cn/developers/raft-apps/bot/) 在消息列里发：`Draft for @dana: https://drafts.example/d/42`。负责审核的 Dana 在卡片上批准这份草稿，Drafts 随后把回复发到消息列里。

**注册** 预览回调和操作端点：

```json
{
  "origin":"https://drafts.example",
  "endpoint":"https://drafts.example/raft/preview",
  "action_endpoint":"https://drafts.example/raft/actions",
  "paths":["/d"],
  "preview_versions":[1, 2, 3]
}
```

然后由所有者或管理员在应用的设置里，为 `https://drafts.example/raft/actions` 允许卡片操作。

**回答版本 2 请求。** 对能看到草稿 42 的查看者，返回一张 block 卡片。`business_revision` 是草稿的版本，`card_revision` 写明草稿和它的版本：

```json
{
  "version":3,
  "items":[
    {
      "type":"card",
      "placement":"block",
      "title":"Draft reply to Lee",
      "card_revision":"d42.v3",
      "business_revision":"v3",
      "card":{
        "root":"main",
        "elements":{
          "main":{"type":"Stack", "props":{}, "children":["state", "text", "buttons"]},
          "state":{"type":"Badge", "props":{"text":"Waiting for review", "tone":"review"}},
          "text":{"type":"Text", "props":{"text":"Thanks for the report. The fix ships in 2.4 on Monday."}},
          "buttons":{"type":"Stack", "props":{"direction":"row"}, "children":["approve", "open"]},
          "approve":{"type":"Button", "props":{"label":"Approve", "action":{"kind":"execute", "action_id":"approve", "confirm":"prepare"}}},
          "open":{"type":"Button", "props":{"label":"Open", "variant":"ghost", "action":{"kind":"navigate", "url":"https://drafts.example/d/42"}}}
        }
      }
    }
  ]
}
```

对 Dana 以外的人，发送同一张卡片，但在 Approve 按钮的属性里加上 `"disabledReason":"Only Dana can approve this draft."`，或者干脆不放这个按钮。完全看不到这份草稿的查看者，得到 `{"version":3,"items":[]}`，也就是普通链接。

因为 Raft 没有审核过 Drafts，Dana 每次按它的执行操作的按钮，Raft 都会请 Dana 确认。

**prepare。** Dana 点击 **Approve** 时，Drafts 验证断言，检查 `sub` 是草稿 42 指定的审核人、草稿仍是 `v3`，然后回答：

```json
{
  "status":"prepared",
  "description":{
    "prepared_action_id":"5b1f0c9e-2d7a-4c1e-9f3b-8a6d2e4c7b10",
    "action_id":"approve",
    "business_revision":"v3",
    "locale":"en",
    "read_at":"2026-11-10T09:30:00Z",
    "title":"Send this reply to the thread?",
    "body":"Thanks for the report. The fix ships in 2.4 on Monday.",
    "rows":[{"label":"Draft", "value":"Version 3"}, {"label":"Posts as", "value":"Drafts"}],
    "confirm_label":"Send reply",
    "cancel_label":"Cancel"
  }
}
```

它以 `prepared_action_id` 为键，把描述和摘要保存 5 分钟。

**execute。** Dana 确认后，Drafts：

1. 验证断言，认领 `operation_id`，认领时检查 `exp`。
2. 检查 `sub` 仍是草稿 42 指定的审核人。如果草稿在此期间换了审核人，就回答 `{"status":"refused"}`。
3. 检查 `card_revision` 是 `d42.v3`，并且草稿仍是 `v3`。如果有人在此期间把草稿改成了 `v4`，就回答 `refused`。Dana 的客户端会重新读取卡片，显示第 4 版和一个新的 **Approve** 按钮。
4. 检查 prepared 记录：存在、不超过 5 分钟，摘要等于 `prepared_digest`。
5. 以应用身份把回复发到消息列，以 `operation_id` 为键记录结果，回答 `{"status":"done"}`。如果发送在任何内容发出之前就失败了，回答 `failed_not_sent`。

下一个 status 请求到达时，Drafts 回答 `done`，并带上一条提示，例如「Reply sent to the thread.」，Dana 就能看到它。

## 故障排查 {#troubleshooting}

| 现象 | 检查 |
| --- | --- |
| 你自己服务器上的人只看到 `navigate` 按钮 | 还没有人允许这个应用的卡片操作（在应用设置的**卡片按钮**里允许），允许之后你改了 `action_endpoint`，或者注册被暂停了。如果都不是，那就是查看者的客户端不会为 Raft 没审核过的应用确认点击（`unreviewed_app.v1`），比如 1.24 版之前的手机 App。 |
| 其他服务器上的人只看到 `navigate` 按钮 | 这是预期行为。只有从应用自己的服务器阅读的人才能拿到它的执行操作的按钮。 |
| 创建分享链接或发布应用之后，执行操作的按钮不能用了 | 这是预期行为。应用已经不再是只为你的服务器创建的应用，所以在任何地方都不能使用本服务器卡片操作，包括你自己的服务器。撤销链接也不会改变这一点。 |
| 某一类执行操作的按钮不见了，其他的还在 | 查看者的客户端没有为这类按钮声明 `confirm.v1` 或 `undo.v1`。 |
| 整张卡片变成了普通链接 | 回答无效。检查每个 `execute` 操作是否恰好带 `confirm` 和 `undoWindowMs` 其中之一，`action_id` 是否有重复，卡片是否超过 4 个按钮。 |
| 点击一直返回 `410` | handle 绑定的某样东西一直在变。例如部署脚本每次启动都发送不同的注册（不同的操作端点或路径集合），每次都会让屏幕上的按钮全部失效。 |
| 点击返回 `429` | 达到了某个 [上限](#limits)。服务器本地应用每人每分钟只有 10 次 execute。 |
| 用户看到「应用无法准备此操作」 | 你的 prepare 回答超过了 2.5 秒，不是带 `application/json` 的 HTTP `200`，除了 `status` 和 `description` 还有别的字段，ID 和请求里的不同，或者不符合描述的规则。 |
| 用户一直看到「结果尚未确认」 | 你没有在 2.5 秒内回答 execute，或者回答了 `accepted` 或 `unknown` 却一直没有完成。请在 10 分钟内发送终态更新，或者在 status 回答里给出终态。 |
| 终态更新返回 `410` `UPDATE_TOKEN_INVALID` | token 已经超过 10 分钟，或者属于另一个应用。改为回答下一个 status 请求。 |

请找两个人测试：一个可以执行，一个不可以。还要测试：在对象变化之前读取的卡片上点击、execute 的回答超过 2.5 秒、status 请求针对一个你从没见过的 `operation_id`、卡片打开时撤回卡片操作，以及 execute 在你的队列里等待时 `exp` 已经过去。在每种情况下，任何事情都不能发生两次，也不能为你的应用不允许的人发生任何事情。
