export interface Env {
  // Bindings
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  ASSETS: Fetcher;

  // Vars
  TIMEZONE: string;
  AUTO_SIGNOUT_HOUR_LOCAL: string;
  FRONT_DESK_CHANNEL: string;
  COMPLIANCE_CHANNEL: string;
  ERROR_CHANNEL: string;

  // Secrets (set via `wrangler secret put`)
  SLACK_BOT_TOKEN?: string;
  SLACK_SIGNING_SECRET?: string;
  ENTRA_TENANT_ID?: string;
  ENTRA_CLIENT_ID?: string;
  ENTRA_CLIENT_SECRET?: string;
}
