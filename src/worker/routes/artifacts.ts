import { Hono } from "hono";
import type { Env } from "../env";

export const artifacts = new Hono<{ Bindings: Env }>();

/**
 * Serves R2 objects. Used by:
 *  - iPad to fetch the generated badge PDF for AirPrint
 *  - Slack to inline the visitor photo in the check-in message
 *  - Admin UI to download photo + NDA records
 *
 * Photos are world-readable when the URL is known (effectively a capability URL).
 * NDAs and badges are behind Access when served via /admin; the raw /api/artifacts/
 * path is safe enough because keys are ulid-based and not enumerable. We still
 * block listing and accept the risk of known-URL fetch for v1.
 */
artifacts.get("/:key{.+}", async (c) => {
  const key = decodeURIComponent(c.req.param("key"));
  if (key.includes("..") || key.startsWith("/")) {
    return c.json({ error: "bad_key" }, 400);
  }
  const obj = await c.env.R2.get(key);
  if (!obj) return c.json({ error: "not_found" }, 404);

  const headers = new Headers();
  if (obj.httpMetadata?.contentType) {
    headers.set("content-type", obj.httpMetadata.contentType);
  }
  headers.set("cache-control", "private, max-age=300");
  return new Response(obj.body, { headers });
});
