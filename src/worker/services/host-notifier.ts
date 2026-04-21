import type { Visit } from "@shared/types";
import type { Env } from "../env";

export interface NotifyResult {
  hostDmTs: string | null;
  frontDeskTs: string | null;
  complianceTs: string | null;
}

export interface HostNotifier {
  notifyCheckIn(visit: Visit, photoUrl: string): Promise<NotifyResult>;
  notifyCheckOut(visit: Visit): Promise<void>;
  notifyError(message: string, detail?: unknown): Promise<void>;
}

export class StubHostNotifier implements HostNotifier {
  async notifyCheckIn(visit: Visit, _photoUrl: string): Promise<NotifyResult> {
    console.log("[StubHostNotifier] check-in", { id: visit.id, host: visit.hostEmail });
    return { hostDmTs: null, frontDeskTs: null, complianceTs: null };
  }
  async notifyCheckOut(visit: Visit): Promise<void> {
    console.log("[StubHostNotifier] check-out", { id: visit.id });
  }
  async notifyError(message: string, detail?: unknown): Promise<void> {
    console.error("[StubHostNotifier] error", message, detail);
  }
}

/**
 * Slack-backed notifier.
 *
 * Every visit:
 *   - DM to host (if slackUserId resolved) with "Signed out" Block Kit button
 *   - Post to FRONT_DESK_CHANNEL (rolling log)
 * Foreign-national visits additionally:
 *   - Post to COMPLIANCE_CHANNEL with escort callout
 *
 * All failures are soft — visit record is already persisted before notify runs.
 * Errors are caught and reported to ERROR_CHANNEL.
 */
export class SlackHostNotifier implements HostNotifier {
  constructor(
    private token: string,
    private env: Env,
  ) {}

  async notifyCheckIn(visit: Visit, photoUrl: string): Promise<NotifyResult> {
    const result: NotifyResult = { hostDmTs: null, frontDeskTs: null, complianceTs: null };

    const slackUserId = await this.resolveSlackUserId(visit.hostEmail);

    const checkInBlocks = this.buildCheckInBlocks(visit, photoUrl);

    if (slackUserId) {
      try {
        const dm = await this.postMessage({
          channel: slackUserId,
          text: `${visit.visitorName} is here to see you.`,
          blocks: [
            ...checkInBlocks,
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  style: "primary",
                  text: { type: "plain_text", text: "Signed out" },
                  action_id: "mark_signed_out",
                  value: visit.id,
                },
              ],
            },
          ],
        });
        result.hostDmTs = dm.ts;
      } catch (e) {
        await this.notifyError(`DM to ${visit.hostEmail} failed`, e);
      }
    } else {
      await this.notifyError(`No Slack user found for ${visit.hostEmail}`);
    }

    try {
      const frontDesk = await this.postMessage({
        channel: this.env.FRONT_DESK_CHANNEL,
        text: `${visit.visitorName} checked in to see ${visit.hostDisplayName}.`,
        blocks: checkInBlocks,
      });
      result.frontDeskTs = frontDesk.ts;
    } catch (e) {
      await this.notifyError("Front-desk channel post failed", e);
    }

    if (visit.escortRequired) {
      try {
        const compliance = await this.postMessage({
          channel: this.env.COMPLIANCE_CHANNEL,
          text: `ESCORT REQUIRED — ${visit.visitorName} (foreign national) on site to see ${visit.hostDisplayName}.`,
          blocks: [
            ...checkInBlocks,
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: ":warning: *ESCORT REQUIRED* — foreign national visitor. Please ensure escort and restricted-area policy is applied.",
              },
            },
          ],
        });
        result.complianceTs = compliance.ts;
      } catch (e) {
        await this.notifyError("Compliance channel post failed", e);
      }
    }

    return result;
  }

  async notifyCheckOut(visit: Visit): Promise<void> {
    const slackUserId = await this.resolveSlackUserId(visit.hostEmail);
    const methodText =
      visit.checkOutMethod === "auto"
        ? "was auto-signed-out at end of day"
        : visit.checkOutMethod === "host"
          ? "was signed out by their host"
          : "signed themselves out";
    if (slackUserId) {
      await this.postMessage({
        channel: slackUserId,
        text: `${visit.visitorName} ${methodText}.`,
      }).catch((e) => this.notifyError("Check-out DM failed", e));
    }
    await this.postMessage({
      channel: this.env.FRONT_DESK_CHANNEL,
      text: `${visit.visitorName} ${methodText}.`,
    }).catch((e) => this.notifyError("Front-desk check-out post failed", e));
  }

  async notifyError(message: string, detail?: unknown): Promise<void> {
    console.error("[SlackHostNotifier]", message, detail);
    try {
      await this.postMessage({
        channel: this.env.ERROR_CHANNEL,
        text: `:rotating_light: ${message}${detail ? ` — \`${String(detail).slice(0, 500)}\`` : ""}`,
      });
    } catch (e) {
      console.error("[SlackHostNotifier] error channel itself failed", e);
    }
  }

  private buildCheckInBlocks(visit: Visit, photoUrl: string): unknown[] {
    const escortBanner = visit.escortRequired
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: ":large_orange_diamond: *ESCORT REQUIRED* — foreign national visitor",
            },
          },
        ]
      : [];
    return [
      ...escortBanner,
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${visit.visitorName}*${visit.visitorCompany ? ` from ${visit.visitorCompany}` : ""} is here to see *${visit.hostDisplayName}*.\n*Purpose:* ${visit.purpose}`,
        },
        accessory: {
          type: "image",
          image_url: photoUrl,
          alt_text: visit.visitorName,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Checked in <!date^${Math.floor(visit.checkInAt / 1000)}^{date_short_pretty} at {time}|${new Date(visit.checkInAt).toISOString()}>`,
          },
        ],
      },
    ];
  }

  private async resolveSlackUserId(email: string): Promise<string | null> {
    const cacheKey = `slack:user:${email.toLowerCase()}`;
    const cached = await this.env.KV.get(cacheKey);
    if (cached !== null) return cached === "" ? null : cached;

    try {
      const resp = await fetch(
        `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`,
        { headers: { authorization: `Bearer ${this.token}` } },
      );
      const body = (await resp.json()) as { ok: boolean; user?: { id: string } };
      const userId = body.ok && body.user ? body.user.id : null;
      await this.env.KV.put(cacheKey, userId ?? "", { expirationTtl: 3600 });
      return userId;
    } catch (e) {
      console.error("slack users.lookupByEmail failed", e);
      return null;
    }
  }

  private async postMessage(payload: {
    channel: string;
    text: string;
    blocks?: unknown[];
    thread_ts?: string;
  }): Promise<{ ts: string }> {
    const resp = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    const body = (await resp.json()) as { ok: boolean; ts?: string; error?: string };
    if (!body.ok) throw new Error(`slack chat.postMessage: ${body.error ?? "unknown"}`);
    return { ts: body.ts! };
  }
}

export function makeHostNotifier(env: Env): HostNotifier {
  if (env.SLACK_BOT_TOKEN) return new SlackHostNotifier(env.SLACK_BOT_TOKEN, env);
  return new StubHostNotifier();
}
