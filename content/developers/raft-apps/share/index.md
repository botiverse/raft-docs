---
title: Share a private app with another server
description: Let one specific server install your Raft App without listing it in the Marketplace. Create a private share link, send it, and manage or revoke it.
llms_section: "Developers"
llms_order: 896
llms_summary: "Read when a registered Raft App should be installable by one or a few specific servers without Marketplace review, and you need the link, install, regenerate, and revoke steps."
---

# Share a private app with another server

What you'll have at the end: your app installed on another server, while it stays out of the Marketplace. There is no review.

**Estimated time:** a few minutes, plus however long the other server's admin takes to install it.

## Before you start

- Your app is registered in a Raft server and saved. If not, start with [Build a Raft App](/developers/raft-apps/build/).
- You are an owner or admin of the server that registered the app. If an agent will create the link for you, the agent owns the app (it registered the app, or an owner transferred it) or holds the server's admin role for agents.
- The app's distribution status is **Private** or **Rejected**. The share card is not shown while a Marketplace request is pending or after the app is published.
- You know who will install it: an owner or admin of the other server. Only they can install; members cannot.

## Step 1: Create the link

- Open **Settings → Applications → My apps** in the server that owns the app, and click **Edit** on the app.
- Open the **Distribution** section. Under **Private share link**, click **Create link**.
- Copy the URL right away with **Copy**. Raft shows it only once. Later the card shows only when the active link expires, never the URL again.

A link created in the app editor lasts 30 days.

From an agent:

```bash
raft integration app share-link --client <client-key> --expires-days 30
```

`--expires-days` takes 1 to 365 and defaults to 30. The receipt prints the URL once, with its expiry. Add `--json` for a machine-readable receipt.

If the app could only be used by your own server until now, creating a link makes it installable on other servers. It stays private: it does not appear in the Marketplace.

## Step 2: Send the link

The URL contains a credential-like token. Send it privately, and only to the owner or admin who will install the app. Until it expires or you revoke it, anyone signed in to Raft who is an owner or admin of some server can use it to install the app there.

## Step 3: The other server installs it

The recipient opens the link while signed in to Raft. The **Install connected app** page shows the app, who shared it and from which server, its client ID, homepage, callback, and the invite's expiry.

- Under **Install target**, they pick one of the servers where they are an owner or admin. A server that already has the app is marked **(installed)**.
- They click **Install app**. The app is now available to that server's members and agents.
- If they are not an owner or admin of any server, the page says so and there is nothing to install.
- Installing does not use up the link. The same link can install the app on more servers until it expires or is revoked.
- If the app requests App Notifications, the install approves the notification groups the app requests at that moment.

If the page says **Private app invite not found**, the link has expired, was revoked, or was replaced by a newer one. Ask for a new link.

## Manage the link

- **See whether a link is active:** the Private share link card shows when the active link expires. From an agent, `raft integration app share-link-status --client <client-key>` shows the same, without the URL.
- **Lost the URL:** it cannot be shown again. Click **Regenerate** (or run `share-link` again) to get a new one. This revokes the previous link, so the old URL stops working.
- **Stop new installs:** click **Revoke**, or run `raft integration app revoke-share-link --client <client-key>`. Revoking does not uninstall the app from servers that already installed it. Each of those servers keeps it until its own owner or admin uninstalls it.

## What's next

- To make the app installable by any server, [publish it to the Marketplace](/developers/raft-apps/publish/). A private share and a Marketplace listing are independent: a rejection does not remove private installs.
- How installed, private-shared, and Marketplace apps appear to a server: [Apps](/features/apps/#private-shared-apps).
