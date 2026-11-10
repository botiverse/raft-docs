---
llms_section: "Developers zh-CN"
llms_order: 1960
llms_summary: "运营供 Built-in Pi Agent 连接的模型网关（OpenAI 兼容或 Anthropic 兼容），并希望 Raft 从你的 /models 端点读取每个模型的上下文窗口和输出上限时阅读。"
---

# 从网关读取模型上限

**在你的 `/models` 响应里列出每个模型的上下文窗口和输出上限，Built-in Pi Agent 就能直接使用，不需要有人手动填写数字。**

Built-in Pi 可以通过 **OpenAI-compatible** 或 **Anthropic-compatible** 网关使用任何模型：Agent 的主人填写网关的 Base URL、API 密钥和模型名称。之后，Raft 还需要知道这个模型的两个数字：

- **上下文窗口**：一次请求最多能容纳的 token 数，输入和输出合计。Pi 用它决定什么时候压缩对话。
- **单次最大输出 token**：模型一次回复最多写出的 token 数。Raft 把它作为请求的输出上限发送。

Pi 已经认识的模型，这两个数字来自 Pi 自带的模型表。其他模型则由 Raft 退回到 200,000 和 8,192，这对有些模型偏高，对另一些模型偏低。本页说明网关怎样报告真实的值，让 Raft 自己读取。

::: info 状态
Raft 目前还不读取这些字段：即将发布的 Raft Computer 版本会支持，发布后本页会写明版本号。你现在就可以在网关里加上这些字段。在那之前，由 Agent 的主人手动设置这两个数字：在 Agent 的设置中，打开 **高级**，填写 **上下文窗口（token）** 和 **单次最大输出 token**。只有提供方是 OpenAI 兼容或 Anthropic 兼容、并且使用自定义模型时，才会显示这两项。
:::

## 你的网关要返回什么 {#what-your-gateway-returns}

Raft 会读取你的网关本来就提供的模型列表端点，使用的 Base URL 和 API 密钥与 Agent 相同。Base URL 遵循各自协议的惯例：OpenAI 兼容的 Base URL 包含版本路径（Raft 把对话请求发到 `<Base URL>/chat/completions`），Anthropic 兼容的则不包含（请求发到 `<Base URL>/v1/messages`）。

| 网关类型 | 请求 |
| --- | --- |
| OpenAI 兼容 | `GET <Base URL>/models`，请求头为 `Authorization: Bearer <API key>` |
| Anthropic 兼容 | `GET <Base URL>/v1/models?limit=1000`，请求头为 `x-api-key: <API key>` 和 `anthropic-version: 2023-06-01` |

Raft 只读取一个响应，不会翻页。请在这个响应里返回所有模型，至少要包含 Agent 用到的所有模型。

响应保持原有的结构：一个 `data` 数组，每个模型一个对象，对象的 `id` 就是 Agent 作为 `model` 发送的名称。在每个模型对象上加两个字段：

| 字段 | 含义 |
| --- | --- |
| `context_length` | 上下文窗口：一次请求最多能容纳的 token 数，输入和输出合计。 |
| `max_completion_tokens` | 单次最大输出 token：模型一次回复最多能写出的 token 数。 |

```json
{
  "object": "list",
  "data": [
    {
      "id": "swe-2-flash",
      "object": "model",
      "owned_by": "devin",
      "context_length": 262144,
      "max_completion_tokens": 64000
    }
  ]
}
```

`context_length` 是 OpenRouter 模型列表使用的字段名；`max_completion_tokens` 与 OpenAI 请求里表示输出上限的参数同名。不认识这些字段的客户端会忽略它们，所以加上它们不会影响其他工具。

如果 Anthropic 兼容网关已经返回 Anthropic Models API 的 `max_input_tokens` 和 `max_tokens`，就不需要再加任何字段：Raft 也会读取它们（见下文）。

### 取值规则 {#rules-for-the-values}

- **正整数，单位是 token。** 字段缺失、为 `null`、为零、为负数、为小数或字符串时，Raft 会忽略它；超过 10,000,000 的上下文窗口和超过 1,000,000 的最大输出也会被忽略。
- **最大输出必须放得进上下文窗口。** 如果单次最大输出 token 大于上下文窗口，Raft 会忽略最大输出的值。
- **不知道的值，就不要写这个字段。** 不要发送猜测的值，也不要发送 `0` 这样的占位值或整个服务商通用的默认值：Raft 会把猜测的值当作真实上限。
- **按你实际的路由报告模型的上限。** 如果同一个 `id` 可能由上限不同的上游提供，就报告最小的那个，这样放得下的请求不会在其中某个上游上失败。
- **`id` 要和 Agent 发送的一致。** Raft 按 `id` 精确查找模型，区分大小写。如果你接受别名，把每个别名都列为单独的一项，上限相同。

