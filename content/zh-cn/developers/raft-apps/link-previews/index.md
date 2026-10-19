---
llms_section: "Developers zh-CN"
llms_order: 1892
llms_summary: "注册 App 链接预览，验证查看者回调，并返回只读 json-render 卡片。包含当前可用状态与 v1 限制。"
---

# App 链接预览

App 可以将自己域名下的链接显示为 Raft 聊天中的标题和只读小卡片。例如，PR 链接可以展示标题、审查状态和简短描述。App 返回 JSON，Raft 使用 [json-render](https://json-render.dev/docs) 和自身组件绘制；App 不需要向聊天客户端上传 JavaScript 或 HTML。后端可以直接根据业务数据构造 JSON，不必安装 json-render，也不必调用语言模型。

链接预览目前仅在测试环境开放，正式环境暂不可用。

## 开始之前

你需要一个[已注册的 Raft App](/zh-cn/developers/raft-apps/build/)、自己控制的公开 HTTPS 域名，以及该域名下的服务端回调。查看者所在的 Server 必须有这个 App 的有效安装。

查看者需要已经通过 [Login with Raft](/zh-cn/developers/login-with-raft/) 登录此 App。Raft 要求同一个 App、同一个 Server 下存在未过期、未撤销的人类 access token，包含 `openid profile`，且仍符合 App 当前声明的 scope。Raft 不会把这个 token 转发给回调，也不会因为查看链接就自动登录。条件不满足时，原始链接仍然可见。

Raft 签名的身份断言用于识别查看者。**App 后端仍须检查此人能否访问链接指向的资源。** 不能因为发送者有权查看，就把私有 PR 或工单摘要展示给所有收件人。

## 1. 证明域名归属

在 `https://your-app.example/.well-known/raft-link-preview.json` 提供以下 JSON：

```json
{"client_id":"your-registered-client-key"}
```

Raft 在注册或更新渲染器时读取此文件。文件的 `client_id` 必须与发起注册请求的 App 一致。v1 中，一个 HTTPS origin 在整个 Raft 平台上只能归一个已注册 App 使用。

转让或放弃域名前，请删除对应注册。域名归属在注册时校验，不会在每次预览请求时持续复验。

## 2. 注册回调和路径

App 后端使用自己的客户端 ID 和密钥进行 **HTTP Basic** 认证，向 Raft API 域名发送 `PUT /api/oauth/link-preview`：

```json
{
  "origin":"https://your-app.example",
  "endpoint":"https://your-app.example/preview",
  "paths":["/pr", "/issues"]
}
```

客户端密钥只放在后端的密钥存储中，不要放进聊天、浏览器代码、版本控制或 URL。

| 字段 | 约定 |
| --- | --- |
| `origin` | 规范化的 HTTPS origin，不含末尾斜杠、凭据、fragment 或非默认端口。 |
| `endpoint` | 与 origin 相同的 HTTPS 回调，不含 query 或 fragment。 |
| `paths` | 1–10 个路径前缀。`/pr` 匹配 `/pr` 和 `/pr/123`，不匹配 `/private`。不支持通配符。 |

后端接口根据客户端凭据确定 App，不接受调用者另外指定一个 App ID：

| 请求 | 结果 |
| --- | --- |
| `PUT /api/oauth/link-preview` | 校验域名，创建或替换此 App 的注册，返回 `{ "registration": … }`。 |
| `GET /api/oauth/link-preview` | 返回此 App 的注册；不存在时返回 `{ "registration": null }`。 |
| `DELETE /api/oauth/link-preview` | 删除此 App 的注册，返回 `204`。 |

凭据无效返回 `401`；配置无效或归属证明不匹配返回 `400`；origin 已被另一 App 注册返回 `409`；证明文件读取失败或其他注册失败返回 `502`。Raft 不跟随重定向，也不会访问私有或特殊用途网络地址。


### 发送注册请求

以下是仅在后端运行的 Node 示例。请通过密钥管理器注入环境变量，不要把凭据值粘贴到命令或聊天中。

```js
const response = await fetch(`${process.env.RAFT_API_ORIGIN}/api/oauth/link-preview`, {
  method: "PUT",
  redirect: "error",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + Buffer.from(
      `${process.env.RAFT_CLIENT_ID}:${process.env.RAFT_CLIENT_SECRET}`
    ).toString("base64"),
  },
  body: JSON.stringify({
    origin: "https://your-app.example",
    endpoint: "https://your-app.example/preview",
    paths: ["/pr"],
  }),
});
if (!response.ok) throw new Error(`Registration failed: HTTP ${response.status}`);
```

## 3. 验证预览请求

符合条件的查看者阅读包含匹配 URL 的消息时，Raft 向回调发送：

```json
{
  "version":1,
  "url":"https://your-app.example/pr/123",
  "request_id":"request-uuid"
}
```

Raft 只发送匹配的 URL，不发送消息正文或频道历史。`Authorization: Bearer …` 中是专用于预览回调的签名断言。使用你**预先配置的 Raft issuer** 所公布的 JWKS 验签，不要根据未验证的 token 字段选择 JWKS 地址。

读取 App 私有数据之前，必须检查：

| Header 或 claim | 必须满足 |
| --- | --- |
| `alg`、`kid` | `ES256`，使用匹配的 Raft 公钥验证签名。 |
| `typ` | `raft-link-preview+jwt` |
| `iss` | 与已配置的 issuer 完全一致；Server-scoped 接入的 issuer 包含 `/oidc/<server-slug>`。 |
| `aud` | `urn:raft:link-preview:<your-client-key>` |
| `token_use`、`type` | 分别为 `link_preview`、`human`。 |
| `iat`、`nbf`、`exp` | 在有效时间窗内；断言有效期为 30 秒。 |
| `jti` | 等于 JSON 中的 `request_id`。 |
| `url_sha256` | 对 JSON 中原样的 `url` 字符串按 UTF-8 计算 SHA-256，使用十六进制摘要。 |
| `server_id`、`installation_id` | 符合预期的 Server 和安装上下文。 |
| `sub` | 查看者的人类 ID，与 Login with Raft 使用的身份一致；还需用它检查 App 自己的资源权限。 |

这份断言**不是** OAuth access token 或 ID token，不应被业务写接口或其他 App API 接受。不要记录断言、原始 URL 或私有回调正文。

## 4. 返回标题和可选卡片

返回 HTTP `200`，并设置 `Content-Type: application/json`：

```json
{
  "version":1,
  "title":"PR 123：修复登录",
  "card":{
    "root":"summary",
    "elements":{
      "summary":{"type":"Stack","props":{},"children":["status","detail"]},
      "status":{"type":"Badge","props":{"text":"待处理"}},
      "detail":{"type":"Text","props":{"text":"可以开始审查","tone":"muted"}}
    }
  }
}
```

`version` 和 `title` 必填，`card` 可选。点击标题打开原始 URL；App 名称由 Raft 的注册信息提供。

| 组件 | Props 与子节点 |
| --- | --- |
| `Stack` | `props` 为空对象；可选 `children`，最多包含 12 个元素 ID。 |
| `Text` | `text` 为 1–500 个字符；可选 `tone` 为 `default` 或 `muted`。不接受子节点。 |
| `Badge` | `text` 为 1–60 个字符。不接受子节点。 |

标题长度为 1–160 个字符。每张卡片最多 16 个元素；任何分支最多经过 4 条父子连接，即包含根节点最多 5 层。元素 ID 以字母开头，最多 64 个字母、数字、下划线或连字符，不允许保留的 prototype 名称。所有元素必须组成一棵树，不能有缺失引用、环或被多个父节点共用的子节点。

这是受限的 json-render 组件目录，不接受表达式、state、watcher、visibility 规则、自定义样式、任意 HTML、脚本、图片、action 或额外链接目标。文本按字面显示。

## 回退与隐私

Raft 每条消息最多考虑 3 个符合条件的可见 HTTPS 链接；含凭据、fragment 或非默认端口的链接不符合条件。代码、图片地址和未使用的 Markdown 链接定义不会触发回调。请求总时限为 3 秒（包含 DNS），响应最多为 32 KiB JSON。超时、格式错误、无权限或失败时，普通链接保持可用。

预览是查看者个人的视图，不会保存到消息正文，也不会在不同查看者之间共用缓存。Raft 返回回调结果前，会重新检查 App、安装、查看者授权、注册版本，以及原消息的可见性和内容。切换查看者或 Server 后，浏览器会丢弃旧请求的结果。

v1 支持人类的普通聊天和线程视图。联合频道的存储投影、转发消息包、操作卡片和 Agent CLI 文本继续保留原有链接行为，没有单独的浏览器配置开关。

## 运行示例

下载不依赖第三方包的 Node 示例：[server.mjs](https://github.com/botiverse/create-raft-app/blob/main/examples/app-link-preview/server.mjs) 和 [server.test.mjs](https://github.com/botiverse/create-raft-app/blob/main/examples/app-link-preview/server.test.mjs)，将两个文件保存在同一本地目录中。

示例提供域名证明与回调，验证 Raft 签名及专用用途字段，并为明确允许的查看者返回合成 PR 卡片。使用 Node 24+，放到 HTTPS 反向代理后运行：

```sh
RAFT_ISSUER=https://api.raft.build/oidc/YOUR_SERVER_SLUG \
RAFT_CLIENT_ID=your-client-key \
RAFT_SERVER_ID=your-server-uuid \
APP_ORIGIN=https://your-app.example \
ALLOWED_VIEWER_IDS=your-test-human-uuid \
node server.mjs
```

进程监听 `127.0.0.1:8789`，可通过 `PORT` 覆盖。将公开 HTTPS 域名路由到该进程，再通过上面的 API 注册 `/preview`。用白名单中的人类身份登录已安装的 App，然后发送 `https://your-app.example/pr/123` 链接。回调本身不需要客户端密钥，只有注册时才需要。

执行 `node --test server.test.mjs` 可运行独立的签名与权限回归。实际接入时，将示例白名单替换为 App 的真实资源权限判断。示例不会连接真实 Stamp 或 GitHub 数据。

## 排查问题

| 现象 | 检查内容 |
| --- | --- |
| 注册返回 `404` | 确认目标环境已开放链接预览，请求使用的是该环境的 API 地址。 |
| 注册返回 `400` | 检查 origin／路径格式、回调 origin，以及证明文件是否包含此 App 的精确 client key。 |
| 注册返回 `409` | origin 已归另一 App 使用，应协调删除旧注册，不要通过变换域名拼写绕过。 |
| 注册返回 `502` | 检查证明地址的公开 DNS、TLS、JSON Content-Type 和可达性。重定向或私网目标会被拒绝。 |
| 注册成功却只显示普通链接 | 检查安装是否有效、查看者当前 Login with Raft 授权、路径匹配、三个链接的上限及回调响应。App 自己的资源权限拒绝时，回退是正确行为。 |
| 资源更新后，已打开的卡片没有变化 | v1 没有主动推送更新 API 或持续轮询。新的查看请求会读取当前数据，测试时可以重新加载消息视图。 |

验收时使用两个人：一人可以访问 App 资源，另一人无权访问。还应测试撤销登录、卸载 App、回调超时、无效 JSON，以及回调尚未结束时编辑或删除消息。这些情况下都不能向无权限的人显示私有内容，原始链接仍应可用。
