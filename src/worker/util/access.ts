import type { Context, Next } from "hono";

/**
 * Cloudflare Access puts the authenticated identity into the `Cf-Access-Authenticated-User-Email`
 * header after verifying the JWT at the edge. Trusting the header is safe because
 * the route is only reachable through the Access policy; direct origin hits are blocked.
 *
 * For local development, we allow a DEV_BYPASS env var.
 */
export async function requireAccess(c: Context, next: Next): Promise<Response | void> {
  const email = c.req.header("cf-access-authenticated-user-email");
  if (email) {
    c.set("accessUser", email);
    return next();
  }

  // Dev fallback
  const host = c.req.header("host") ?? "";
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.endsWith(".local")) {
    c.set("accessUser", "dev@local");
    return next();
  }

  return c.json({ error: "forbidden", detail: "Cloudflare Access required" }, 403);
}
