import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { visits } from "./routes/visits";
import { hosts } from "./routes/hosts";
import { artifacts } from "./routes/artifacts";
import { slack } from "./routes/slack";
import { deliveries } from "./routes/deliveries";
import { admin } from "./routes/admin";
import { autoCloseOpenVisits, listOpenVisits } from "./db/visits";
import { makeHostNotifier } from "./services/host-notifier";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors({ origin: "*", allowMethods: ["GET", "POST"] }));

app.get("/api/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.route("/api/visits", visits);
app.route("/api/hosts", hosts);
app.route("/api/artifacts", artifacts);
app.route("/api/slack", slack);
app.route("/api/deliveries", deliveries);
app.route("/api/admin", admin);

// Anything else falls through to static assets (React SPA)
app.get("/api/*", (c) => c.json({ error: "not_found" }, 404));

export default {
  fetch: app.fetch,

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Runs daily at 00:07 UTC = ~18:07 MT (during DST). Cron adjusts naturally
    // twice a year — close enough; front desk reviews auto-closes in morning.
    ctx.waitUntil(runAutoSignout(env));
  },
} satisfies ExportedHandler<Env>;

async function runAutoSignout(env: Env): Promise<void> {
  const open = await listOpenVisits(env.DB);
  if (open.length === 0) return;
  const closed = await autoCloseOpenVisits(env.DB, Date.now());
  const notifier = makeHostNotifier(env);
  for (const v of closed) {
    await notifier.notifyCheckOut({ ...v, checkOutMethod: "auto" }).catch((e) =>
      console.error("auto-signout notify", e),
    );
  }
  await notifier.notifyError(`Auto-signed-out ${closed.length} visit(s) at end of day.`);
}
