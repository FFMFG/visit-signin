import type {
  Citizenship,
  Host,
  PurposeCategory,
  VisitorIdentity,
} from "@shared/types";

export type KioskStep =
  | "welcome"
  | "citizenship"
  | "identity"
  | "host"
  | "purpose"
  | "photo"
  | "nda"
  | "confirmation"
  | "signout_pick"
  | "signout_done"
  | "delivery"
  | "delivery_done";

export interface KioskDraft {
  citizenship?: Citizenship;
  identity?: VisitorIdentity;
  host?: Host;
  purpose?: string;
  purposeCategory?: PurposeCategory;
  photoDataUrl?: string;
  signatureDataUrl?: string;
  visitId?: string;
  badgePdfUrl?: string;
}
