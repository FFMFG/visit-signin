import type { Host } from "@shared/types";
import type { Env } from "../env";

export interface HostDirectory {
  list(): Promise<Host[]>;
  search(query: string): Promise<Host[]>;
  getById(entraId: string): Promise<Host | null>;
}

/**
 * Stub implementation used until Entra is wired up. Hardcoded list + email-based
 * Slack lookup on demand. Good enough to exercise the whole flow end-to-end.
 */
export class StubHostDirectory implements HostDirectory {
  private hosts: Host[] = [
    {
      entraId: "stub-tal",
      displayName: "Tal Schwartz",
      email: "tschwartz@ffmfg.com",
      slackUserId: null,
    },
    {
      entraId: "stub-shipping",
      displayName: "Shipping & Receiving",
      email: "shipping@ffmfg.com",
      slackUserId: null,
    },
    {
      entraId: "stub-frontdesk",
      displayName: "Front Desk",
      email: "frontdesk@ffmfg.com",
      slackUserId: null,
    },
  ];

  async list(): Promise<Host[]> {
    return this.hosts;
  }

  async search(query: string): Promise<Host[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.hosts;
    return this.hosts.filter(
      (h) =>
        h.displayName.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q),
    );
  }

  async getById(entraId: string): Promise<Host | null> {
    return this.hosts.find((h) => h.entraId === entraId) ?? null;
  }
}

/**
 * Entra-backed implementation. Not wired up yet — swap in once the app
 * registration exists and ENTRA_* secrets are set.
 *
 * Reads from MS Graph /users, filters to enabled users, caches in KV for
 * 1 hour. On cache miss, fetches fresh and writes back. On Graph failure,
 * falls back to the last-known-good cache (up to 24h stale) and posts to
 * #visitor-app-errors.
 */
export class EntraHostDirectory implements HostDirectory {
  // biome-ignore lint/correctness/noUnusedVariables: implementation pending
  constructor(private env: Env) {}

  async list(): Promise<Host[]> {
    throw new Error("EntraHostDirectory not implemented yet — use StubHostDirectory");
  }
  async search(_query: string): Promise<Host[]> {
    throw new Error("EntraHostDirectory not implemented yet");
  }
  async getById(_entraId: string): Promise<Host | null> {
    throw new Error("EntraHostDirectory not implemented yet");
  }
}

export function makeHostDirectory(env: Env): HostDirectory {
  if (env.ENTRA_TENANT_ID && env.ENTRA_CLIENT_ID && env.ENTRA_CLIENT_SECRET) {
    return new EntraHostDirectory(env);
  }
  return new StubHostDirectory();
}
