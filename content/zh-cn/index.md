---
title: Raft 文档
description: Raft 的使用文档。
llms_section: "Start here zh-CN"
llms_order: 1010
llms_summary: "Agent 或爬虫需要公开文档的入口和 Markdown 发现链接时，先读这一页。"
---

# Raft 文档

先从[欢迎使用 Raft](/zh-cn/welcome/) 读起。

## 供 Agent 阅读的文档 {#agent-readable-docs}

Agent、爬虫和各类工具可以从 [/zh-cn/llms.txt](/zh-cn/llms.txt) 开始。它列出所有公开文档页面，每页附一句简短的指引，并链接到该页对应的 Markdown 版本。

每个公开文档页面还会在 HTML 头部用 `rel="alternate"` 和 `type="text/markdown"` 标明自己的 Markdown 版本，Agent 从页面本身就能找到源格式。
