# 中文翻译指南与术语表

本文件约定 docs.raft.build 中文版（`content/zh-cn/`）怎么写。中文版由 Hasaki 在 Raft 的 #proj-i18n 统一维护（见 [AGENTS.md](../../AGENTS.md) 的 Translations 一节），写英文页的人不需要同步中文。

**用词以 Raft App 的中文界面为准**（slock 仓库 `packages/web/src/i18n/messages/zh-cn.ts`），其次是官网 raft.build 的中文版。两者不一致时跟 App。设计系统文档的中文版（raft-design 的 `i18n/zh/GLOSSARY.md`）用同一套用词。

## 原则

- **意思一条不改。** 规则、步骤、数字、限制、例外都要在；不增加原文没有的话，不删除原文有的话。
- **按中文习惯写，不逐字直译。** 可以调整语序、拆分长句、把被动句改成主动句。英文的祈使句（"Click …", "Don't …"）译成直接的中文祈使句（「点击……」「不要……」）。
- **不要中英混杂。** 除了下面「保持英文的词」，正文里的英文单词都要译成中文。「Reminders 是定时 wake-up signals」这种句子是错的，应写成「提醒是定时唤醒信号」。
- **界面文字照抄 App 中文版。** 文中提到按钮、菜单、标签页、设置项时，写 App 中文界面上实际显示的文字，用粗体：「点击 **评论**」「打开 **设置 → 成员**」。不知道某个界面文字的中文是什么，就去 `zh-cn.ts` 里查对应的英文；查不到时，按本表意译，不要留英文。
- **语气平实，称呼用「你」**，不用「您」。不用「强大」「无缝」「赋能」这类营销词，原文也没有。
- **句子短。** 一句话说一件事。

## 格式

- 简体中文，全角标点（，。：；？！）。引用、界面上的词语用「」，不用弯引号。
- 中文与英文单词、数字、行内代码之间加一个半角空格：「5 个 Agent」「运行 `raft integration list`」。和 App 中文界面的检查（slock 的 `zhCatalogSpacingContract`）一致。
- 省略号只用一个「…」，不用「……」或「...」（同 App 的 `zhEllipsisForm`）。
- Agent 首字母大写，不加复数：「5 个 Agent」，不写「agents」「agent」。
- 粗体、列表、表格、提示框（`::: tip` 等）的结构与原文一一对应；表格的行数和列数不变。提示框的标题要翻译。

## 和英文页保持一致的部分

一份中文页是 `content/<路径>/index.md` 的译文，放在 `content/zh-cn/<路径>/index.md`。

- **标题**：数量、层级和顺序与英文页完全一致。每个二级及以下标题带上英文页的锚点：`## 开始一个消息列 {#starting-a-thread}`，这样中英文页之间的 `#锚点` 链接和分享出去的网址都通用。
- **代码块**：原样保留，只有注释可以翻译。命令、参数、字符串、JSON、示意图（`text` 代码块）一个字都不改。
- **行内代码**、命令名、文件路径、URL、环境变量、API 字段原样保留。
- **链接**：站内链接加 `/zh-cn` 前缀，锚点用英文页的锚点：`[外部 Agent](/zh-cn/features/agents/external/#connecting)`。站外链接原样保留。
- **图片**：用英文页的同一张图（相对路径指回英文页目录），只翻译 alt 文字。
- **front matter**：键和英文页相同。`llms_section` 是英文的值加上 ` zh-CN`，`llms_order` 是英文的值加 1000，`llms_summary`、`title`、`description` 要翻译。

`pnpm check:zh` 检查上面这些（标题、锚点、代码块、链接、图片、表格、空格和用词），`pnpm sync:zh-anchors <路径>` 给中文页的标题补上英文页的锚点（需要先 `pnpm build`）。

## 保持英文的词

- **产品和组件名**：Raft、Raft Computer、Raft CLI、Raft SDK、Login with Raft、Stamp、Vault、MEMORY.md。
- **Agent**：不译，首字母大写。
- **技术名词**：API、CLI、SDK、OAuth、OIDC、JWT、token、MCP、URL、JSON、Webhook、manifest、client key、scope 等开发者通用的词保留英文；第一次出现时可以加中文说明，比如「权限范围（scope）」。
- **运行时和第三方产品名**：Claude Code、Codex、Cursor、GitHub、Slack 等。
- **代码里的标识符**：`createRaftClient`、`install_required` 等。

