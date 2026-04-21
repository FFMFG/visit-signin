import { z } from "zod";

export const Citizenship = z.enum(["us_person", "foreign_national"]);
export type Citizenship = z.infer<typeof Citizenship>;

export const PurposeCategory = z.enum([
  "meeting",
  "interview",
  "delivery",
  "contractor",
  "audit",
  "other",
]);
export type PurposeCategory = z.infer<typeof PurposeCategory>;

export const CheckOutMethod = z.enum(["self", "host", "auto"]);
export type CheckOutMethod = z.infer<typeof CheckOutMethod>;

export const VisitorIdentity = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(7).max(30),
  company: z.string().max(120).optional(),
});
export type VisitorIdentity = z.infer<typeof VisitorIdentity>;

export const Host = z.object({
  entraId: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  slackUserId: z.string().nullable(),
});
export type Host = z.infer<typeof Host>;

export const CreateVisitRequest = z.object({
  identity: VisitorIdentity,
  citizenship: Citizenship,
  hostEntraId: z.string(),
  purpose: z.string().min(1).max(500),
  purposeCategory: PurposeCategory,
  photoDataUrl: z.string().startsWith("data:image/"),
  signatureDataUrl: z.string().startsWith("data:image/"),
});
export type CreateVisitRequest = z.infer<typeof CreateVisitRequest>;

export const CreateDeliveryRequest = z.object({
  identity: VisitorIdentity.pick({ name: true, company: true }),
  carrier: z.string().max(60).optional(),
  signatureDataUrl: z.string().startsWith("data:image/"),
});
export type CreateDeliveryRequest = z.infer<typeof CreateDeliveryRequest>;

export const Visit = z.object({
  id: z.string(),
  checkInAt: z.number(),
  checkOutAt: z.number().nullable(),
  checkOutMethod: CheckOutMethod.nullable(),
  visitorName: z.string(),
  visitorEmail: z.string().email(),
  visitorPhone: z.string().nullable(),
  visitorCompany: z.string().nullable(),
  citizenship: Citizenship,
  hostEntraId: z.string(),
  hostEmail: z.string().email(),
  hostDisplayName: z.string(),
  purpose: z.string(),
  purposeCategory: PurposeCategory.nullable(),
  photoKey: z.string(),
  ndaPdfKey: z.string(),
  badgePdfKey: z.string().nullable(),
  escortRequired: z.boolean(),
  slackDmTs: z.string().nullable(),
  notes: z.string().nullable(),
});
export type Visit = z.infer<typeof Visit>;

export const CreateVisitResponse = z.object({
  id: z.string(),
  badgePdfUrl: z.string(),
  hostNotified: z.boolean(),
});
export type CreateVisitResponse = z.infer<typeof CreateVisitResponse>;

export const CheckOutRequest = z.object({
  visitId: z.string(),
  method: CheckOutMethod,
});

export const ApiError = z.object({
  error: z.string(),
  detail: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiError>;