### Raft 接受的其他字段名 {#other-field-names-raft-accepts}

如果你的网关已经在用另一个常见的字段名，就不需要再加一个。对每个模型对象，Raft 按以下顺序查找，取找到的第一个有效值：

- **上下文窗口：** `context_length`、`context_window`、`max_model_len`（vLLM）、`top_provider.context_length`（OpenRouter），然后是 `max_input_tokens`（Anthropic Models API）或 `input_token_limit`：没有给出总量时，把它们当作上下文窗口。
- **单次最大输出 token：** `max_completion_tokens`、`max_output_tokens`、`top_provider.max_completion_tokens`（OpenRouter）、`output_token_limit`，最后是 `max_tokens`（仅限 Anthropic 兼容网关）。

在 OpenAI 兼容网关上，Raft 不读取单独的 `max_tokens`，因为不同的模型目录用它表示不同的东西。

### 你手动输入的 OpenRouter 模型 {#openrouter-models-you-type-in}

Built-in Pi 的 **OpenRouter** 提供方也接受不在它列表里的模型 ID。对这样的模型，Raft 用同样的方式、用 Agent 的 OpenRouter 密钥读取 OpenRouter 自己的模型列表，并按 OpenRouter ID 查找这个模型。OpenRouter 本来就列出了 `context_length` 和 `top_provider.max_completion_tokens`，所以 OpenRouter 那边不需要做任何改动。读取顺序、缓存和退回到默认值的规则都和上面一样。

## Raft 会怎样使用它们 {#what-raft-will-do-with-them}

两个数字各自独立决定，按以下顺序：

1. **Agent 自己的设置。** 主人在 **高级** 里填写的值始终优先。
2. **你的网关给出的值**，来自上面这些字段。它排在 Pi 的模型表之前，因为你的网关知道自己怎样路由每个模型；所以请确保它是正确的。
3. **Pi 的模型表**，前提是 Pi 认识这个端点上的这个模型。
4. **Raft 的默认值**：上下文窗口 200,000，单次最大输出 token 8,192。

只要有一个数字来自 Raft 的默认值，Agent 的页面上就会显示提示「这个模型可能在用 Raft 默认上限」。你的网关两个数字都报告了，这条提示就不会出现。

Raft 什么时候读取你的端点：

- **Agent 启动时**，而且只针对没有在 Agent 自己的设置里填好两个数字的模型。
- **同一个 Base URL 和 API 密钥，每小时最多读取一次。** Raft 把结果保存在计算机上，所有使用同一连接的 Agent 都复用它。上限改了之后，Agent 要等这一小时过去、下一次启动时才会拿到新值。
- **超时时间很短**（5 秒），响应大小也有上限（2 MB）。Raft 不跟随重定向，只把 API 密钥发给 Base URL 本身。

如果请求失败、超时、响应太大或不是有效的 JSON，或者列表里没有这个模型，Agent 就按上面的顺序改用下一个来源启动。读取失败绝不会让 Agent 无法启动。

## 检查你的响应 {#check-your-response}

用 Agent 使用的密钥列出模型，看看这个模型上有没有这两个字段。OpenAI 兼容：

```sh
curl -s -H "Authorization: Bearer $API_KEY" "$BASE_URL/models" \
  | jq '.data[] | select(.id == "swe-2-flash") | {id, context_length, max_completion_tokens}'
```

Anthropic 兼容：

```sh
curl -s -H "x-api-key: $API_KEY" -H "anthropic-version: 2023-06-01" "$BASE_URL/v1/models?limit=1000" \
  | jq '.data[] | select(.id == "swe-2-flash") | {id, max_input_tokens, max_tokens, context_length, max_completion_tokens}'
```

两个数字都应该存在，并且与你的上游实际接受的值一致。等运行你的 Agent 的计算机装上会读取这些字段的版本后，重启一个使用这个模型的 Agent：它的页面上不应该再出现默认上限的提示。
