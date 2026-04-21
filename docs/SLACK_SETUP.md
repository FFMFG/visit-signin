# Slack App Setup

Creating the Slack app that powers host notifications.

## 1. Create the app

1. Go to https://api.slack.com/apps and click **Create New App**
2. Choose **From scratch**
3. Name: `FFMFG Visitor Sign-In` (or whatever fits your org)
4. Workspace: your FFMFG workspace
5. Click **Create App**

## 2. Bot token scopes

In the left sidebar: **OAuth & Permissions** → Scroll to **Scopes** → **Bot Token Scopes** → Add each of these:

| Scope | Why |
|---|---|
| `chat:write` | Post messages to channels and DMs |
| `chat:write.public` | Post to public channels the bot isn't explicitly in |
| `im:write` | Send DMs to users |
| `users:read` | Look up users |
| `users:read.email` | Resolve host email → Slack user ID |
| `commands` | (Optional, future) Slash-command support |

## 3. Install to workspace

Still on **OAuth & Permissions**: click **Install to Workspace** at the top. Approve the scopes.

Slack shows you a **Bot User OAuth Token** starting with `xoxb-`. Copy it.

```bash
cd visit-signin
npx wrangler secret put SLACK_BOT_TOKEN
# paste the xoxb-... token when prompted
```

## 4. Signing secret

Left sidebar: **Basic Information** → scroll to **App Credentials** → copy **Signing Secret**.

```bash
npx wrangler secret put SLACK_SIGNING_SECRET
```

This secret lets the Worker verify that button-click callbacks actually came from Slack.

## 5. Interactivity (for the "Signed out" button)

Left sidebar: **Interactivity & Shortcuts** → toggle **Interactivity** on.

Request URL: `https://visit.yourdomain.com/api/slack/interactive`

Save.

## 6. Create the channels

In Slack:

```
/create #front-desk
/create #compliance        # private, compliance officer + execs
/create #visitor-app-errors
```

Invite the bot to each:

```
/invite @FFMFG Visitor Sign-In
```

(Replace with your app's name.)

## 7. Verify channel names match config

In `wrangler.jsonc`:

```jsonc
"vars": {
  "FRONT_DESK_CHANNEL": "#front-desk",
  "COMPLIANCE_CHANNEL": "#compliance",
  "ERROR_CHANNEL": "#visitor-app-errors"
}
```

Redeploy if you changed these: `npm run deploy`.

## 8. Smoke test

On your dev or prod deploy, do a test sign-in. Expect:

- DM in your host's Slack
- Message in `#front-desk`
- If you selected Foreign National: message in `#compliance`
- Nothing in `#visitor-app-errors` (unless the host-email-to-Slack-user lookup fails, which is expected for a brand-new install until you've populated real host data)

## Common gotchas

- **`users.lookupByEmail` returns "users_not_found"** — the host's email in your host directory doesn't match any Slack account email. The visit still succeeds; a notice goes to `#visitor-app-errors`.
- **Bot can't post to a private channel** — invite the bot explicitly with `/invite @<bot>`. The `chat:write.public` scope covers public channels only.
- **Button click does nothing** — Interactivity URL is wrong, or `SLACK_SIGNING_SECRET` doesn't match the app's. Double-check both.
