import { Hono } from "hono";
import { ulid } from "ulid";
import { CheckOutMethod, CreateVisitRequest } from "@shared/types";
import type { Env } from "../env";
import { decodeDataUrl } from "../util/data-url";
import { makeHostDirectory } from "../services/host-directory";
import { makeHostNotifier } from "../services/host-notifier";
import { makeBadgePrinter } from "../services/badge-printer";
import { renderNdaPdf } from "../pdf/nda";
import {
  checkOutVisit,
  findRecentVisitor,
  getVisit,
  insertVisit,
  listOpenVisits,
  listVisitsBetween,
  setBadgeKey,
  setSlackThreadTs,
} from "../db/visits";

export const visits = new Hono<{ Bindings: Env }>();

visits.post("/", async (c) => {
  const parsed = CreateVisitRequest.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_request", detail: parsed.error.message }, 400);
  }
  const req = parsed.data;

  const hosts = makeHostDirectory(c.env);
  const host = await hosts.getById(req.hostEntraId);
  if (!host) return c.json({ error: "unknown_host" }, 404);

  const id = ulid();
  const now = Date.now();

  const photo = decodeDataUrl(req.photoDataUrl);
  const signature = decodeDataUrl(req.signatureDataUrl);

  const photoKey = `visit-photos/${id}.${photo.mime === "image/png" ? "png" : "jpg"}`;
  await c.env.R2.put(photoKey, photo.bytes, { httpMetadata: { contentType: photo.mime } });

  const ndaBytes = await renderNdaPdf({
    visitorName: req.identity.name,
    company: req.identity.company,
    hostDisplayName: host.displayName,
    purpose: req.purpose,
    citizenship: req.citizenship,
    signatureImageBytes: signature.bytes,
    sessionId: id,
    dateIso: new Date(now).toISOString(),
  });
  const ndaKey = `signed-ndas/${id}.pdf`;
  await c.env.R2.put(ndaKey, ndaBytes, { httpMetadata: { contentType: "application/pdf" } });

  const visit = {
    id,
    checkInAt: now,
    visitorName: req.identity.name,
    visitorEmail: req.identity.email.toLowerCase(),
    visitorPhone: req.identity.phone,
    visitorCompany: req.identity.company ?? null,
    citizenship: req.citizenship,
    hostEntraId: host.entraId,
    hostEmail: host.email,
    hostDisplayName: host.displayName,
    purpose: req.purpose,
    purposeCategory: req.purposeCategory,
    photoKey,
    ndaPdfKey: ndaKey,
    escortRequired: req.citizenship === "foreign_national",
  };
  await insertVisit(c.env.DB, visit);

  const printer = makeBadgePrinter();
  const badgeBytes = await printer.produce(
    {
      ...visit,
      checkOutAt: null,
      checkOutMethod: null,
      badgePdfKey: null,
      slackDmTs: null,
      notes: null,
    },
    photo.bytes,
  );
  const badgeKey = `badge-pdfs/${id}.pdf`;
  await c.env.R2.put(badgeKey, badgeBytes, {
    httpMetadata: { contentType: "application/pdf" },
  });
  await setBadgeKey(c.env.DB, id, badgeKey);

  // Notify Slack. Do NOT fail the sign-in on Slack errors.
  const notifier = makeHostNotifier(c.env);
  const photoPublicUrl = `${new URL(c.req.url).origin}/api/artifacts/${encodeURIComponent(photoKey)}`;
  const fullVisit = (await getVisit(c.env.DB, id))!;
  const notify = await notifier
    .notifyCheckIn(fullVisit, photoPublicUrl)
    .catch((e) => {
      console.error("notify failed", e);
      return null;
    });
  if (notify?.hostDmTs) await setSlackThreadTs(c.env.DB, id, notify.hostDmTs);

  return c.json({
    id,
    badgePdfUrl: `/api/artifacts/${encodeURIComponent(badgeKey)}`,
    hostNotified: notify !== null && notify.hostDmTs !== null,
  });
});

visits.post("/:id/checkout", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { method?: string };
  const method = CheckOutMethod.safeParse(body.method ?? "self");
  if (!method.success) return c.json({ error: "invalid_method" }, 400);

  const visit = await checkOutVisit(c.env.DB, id, method.data, Date.now());
  if (!visit) return c.json({ error: "not_found_or_already_closed" }, 404);

  const notifier = makeHostNotifier(c.env);
  await notifier.notifyCheckOut(visit).catch((e) => console.error("checkout notify failed", e));
  return c.json({ ok: true, visit });
});

visits.get("/recent-visitor", async (c) => {
  const email = c.req.query("email");
  const phone = c.req.query("phone");
  if (!email || !phone) return c.json({ error: "email_and_phone_required" }, 400);
  const v = await findRecentVisitor(c.env.DB, email, phone);
  if (!v) return c.json({ found: false });
  return c.json({
    found: true,
    name: v.visitorName,
    company: v.visitorCompany,
  });
});

visits.get("/open", async (c) => {
  const open = await listOpenVisits(c.env.DB);
  return c.json({ visits: open });
});

visits.get("/history", async (c) => {
  const fromMs = Number.parseInt(c.req.query("from") ?? "0", 10);
  const toMs = Number.parseInt(c.req.query("to") ?? `${Date.now()}`, 10);
  const list = await listVisitsBetween(c.env.DB, fromMs, toMs);
  return c.json({ visits: list });
});
