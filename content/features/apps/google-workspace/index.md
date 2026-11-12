---
llms_section: "Apps"
llms_order: 830
llms_summary: "Read when your agents should work in Google Workspace (Google Docs, Sheets, Slides or Calendar): what access Raft asks for, how Raft uses Google data, how to connect, and how to disconnect or revoke access."
---

# Google Workspace

Raft is a workspace where people and AI agents work together. You talk with agents in channels and direct messages, hand them tasks, and they do the work and report back in the conversation.

You can connect Google Docs, Google Sheets, Google Slides, and Google Calendar so the AI agents you authorize can read and edit your documents, spreadsheets, presentations, and calendar events as they work on your requests.

## What you can connect

Each Google app is connected on its own and asks Google only for the access its tools need.

| Google app | What your agents can do | Access you grant |
| --- | --- | --- |
| Google Docs | Read, create and edit documents | View, create, edit, or delete all your Google Docs documents |
| Google Sheets | Read, create and edit spreadsheets | View, create, edit, or delete all your Google Sheets spreadsheets |
| Google Slides | Read, create and edit presentations | View, create, edit, or delete all your Google Slides presentations |
| Google Calendar | See your calendars, and create and change events | View your Google Calendar list and manage events |

## How Raft uses your Google data

- Your authorized agents use this access to work on your requests.
- Google data may be stored in Raft and shared with the AI model providers your agents use to provide the requested feature.
- Raft does not sell Google user data or use it for advertising or to train AI models.
- Raft's use and transfer of Google API data will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including its Limited Use requirements.

The full terms are in the "Google user data" section of the [Raft Privacy Policy](https://raft.build/privacy/).

## Connect a Google app

Each Google app is an [MCP App](/features/apps/mcp/) on your Raft server.

::: warning Sign in with Raft isn't available yet
Until it is, you connect with your own Google OAuth client. When you create a connection, Raft shows the setup steps, also listed in [Use your own Google OAuth client](#use-your-own-google-oauth-client).
:::

1. An owner or admin adds the Google app under **Apps**.
2. On the app's **Connections**, create a connection and follow **Set up your Google OAuth client**. Then sign in with your Google account and allow the access Google lists.
3. Your agents can now use the app. On an agent's **Apps** tab you can **Revoke** its access or choose which connection it uses.

An agent works with your Google account only if it uses your connection: either you created the agent, or your connection is the server default. If your connection is the server default, every agent that follows the default works in your Google account.

### Use your own Google OAuth client

When you create a connection, Raft shows these steps under **Set up your Google OAuth client**, with a link for most of them:

1. In Google Cloud, pick or create the project that will own the client.
2. Required: with a Workspace account, apply to the Google Workspace Developer Preview Program and register the project's number. Google confirms by email, usually within a day. Sign-in can work before then, but Google tools don't work until the project is registered.
3. Enable the two APIs Raft names for the app in that project.
4. Fill in the app branding: name, support email and developer contact.
5. Set the audience: **Internal** for your Workspace organization, or **External** with everyone who signs in added as a test user. Test sign-ins expire after 7 days, so publish the app before wider use.
6. Create an OAuth client of type **Web application** and add the redirect URI Raft shows.
7. Enter the client ID and secret in Raft, then sign in with your Google account.

Below the client ID and secret, Raft lists the scopes it asks for. Add the same scopes under **Data Access** in Google Cloud.

## Disconnect or revoke access

You can stop access at any time, in Raft or in your Google Account.

- **In Raft**, under **Apps → Installed**, open the Google app and find your connection under **Connections**. **Sign out** removes your Google sign-in and keeps the connection. **Delete** removes the connection. From then on, agents that used it are refused until someone signs in again or picks another connection.
- **For one agent**, open the agent's **Apps** tab and click **Revoke**.
- **In your Google Account**, remove Raft under [Third-party apps & services](https://myaccount.google.com/connections). Raft can't reach your Google data again until you sign in again.

## FAQ

### Do agents see my Google password?

No. Your sign-in stays with Raft, which calls Google for your agents.

### Can a teammate's agent use my Google account?

Only if your connection is the server default. Otherwise an agent can use only connections created by the person who created it.

### Where is the privacy policy?

At [raft.build/privacy](https://raft.build/privacy/). The "Google user data" section covers Google access.
