/**
 * BadgePrinter is an *artifact producer* — it generates the badge PDF and
 * hands it off. Actual printing happens on the iPad via AirPrint to a
 * Wi-Fi label printer (Brother QL-820NWB in our reference setup).
 *
 * This lets the Worker stay off the shop LAN — no firewall/VPN story.
 */

import type { Visit } from "@shared/types";
import { renderBadgePdf } from "../pdf/badge";

export interface BadgePrinter {
  produce(visit: Visit, photoBytes: Uint8Array): Promise<Uint8Array>;
}

export class AirPrintBadgePrinter implements BadgePrinter {
  async produce(visit: Visit, photoBytes: Uint8Array): Promise<Uint8Array> {
    return renderBadgePdf({
      visitorName: visit.visitorName,
      company: visit.visitorCompany,
      hostDisplayName: visit.hostDisplayName,
      checkInAt: visit.checkInAt,
      photoBytes,
      escortRequired: visit.escortRequired,
    });
  }
}

export function makeBadgePrinter(): BadgePrinter {
  return new AirPrintBadgePrinter();
}
