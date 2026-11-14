---
llms_section: "Developers zh-CN"
llms_order: 1892
llms_summary: "注册由应用提供的链接预览，验证查看者回调，并返回只读的 json-render 卡片。包含接入条件、v1 的限制，以及如何声明更新的版本来使用 block 卡片和按钮。"
---

# 应用链接预览

应用可以把它自己域名下的链接，在 Raft 聊天中显示为一个标题和一张只读的小卡片。例如，PR 链接可以显示标题、审核状态和一段简短描述。应用返回 JSON；Raft 用 [json-render](https://json-render.dev/docs) 和 Raft 组件把它渲染出来。你的应用不会向聊天客户端上传 JavaScript 或 HTML。你的后端可以直接用业务数据构造这段 JSON，不需要安装 json-render，也不需要调用语言模型。

## 开始之前 {#before-you-start}

你需要一个 [已注册的 Raft 应用](/zh-cn/developers/raft-apps/build/)、一个由你控制的公开 HTTPS 域名，以及这个域名上的后端回调。应用必须处于启用状态，并且在查看者所在的服务器上有有效的安装。

查看者必须已经通过 [Login with Raft](/zh-cn/developers/login-with-raft/) 登录过这个应用。Raft 要求存在一个属于同一应用、同一服务器的人类访问 token：未过期、未被撤销，带有 `openid profile` 权限范围（scope），并且仍在应用当前声明的 scope 之内。Raft 不会把这个 token 转发给你的回调，也不会自动替任何人登录。不满足这些条件时，原始链接照常显示。

Raft 身份断言用来识别查看者。**你的后端仍然必须检查这个查看者能否访问链接指向的资源。** 不要仅仅因为发送者能看到某个私有 PR 或工单，就返回它的摘要。

## 1. 证明你拥有这个域名 {#_1-prove-ownership-of-the-domain}

在 `https://your-app.example/.well-known/raft-link-preview.json` 提供以下 JSON：

```json
{"client_id":"your-registered-client-key"}
```

Raft 会在你注册或更新渲染器时读取这个文件。其中的 `client_id` 必须是发起注册请求的应用的客户端 ID，或者是这个应用的某个[旧 ID](/zh-cn/developers/login-with-raft/#changing-your-client-id)。Raft 发给你的链接预览、resolve 和卡片操作请求，`aud` 用的是这个文件写明的 ID，所以更改客户端 ID 之后，更新这个文件就能切换到新 ID。在 v1 中，每个 HTTPS 源（origin）在整个 Raft 中只能归一个应用所有。

在转让或放弃某个域名之前，先删除它的注册。所有权只在注册时检查，不会在每次预览请求时反复检查。

## 2. 注册回调和路径 {#_2-register-the-callback-and-paths}

在你的应用后端，以 **HTTP Basic** 方式用应用的客户端 ID 和密钥认证，然后在你的 Raft API 源上调用 `PUT /api/oauth/link-preview`：

```json
{
  "origin":"https://your-app.example",
  "endpoint":"https://your-app.example/preview",
  "paths":["/pr", "/issues"]
}
```

把客户端密钥放在后端的密钥存储中。绝不要把它放进聊天、浏览器代码、源代码管理或 URL。

| 字段 | 约定 |
| --- | --- |
| `origin` | 规范的 HTTPS 源，末尾不带斜杠，不含凭据、片段或非默认端口。 |
| `endpoint` | 同一源上的 HTTPS 回调地址，不带查询参数或片段。 |
| `paths` | 1 到 10 个路径前缀。`/pr` 匹配 `/pr` 和 `/pr/123`，但不匹配 `/private`。不支持通配符。 |

这些后端 API 根据客户端凭据确定是哪个应用，而不是根据调用方传入的应用 ID：

| 请求 | 结果 |
| --- | --- |
| `PUT /api/oauth/link-preview` | 验证域名，创建或替换这个应用的注册，并返回 `{ "registration": … }`。 |
| `GET /api/oauth/link-preview` | 返回这个应用的注册；没有注册时返回 `{ "registration": null }`。 |
| `DELETE /api/oauth/link-preview` | 删除这个应用的注册；返回 `204`。 |

凭据无效时返回 `401`。配置无效或所有权证明不匹配时返回 `400`；源已被其他应用注册时返回 `409`。获取所有权证明失败或其他注册失败时返回 `502`。Raft 不会跟随重定向，也不会访问私有或特殊用途的网络地址。


### 发起注册请求 {#make-the-registration-request}

下面是一个只在后端运行的 Node 示例。请通过你的密钥管理工具设置这些环境变量；不要把凭据的值粘贴到命令或消息里。

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

## 3. 验证预览请求 {#_3-verify-the-preview-request}

符合条件的查看者阅读带有匹配 URL 的消息时，Raft 会向你的回调发送 HTTP **POST** 请求，请求头为 `Content-Type: application/json`：

```json
{
  "version":1,
  "url":"https://your-app.example/pr/123",
  "request_id":"request-uuid"
}
```

Raft 只发送匹配到的 URL，不发送消息正文或频道历史。`Authorization: Bearer …` 请求头里是一个专用的签名断言。请用 **你配置的 Raft 签发者（issuer）** 公布的 JWKS 验证它。绝不要根据未经验证的 token 声明来选择 JWKS URL。

读取应用的私有数据之前，必须确认以下值：

| 头部字段或声明 | 必须做的检查 |
| --- | --- |
| `alg`、`kid` | `ES256`；用公布的、与之匹配的 Raft 密钥验证签名。 |
| `typ` | `raft-link-preview+jwt` |
| `iss` | 与你配置的签发者完全一致：`<Raft API origin>/oidc/<server-slug>`。版本 1 请求使用这种限定到服务器的形式。[版本 2 请求](#newer-versions)改用 ID 表示服务器。 |
| `aud` | `urn:raft:link-preview:<your-client-key>` |
| `token_use`、`type` | `link_preview`、`human` |
| `iat`、`nbf`、`exp` | 处于有效时间窗口内；断言的有效期是 30 秒。 |
| `jti` | 等于 JSON 中的 `request_id`。 |
| `url_sha256` | JSON 中 `url` 字符串原样按 UTF-8 编码后的 SHA-256 十六进制摘要。 |
| `server_id`、`installation_id` | 预期的服务器和安装上下文。 |
| `sub` | 查看者的人类 ID，与 Login with Raft 使用的身份相同；用它执行你的资源访问控制（ACL）。 |

这个断言 **不是** OAuth 访问 token，也不是 ID token。不要用它来执行业务上的修改操作，也不要用于无关的应用 API。不要记录断言、原始 URL 或私有的回调请求体。

## 4. 返回标题和可选的卡片 {#_4-return-a-title-and-optional-card}

返回 HTTP `200`，`Content-Type: application/json`：

```json
{
  "version":1,
  "title":"PR 123: Fix sign-in",
  "card":{
    "root":"summary",
    "elements":{
      "summary":{"type":"Stack","props":{},"children":["status","detail"]},
      "status":{"type":"Badge","props":{"text":"Open"}},
      "detail":{"type":"Text","props":{"text":"Ready for review","tone":"muted"}}
    }
  }
}
```

`version` 和 `title` 必填；`card` 可选。点击标题会打开原始 URL。Raft 根据自己的注册记录标明卡片来自哪个应用。

| 组件 | 属性与子元素 |
| --- | --- |
| `Stack` | `props` 为空；可选的 `children` 最多包含 12 个元素 ID。 |
| `Text` | `text`：1–500 个字符；可选的 `tone`：`default` 或 `muted`。没有子元素。 |
| `Badge` | `text`：1–60 个字符。没有子元素。 |

标题长度为 1–160 个字符。一张卡片最多包含 16 个元素；任何一条分支上，父元素到子元素的连接最多 4 条（连同根节点共 5 层）。元素 ID 以字母开头，最多 64 个字符，只能包含字母、数字、下划线或连字符；不能使用保留的原型名称。所有元素必须属于同一棵树，不能有缺失的引用、循环或共享的子元素。

这是一个受限的 json-render 组件目录。不接受表达式、状态、监听器、可见性规则、自定义样式、任意 HTML、脚本、图片、操作和额外的链接目标。文本按字面原样渲染。

## 5. 声明更新的版本，使用 block 卡片和按钮 {#newer-versions}

上面讲的都是版本 1：链接上的一张只读卡片。更新的版本可以让应用在消息里显示 block 卡片，并加上按钮。应用只有声明了才会用到它们。只要查看者的客户端用不了更新的版本，Raft 就继续发版本 1，所以你的回调必须始终能回答版本 1。

在注册里加上 `preview_versions`：

```json
{
  "origin":"https://your-app.example",
  "endpoint":"https://your-app.example/preview",
  "paths":["/pr", "/issues"],
  "preview_versions":[1, 2, 3]
}
```

这个列表必须包含 1，不能重复，3 必须和 2 一起声明。其他值都返回 `400`。

**每次 `PUT` 都要带上它。** `PUT` 会替换整条注册，不带 `preview_versions` 的 `PUT` 会把应用退回 `[1]`，而且不报错。发生这种情况时，Raft 里 My Apps 下的应用页面会提示它的预览是只读的。用 `GET /api/oauth/link-preview` 可以查看已保存的值，字段名是 `previewVersions`。

修改从下一次读取开始生效，不需要市场审核，已打开卡片上的按钮也不受影响。

### 版本 2 请求 {#the-version-2-request}

声明了 2 的应用会收到下面的请求体，并带上 `Accept-Language` 请求头：

```json
{
  "version":2,
  "url":"https://your-app.example/pr/123",
  "request_id":"request-uuid",
  "client_capabilities":["card.v2", "button.v1", "block.v1", "preview.v3"],
  "locale":"en"
}
```

验证方式和[第 3 步](#_3-verify-the-preview-request)相同，只有一处不同：**`iss` 用 ID 表示服务器**，形式是 `<Raft API origin>/oidc/<server-id>`。所以版本 2 要接受这种形式，版本 1 仍用 slug 形式。`<server-id>` 与断言中 `server_id` 声明的值相同。

**按请求体的 `version` 分别处理。** 同一个回调两种请求都会收到：`version: 1` 的请求用版本 1 回答，`version: 2` 的请求用版本 2 或 3 回答。用版本 1 回答版本 2 请求是无效的。

版本 2 请求失败后，Raft 不会改用版本 1 重试：无效的回答只显示普通链接。请在回调能回答版本 2 之后再声明 2。

### 版本 3 回答 {#the-version-3-answer}

没有单独的版本 3 请求。用版本 3 回答版本 2 请求，它是一个按顺序列出要显示什么的列表，Raft 只显示你列出的内容：

```json
{
  "version":3,
  "items":[
    {"type":"inline", "title":"PR 123"},
    {
      "type":"card",
      "placement":"block",
      "title":"PR 123: Fix sign-in",
      "card_revision":"r1",
      "business_revision":"b1",
      "card":{
        "root":"summary",
        "elements":{
          "summary":{"type":"Stack", "props":{}, "children":["status", "detail", "open"]},
          "status":{"type":"Badge", "props":{"text":"Open"}},
          "detail":{"type":"Text", "props":{"text":"Ready for review", "tone":"muted"}},
          "open":{"type":"Button", "props":{"label":"Review", "action":{"kind":"navigate", "url":"https://your-app.example/pr/123/files"}}}
        }
      }
    }
  ]
}
```

| 项目 | Raft 显示什么 |
| --- | --- |
| `inline` | 链接变成一个带这个 `title` 的小标签。没有它时，hover 卡片的小标签使用卡片的 `title`；只有 block 卡片时，链接保持原样。 |
| `placement` 为 `"block"` 的 `card` | 卡片显示在消息里，位于链接所在段落之后。每条消息最多三张。 |
| `placement` 为 `"hover"` 的 `card` | 把鼠标移到小标签上时显示卡片。 |
| `[]`（空的 `items`） | 只显示普通链接。 |

`inline` 和 `card` 各最多一个；无效的回答只显示普通链接，Raft 不认识的项目类型会被跳过。`card_revision` 和 `business_revision` 是你自己定的字符串（1–512 个字符）：卡片变了就改 `card_revision`，卡片显示的对象变了就改 `business_revision`。

`inline.title` 为 1–80 个字符，卡片的 `title` 为 1–160 个字符。一张卡片最多 4 个按钮，每个 `label` 为 1–40 个字符。已知项目上出现未知字段、`items` 超过 8 项，或 `navigate` 的 URL 不在你的源上，整个回答都会无效，查看者只看到普通链接。

你可以用版本 3 回答所有版本 2 请求。如果查看者的 `client_capabilities` 没有列出 `preview.v3`，Raft 会转换你的回答：block 卡片变成小标签，卡片在悬停时显示；没有卡片的 `inline` 变成普通链接。

**按钮：** 任何应用都可以保留 `navigate` 按钮，它打开你的源上的一个 URL。要执行操作的按钮需要有生效中操作端点的官方应用（已发布的应用，端点要通过 Marketplace 审核）；或者是服务器本地应用，在它自己的服务器上阅读，并且由那里能管理集成的人允许了它的卡片操作。其他应用卡片上的这类按钮会被 Raft 移除，其他服务器上的查看者也拿不到服务器本地应用的这类按钮。详见 [链接卡片操作](/zh-cn/developers/raft-apps/link-card-actions/)。

**状态标签：** 卡片里的 `Badge` 有 `text`（1–60 个字符）和可选的 `tone`：`neutral`（默认）、`review`、`progress`、`warning`、`action`、`done` 或 `closed`。还可以带 `color`，一个 `#RRGGBB` 格式的十六进制颜色，用你自己的颜色表示状态（比如 Stamp 的「已合并」是绿色）：

```json
"status":{"type":"Badge", "props":{"text":"Merged", "tone":"done", "color":"#218358"}}
```

Raft 只在 block 卡片上画 `color`，而且只对 `client_capabilities` 里有 `badge.color.v1` 的查看者画：标签用你的颜色填充，文字由 Raft 按对比度选黑色或白色，亮色和暗色模式都一样。其他查看者看到的是 `tone` 对应的样式，所以 `tone` 也要一直写上，并且用标签的文字说清楚状态，颜色只是辅助。不是 `#RRGGBB` 格式的 `color` 会被丢掉，不会报错，标签退回 `tone` 的样式。`inline` 项的标签带 `color` 会让整个回答无效。

## 回退与隐私 {#fallback-and-privacy}

Raft 会按消息中的顺序，**在匹配应用注册之前**，先取出 **前十个符合 URL 规则、互不相同的可见 HTTPS URL**（较旧的客户端是前三个）。链接指向的网站即使没有注册渲染器，也计入这个上限；超出上限的 URL 不再考虑。包含凭据、片段、非默认端口、IP 字面量主机或不带点的主机名的 URL 不符合条件。代码、图片地址和未使用的 Markdown 链接定义不会触发回调。请求的时限是三秒，包括 DNS 解析；响应必须是不超过 32 KiB 的 JSON。响应缓慢、格式错误、未授权或失败时，普通链接保持原样。

预览获取请求的上限是每个查看者在每个服务器上每分钟 60 次。超过上限后，原始链接照常显示。

预览是个人视图：它不会保存到消息正文中，也不会放进跨查看者共享的缓存。Raft 在返回回调结果之前，会重新检查应用、安装、查看者授权、注册修订版本，以及消息的可见性和内容。切换查看者或服务器时，浏览器会丢弃较早发出的请求。

在 v1 中，链接预览支持人类用户的普通聊天视图和消息列视图。联合频道的存储投影、转发的消息合集、操作卡片和 Agent CLI 记录保持原有的链接行为。浏览器端没有单独的配置开关。

## 运行示例 {#run-the-example}

下载这个无依赖的 Node 示例：[server.mjs](https://github.com/botiverse/create-raft-app/blob/main/examples/app-link-preview/server.mjs) 和 [server.test.mjs](https://github.com/botiverse/create-raft-app/blob/main/examples/app-link-preview/server.test.mjs)。把两个文件放在同一个本地目录中。

它提供域名证明和回调，验证 Raft 的签名和限定用途的声明，并只为允许列表中明确列出的查看者返回一张模拟的 PR 卡片。这个示例只回答版本 1：在[声明更新的版本](#newer-versions)之前，请加上处理版本 2 的分支，并接受用 ID 表示服务器的 `iss` 形式。使用 Node 24 及以上版本，放在你的 HTTPS 反向代理后面运行：

```sh
RAFT_ISSUER=https://api.raft.build/oidc/YOUR_SERVER_SLUG \
RAFT_CLIENT_ID=your-client-key \
RAFT_SERVER_ID=your-server-uuid \
RAFT_INSTALLATION_ID=your-installation-uuid \
APP_ORIGIN=https://your-app.example \
ALLOWED_VIEWER_IDS=your-test-human-uuid \
node server.mjs
```

进程监听 `127.0.0.1:8789`（可以用 `PORT` 覆盖）。请配置该服务器中应用的预期安装 ID，并在返回数据前将它与签名断言中的安装 ID 比较。你的后端可以使用应用的客户端凭据[查找安装 ID](/zh-cn/developers/raft-apps/bot/#_2-get-the-per-server-grant)。把你的公开 HTTPS 域名路由到这个进程，然后用上面的 API 注册 `/preview`。以允许列表中的人类用户身份登录已安装的应用，再发送一条 `https://your-app.example/pr/123` 链接。回调本身不需要客户端密钥；只有注册和安装查询需要。

运行 `node --test server.test.mjs`，可以单独对签名和访问检查做回归测试。请把示例中的允许列表换成你应用真实的资源权限。这个示例不会连接真实的 Stamp 或 GitHub 数据。

## 故障排查 {#troubleshooting}

| 现象 | 检查 |
| --- | --- |
| 注册返回 `404` | 确认目标环境已经开放链接预览，并且请求发往这个环境的 API 源。 |
| 注册返回 `400` | 检查源和路径是否符合规范写法、回调所在的源，以及证明文件是否包含这个应用准确的 client key。 |
| 注册返回 `409` | 这个源已经归另一个应用所有。不要换一种域名写法来绕过；请协调删除旧的注册。 |
| 注册返回 `502` | 检查公共 DNS、TLS、JSON 内容类型，以及所有权证明端点能否访问。重定向和私有网络目标会被拒绝。 |
| 注册成功，但只显示普通链接 | 检查安装是否有效、查看者当前的 Login with Raft 授权、路径是否匹配、链接数量上限，以及回调响应。应用私有 ACL 拒绝访问时回退为普通链接，这是正确的行为。 |
| 声明了更新的版本，预览仍然是只读的 | 用 `GET /api/oauth/link-preview` 检查 `previewVersions`。不带 `preview_versions` 的 `PUT` 会退回 `[1]`。使用较旧客户端的查看者仍然拿到版本 1，所以请在最新的网页或手机 App 上测试。 |
| 资源变了，但已经打开的卡片没有更新 | 在 v1 中，没有推送更新的 API，也不会持续轮询。新的查看请求会获取最新数据；重新加载消息视图即可测试。 |

请找两个人测试：一个能访问应用资源，一个不能。还要测试登录被撤销、应用被卸载、回调超时、JSON 无效，以及回调还在进行时编辑或删除消息的情况。在每种情况下，私有内容都不能展示给未授权的查看者，原始链接也必须仍然可用。
