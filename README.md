# visit-signin

Open-source visitor sign-in kiosk for aerospace, defense, and other CMMC-adjacent shops. Runs on Cloudflare Workers, prints AirPrint badges to any Wi-Fi label printer, and notifies hosts in Slack.

Built at [Final Frontier Manufacturing](https://ffmfg.com) because Envoy's paid tier jumped to $4,500/year and our ITAR posture wanted stricter branching anyway.

## Features

- **iPad kiosk flow** — welcome → citizenship declaration → identity → host → purpose → photo → NDA + signature → AirPrint badge → Slack notify. Under 90 seconds end-to-end.
- **Citizenship-aware NDA + badge** — U.S. Person vs Foreign National branch to different NDAs. Foreign-national badges get a full-width `ESCORT REQUIRED` stripe.
- **Slack fan-out** — DM to host, rolling log to `#front-desk`, `#compliance` cc for foreign-national visits. Host clicks "✅ Signed out" to close the visit.
- **Defense-in-depth sign-out** — three independent mechanisms (self-signout on iPad, host button in Slack, nightly auto-close). Because people forget.
- **Cloudflare Access on admin** — `/admin/on-site` is your emergency roll-call page. SSO via your identity provider, no password management.
- **AirPrint to any Wi-Fi label printer** — no print server, no USB, no driver. We use a Brother QL-820NWB with DK-1202 die-cut labels (~$280 total).

## Architecture

```
iPad (Safari, Guided Access)
     │
     ▼
visit.yourdomain.com  ← Cloudflare Worker (Hono + React SPA)
     │
     ├── D1 (visits, hosts cache)
     ├── R2 (photos, signed NDAs, badges)
     ├── KV (cache TTLs)
     │
     ├── HostDirectory (Entra | Slack | static list)
     ├── HostNotifier  (Slack today)
     └── BadgePrinter  (iPad AirPrint today)
```

Each integration is behind an interface — swap implementations without touching callers.

## Hardware

- iPad (any current generation) — Guided Access mode, Safari pinned to the kiosk URL
- **Brother QL-820NWB** Wi-Fi label printer with **DK-1202** 2.4" × 3.9" die-cut labels
- That's it. No Pi, no print server, no USB dongle.

## Setup

See [docs/SETUP.md](docs/SETUP.md) for:

- Cloudflare account provisioning (Worker, D1, R2, KV, Access)
- Slack app creation ([docs/SLACK_SETUP.md](docs/SLACK_SETUP.md))
- Entra (Microsoft 365) app registration for host directory
- iPad Guided Access setup
- Brother QL-820NWB network configuration

## Development

```bash
npm install
npm run dev          # Vite + Miniflare, iPad-sized preview at http://localhost:5173
npm run test
npm run typecheck
npm run build
npm run deploy       # Cloudflare Worker deploy
```

## Status

v0.1 — end-to-end flow works against mocked host directory. Production-ready minus NDA legal wording (your legal team fills in `templates/*.md`).

## License

MIT. See [LICENSE](LICENSE).
