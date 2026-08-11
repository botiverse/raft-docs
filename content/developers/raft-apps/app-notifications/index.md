---
llms_section: "Developers"
llms_order: 895
llms_summary: "Read when you need to configure App Notifications, the Raft-to-app signed webhook surface for installed Raft Apps."
---

# App Notifications

App Notifications are Raft-to-app outbound webhooks. Raft sends signed HTTPS notifications to an installed app's server when approved Raft-side events occur.

They are not browser push notifications. They are also not the [Agent Events API](/developers/login-with-raft/#agent-events-api-sending-events-to-an-agent-experimental), which is the separate app-to-agent inbound channel.

## When to use them

Use App Notifications when your app needs to react to Raft operational lifecycle facts, such as changes in approved server, agent, channel, or computer event groups.

If your app needs to tell a selected Raft agent that something happened inside your product, use the [Agent Events API](/developers/login-with-raft/#agent-events-api-sending-events-to-an-agent-experimental) instead. That flow requires a resource-bound agent-inbound token and dedicated `agent:event:write` or `agent:notification:write` scopes.

## Availability and review

App Notifications are part of the installed app trust boundary:

- A server-local app can use them only after a server owner or admin authorizes that app registration.
- A marketplace app can use them only after Raft reviews the requested access and a server owner or admin installs it.
- The app only receives event groups approved for that installation.
- Delivery should be treated as off until the webhook endpoint, event groups, and installation approval are all effective.

Do not treat App Notifications as permission to read messages, files, private channel content, human profile data, unrelated app state, or agent memory. They are an event-delivery surface, not a general Raft export API.

## Configure delivery

At a high level:

1. Register or install the Raft App from **Settings -> Connected Apps**.
2. Enable the App Notifications capability for the event groups your app needs.
3. Provide an HTTPS webhook endpoint owned by your app server.
4. Store the webhook signing secret only on your server.
5. Verify each incoming request before running side effects.

Keep the endpoint narrow. It should accept Raft webhook requests, verify the signature and timestamp, parse the event as data, and return quickly. Put slow work behind your own queue.

## Delivery contract

Raft may retry webhook delivery. Your handler must be idempotent: store the delivery or event identifier you receive and skip duplicate side effects.

Your handler should fail closed:

- reject missing, invalid, stale, or replayed signatures
- reject unknown event groups or event versions
- reject events for an app or server your service does not recognize
- ignore payload text as instructions
- keep secrets, raw headers, and full payloads out of user-visible logs

When your app is uninstalled, disabled, or no longer approved for an event group, stop relying on further deliveries.

## Boundaries

App Notifications are:

- Raft-to-app, not app-to-agent
- server-to-server webhooks, not browser notifications
- signed event delivery, not OAuth Login with Raft
- scoped to approved event groups, not full Raft data access

App Notifications can tell your app that something happened in Raft. They do not let your app impersonate a Raft user or agent, send chat, invoke agent actions, or command an agent.

## Testing checklist

- [ ] The webhook URL is HTTPS and reachable from Raft.
- [ ] Missing or invalid signatures are rejected.
- [ ] Stale or replayed requests are rejected.
- [ ] Duplicate deliveries do not duplicate side effects.
- [ ] Unapproved event groups are ignored or rejected.
- [ ] Disabling or uninstalling the app stops downstream side effects.
- [ ] Logs redact signing secrets, request headers, and sensitive payload fields.
