import { Hono } from "hono";
import type { Env } from "../env";
import { checkOutVisit } from "../db/visits";
import { makeHostNotifier } from "../services/host-notifier";

export const slack = new Hono<{ Bindings: Env }>();

/**
 * Slack interactive webhook. Wired to the "Signed out" button in the host
 * DM. Payload is form-encoded with a single `payload` field containing JSON.
 *
 * Signature verification uses SLACK_SIGNING_SECRET — we verify v0=... HMAC
 * over the raw body. Skipped when the secret isn't set (dev mode).
 */
slack.post("/interactive", async (c) => {
  const rawBody = await c.req.text();

  if (c.env.SLACK_SIGNING_SECRET) {
    const ok = await verifySlackSignature(c.env.SLACK_SIGNING_SECRET, c.req.raw, rawBody);
    if (!ok) return c.json({ error: "invalid_signature" }, 401);
  }

  const form = new URLSearchParams(rawBody);
  const payloadStr = form.get("payload");
  if (!payloadStr) return c.json({ error: "missing_payload" }, 400);

  const payload = JSON.parse(payloadStr) as {
    type: string;
    actions?: { action_id: string; value: string }[];
    user?: { id: string };
  };
  if (payload.type !== "block_actions" || !payload.actions?.length) {
    return c.json({ ok: true });
  }

  const action = payload.actions[0]!;
  if (action.action_id !== "mark_signed_out") return c.json({ ok: true });

  const visitId = action.value;
  const visit = await checkOutVisit(c.env.DB, visitId, "host", Date.now());
  if (visit) {
    const notifier = makeHostNotifier(c.env);
    await notifier.notifyCheckOut(visit).catch((e) => console.error("slack checkout notify", e));
  }
  return c.json({ ok: true, text: visit ? `Signed out ${visit.visitorName}.` : "Already signed out." });
});

async function verifySlackSignature(
  secret: string,
  req: Request,
  rawBody: string,
): Promise<boolean> {
  const ts = req.headers.get("x-slack-request-timestamp");
  const sig = req.headers.get("x-slack-signature");
  if (!ts || !sig) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number.parseInt(ts, 10)) > 60 * 5) return false;

  const base = `v0:${ts}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base));
  const macHex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const expected = `v0=${macHex}`;
  return timingSafeEq(expected, sig);
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
