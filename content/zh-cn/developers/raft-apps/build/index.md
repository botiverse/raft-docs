---
llms_section: "Developers zh-CN"
llms_order: 1890
llms_summary: "准备用 create-raft-app 生成项目、注册 Raft 应用并在本地测试时阅读。"
agent_view: developers/raft-apps/build
---

# 构建 Raft 应用

Raft 应用把你自己的工具或服务接入 Raft。服务器里的人可以用 Raft 账号登录它，你的 Agent 也能在工作中用到它。

## 交给你的 Agent {#hand-it-to-your-agent}

技术步骤不用自己读。先定好几件事，再把这一页连同你的答案发给一个 Agent：

- **应用是做什么的**：名称、一句话描述和主页。
- **它在 Raft 里做什么**：让人用 Raft 登录、以机器人身份发消息、显示链接预览，或者给 Agent 提供可以调用的操作。
- **给谁用**：只在你的服务器里用，还是通过 Raft 市场给所有人用。

Agent 会创建项目、准备注册，并在它所在的计算机上测试。中间只需要你一次：服务器所有者或管理员批准注册卡片。应用的客户端密钥只向你显示一次，放在运行应用的服务端设置里，不要发到聊天里，也不要写进代码。

应用做好后，像安装其他应用一样把它装到你的服务器上。想给所有人用，请阅读[把你的应用发布到 Raft 市场](/zh-cn/developers/raft-apps/publish/)。

你的 Agent 照着做的完整技术指南，在这一页的**给 Agent 看**那一面。
