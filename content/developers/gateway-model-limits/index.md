---
llms_section: "Developers"
llms_order: 960
llms_summary: "Read when you run a model gateway (OpenAI- or Anthropic-compatible) that Built-in Pi agents connect to, and want Raft to pick up each model's context window and output limit from your /models endpoint."
---

# Model limits from your gateway

**List each model's context window and output limit in your `/models` response, and Built-in Pi agents use them without anyone typing numbers in.**

Built-in Pi can reach any model through an **OpenAI-compatible** or **Anthropic-compatible** gateway: you enter the gateway's Base URL, an API key and a model name. Raft then needs two numbers for that model:

- **Context window**: the most tokens one request can hold, input and output together. Pi uses it to decide when to compact the conversation.
- **Max output tokens**: the most tokens the model writes in one reply. Raft sends it as the request's output limit.

For models Pi already knows, the numbers come from Pi's own model table. For any other model, Raft falls back to 200,000 and 8,192, which can be too high for some models and too low for others. This page describes how a gateway reports the real values, so Raft reads them itself.

::: info Status
Raft Computer reads these fields starting with an upcoming release; this page will name the version once it ships. Until then, set the two numbers in the agent's **Advanced** settings.
:::

## What your gateway returns

Raft reads the endpoint your gateway already serves for listing models, with the same Base URL and API key the agent uses:

| Gateway type | Request |
| --- | --- |
| OpenAI-compatible | `GET <Base URL>/models` with `Authorization: Bearer <API key>` |
| Anthropic-compatible | `GET <Base URL>/v1/models` with `x-api-key: <API key>` and `anthropic-version: 2023-06-01` |

The response keeps its usual shape: a `data` array with one object per model, whose `id` is the name the agent sends as `model`. Add two fields to each model object:

| Field | Meaning |
| --- | --- |
| `context_length` | Context window: the most tokens one request can hold, input and output together. |
| `max_completion_tokens` | Max output tokens: the most tokens the model can write in one reply. |

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

These are the field names OpenRouter uses. Clients that don't know them ignore them, so adding them doesn't change anything for other tools.

### Rules for the values

- **Positive whole numbers, in tokens.** Raft ignores a field that is missing, zero, negative, fractional, a string, or above 10,000,000.
- **Leave a field out when you don't know it.** Don't send a guess or a placeholder such as `0` or a provider-wide default: Raft would treat a guess as the real limit.
- **Report the limit of the model as you route it.** If one `id` can be served by upstreams with different limits, report the smallest, so a request that fits never fails on one of them.
- **Match `id` to what agents send.** Raft looks the model up by exact, case-sensitive `id`. If you accept aliases, list each alias as its own entry with the same limits.

### Other field names Raft accepts

If your gateway already uses another common name, you don't need to add a second one. Per model object, Raft reads the first valid value it finds, in this order:

- **Context window:** `context_length`, `context_window`, `max_model_len` (vLLM), `top_provider.context_length` (OpenRouter), then `max_input_tokens` (Anthropic Models API) or `input_token_limit`, used as the context window when no total is given.
- **Max output tokens:** `max_completion_tokens`, `max_output_tokens`, `top_provider.max_completion_tokens` (OpenRouter), `output_token_limit`, then `max_tokens` on Anthropic-compatible gateways only.

On OpenAI-compatible gateways Raft does not read a bare `max_tokens`, because catalogs use it for different things.

## What Raft does with them

Each number is decided on its own, in this order:

1. **The agent's own setting.** Whatever the owner entered under **Advanced** always wins.
2. **Your gateway's value**, from the fields above.
3. **Pi's model table**, when Pi knows this exact model on this endpoint.
4. **Raft's fallback**: 200,000 for the context window, 8,192 for max output tokens.

When either number is Raft's fallback, the agent's page shows a warning that its limits are Raft's defaults. Once your gateway reports both, the warning goes away.

When Raft reads your endpoint:

- **When an agent starts**, and only for a model that doesn't have both numbers from the agent's own setting.
- **At most once an hour per Base URL and API key.** Raft keeps the answer on the Computer and reuses it for every agent with the same connection. A changed limit reaches an agent the next time it starts after that hour.
- **With a short timeout** (5 seconds) and a size cap (2 MB). Raft doesn't follow redirects, and sends the API key only to the Base URL itself.

If the request fails, times out, is too large or isn't valid JSON, or the model isn't listed, the agent starts with the next source in the order above. A failure never stops an agent from starting.

## Check your response

Ask for the list with the key an agent uses and look for the two fields on the model:

```sh
curl -s -H "Authorization: Bearer $API_KEY" "$BASE_URL/models" \
  | jq '.data[] | select(.id == "swe-2-flash") | {id, context_length, max_completion_tokens}'
```

Both numbers should be present and match what your upstream accepts. Then restart the agent: the warning about Raft's default limits should no longer appear on its page.
