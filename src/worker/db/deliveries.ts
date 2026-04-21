export interface DeliveryRow {
  id: string;
  received_at: number;
  courier_name: string;
  courier_company: string | null;
  carrier: string | null;
  receipt_pdf_key: string;
}

export async function insertDelivery(
  db: D1Database,
  d: {
    id: string;
    receivedAt: number;
    courierName: string;
    courierCompany: string | null;
    carrier: string | null;
    receiptPdfKey: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO deliveries (id, received_at, courier_name, courier_company, carrier, receipt_pdf_key)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(d.id, d.receivedAt, d.courierName, d.courierCompany, d.carrier, d.receiptPdfKey)
    .run();
}
