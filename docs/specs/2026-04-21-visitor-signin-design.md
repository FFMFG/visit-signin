# visit.ffmfg.com — Visitor Sign-In Kiosk

**Status:** Design approved 2026-04-21
**Author:** Tal Schwartz
**Replaces:** Envoy free tier

## Problem

Envoy's paid tier jumped to $4,500/year. For an aerospace shop doing CMMC-adjacent work, we also need a sign-in flow tuned to ITAR posture (US Person vs. Foreign National branching) and integrated with our stack (Entra for identity, Slack for notifications). Rolling our own is cheaper, more correct for our compliance posture, and lets us open-source the result for other shops in the same situation.

## Goals

1. Replace Envoy for day-to-day visitor sign-in at the front desk.
2. Branch correctly on citizenship status — stricter NDA + "ESCORT REQUIRED" badge for foreign nationals.
3. Notify hosts in Slack immediately, maintain a rolling log in `#front-desk`, and cc `#compliance` for ITAR-relevant visits.
4. Capture photo and signed NDA as durable records (aerospace-typical retention).
5. Keep the iPad experience fast and obvious — visitor should be done in under 90 seconds.
6. Defense-in-depth sign-out: three independent mechanisms so the "who's on-site" list stays accurate for emergency roll-call.

## Non-Goals (v1)

- Pre-registration / host-invites-visitor flows.
- Multi-site / multi-kiosk deployments.
- Badge re-print without re-signing.
- Real NDA legal copy (stubbed with placeholders; legal drops in final text).
- Fulcrum / shop-floor-mes integration — that's the "full system" hookup for later.
- SIEM / Logpush. Structured `console.log` to Worker tail is enough for v1.

## Architecture

```
iPad (Safari, Guided Access mode)
     │  HTTPS
     ▼
visit.ffmfg.com  ← Cloudflare Worker (Hono + React SPA)
     │
     ├── D1: visits, hosts_cache, nda_signatures
     ├── R2: visit-photos/, signed-ndas/, badge-pdfs/
     ├── KV: session tokens, Entra host cache TTL
     │
     ├── HostDirectory (interface)
     │     └─ EntraHostDirectory (MS Graph /users, hourly cache in KV)
     ├── HostNotifier (interface)
     │     └─ SlackHostNotifier (Bot token: chat:write, im:write, users.lookupByEmail)
     ├── BadgePrinter (interface)
     │     └─ AirPrintBadgePrinter (PDF handed to iPad, AirPrint to Brother QL on LAN)
     └── NdaRenderer
           Markdown template → HTML → PDF (pdf-lib), signature image stamped in
```

**Print path:** The Worker generates the badge PDF server-side. The iPad fetches it and hands it to AirPrint, which delivers it to the Brother QL-820NWB on the shop LAN. No server-to-printer network path — keeps the Worker off the shop network and sidesteps firewall/VPN concerns.

### Isolation boundaries

Each interface is independently testable:
- `HostDirectory` — list/search hosts. Implementation can be swapped for Slack-users, static config, or combined lookups without touching callers.
- `HostNotifier` — deliver visit events. Swappable for email / Teams / pager later.
- `BadgePrinter` — render + deliver badge. Testable in isolation with a fixture PDF.
- `NdaRenderer` — template + signature → PDF. No I/O; pure function.

## Data Model (D1)

