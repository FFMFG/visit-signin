import { Hono } from "hono";
import type { Env } from "../env";
import { requireAccess } from "../util/access";
import { listOpenVisits, listVisitsBetween } from "../db/visits";

export const admin = new Hono<{ Bindings: Env; Variables: { accessUser: string } }>();

admin.use("*", requireAccess);

admin.get("/me", (c) => c.json({ email: c.get("accessUser") }));
admin.get("/on-site", async (c) => c.json({ visits: await listOpenVisits(c.env.DB) }));
admin.get("/visits", async (c) => {
  const fromMs = Number.parseInt(c.req.query("from") ?? `${Date.now() - 30 * 24 * 3600_000}`, 10);
  const toMs = Number.parseInt(c.req.query("to") ?? `${Date.now()}`, 10);
  const list = await listVisitsBetween(c.env.DB, fromMs, toMs);
  return c.json({ visits: list });
});
