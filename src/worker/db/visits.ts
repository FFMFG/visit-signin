import type { CheckOutMethod, Visit } from "@shared/types";

export interface VisitRow {
  id: string;
  check_in_at: number;
  check_out_at: number | null;
  check_out_method: CheckOutMethod | null;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string | null;
  visitor_company: string | null;
  citizenship: "us_person" | "foreign_national";
  host_entra_id: string;
  host_email: string;
  host_display_name: string;
  purpose: string;
  purpose_category: string | null;
  photo_key: string;
  nda_pdf_key: string;
  badge_pdf_key: string | null;
  escort_required: number;
  slack_dm_ts: string | null;
  notes: string | null;
}

export function rowToVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    checkInAt: row.check_in_at,
    checkOutAt: row.check_out_at,
    checkOutMethod: row.check_out_method,
    visitorName: row.visitor_name,
    visitorEmail: row.visitor_email,
    visitorPhone: row.visitor_phone,
    visitorCompany: row.visitor_company,
    citizenship: row.citizenship,
    hostEntraId: row.host_entra_id,
    hostEmail: row.host_email,
    hostDisplayName: row.host_display_name,
    purpose: row.purpose,
    purposeCategory: row.purpose_category as Visit["purposeCategory"],
    photoKey: row.photo_key,
    ndaPdfKey: row.nda_pdf_key,
    badgePdfKey: row.badge_pdf_key,
    escortRequired: row.escort_required === 1,
    slackDmTs: row.slack_dm_ts,
    notes: row.notes,
  };
}

export async function insertVisit(
  db: D1Database,
  v: Omit<Visit, "checkOutAt" | "checkOutMethod" | "badgePdfKey" | "slackDmTs" | "notes">,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO visits (
        id, check_in_at, visitor_name, visitor_email, visitor_phone, visitor_company,
        citizenship, host_entra_id, host_email, host_display_name, purpose, purpose_category,
        photo_key, nda_pdf_key, escort_required
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`,
    )
    .bind(
      v.id,
      v.checkInAt,
      v.visitorName,
      v.visitorEmail,
      v.visitorPhone,
      v.visitorCompany,
      v.citizenship,
      v.hostEntraId,
      v.hostEmail,
      v.hostDisplayName,
      v.purpose,
      v.purposeCategory,
      v.photoKey,
      v.ndaPdfKey,
      v.escortRequired ? 1 : 0,
    )
    .run();
}

export async function setBadgeKey(
  db: D1Database,
  visitId: string,
  badgePdfKey: string,
): Promise<void> {
  await db
    .prepare("UPDATE visits SET badge_pdf_key = ?1 WHERE id = ?2")
    .bind(badgePdfKey, visitId)
    .run();
}

export async function setSlackThreadTs(
  db: D1Database,
  visitId: string,
  ts: string,
): Promise<void> {
  await db
    .prepare("UPDATE visits SET slack_dm_ts = ?1 WHERE id = ?2")
    .bind(ts, visitId)
    .run();
}

export async function checkOutVisit(
  db: D1Database,
  visitId: string,
  method: CheckOutMethod,
  at: number,
): Promise<Visit | null> {
  await db
    .prepare(
      `UPDATE visits SET check_out_at = ?1, check_out_method = ?2
       WHERE id = ?3 AND check_out_at IS NULL`,
    )
    .bind(at, method, visitId)
    .run();
  return getVisit(db, visitId);
}

export async function getVisit(db: D1Database, id: string): Promise<Visit | null> {
  const row = await db
    .prepare("SELECT * FROM visits WHERE id = ?1")
    .bind(id)
    .first<VisitRow>();
  return row ? rowToVisit(row) : null;
}

export async function listOpenVisits(db: D1Database): Promise<Visit[]> {
  const res = await db
    .prepare("SELECT * FROM visits WHERE check_out_at IS NULL ORDER BY check_in_at DESC")
    .all<VisitRow>();
  return (res.results ?? []).map(rowToVisit);
}

export async function listVisitsBetween(
  db: D1Database,
  fromMs: number,
  toMs: number,
  limit = 200,
): Promise<Visit[]> {
  const res = await db
    .prepare(
      `SELECT * FROM visits WHERE check_in_at BETWEEN ?1 AND ?2
       ORDER BY check_in_at DESC LIMIT ?3`,
    )
    .bind(fromMs, toMs, limit)
    .all<VisitRow>();
  return (res.results ?? []).map(rowToVisit);
}

export async function findRecentVisitor(
  db: D1Database,
  email: string,
  phone: string,
): Promise<Visit | null> {
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const row = await db
    .prepare(
      `SELECT * FROM visits
       WHERE visitor_email = ?1 AND visitor_phone = ?2 AND check_in_at > ?3
       ORDER BY check_in_at DESC LIMIT 1`,
    )
    .bind(email.toLowerCase(), phone, cutoff)
    .first<VisitRow>();
  return row ? rowToVisit(row) : null;
}

export async function autoCloseOpenVisits(db: D1Database, at: number): Promise<Visit[]> {
  const open = await listOpenVisits(db);
  for (const v of open) {
    await db
      .prepare(
        "UPDATE visits SET check_out_at = ?1, check_out_method = 'auto' WHERE id = ?2",
      )
      .bind(at, v.id)
      .run();
  }
  return open;
}
