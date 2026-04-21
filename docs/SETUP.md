# Setup Guide

From zero to a live `visit.yourdomain.com` in under an hour.

## Prerequisites

- Cloudflare account (Workers Paid $5/mo plan for R2/D1 headroom; the free plan works for a single kiosk)
- Your domain on Cloudflare (DNS nameservers pointed at Cloudflare)
- A Slack workspace where you can install a custom app
- (Optional) Microsoft Entra tenant for host directory integration
- An iPad
- A Brother QL-820NWB + DK-1202 label roll (or any AirPrint-capable label printer)

## 1. Clone and install

```bash
git clone https://github.com/ffmfg/visit-signin.git
cd visit-signin
npm install
```

## 2. Cloudflare resources

Authenticate:

```bash
npx wrangler login
```

Create the D1 database, KV namespace, and R2 bucket:

```bash
npx wrangler d1 create visit_signin
npx wrangler kv namespace create KV
npx wrangler r2 bucket create visit-signin-artifacts
```

Paste the generated IDs into `wrangler.jsonc` where you see `REPLACE_WITH_...`.

Apply migrations:

```bash
npm run db:migrate:remote
```

## 3. Slack app

Follow [SLACK_SETUP.md](./SLACK_SETUP.md). You'll come back with a bot token and a signing secret.

Store them as Worker secrets:

```bash
npx wrangler secret put SLACK_BOT_TOKEN
npx wrangler secret put SLACK_SIGNING_SECRET
```

Configure channels in `wrangler.jsonc` (`FRONT_DESK_CHANNEL`, `COMPLIANCE_CHANNEL`, `ERROR_CHANNEL`) — must match channels the bot is invited to.

## 4. Entra (optional)

If you skip this step, the kiosk uses the built-in `StubHostDirectory` (a hardcoded list of three hosts). Good enough for demos and small shops.

For real Entra:

1. Azure Portal → App registrations → New registration
2. API permissions → Microsoft Graph → Application permissions → `User.Read.All` → Admin consent
3. Certificates & secrets → New client secret
4. Store secrets:

```bash
npx wrangler secret put ENTRA_TENANT_ID
npx wrangler secret put ENTRA_CLIENT_ID
npx wrangler secret put ENTRA_CLIENT_SECRET
```

## 5. Deploy

```bash
npm run deploy
```

Wrangler prints a `*.workers.dev` URL. Verify `/api/health` returns `{ ok: true }`.

## 6. Custom domain

Cloudflare Dashboard → Workers → `visit-signin` → Triggers → Custom Domains → add `visit.yourdomain.com`.

## 7. Cloudflare Access on /admin

Zero Trust → Access → Applications → Add application:

- Type: Self-hosted
- Subdomain: `visit.yourdomain.com`
- Path: `/admin/*`
- Identity provider: your Entra / Google / etc.

## 8. Brother QL-820NWB

1. Plug in, hold WPS button briefly to put into setup mode
2. Join shop Wi-Fi via the Brother mobile app
3. Load a DK-1202 die-cut label roll (2.4" × 3.9")
4. Print a test label from the Brother app

## 9. iPad kiosk

1. Safari → `https://visit.yourdomain.com` → Share → Add to Home Screen
2. Settings → Accessibility → Guided Access → On
3. Open the bookmark, triple-click Home/Side button → enable Guided Access, pin the kiosk
4. Plug the iPad into a hardwired charger mounted at the front desk

## 10. Smoke test

- Sign in as yourself, pick yourself as host
- Verify Slack DM lands
- Verify badge prints
- Sign out via the iPad

You're done.
