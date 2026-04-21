-- Deliveries: simpler flow than visits, no host/NDA/photo
-- Tracked in a separate table since the data shape is genuinely different

CREATE TABLE deliveries (
  id                TEXT PRIMARY KEY,
  received_at       INTEGER NOT NULL,
  courier_name      TEXT NOT NULL,
  courier_company   TEXT,
  carrier           TEXT,
  receipt_pdf_key   TEXT NOT NULL
);

CREATE INDEX idx_deliveries_received ON deliveries(received_at);