```sql
CREATE TABLE visits (
  id                TEXT PRIMARY KEY,           -- ulid
  check_in_at       INTEGER NOT NULL,           -- epoch ms
  check_out_at      INTEGER,                    -- null while on-site
  check_out_method  TEXT,                       -- 'self' | 'host' | 'auto'
  visitor_name      TEXT NOT NULL,
  visitor_email     TEXT NOT NULL,
  visitor_phone     TEXT,
  visitor_company   TEXT,
  citizenship       TEXT NOT NULL,              -- 'us_person' | 'foreign_national'
  host_entra_id     TEXT NOT NULL,
  host_email        TEXT NOT NULL,
  host_display_name TEXT NOT NULL,
  purpose           TEXT NOT NULL,
  purpose_category  TEXT,                       -- 'meeting' | 'interview' | 'delivery' | 'contractor' | 'audit' | 'other'
  photo_key         TEXT NOT NULL,              -- R2 key: visit-photos/{id}.jpg
  nda_pdf_key       TEXT NOT NULL,              -- R2 key: signed-ndas/{id}.pdf
  badge_pdf_key     TEXT,                       -- R2 key: badge-pdfs/{id}.pdf
  escort_required   INTEGER NOT NULL,           -- 0|1, mirrors citizenship = foreign_national
  slack_dm_ts       TEXT,                       -- thread ts for sign-out button callback
  notes             TEXT
);

CREATE INDEX idx_visits_open ON visits(check_out_at) WHERE check_out_at IS NULL;
CREATE INDEX idx_visits_checkin ON visits(check_in_at);
CREATE INDEX idx_visits_visitor ON visits(visitor_email, visitor_phone);

CREATE TABLE hosts_cache (
  entra_id          TEXT PRIMARY KEY,
  display_name      TEXT NOT NULL,
  email             TEXT NOT NULL,
  slack_user_id     TEXT,                       -- resolved on write, nullable if no match
  active            INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX idx_hosts_active_name ON hosts_cache(active, display_name);
```

**Returning-visitor lookup:** on the identity screen, query `visits` by `(visitor_email, visitor_phone)` within the last 12 months, return most recent match to pre-fill name/company. NDA is always re-signed — no skip.

## Visitor Flow (iPad)

1. **Welcome** — three tiles: "Sign in" / "Sign out" / "Delivery".
2. **Citizenship declaration** — "Are you a U.S. Person?" with plain-language definition ("U.S. citizen, permanent resident, or protected individual under 8 U.S.C. § 1324b(a)(3)"). Drives NDA branch + escort flag.
3. **Identity** — name, company, email, phone. Returning visitors: "Welcome back, Jane Doe from Acme. Not you? [Edit]".
4. **Host picker** — searchable list from Entra cache. Shows display name + email. Empty-state: "Host not listed? [Tell front desk]" triggers Slack message to `#front-desk`.
5. **Purpose** — chip row (meeting / interview / delivery / contractor / audit / other) + 140-char free-text.
6. **Photo** — `getUserMedia` front camera, 3-2-1 countdown, preview, accept/retake.
7. **NDA** — appropriate template rendered full-screen, scroll-to-bottom enabled, then signature canvas. Finger-signature → PNG → stamped into PDF with name, date, IP, user agent.
8. **Badge** — PDF generated; AirPrint dialog triggered via `window.print()` on a hidden iframe. Badge shows photo, name, company, host, date/time, and a full-width aerospace-orange `ESCORT REQUIRED` band if foreign national.
9. **Notify** — Slack fan-out. Confirmation: "You're checked in. [Host] has been notified." Auto-return to welcome after 15s.

**Delivery flow** skips citizenship, NDA, and photo. Captures name, carrier, and a single-line delivery-receipt signature (not a legal NDA — stored as a small `delivery-receipts/{id}.pdf` in R2). Host defaults to shipping/receiving. Badge has a "DELIVERY" header instead of photo. Faster path for UPS/FedEx.

**Sign-out flow (on iPad):** Tap "Sign out" → search name → confirm → done. Updates `check_out_at`, sends DM to host "Jane Doe has signed out."

## Host / Slack Integration

Every visit triggers:

| Destination | Content | Purpose |
|---|---|---|
| DM to host | Photo, visitor name/company, purpose, "✅ Signed out" Block Kit button | Host-owned |
| `#front-desk` | Same minus button | Rolling log for reception / safety officer |
| `#compliance` (FN only) | Same + "ESCORT REQUIRED" callout | ITAR visibility |

**Sign-out triggers (defense-in-depth):**
1. Visitor self-signout on iPad.
2. Host clicks "✅ Signed out" button in Slack DM (Slack interactivity webhook to Worker).
3. Cron at 18:07 MT auto-closes open visits with `check_out_method = auto` and flags the visit for front-desk morning review.

**Host resolution:** Entra `mail` → Slack `users.lookupByEmail`. Cached in `hosts_cache.slack_user_id`. If no match, DM is skipped and an alert posts to `#visitor-app-errors` with the host email.

## Admin / Visibility

- `/admin/on-site` — life-safety roll-call page. Who's checked in, when, with which host. One-click sign-out per row.
- `/admin/visits` — paginated history with filters (date range / host / citizenship / purpose category). Click a row to download photo + signed NDA.
- `/admin/hosts` — view Entra cache state; "Refresh now" button.

