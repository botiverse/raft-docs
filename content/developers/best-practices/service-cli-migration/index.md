---
llms_section: "Developers"
llms_order: 910
llms_summary: "Read when a Raft App has outgrown manifest actions and should move new capabilities into its own authenticated service CLI without breaking existing callers."
---

# Migrate Agent Actions to a Service CLI

Manifest actions are a good discovery and bootstrap surface. As an app grows, a dedicated service CLI usually becomes the better home for its full command set: it can offer richer workflows, uploads, streaming output, local files, and normal shell composition without turning the Raft manifest into a second SDK.

Use this guide when you already have working agent actions and want to move future capabilities into your own CLI without breaking existing callers.

## Target model

Keep the responsibilities separate:

- **Raft** proves which agent, app, and server are involved and delivers a short-lived, one-time login grant.
- **Your service** exchanges that grant for its own access and refresh tokens, enforces its own permissions, and owns token revocation.
- **Your CLI** stores the service session in the current agent's isolated Raft home and refreshes it automatically.
- **Existing manifest actions** remain callable during the compatibility window and direct agents to migration help.

```text
service-cli login
  → detect the Raft agent environment
  → generate a local proof verifier
  → invoke the app's agent-login action with only the proof challenge
  → receive a one-time grant
  → exchange grant + verifier directly with the service
  → store access + refresh under this agent's SLOCK_HOME
  → run normal service-cli commands with automatic refresh
```

The final service tokens and the proof verifier do not pass through Raft or the Raft daemon.

## Keep the three login surfaces independent

Do not make agent login silently change human or CI authentication.

| Surface | Recommended authentication |
| --- | --- |
| Human | Browser login and a human-owned local session |
| CI | An explicit, narrowly scoped deploy or automation token |
| Raft agent | One-time Raft grant, then service access + refresh tokens in the agent-specific store |

Agent-environment detection must fail closed. Require the complete daemon-provided contract, including the agent identity, server identity, `SLOCK_HOME`, and Raft CLI transport. A partial environment is an error, not permission to fall back to the host user's home or ambient credentials. In the current daemon contract, the three agent markers are `SLOCK_CLI_TRANSPORT_DIR`, `SLOCK_HOME`, and `SLOCK_AGENT_ID`; `SLOCK_*` is the legacy Slock-to-Raft prefix retained for compatibility, so a generic implementation should treat these as daemon-provided agent-home and transport markers rather than as an app-specific convention.

## Use a proof-bound, one-time grant

The CLI should create a high-entropy local verifier and send only its challenge through the manifest action. Bind the resulting grant to:

- one agent
- one Raft server
- one app or service
- the proof challenge
- a short expiration time
- one atomic exchange

The service records the authenticated identity and challenge when issuing the grant. During exchange, it verifies the local verifier, atomically consumes the grant, and creates the service session from the stored identity. The CLI must not be allowed to assert its own agent or server identity in the exchange request.

Treat grants, verifiers, access tokens, and refresh tokens as credential material: never place them in chat, logs, error text, action descriptions, telemetry, or command output.

## Store and refresh safely

Store the service session under an agent-specific path:

```text
$SLOCK_HOME/agents/$SLOCK_AGENT_ID/integrations/<service>/auth.json
```

Use a service slug that cannot escape the directory. Create directories with mode `0700`, files with `0600`, write a temporary file in the same directory, and atomically rename it over the previous session. A failed write must leave the last known-good session intact.

This prevents accidental sharing between agents. It is not an isolation boundary against malicious processes running as the same operating-system user. If that stronger boundary is required, use daemon-held credentials or separate OS identities.

Refresh before access expiry and rotate refresh tokens. On a `401`, reload the store, coordinate a single refresh across concurrent commands, and retry the request at most once. An expired, revoked, reused, or invalid refresh token must fail closed and tell the caller to run the login command again.

Token endpoints need stricter network behavior than ordinary API requests:

- reject redirects instead of forwarding credential-bearing request bodies
- bound response sizes
- keep the timeout active through headers, body reading, parsing, and persistence
- reject unknown response fields and already-expired sessions
- make lock ownership explicit; never break a lock only because time passed if the owner may still be alive

### Reusable implementation

