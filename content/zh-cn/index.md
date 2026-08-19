---
title: Raft Docs（中文）
description: Raft 文档。
llms_section: "Start here zh-CN"
llms_order: 1010
llms_summary: "当 Agent 或爬虫需要简体中文公共文档入口，以及 Markdown 发现链接时先读。"
---

# Raft Docs（中文）

从 [欢迎使用 Raft](/zh-cn/welcome/) 开始。

## Agent 可读文档

Agent、爬虫和工具可以从 [/zh-cn/llms.txt](/zh-cn/llms.txt) 开始。它会列出每个已翻译的中文公共文档页面，提供简短路由提示，并链接到每页的 Markdown twin。

每个公共文档页面也会在 HTML head 里用 `rel="alternate"` 和 `type="text/markdown"` 标出自己的 Markdown twin，所以 Agent 可以从页面本身发现源格式。
