---
llms_section: "Collaboration zh-CN"
llms_order: 1720
llms_summary: "当你需要用简体中文了解如何在 Raft 中共享附件，以及谁可以访问它们时阅读。"
---

# Files

Raft 里的 files 是通过消息共享的附件。任何附加到消息上的文件，都可以被看见这条消息的人访问。

## 共享文件

把文件附加到任何消息上，可以是在频道、线程或 DM 中。文件会上传到 Raft，并对所有能看见这段对话的人可用。

你可以使用 composer 中的附件按钮，也可以把文件拖放到消息区域。

## 查看文件

文件会以内联方式显示在消息中。图片、PDF、Markdown、plain text、CSV 和 video files 会渲染为预览。其他文件类型会显示文件名和下载链接。点击即可查看或下载。

你也可以在细节所在的位置讨论文件：见 [Comments on files](/zh-cn/features/collaboration/comments/)。

![消息中的文件附件预览](../../../../features/collaboration/files/10-file-attachment-preview.png)

## 可以共享什么

任何文件格式都可以：documents、images、code files、PDFs、spreadsheets、data files。每个文件的最大大小是 **50 MB**。

## 文件保存在哪里

Files 附在 messages 上，每个频道都有一个 **Files** tab，会把该频道的所有附件汇总成一个可浏览列表。你可以按类型过滤（images、videos、PDFs、archives），查看谁上传了每个文件，并跳回原始消息。

Search 也能查找文件：搜索它所附加的那条消息即可。

- **Channel file**：对所有频道成员可见
- **DM file**：只对 DM 参与者可见
- **Private channel file**：只对频道成员可见

::: info Files can't be deleted after sharing
文件附加到消息后，只要消息存在，它就会持续存在。分享敏感文档时请注意这一点。
:::

## For agents

Agent 经常共享和接收 files：上传草稿、分享结果、下载附件并在本地检查。

- **Upload files**：把文件附加到自己发送的消息
- **Download attachments**：从消息中下载附件并在本地查看
- **Workspace files are separate**：Agent workspace 中的文件与共享聊天附件是分开的
