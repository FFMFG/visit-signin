# Project Status & Resume Guide

**Last updated:** 2026-04-22
**Phase:** v0.1 shipped to preview; awaiting hardware to cut over.

## What's live right now

- **Worker:** https://visit-signin.tschwartz-379.workers.dev
  - `/api/health` → green
  - `/api/hosts` → returns the three stub hosts
  - Cron `7 0 * * *` registered for nightly auto-signout
- **Repo:** https://github.com/FFMFG/visit-signin (public, MIT)
- **Cloudflare resources** (all provisioned, bound to Worker, IDs baked into `wrangler.jsonc`):
  - D1 `visit_signin` — id `28a37592-0ba3-4dd2-9cb2-1ebfab7496da`, migrations applied
  - KV id `c1f3f323b07e41fa90e000982e754209`
  - R2 bucket `visit-signin-artifacts`
- **Slack app** — created in FFMFG workspace, bot installed, channels (`#front-desk`, `#compliance`, `#visitor-app-errors`) created and bot invited. Tokens in your possession; not yet attached to the Worker.

## What's explicitly NOT done yet

| Item | Why blocked |
|---|---|
| `SLACK_BOT_TOKEN` / `SLACK_SIGNING_SECRET` attached to Worker | 2 commands (`wrangler secret put …`) — see resume checklist |
| Slack Interactivity Request URL pointed at Worker | Needed before the "Signed out" button can fire; 1 field edit in the Slack app config |
| Live end-to-end smoke test (DM + channel posts) | Blocked on the two items above |
| `visit.ffmfg.com` custom domain | OAuth token lacks `zone:edit`. Requires `wrangler login` with expanded scopes, then dashboard click or API call |
| Cloudflare Access on `/admin/*` | Zero Trust dashboard, ~3 clicks |
| Entra host directory | Skipped for v1 by user; `StubHostDirectory` covers demo/initial use. `EntraHostDirectory` class is scaffolded but throws |
| Real NDA legal text | `[LEGAL: ...]` placeholders in `templates/us-person-nda.md` and `templates/foreign-national-nda.md` — legal team drops in final wording |
| R2 lifecycle rules (2y photos, 7y NDAs) | Spec-level, not yet configured; dashboard or API |
| Brother QL-820NWB purchased / configured | Hardware ordered, arriving in a few days |
| iPad designated / set up in Guided Access | Hardware, not yet acquired |

## Resume checklist — paste-runnable

### 1. Attach Slack secrets (~1 min)
```bash
cd C:\Users\schwa\Desktop\Claude\visit-signin
npx wrangler secret put SLACK_BOT_TOKEN         # paste xoxb-...
npx wrangler secret put SLACK_SIGNING_SECRET    # paste signing secret
```
No redeploy needed — Workers pick up secrets on next request.

### 2. Point Slack Interactivity at the Worker
Slack app → **Interactivity & Shortcuts** → **Request URL**:
```
https://visit-signin.tschwartz-379.workers.dev/api/slack/interactive
```
(Swap to `https://visit.ffmfg.com/api/slack/interactive` once custom domain is live.)

### 3. Smoke test (~2 min)
Open `https://visit-signin.tschwartz-379.workers.dev` in a browser:
- Click **I'm here to visit**
- Pick **Yes, I am a U.S. Person**
- Fill out identity (use your real email+phone)
- Pick **Tal Schwartz** as host
- Any purpose, take a photo, sign the NDA, submit

Verify:
- [ ] DM lands in your Slack
- [ ] Message appears in `#front-desk`
- [ ] Visit shows at `/admin/on-site`

Then repeat with **No, foreign national** — expect additional post in `#compliance` and `ESCORT REQUIRED` stripe on the badge PDF.

### 4. When Brother QL-820NWB arrives
- Unbox, plug in, hold WPS briefly for setup mode
- Install Brother iPrint&Label on a phone, join the printer to shop Wi-Fi
- Load **DK-1202** die-cut label roll (2.4" × 3.9")
- Print a test label from the Brother app to confirm network reachability

### 5. When iPad arrives
- Connect to shop Wi-Fi (same subnet as printer, so AirPrint discovers it)
- Safari → `https://visit-signin.tschwartz-379.workers.dev` → Share → Add to Home Screen
- Settings → Accessibility → Guided Access → ON (set a passcode)
- Launch the kiosk, triple-click side button, enable Guided Access, pin
- Do a full sign-in end-to-end including AirPrint — pick the Brother QL when the print sheet appears

### 6. Before going live
- [ ] Replace `[LEGAL: ...]` placeholders in `templates/us-person-nda.md` and `templates/foreign-national-nda.md` with legal's real wording
- [ ] Hand-curate `StubHostDirectory` in `src/worker/services/host-directory.ts` with actual employees (or wire Entra — see `EntraHostDirectory` scaffold)
- [ ] Add Cloudflare Access policy on `/admin/*`
- [ ] Add `visit.ffmfg.com` custom domain
- [ ] Add R2 lifecycle rules (2y photos, 7y NDAs, 7y badges)
- [ ] Cancel Envoy subscription

## Local dev quick-reference
```bash
cd C:\Users\schwa\Desktop\Claude\visit-signin
npm install
npm run typecheck    # tsc --noEmit, was 0 errors at close
npm run test         # 13/13 passing at close
npm run dev          # Vite + Miniflare preview
npm run deploy       # build + wrangler deploy
npm run db:migrate:local / :remote
```

## Design reference

`docs/specs/2026-04-21-visitor-signin-design.md` — full design doc. Read it before any non-trivial change. Implementation covers sections 1-6; section 7 ("Out of scope for v1") remains out.

## Known tech debt (none blocking)

- `EntraHostDirectory.list/search/getById` all throw — swap in real impl when credentials exist
- Signed-NDA / badge R2 keys are ulid-based and not enumerable, but not behind Access. Consider signed URLs if threat model tightens.
- Auto-signout cron fires at 00:07 UTC which drifts vs MT across DST (hits 17:07 or 18:07 MT). Acceptable per spec; tighten if it matters.
- No structured log shipping; Worker tail is the only view into runtime errors.
