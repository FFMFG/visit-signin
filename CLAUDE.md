# CLAUDE.md — visit-signin

Guidance for Claude Code working in this repo.

## What this is

Visitor sign-in kiosk for CMMC-adjacent aerospace shops. Runs on an iPad at the front desk. Replaces Envoy. Host: `visit.ffmfg.com` (Cloudflare Worker).

Origin spec: `docs/specs/2026-04-21-visitor-signin-design.md`. Read it before making non-trivial changes.

## Architecture

One package. Three source trees:

- `src/worker/` — Hono on Cloudflare Workers. Owns D1, R2, KV, Slack, Entra, PDF generation.
- `src/web/` — React SPA, iPad-first. Kiosk flow + admin pages.
- `src/shared/` — Zod schemas + types shared across the worker/web boundary.

The Worker serves `/api/*` and hands everything else to the static assets binding.

## Key conventions

- **Strict TS.** `noUncheckedIndexedAccess`, no implicit any. Zod at every HTTP boundary.
- **Interfaces for swappable integrations.** `HostDirectory`, `HostNotifier`, `BadgePrinter` — each has one real implementation and a stub. Adding a new source means a new implementation, not editing callers.
- **No legal text in git.** NDAs use `[LEGAL: ...]` placeholders. Real wording gets pasted in by legal and versioned separately.
- **Defense-in-depth for sign-out.** Three independent mechanisms (iPad self-signout, Slack button, cron). Don't collapse into one.
- **Citizenship branches everything downstream.** Template choice, badge style, `#compliance` cc, escort flag. Keep branching explicit — don't hide it in helpers.

## Tech

- Cloudflare Workers + Hono
- React 19 + Vite + Tailwind v4
- D1 (SQLite-at-edge), R2 (objects), KV (short-lived cache)
- pdf-lib for NDA + badge PDFs
- Vitest with `@cloudflare/vitest-pool-workers` for worker tests
- Biome for lint/format

## Workflow

- `npm run dev` — Vite dev server + miniflare Worker at :8787, SPA at :5173
- `npm run test` — unit + integration tests
- `npm run typecheck`
- `npm run db:migrate:local` / `db:migrate:remote`

Before deploy: `npm run typecheck && npm run test && npm run build`.

## FFMFG brand

Dark theme: `#1a1a2e` bg, `#ffffff` text, `#00b4d8` accents, `#e76f51` escort stripe. Inter font. See the parent workspace `CLAUDE.md` for brand details.