## 术语表

| English | 中文 | 说明 |
| --- | --- | --- |
| agent | Agent | 不译，首字母大写，不加复数 |
| human (与 Agent 相对) | 人类 | 「人类成员」；泛指时用「人」：「人和 Agent」 |
| people and agents | 人和 Agent | |
| member | 成员 | |
| owner / admin / guest | 所有者 / 管理员 / 访客 | 服务器角色 |
| role | 角色 | |
| server | 服务器 | |
| workspace（Raft 的工作空间，即服务器） | 工作空间 | App：「服务器是你的成员、Agent、频道和计算机所在的工作空间」 |
| workspace（Agent 的工作目录） | 工作区 | App 里 Agent 详情的 **工作区** 标签页 |
| channel | 频道 | |
| public / private channel | 公开频道 / 私有频道 | |
| joint channel | 联合频道 | |
| direct message, DM | 私信 | |
| thread | 消息列 | App 的叫法，不用「线程」「讨论串」 |
| reply in thread | 在消息列中回复 | |
| top-level message | 顶层消息 | |
| message | 消息 | |
| mention, @mention | 提及、@ 提及 | |
| reaction | 回应 | |
| Saved（侧栏里收藏的消息列表）/ save a message | 已保存 / 收藏 | 侧栏标签是 **已保存**；收藏一条消息的操作是 **收藏** |
| pin / pinned | 置顶 / 已置顶 | |
| unread | 未读 | |
| follow / unfollow | 关注 / 取消关注 | 消息列 |
| mute | 静音 | |
| activity | 动态 | 标签栏和 Agent 详情页的 **动态** |
| inbox | 收件箱 | |
| notification | 通知 | push notification：推送通知 |
| task | 任务 | |
| task status: To Do / In Progress / In Review / Done / Closed | 待办 / 进行中 / 待确认 / 完成 / 已关闭 | |
| claim | 认领 | |
| assignee | 负责人 | |
| reminder | 提醒 | |
| snooze | 推迟 | |
| file / attachment | 文件 / 附件 | |
| comment | 评论 | |
| search | 搜索 | |
| Home / Activity / Tasks / Search / More | 主页 / 动态 / 任务 / 搜索 / 更多 | 手机底部标签栏 |
| settings | 设置 | |
| sidebar | 侧栏 | App 的叫法，不用「侧边栏」 |
| composer | 消息输入框 | 发消息的那个输入区 |
| account | 账户 | 不用「账号」 |
| action card | 操作卡片 | Agent 附在消息上、等人确认的卡片 |
| redirect URL, callback URL | 回调地址 | 表单字段按 App：Return URL 是「返回网址」，Homepage URL 是「主页网址」 |
| Experimental（文档里的标记） | 实验性 | |
| profile | 资料 | |
| computer | 计算机 | 产品名 Raft Computer 不译 |
| daemon | 守护进程 | |
| runtime | 运行时 | Agent 运行所用的程序（Claude Code、Codex…） |
| model | 模型 | |
| memory | 记忆 | 文件名 MEMORY.md 不译 |
| skill | 技能 | App 里的标签页标题是 **Skills** |
| session | 会话 | |
| restart / reset | 重启 / 重置 | |
| external agent | 外部 Agent | |
| onboarding | 新成员引导 | onboarding agent：引导 Agent |
| app | 应用 | Raft Apps（第三方应用平台）写「Raft 应用」 |
| install / uninstall | 安装 / 卸载 | |
| marketplace | 市场 | |
| integration | 集成 | |
| sign in, log in / sign up | 登录 / 注册 | |
| credential | 凭据 | |
| API key | API 密钥 | |
| review / approve | 审核 / 批准 | |
| hand off, handoff | 交接 | |
| plan / billing / usage | 套餐 / 账单 / 用量 | |
| limit / allowance | 上限 / 额度 | |
| desktop / web / phone | 桌面端 / 网页版 / 手机 | |
| draft | 草稿 | |
| archive | 归档 | |
| invite / invite link | 邀请 / 邀请链接 | |
| build（品牌语境，"build with Raft"） | 创造 | 官网用词；技术语境的 build 译作「构建」 |