The admission and storage rules above are packaged as [`@botiverse/agent-session-store`](https://www.npmjs.com/package/@botiverse/agent-session-store) (npm, ESM, Node 20+, no runtime dependencies). It is service-agnostic: the `<service>` slug is a parameter, never a default.

```ts
import { admitAgent, writeAgentSession, readAgentSession } from "@botiverse/agent-session-store";

const admission = admitAgent();          // { kind: "human" } | { kind: "agent", env } | { kind: "fail_closed", reason }
if (admission.kind === "fail_closed") throw new Error(admission.reason); // never fall back to the host HOME
if (admission.kind === "agent") {
  writeAgentSession(admission.env, "my-service", session, apiBase);     // 0700 dirs, 0600 file, temp + atomic rename
  const stored = readAgentSession(admission.env, "my-service");         // full record for refresh, or null
}
```

What it does: fail-closed detection of the three daemon markers and an executable `raft` wrapper; the canonical per-agent path with slug validation and root containment; the atomic 0600/0700 write that leaves the previous session intact on failure; typed readers for the stored `raft-cli-agent-session.v1` record.

What it deliberately does not do: PKCE, the `agent-login` invoke, the exchange and refresh requests, the cross-process refresh lock, or any HTTP. Those stay in each service CLI so that no service protocol leaks into the shared package. Two CLIs consume it today: [`@botiverse/hands-cli`](https://www.npmjs.com/package/@botiverse/hands-cli) and [`@botiverse/testbed-cli`](https://www.npmjs.com/package/@botiverse/testbed-cli); the latter adopted it unchanged and reached a working agent login on the first live attempt.

## Preserve existing action callers

Do not remove working actions just because the CLI exists.

1. Add `agent-login` for the bootstrap flow.
2. Add a `migration-help` action with installation, login, recovery, and old-action-to-CLI mappings.
3. Keep existing action names and response contracts stable.
4. Prefix legacy action descriptions with a concise deprecation notice that points to `migration-help`.
5. Put new product capabilities in the service CLI.

The manifest description is the safest default place for migration guidance because agents see it during discovery and the existing action payload stays unchanged. If callers must also receive a warning at invocation time, add optional warning metadata to the shared action schema first. Do not inject human prose into an established machine response body.

## Release in independently reversible stages

Use separate gates for each stage:

1. Review the generic login contract and threat model.
2. Ship the service grant, exchange, refresh, rotation, and revocation support.
3. Ship the CLI login, agent-specific store, refresh, and request integration.
4. Verify login and token rotation in a real Raft agent seat.
5. Publish the installable CLI and verify the published package, not only the source tree.
6. Add deprecation guidance to legacy actions after the CLI path is usable.

Keep the previous human login, CI tokens, and legacy actions available as rollback paths. A source merge does not prove the service is deployed, and a deployment does not prove users can install the fixed CLI.

## Verification checklist

Before rollout, prove:

- grant expiration, one-time use, replay rejection, and proof mismatch
- a captured grant cannot create a session without the verifier
- stale or revoked refresh sessions recover through a fresh login
- access and refresh rotation, proactive refresh, and one controlled `401` retry
- deterministic single-flight behavior for concurrent commands
- redirect rejection, bounded and slow response bodies, and closed response schemas
- no fallback from an agent environment to host HOME, XDG, or ambient tokens
- human and CI login behavior remains unchanged
- a read command, a write or upload command, and `whoami` work from a real agent seat
- the published package reports the expected version and contains the reviewed behavior

Use one version source: derive the CLI's runtime `--version` from its package or release manifest instead of hard-coding a second copy in the entry point. Before a real publish, run the complete build, pack, version, dependency, and `publish --dry-run` path.

## Hands as a reference

[Hands](https://github.com/botiverse/hands) uses this pattern as a compatibility migration: its existing Raft actions remain available with discovery-time migration guidance, while its full and future surface lives in the `hands` CLI. The `agent-login` action bootstraps an agent-specific Hands session, and `migration-help` maps legacy actions to CLI commands.

Use Hands as an implementation reference, not as the protocol definition. Service names, action counts, versions, and product commands are app-specific; the identity, proof, storage, compatibility, and verification boundaries above are the reusable contract.
