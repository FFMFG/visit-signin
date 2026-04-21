import { Hono } from "hono";
import { ulid } from "ulid";
import { CreateDeliveryRequest } from "@shared/types";
import type { Env } from "../env";
import { decodeDataUrl } from "../util/data-url";
import { insertDelivery } from "../db/deliveries";

export const deliveries = new Hono<{ Bindings: Env }>();

deliveries.post("/", async (c) => {
  const parsed = CreateDeliveryRequest.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_request", detail: parsed.error.message }, 400);
  }
  const d = parsed.data;
  const id = ulid();
  const now = Date.now();

  const signature = decodeDataUrl(d.signatureDataUrl);
  // Minimal receipt PDF — for v1 just save the signature image. Formal PDF later.
  const key = `delivery-receipts/${id}.png`;
  await c.env.R2.put(key, signature.bytes, {
    httpMetadata: { contentType: "image/png" },
  });
  await insertDelivery(c.env.DB, {
    id,
    receivedAt: now,
    courierName: d.identity.name,
    courierCompany: d.identity.company ?? null,
    carrier: d.carrier ?? null,
    receiptPdfKey: key,
  });
  return c.json({ id, ok: true });
});
