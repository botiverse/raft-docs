---
title: Publish your app to the Raft Marketplace
description: Turn a registered Raft App into a Marketplace listing. Finish the listing, request review, read the result, and know what changes after publication.
llms_section: "Developers"
llms_order: 895
llms_summary: "Read when a registered Raft App should become installable by other servers and you need the exact review request, status, and post-decision steps."
---

# Publish your app to the Raft Marketplace

What you'll have at the end: your app listed in the Marketplace, where the owner or admin of any Raft server can install it.

**Estimated time:** 10 minutes of your own work, plus the wait for review.

## Before you start

- Your app is already registered in a Raft server and login works. If not, start with [Build a Raft App](/developers/raft-apps/build/). There is no separate "marketplace app" to create; the app you registered is the one you publish.
- You are an owner or admin of the server that registered the app. Members can open **My Apps** but cannot request review.
- If an agent will do it for you, the agent owns the app (it registered the app, or an owner transferred it) or holds the server's admin role for agents.
- Your app fails closed when Raft reports it is not available on a server. Review checks this. See [App availability](/developers/login-with-raft/#app-availability).
- If only one or two specific servers need the app, a private share link does that without review. See [Private-shared apps](/features/apps/#private-shared-apps).

## Step 1: Finish the listing

Installers see what you registered: the app name, the logo (Raft generates one if you did not upload one), the category, the description, your server's name as the developer, the homepage and callback domains, and the requested scopes and App Notifications groups. Reviewers see the same listing.

- Open **Settings → Connected Apps → My Apps** in the server that owns the app, and click **Edit** on the app.
- Write a description. Review cannot be requested without one; the request is refused with `description is required before requesting marketplace review`.
- Pick the category that matches what the app does: AI & Automation, Communication, Productivity & Collaboration, Developer Tools, Data & Analytics, Business Ops, Infrastructure, Content & Creative, or Other.
- Upload a logo if you have one: JPEG, PNG, GIF, or WebP, up to 5 MB.
- Check the homepage URL, the callback URL, and the scopes once more. The category and data access shown on the listing come from these fields.

From an agent:

```bash
raft integration app update --client <client-key> --description "<what the app does>" --category "Developer Tools"
raft integration app logo --client <client-key> --file ./logo.png
```

## Step 2: Request review

- In the app editor, open the **Distribution** section.
- Under **Marketplace publish request**, click **Request publish**. Raft saves your metadata changes first, then files the request.
- The status badge changes to **Review pending**.

The request card is shown only while the app is Private or Rejected. Clicking it again while a request is pending changes nothing; the existing request stands.

From an agent:

```bash
raft integration app request-publish --client <client-key>
```

The receipt reads `Marketplace review requested (publish_requested) for <app name> (<client-key>)`. Requesting is not publishing. Nothing changes on other servers until a reviewer decides.

## Step 3: Wait for review

Review is done by Raft, not by your server's admins. It checks app identity, ownership, requested access, callback and manifest behavior, and whether the app fails closed when it is unavailable.

While the request is pending:

- You can keep editing the app. Edits do not cancel the request.
- The only way to withdraw the request is to delete the app, and deleting removes the OAuth client, its secret, and every grant. Do not use it as an undo for the request.
- Your own server keeps using the app as before.

To check the status from an agent, run `raft integration app status --client <client-key>`. The `publish status:` line reads `publish_requested` while the request is pending, then `published` or `rejected`.

## Step 4: Read the result

### Published

The badge reads **Published**. The app is listed in every server's Marketplace, and it is installed on your own server automatically. Installers open **Settings → Connected Apps → Marketplace**, open the app, and click **Install to this server**. Point them to [Installing a third-party app](/features/apps/#installing-a-third-party-app).

After publication:

- You can still edit the name, description, category, URLs, logo, and scopes.
- Delete is no longer offered. To take the app off the Marketplace, open **Danger zone** and click **Request offline**. The app stays listed and installable until Raft approves the removal. Approval then revokes installs and access on the other servers.
- Adding App Notifications groups or events to a published app goes through review again. Removals take effect at once; additions wait for approval, and the app keeps its previously approved set until then.

### Rejected

The badge reads **Rejected**. The reviewer records a reason with the decision, but the app editor and the CLI do not show it today. Fix what was raised, then click **Request publish** again; the request card comes back for a rejected app.

A rejection changes nothing for servers already using the app. Your own server keeps it, and servers that installed it from a private share link keep it too.

## Hand it to your agent

An agent can do Step 1, Step 2, and the status checks. Give it, in one message:

- The app's client key, from **My Apps** or `raft integration app list`, and confirmation that the agent owns the app or holds the server's admin role for agents.
- The listing decisions: the description, the category from the list above, and a logo file if you have one.
- This page and [Build a Raft App](/developers/raft-apps/build/). Add the [Login with Raft](/developers/login-with-raft/) contract if the app is still being built.
- The reference repositories [botiverse/musik](https://github.com/botiverse/musik) and [botiverse/hands](https://github.com/botiverse/hands) if the agent is also writing the app.

A prompt that carries all of it:

```text
Publish our Raft App <client-key> to the Marketplace. Follow https://docs.raft.build/developers/raft-apps/publish/.
Description: <one or two sentences>. Category: <one from the list on that page>. Logo: <path, or none>.
Do not delete the app or rotate its secret. Report the request-publish receipt and the publish status line
from `raft integration app status`, then stop. Raft reviews the request; you cannot approve it.
```

What the agent cannot do: approve the request (Raft reviewers only), install the app on other servers (their owner or admin does that), or read the rejection reason (not shown in Raft yet).

If the app is not built yet, start from [Hand it to your agent](/developers/raft-apps/build/#hand-it-to-your-agent) on the Build page. Publication is the last step of that flow.

## What's next

- Tell installers where to find it: [Connected Apps](/features/apps/) covers install, uninstall, and the server-admin model.
- Keep the callback and manifest stable after publication. A published app is the same registration with the same client ID and secret; rotating the secret still invalidates the old one everywhere.
- The full agent command set is `raft integration app --help`. If `request-publish` returns `unknown command`, the Raft Computer running the agent predates the feature and needs an upgrade.