**Auth:** Cloudflare Access in front of `/admin/*`, Entra SSO behind it. Worker trusts the Access JWT; no additional auth code.

## NDA Templates

Two files in repo, versioned in git:

```
templates/
  us-person-nda.md          -- US Person standard NDA (stub with [LEGAL: ...])
  foreign-national-nda.md   -- FN NDA with ITAR deemed-export language (stub)
  badge.html                -- Handlebars template for badge PDF
```

NDAs rendered at sign-time: `{{visitor_name}}`, `{{company}}`, `{{date}}`, `{{host}}` interpolated, signature image embedded, PDF generated with pdf-lib and stored to R2.

Template changes are git commits, so the exact wording at time of signing is always recoverable via git history + the stored PDF.

## Retention

- Photos: 2 years, then delete via R2 lifecycle.
- Signed NDAs: 7 years (aerospace-typical), then delete.
- Visit records (D1): indefinite for v1. Revisit when volume becomes a problem.
- Cron `18:07 MT` handles auto-signout; separate weekly cron checks lifecycle.

## Tech Stack

- Cloudflare Workers (Hono) — TypeScript strict
- React + Vite, served as static assets
- Tailwind with FFMFG palette (dark: `#1a1a2e` bg, `#ffffff` text, `#00b4d8` accents, `#e76f51` escort stripe)
- Zod at all HTTP boundaries
- pdf-lib for PDF assembly
- D1 migrations via Wrangler
- GitHub Actions CI: typecheck + test on PR; deploy on merge to `main`

## Repo

- Name: `visit-signin` under `github.com/ffmfg` org
- **Public**, MIT license (user plans to share)
- README: what it is, why it exists, setup guide, and a "deploying your own" section for other shops
- `CLAUDE.md` in repo root with project-specific conventions

## Error Handling

Every external integration (Entra, Slack, AirPrint, D1, R2) has a well-defined failure mode:

| Integration | Failure mode | User-visible behavior |
|---|---|---|
| Entra host list | Stale cache acceptable up to 24h | Fall back to cache; flag to `#visitor-app-errors` |
| Slack DM | Transient error | Visit still recorded; retry once; post to `#visitor-app-errors` on second failure |
| Slack channel post | Transient error | Visit still recorded; retry once |
| Photo capture | Permission denied | "Camera required" message with retry |
| PDF generation | Exception | Sign-in fails with "Please see front desk" — front desk notified via Slack |
| Print | iPad can't reach printer | "Print failed" + "Ask front desk to print your badge" + PDF available at `/admin/visits` |

Philosophy: a visitor should never be stuck. The audit trail (visit record, photo, NDA) is the priority; the badge print is best-effort.

## Testing

- Unit: NdaRenderer (template + signature → PDF bytes), citizenship → template+badge-style mapping, host-email-to-Slack-user resolution
- Integration: Miniflare-based tests for Hono routes — full sign-in flow hitting in-memory D1/R2/KV
- Manual: smoke script on deploy that creates a test visit, verifies Slack DM lands, verifies PDF is in R2

## External Dependencies / Setup Required

These MUST exist before the app is useful in prod — flagged to be provisioned separately:

1. **Brother QL-820NWB + DK-1202 die-cut labels** — ~$250 + $30 label roll. Join to shop Wi-Fi, enable AirPrint.
2. **Dedicated iPad** — any current-gen iPad, Guided Access mode enabled, Safari pinned to visit.ffmfg.com.
3. **Slack app** — Bot with scopes: `chat:write`, `chat:write.public`, `im:write`, `users:read`, `users:read.email`, `commands`. Installed to the FFMFG workspace. Tokens stored as Worker secrets.
4. **Entra app registration** — Client credentials flow, Graph `User.Read.All` scope admin-consented. Tokens stored as Worker secrets.
5. **Slack channels** — `#front-desk`, `#compliance`, `#visitor-app-errors`. Bot invited to each.
6. **Cloudflare DNS** — CNAME `visit.ffmfg.com` → Worker.
7. **Cloudflare Access** — Application covering `visit.ffmfg.com/admin/*`, Entra SSO identity provider.

## Open Questions

None — all resolved during brainstorming. Revisit if any of the external setup items reveals unexpected constraints.
