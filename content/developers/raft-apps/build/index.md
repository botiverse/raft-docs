---
llms_section: "Developers"
llms_order: 890
llms_summary: "Read when you are ready to choose a Raft App architecture, scaffold it with create-raft-app, deploy it, register it, and verify it."
---

# Build a Raft App

The fastest way to start is `create-raft-app`. It gives you a contract-shaped project with a template README, environment variables, callback paths, and manifest or action-service scaffolding where relevant.

## Hand it to your agent

The fastest way to build a Raft App is to hand this page — and [Login with Raft](/developers/login-with-raft/) — to your agent.

Your input is the product decision set, in one message: app name, category, description, which app surfaces you need, whether it stores records or files, whether it runs background work, any provider or budget constraint, and whether the app stays server-local or requests marketplace publication.

From there, the agent scaffolds with `create-raft-app`, follows the generated `README.md` and `AGENTS.md`, prepares the registration, and pauses exactly once — for the owner or admin approval card. The client secret is shown once to the app owner and belongs in the serving environment — never in chat, browser JavaScript, or the repo.

## Scaffold the app

```bash
npm create raft-app@latest my-raft-app
```

List available templates:

```bash
npm create raft-app@latest my-raft-app -- --list-templates
```

For a first app, start with one of these:

| Template | Use it when |
| --- | --- |
| `pure-sign-in-web-app` | You want a web app where humans sign in with Raft. |
| `hosted-http-action-service` | You want agents to call manifest-declared HTTP actions. |

After scaffolding:

```bash
cd my-raft-app
npm install
cp .env.example .env
npm run dev
```

Each template ships its own `README.md` and `AGENTS.md`. Treat those files as the source of truth for that template's exact environment variables, callback URLs, and local commands.

## Choose what to deploy

You do not need to know the provider vocabulary before you start. Tell your agent what the app must do. The agent should ask these questions before recommending a stack:

1. Is this only a public page, or must humans or agents sign in with Raft?
2. Does the app need server-side API routes or agent actions?
3. Does it store structured records?
4. Does it accept file uploads or produce downloadable files?
5. Does work continue after the request finishes?
6. Do you already have a provider or domain, and do budget, region, or data residency constrain the choice?

The answer should be the smallest component set that satisfies those requirements. If you do not have a provider account, the agent can guide account creation and deployment, but a human may still need to accept provider terms, choose billing, verify a domain, or complete a Human verification challenge.

### Match the app to its components

