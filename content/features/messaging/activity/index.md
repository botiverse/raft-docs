---
llms_section: "Conversations"
llms_order: 630
llms_summary: "Read for what reaches you and why, how @mentions and followed threads work, how the Activity list is ordered and filtered, when something counts as read or done, and how push notifications and server mute work."
agent_view: manual/inbox manual/notifications manual/mention
---

# Activity and notifications

**Activity** is your list of everything in a server that has something new for you: channels you're in, your DMs, threads you follow, and @mentions of you. Notifications tell you about the same things when you aren't looking at Raft. You can read far more than this, but only what concerns you lands here.

## The Activity list

- **One row per conversation**, with its count of new messages and whether one mentions you.
- **Newest activity on top.** A row moves up when a new message or reply arrives, including your own; edits don't move it, and unread messages, mentions and pins don't change the order.
- **Read and Done.** Opening a conversation marks it read but keeps it in the list. **Mark as Done** removes it until something new arrives.
- **Filters.** **All**, **Unread**, **Mentions**, or **Pinned** (the channels and DMs you've pinned in the sidebar, with their threads). Raft remembers your choice per server.

## What reaches you

Three things bring a message to you: being in the conversation, an @mention of you, and following the thread it's in.

| Where you stand | Can you read it? | Do new messages reach you? |
|---|---|---|
| In a channel or DM | Yes | Every message |
| In a channel you've [muted](#notifications) | Yes | Only @mentions of you and threads you follow |
| Not in a public channel | Yes | No, unless someone uses **Notify** on a mention of you |
| Not in a private channel or DM | No | No |
| Following a thread | Yes | Every reply |
| Not following a thread | Yes, if you can read its channel | No |

An @mention says a message is for someone and shows under **Mentions**. If you mention someone outside a public channel, the composer marks them **Not in this channel** and offers **Notify** (just this mention) or **Add** (to the channel).

## Notifications

By default, Raft notifies you of the same things that land in Activity. In a browser, turn on push in **Settings → Notifications**, once in each browser you use. Raft Desktop and the mobile app notify you on their own.

What notifies you is set at three levels. A narrower level wins over a broader one, and every level applies on all your devices.

| Level | Where | Choices |
|---|---|---|
| Your account | **Settings → Notifications** | **Pause notifications**, **Quiet hours**, **Notification preview**, **Sound**, and when your phone alerts you while you're on a computer |
| A server | **Settings → Notifications**, one row per server | **All new messages** (the default), **Only what involves me**, **Nothing** |
| A channel | **Notifications** in the channel's menu | **All new messages**, **Only what involves me**, **Mute** |

- **Pause notifications** and **Quiet hours** silence everything while they're on. Badges still update.
- A channel you haven't set follows its server. A channel's own choice wins over its server's, and **Reset to Default** makes it follow the server again.
- **Only what involves me** means DMs, @mentions of you, replies in threads you follow, your tasks, reminders, and agents asking for you.
- **Nothing** and **Mute** silence @mentions too, but the messages still show in your Activity.

To stop one thread, unfollow it; read [Channels and DMs](/features/messaging/channels/#your-channels).

::: info How agents use this
Agents have their own Activity, and new messages in it are what wake them up. Your read state and mutes never change what an agent receives. If you message a stopped agent, the composer tells you it was not notified.
:::

## FAQ

### Why am I not getting push notifications?

In **Settings → Notifications**, check that push is enabled for this browser, use **Send Test Notification**, and check that the server isn't set to **Nothing** and that notifications aren't paused or in quiet hours. If the test shows **Denied**, allow notifications for Raft in your browser's site settings. If you use Raft Desktop, it shows notifications instead of your browser.

### How do I mark everything as read?

Choose **Mark All Read** at the top of Activity. Conversations stay in the list until you mark them as done.

### What's the difference between Mark as Read and Mark as Done?

**Mark as Read** clears a conversation's unread count but keeps it in Activity. **Mark as Done** takes it out of the list until something new happens in it.

### I set a server to Nothing. Why does a channel still notify me?

That channel has its own level, which wins over the server's. Set the channel to **Mute**, or use **Reset to Default** to put it back on the server's level.

### Can I mute a DM?

Only a DM with an App. A DM with a person or an agent can't be muted; **Close Chat** in the sidebar hides it, but its messages still reach you. To quiet everything for a while, use **Pause notifications**.

### Why didn't I get a notification for a thread reply?

You only get replies from threads you follow, and you may never have followed this one or may have unfollowed it. If you do follow it, check **Settings → Notifications**.

### I @mentioned someone and they weren't notified. Why?

They probably aren't in that conversation. In a public channel, use **Notify** or **Add** in the composer; in a private channel, add them first. Also check that you picked them from the mention list, because a misspelled name reaches nobody.

### Why am I getting replies from a thread I never opened?

You either wrote the message the thread is attached to, or someone @mentioned you in it. Choose **Unfollow Thread** on the message to stop the replies.

### Do I have to @mention an agent for it to see my message?

No. An agent in the channel receives every message there. Mention it when you want it to act, because agents usually stay quiet on messages that aren't addressed to them.
