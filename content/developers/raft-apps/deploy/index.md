---
llms_section: "Developers"
llms_order: 895
llms_summary: "Read when your Raft App works locally and you need to deploy it, register exact production URLs, verify login or actions, and prepare rollback."
---

# Deploy a Raft App

A Raft App is ready to register only after it has a stable HTTPS origin. This tutorial takes a locally working app through deployment, registration, verification, and rollback without putting a client secret in the browser or repository.

The safe sequence is:

1. Deploy a fail-closed app and obtain its public origin.
2. Register that exact origin, callback, and optional manifest URL in Raft.
3. Add the issued credentials to the serving environment.
4. Redeploy or restart, then verify the complete flow.

If you have not scaffolded an app yet, start with [Build a Raft App](/developers/raft-apps/build/).

## Choose a deployment shape

| Shape | Good fit | Important boundary |
| --- | --- | --- |
| Static frontend + server-side API | A mostly static UI hosted on Pages, Vercel, or a CDN | The callback, token exchange, sessions, and authenticated actions still need a Worker, serverless function, or web server. Static browser code must never receive the client secret. |
| Long-running Node web service | The Express-based sign-in or action-service templates | Run the generated build and start commands on a host with HTTPS, managed secrets, logs, and durable session storage. |
| Worker/serverless app | The `hono-react-cfworker` template or an app already designed for that runtime | Use platform bindings for state and managed secrets. Do not assume an in-memory session survives another request or deployment. |

Deployment does not grant Raft access. Registration, marketplace review, installation, and each user's or agent's grant remain separate Raft authority gates.

## 1. Finish the server-side paths

Generated templates are intentionally fail closed. Before you deploy, complete the paths your app actually needs:

- the browser login start route
- the exact human callback route
- the server-side authorization-code exchange
- userinfo lookup and a local HttpOnly session
- the agent callback and service-local agent session, if the app supports Agent Login
- manifest-declared action routes, input validation, authorization, and idempotency
- a non-sensitive health endpoint or equivalent public readiness check

Do not treat a successful scaffold build as proof that OAuth is implemented. The template `README.md` and `AGENTS.md` are the source of truth for its routes, environment variables, and remaining fail-closed markers.

Run the generated checks before deploying:

```bash
npm install
npm run build
```

If the template exposes a different check command, use the command in its README as well.

## 2. Separate preview and production

Use different app registrations and credentials for preview/staging and production. Do not point a preview deployment at a production client secret.

| Value | Preview example | Production example |
| --- | --- | --- |
| App origin | `https://preview.example.dev` | `https://app.example.com` |
| Human callback | `https://preview.example.dev/auth/callback` | `https://app.example.com/auth/callback` |
| Agent callback | `https://preview.example.dev/agent/callback` | `https://app.example.com/agent/callback` |
| Client ID and secret | Preview registration | Production registration |
| Session/action secrets | Preview-only values | Production-only values |
| State and storage | Preview namespace | Production namespace |

For generated Node templates, the main variables are typically:

- `APP_ORIGIN` — your deployed app's public origin
- `RAFT_APP_ORIGIN` — the Raft browser origin that serves the setup page
- `RAFT_API_ORIGIN` — the Raft API used for token exchange and userinfo
- `RAFT_CLIENT_ID` — the registered app's client ID
- `RAFT_CLIENT_SECRET` — the registered app's server-only secret
- `SESSION_SECRET` or an action/session credential required by that template

`APP_ORIGIN` is your app. `RAFT_APP_ORIGIN` and `RAFT_API_ORIGIN` are Raft. Mixing these values is a common cause of redirects that loop or return to the wrong environment.

## 3. Deploy without the Raft secret

First deploy the app with its public configuration and no usable Raft client secret. Login and protected actions should fail closed, while the homepage, health check, and public manifest remain reachable.

### Node web service

Use a Node host that supports a stable HTTPS hostname and managed environment variables. Configure the generated commands:

```text
Build command: npm install && npm run build
Start command: npm start
```

Set `APP_ORIGIN` to the final HTTPS origin. Add durable storage before relying on any template that currently keeps sessions, OAuth state, idempotency records, or agent grants in memory.

### Cloudflare Worker template

The `hono-react-cfworker` template includes a Worker, React assets, D1, R2, and Queue bindings. Follow its generated README to create the resources and replace every placeholder ID before deployment:

```bash
cd worker
npx wrangler d1 create YOUR_APP
npx wrangler r2 bucket create YOUR_APP-files
npx wrangler queues create YOUR_APP-events
npx wrangler d1 migrations apply YOUR_APP --remote
```

Set the final `APP_ORIGIN` and public Raft origins in `worker/wrangler.toml`, then deploy from the project root:

```bash
npm install
npm run deploy
```

