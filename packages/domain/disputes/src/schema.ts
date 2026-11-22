import { z } from "zod/v4";

export const DisputeReasonSchema = z.enum([
  "service_not_delivered",
  "quality_issue",
  "no_show",
  "unauthorised_charge",
  "other",
]);
export type DisputeReason = z.infer<typeof DisputeReasonSchema>;

export const DisputeStateSchema = z.enum([
  "open",
  "under_review",
  "resolved_customer",
  "resolved_vendor",
  "closed",
]);
export type DisputeState = z.infer<typeof DisputeStateSchema>;

export const EvidenceKindSchema = z.enum(["image", "document", "text", "video"]);
export type EvidenceKind = z.infer<typeof EvidenceKindSchema>;