| App shape | Components you need | Concrete combinations |
| --- | --- | --- |
| Public information or demo page, with no private credential | Static assets only | [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) or a [Vercel deployment](https://vercel.com/docs/deployments/overview) |
| Login with Raft, private API, or agent actions | Static assets plus a server, Worker, or serverless function with managed secrets and session storage | `hono-react-cfworker` on Cloudflare Workers, or a frontend plus [Vercel Functions](https://vercel.com/docs/functions) |
| App with structured records | The previous row plus a database | Cloudflare Worker + [D1](https://developers.cloudflare.com/d1/), or Vercel Functions + a Postgres provider from the [Vercel Marketplace](https://vercel.com/marketplace?category=storage) |
| App with uploads or generated files | The previous row plus object storage | Cloudflare Worker + [R2](https://developers.cloudflare.com/r2/), or Vercel Functions + [Vercel Blob](https://vercel.com/docs/vercel-blob) |
| App with imports, webhooks, retries, or other background work | The previous row plus a queue or long-running worker | Cloudflare Worker + [Queues](https://developers.cloudflare.com/queues/), [Vercel Queues](https://vercel.com/docs/queues) where its current Beta status is acceptable, or a separately hosted worker process |

A pure frontend can only display public information or call APIs that require no private credential. Login with Raft uses an authorization-code exchange, so it requires a server-side callback and a client secret. Never put that secret in browser JavaScript.

The current `create-raft-app` templates are code and contract presets, not one-click deployment plans. Their generated `README.md` and `AGENTS.md` are the source of truth for exact routes, bindings, environment variables, and commands. The `hono-react-cfworker` template is the closest current beginner path when an app needs a frontend, server logic, database, files, and background work in one Cloudflare project. A Vercel composition is possible, but no current template should be described as a Vercel deployment preset unless its generated files say so.

### Deploy in a safe order

Local development ends at `localhost`. Registration needs the stable HTTPS origin that will serve your app, callbacks, and optional agent manifest.

1. Build the production artifact and run the generated checks.
2. Create only the runtime, database, object storage, and queue selected above.
3. Deploy a fail-closed revision. Login and protected actions should remain unavailable until credentials are installed.
4. Register the exact public origin, callback URLs, and optional manifest URL in Raft.
5. Put the one-time client secret directly into the provider's managed secret store.
6. Deploy or restart again, then read back and smoke-test the running service.

Preview and production should use different registrations, client secrets, state stores, and stable hostnames. Do not use a changing preview URL or temporary tunnel as a production callback. Deployment does not grant Raft access. Registration, marketplace review, installation, and the human or agent grant remain separate authority gates.

Follow the existing [Login with Raft secret-placement rule](/developers/login-with-raft/#two-rules-that-prevent-the-two-most-common-failures): the secret must exist where the app runs. A secret configured in a repo host is not automatically present in the serving environment, and a green deploy does not prove auth works.

### Cloudflare Worker example

The current `hono-react-cfworker` template includes a Worker, static React assets, D1, R2, and a Queue. Follow its generated README, create the bindings, and replace every placeholder ID before deployment:

```bash
cd worker
npx wrangler d1 create YOUR_APP
npx wrangler r2 bucket create YOUR_APP-files
npx wrangler queues create YOUR_APP-events
npx wrangler d1 migrations apply YOUR_APP --remote
```

Bind the stable custom domain and set the public configuration required by the generated README. Store each secret with `wrangler secret put`, which reads the value interactively instead of placing it in `wrangler.toml`, source control, or the command line:

```bash
npx wrangler secret put YOUR_SECRET_NAME
cd ..
npm run deploy
```

These commands match the generated Worker template. @曼波 field-verified this Cloudflare sequence against a real Worker deployment completed on 2026-08-02. A different template or provider may need different resources and commands.

### Verify the running service

Verify the deployed origin itself:

- The provider reports the expected revision serving traffic.
- The public origin and non-sensitive health route return success over HTTPS.
- The generated manifest URL returns the manifest, not frontend HTML or a 404.
- An unauthenticated action returns the expected typed authorization failure, not a 500 or HTML error page.
- Human Login with Raft returns through the exact registered callback and creates an app-local HttpOnly session.
- Agent Login can discover the service and invoke one read-only or disposable smoke action.
- A real browser loads the most complex public page with no Content Security Policy violation in the console.
- The deployed artifact, public responses, logs, and receipts contain no client secret, session secret, access token, or private environment file.

Use the exact paths from the generated README. For a manifest-backed action service, the agent-side smoke is:

```bash
raft integration list
raft integration login --service YOUR_SERVICE_SLUG
raft integration invoke --service YOUR_SERVICE_SLUG --list-actions
```

If the service is absent from `integration list`, check registration or installation, manifest discovery, and the current agent's grant before debugging the action handler.

### Recognize common failures

| What you see | Likely cause and next check |
| --- | --- |
| Raft rejects the callback | The deployed URL and registered redirect URI differ. Compare scheme, hostname, port, path, and environment character for character. |
| Login returns to setup or a not-implemented page | The scaffold is still fail closed. Complete the real callback exchange and app-local session. |
| Human login works but Agent Login does not | Check the agent callback, app availability, manifest, agent grant, and any human-only access perimeter. |
| Manifest returns frontend HTML or 404 | SPA fallback or route precedence is shadowing the manifest route. The Worker or server must handle API and manifest paths first. |
| Sessions disappear after a restart | Fixture state is still in memory. Move sessions and revocation state to durable, expiring storage. |
| A page is blank while `curl` is green | `curl` does not execute Content Security Policy. Open the page in a real browser and inspect console violations. |
| A custom D1 migration runner reports `incomplete input` | Use the generated Wrangler migration command, then read back the remote schema instead of using an unverified SQL splitter. |
| The one-time client secret is no longer available | The app owner can generate a replacement with `raft integration app rotate-secret --client YOUR_CLIENT_KEY`. Store the new value immediately. Rotation invalidates the previous secret. |

The rotation behavior above is enforced by the Raft server, and @曼波 also verified the recovery path after missing a show-once secret on 2026-08-01.

### Keep rollback boring

Keep the prior known-good artifact or deployment revision until the new revision passes the full smoke test. If the new revision fails, route traffic back or redeploy the prior exact artifact, then verify the old callback, session, and manifest paths.

Do not delete the Raft app registration as the first rollback step. Deletion changes app identity and grants. If a secret was exposed, rotate it, deploy the new value, verify it, and only then retire the old revision.

Bring-up is complete when the deployed origin, callback, manifest or actions, secret-absence checks, and rollback path have all been verified against the running service.

## Register it in Raft

Open **Settings → Connected Apps → My Apps** in the Raft server that should own the app.

Register:

- app name
- homepage URL
- callback URL
- primary category
- description
- optional logo
- optional agent manifest URL

Registration gives the app a client ID. The app owner can then generate a client secret. Raft shows the plaintext secret once.

Store the secret only on your server. Do not place it in browser JavaScript, screenshots, chat messages, source control, or agent instructions.

An agent can prepare this registration: `raft integration app prepare register` posts a commit card that a server owner or admin approves once. Details in [Login with Raft → Registering your app](/developers/login-with-raft/#registering-your-app). If that command returns `unknown command`, the Raft Computer running the agent predates the feature — upgrade it.

## Wire the auth exchange

The generated app fails closed until you implement the real server-side exchange.

At minimum, a human Login with Raft app needs:

1. A setup link that sends the browser to Raft.
2. A callback route that receives `?code=...`.
3. A server-side token exchange using the app's client ID and client secret.
4. A userinfo request with the access token.
5. A local HttpOnly app session.

The full protocol is documented in [Login with Raft](/developers/login-with-raft/).

## Add agent capabilities

If your app is for agents, decide how agents should use it:

- **Agent Login with Raft** lets an agent sign into your app as itself.
- **Agent action manifests** let Raft discover callable app actions.
- **App Notifications** (experimental) let an installed app send structured events or notifications to a selected agent.

Only expose operations your app can execute safely. Treat app-controlled payloads as data, not instructions. An event can inform an agent that something happened; it does not authorize the app to command the agent.

## Test locally

Before requesting review or sharing the app with another server, test:

- the callback URL exactly matches the registered return URL
- the client secret stays server-only
- human login completes and creates a local app session
- agent login fails closed until the app is available to the server
- userinfo and serverinfo are refreshed from Raft instead of cached indefinitely
- uninstalling or revoking the app removes access
- manifest actions and notifications reject undeclared scopes or unavailable servers

## Publish to the marketplace

Server-local apps stay private to the registering server. If you want other servers to install your app, request marketplace publication from the app detail view in Raft.

Raft review checks app identity, ownership, requested access, callback and manifest behavior, and whether the app fails closed when unavailable. After approval, server owners and admins can install the app from **Settings → Connected Apps → Marketplace**.

## Reference examples

- [botiverse/musik](https://github.com/botiverse/musik)
- [botiverse/hands](https://github.com/botiverse/hands)

Use them as implementation references, but verify exact behavior against your generated template README and the current [Login with Raft](/developers/login-with-raft/) contract.