Do not add `RAFT_CLIENT_SECRET` to `wrangler.toml`. Add it as a managed Worker secret only after registration.

## 4. Register the exact deployed URLs

In the Raft server that should own the app, open **Settings → Connected Apps → My Apps** and register:

- the deployed homepage or app origin
- every exact callback URL the app supports
- the primary category and description
- the public agent manifest URL, if the app exposes agent actions

The scheme, hostname, port, and path must match the deployed route exactly. Production callbacks must use HTTPS. Do not register a wildcard callback or a preview hostname as the production callback.

An agent can prepare the same registration with `raft integration app prepare register`; a server owner or admin still commits it through the approval card. Raft then issues a client ID and shows the client secret once to the app owner.

## 5. Add credentials and redeploy

Put credentials directly into the deployment platform's managed secret store. Never place them in source control, a public manifest, browser JavaScript, build output, chat, screenshots, or command-line arguments that will be retained in shell history or process listings.

For the Cloudflare Worker template:

```bash
cd worker
npx wrangler secret put RAFT_CLIENT_SECRET
```

Set `RAFT_CLIENT_ID` as the public deployment variable, then redeploy. For a Node host, add the client ID and secret in the provider's environment/secret settings and restart or roll out a new revision.

If the app has its own session or action credential, manage and rotate that value independently from the Raft client secret.

## 6. Verify the deployed app

Verify the deployed origin, not localhost and not only the provider preview.

### Public surface

- The origin serves valid HTTPS with no human-only perimeter in front of agent routes.
- The health endpoint returns success without credentials or sensitive details.
- The exact manifest URL returns the generated public manifest, if applicable.
- The response and deployment artifact do not contain the client secret, session secret, access token, or private environment file.

### Human login

1. Start Login with Raft from the deployed app.
2. Confirm the setup page names the expected app and Raft server.
3. Authorize and return to the exact deployed callback.
4. Confirm the app creates its own HttpOnly session and does not expose the raw Raft access token to browser JavaScript.
5. Sign out, revoke, or uninstall as appropriate and confirm access fails closed.

### Agent login and actions

For an app with a published agent manifest:

```bash
raft integration list
raft integration login --service YOUR_SERVICE_SLUG
raft integration invoke --service YOUR_SERVICE_SLUG --list-actions
```

Invoke one read-only or disposable smoke action using the parameters declared by the manifest. Confirm invalid credentials, undeclared actions, malformed input, revoked access, and duplicate write retries fail safely.

If the Raft integration inventory does not list the service, check app availability, marketplace installation, manifest discovery, and the current agent's grant before debugging the action handler.

## 7. Prepare rollback before wider use

Keep the prior known-good artifact or deployment revision until the new revision passes the full smoke test.

If the new revision fails:

1. Stop routing traffic to it or redeploy the previous exact artifact.
2. Keep the Raft registration in place unless the registration itself is unsafe.
3. Verify the old homepage, callback, session, and manifest paths.
4. If a secret was exposed, rotate it in Raft and the serving secret store, deploy the new value, verify it, then revoke the old value.

Do not delete the app registration as the first rollback step. Deletion changes identity and grants, and can make recovery harder than restoring a previous serving revision.

## Troubleshooting

| Symptom | Check first |
| --- | --- |
| Raft rejects the callback | Compare the deployed URL with the registered redirect URI character for character. Check HTTPS, hostname, port, path, and environment. |
| Login returns to setup or a not-implemented page | The scaffold is still fail closed because the callback exchange or local session has not been implemented. |
| Human login works but Agent Login does not | Check the agent callback, app availability/installation, manifest, agent grant, and any human-only access perimeter. |
| Manifest returns the frontend HTML or 404 | Fix SPA rewrites or route precedence so the Worker/server handles the manifest path before static fallback. |
| Actions return 401 or 403 | Check the service-local credential/session, install and grant state, declared auth type, and whether preview credentials were mixed with production. |
| Sessions disappear after a restart | Replace in-memory fixture state with durable, expiring, revocable session storage. |
| Preview works but production fails | Compare the two registrations, callback URLs, origins, secret revisions, storage namespaces, and deployed commit. |

## Production checklist

- [ ] One stable HTTPS production origin
- [ ] Exact production callback and manifest URLs registered
- [ ] Preview and production registrations and secrets separated
- [ ] Client secret present only in the server-side managed secret store
- [ ] OAuth state, sessions, grants, and idempotency records are durable and expiring where required
- [ ] Human and agent flows tested on the deployed origin
- [ ] Revocation, uninstall, invalid input, and replay paths fail closed
- [ ] Logs and receipts contain no secrets or raw access tokens
- [ ] Previous exact artifact and rollback steps recorded

Continue with [Login with Raft](/developers/login-with-raft/) for protocol details and [Connected Apps](/features/apps/) for availability, installation, and marketplace behavior.
