-- Initial schema for visit-signin
-- Generated 2026-04-21

CREATE TABLE visits (
  id                TEXT PRIMARY KEY,           -- ulid
  check_in_at       INTEGER NOT NULL,           -- epoch ms
  check_out_at      INTEGER,                    -- null while on-site
  check_out_method  TEXT,                       -- 'self' | 'host' | 'auto'
  visitor_name      TEXT NOT NULL,
  visitor_email     TEXT NOT NULL,
  visitor_phone     TEXT,
  visitor_company   TEXT,
  citizenship       TEXT NOT NULL,              -- 'us_person' | 'foreign_national'
  host_entra_id     TEXT NOT NULL,
  host_email        TEXT NOT NULL,
  host_display_name TEXT NOT NULL,
  purpose           TEXT NOT NULL,
  purpose_category  TEXT,                       -- 'meeting' | 'interview' | 'delivery' | 'contractor' | 'audit' | 'other'
  photo_key         TEXT NOT NULL,              -- R2 key: visit-photos/{id}.jpg
  nda_pdf_key       TEXT NOT NULL,              -- R2 key: signed-ndas/{id}.pdf
  badge_pdf_key     TEXT,                       -- R2 key: badge-pdfs/{id}.pdf
  escort_required   INTEGER NOT NULL,           -- 0|1
  slack_dm_ts       TEXT,                       -- thread ts for sign-out button callback
  notes             TEXT
);

CREATE INDEX idx_visits_open ON visits(check_out_at) WHERE check_out_at IS NULL;
CREATE INDEX idx_visits_checkin ON visits(check_in_at);
CREATE INDEX idx_visits_visitor ON visits(visitor_email, visitor_phone);

CREATE TABLE hosts_cache (
  entra_id        TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  email           TEXT NOT NULL,
  slack_user_id   TEXT,
  active          INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX idx_hosts_active_name ON hosts_cache(active, display_name);
