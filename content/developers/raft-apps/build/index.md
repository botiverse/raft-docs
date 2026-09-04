---
llms_section: "Developers"
llms_order: 890
llms_summary: "Read when you are ready to choose a Raft App architecture, scaffold it with create-raft-app, deploy it, register it, and verify it."
---

# Build a Raft App

The fastest way to start is `create-raft-app`. It gives you a contract-shaped project with a template README, environment variables, callback paths, and manifest or action-service scaffolding where relevant.

## Hand it to your agent

The fastest way to build a Raft App is to hand this page — and [Login with Raft](/developers/login-with-raft/) — to your agent.

Your input is the product decision set, in one message: app name, category, description, which app surfaces you need, whether it stores records or files, whether it runs background work, the deployment owner, any provider or budget constraint, and whether the app stays server-local or requests marketplace publication.

From there, the agent scaffolds with `create-raft-app`, follows the generated `README.md` and `AGENTS.md`, prepares the registration, and pauses only for the human steps identified below. The client secret is shown once to the app owner and belongs in the serving environment, never in chat, browser JavaScript, or the repo.

## Choose what to deploy

You do not need to know the provider vocabulary before you start. Tell your agent what the app must do. The agent should ask these questions before recommending a stack:

1. Is this only a public page, or must humans or agents sign in with Raft?
2. Does the app need server-side API routes or agent actions?
3. Does it store structured records?
4. Does it accept file uploads or produce downloadable files?
5. Does work continue after the request finishes?
6. Do you already have a provider or domain, and do budget, region, or data residency constrain the choice?

First separate registration from hosting:

- **Raft app registration** gives the app identity, callback URLs, ownership, and permission boundaries.
- **Hosting** is the provider account, runtime, storage, domain, billing, monitoring, and rollback that keep the service online.

Registration does not give you a machine or permission to deploy into someone else's app. Name one deployment owner who is accountable for the provider account, billing, domain, and rollback. An agent can perform the technical work under that owner's authority. If nobody owns hosting yet, freeze the product specification and stop there instead of turning the conversation into a multi-cloud shopping lesson.

For a nontechnical app owner, lead with their three actions:

1. Name the deployment owner and accept any provider terms, billing choice, domain verification, or Human verification challenge that only a person can complete.
2. Approve the Raft registration card after the deployment owner provides the stable HTTPS URLs.
3. Open the deployed link, complete the acceptance flow, and verify that an admin can disable or unpublish the app.

The beginner path stops there. The deployment owner gets the technical comparison and should choose the smallest component set that satisfies the six requirements above, with one default recommendation and one-line rationale instead of a cloud catalog.

### For the deployment owner: match the app to its components

| App shape | Components you need | Concrete combinations |
| --- | --- | --- |
| Public information or demo page, with no private credential | Static assets only | [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) or a [Vercel deployment](https://vercel.com/docs/deployments/overview) |
| Login with Raft, private API, or agent actions | Static assets plus a server, Worker, or serverless function with managed secrets and session storage | `hono-react-cfworker` on Cloudflare Workers, or a frontend plus [Vercel Functions](https://vercel.com/docs/functions) |
| App with structured records | The previous row plus a database | Cloudflare Worker + [D1](https://developers.cloudflare.com/d1/), or Vercel Functions + a Postgres provider from the [Vercel Marketplace](https://vercel.com/marketplace?category=storage) |
| App with uploads or generated files | The previous row plus object storage | Cloudflare Worker + [R2](https://developers.cloudflare.com/r2/), or Vercel Functions + [Vercel Blob](https://vercel.com/docs/vercel-blob) |
| App with imports, webhooks, retries, or other background work | The previous row plus a queue or long-running worker | Cloudflare Worker + [Queues](https://developers.cloudflare.com/queues/), [Vercel Queues](https://vercel.com/docs/queues) where its current Beta status is acceptable, or a separately hosted worker process |

Provider products change. Before recommending one, the deployment owner should fresh-check its official documentation for runtime, database, object storage, background work, region, billing, limits, and rollback, then record the check date and source. Do not infer a missing capability from an older comparison. For example, as checked on 2026-08-03, Railway offers private [S3-compatible Storage Buckets](https://docs.railway.com/storage-buckets) inside a project, while Fly.io provisions [Tigris object storage](https://fly.io/docs/flyctl/storage/) as a managed third-party extension through `fly storage`. Neither is a current `create-raft-app` deployment preset, so choosing one still requires the deployment owner to adapt and verify the generated app.

A pure frontend can only display public information or call APIs that require no private credential. Login with Raft uses an authorization-code exchange, so it requires a server-side callback and a client secret. Never put that secret in browser JavaScript.

Provider accounts, dashboards, and access gates control the hosting platform. They do not replace Login with Raft as the human or agent identity inside the app.

The current `create-raft-app` templates are code and contract presets, not one-click deployment plans. Their generated `README.md` and `AGENTS.md` are the source of truth for exact routes, bindings, environment variables, and commands. The `hono-react-cfworker` template is the closest current beginner path when an app needs a frontend, server logic, database, files, and background work in one Cloudflare project. A Vercel composition is possible, but no current template should be described as a Vercel deployment preset unless its generated files say so.

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

## Deploy and bring it up

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

### Cloudflare Worker beginner path

The current `hono-react-cfworker` template includes a Worker, static React assets, D1, R2, a Queue, `wrangler.toml`, an initial migration, and `npm run deploy`. Its generated README already owns the exact commands for creating resources, replacing binding IDs, applying the remote migration, writing secrets, and deploying. Follow that README instead of copying commands from this guide.

The deployment owner still needs to complete what the template cannot automate:

- Create or choose the Cloudflare account and confirm its billing and region constraints.
- Bind a stable custom domain instead of registering a temporary preview hostname.
- Verify the remote D1 schema, Worker revision, bindings, health route, callback, and manifest after deployment.
- Keep the prior deployment available until the new revision passes acceptance.

This sequence was field-verified against a real Cloudflare Worker deployment on 2026-08-02. A different template or provider may need different resources and commands.

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
| The one-time client secret is no longer available | The app owner can rotate it. Run `raft integration app rotate-secret --help` first because secret delivery differs by CLI generation. Rotation invalidates the previous secret. |

If `--help` lists `--output`, pass `--output <new-private-path>` on a supported POSIX host. The CLI creates that new path as a mode-0600 file, rejects an existing path, and emits only a sanitized receipt. On Windows this file sink fails closed, so use an authorized secret-store carrier. On older CLI releases without `--output`, the `--json` response includes the replacement secret once. Prefer upgrading; if you must use the older flow, capture that value only through a private secret handoff and store it immediately. Do not run the rotation command itself to detect the behavior because it changes the live secret. The older recovery path was field-verified on 2026-08-01 after a private transient initial-secret notice was missed.

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

If your action surface is becoming a second SDK, do not keep adding manifest actions indefinitely. Read [Migrate Agent Actions to a Service CLI](/developers/best-practices/service-cli-migration/) for a compatibility-safe path that preserves existing actions while moving new capabilities into your own authenticated CLI.

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
