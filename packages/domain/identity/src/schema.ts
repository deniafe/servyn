import { z } from "zod/v4";

// ── jsonb / serialised-JSON column schemas ────────────────────────────────────

export const DefaultLocationSchema = z.object({
  postcode: z.string(),
  lat: z.number(),
  lng: z.number(),
  label: z.string().optional(),
});

export type DefaultLocation = z.infer<typeof DefaultLocationSchema>;

export const VerificationMetadataSchema = z.object({
  issuedBy: z.string().optional(),
  certificateNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type VerificationMetadata = z.infer<typeof VerificationMetadataSchema>;

// ── Domain enum / union schemas ───────────────────────────────────────────────

export const UserStatusSchema = z.enum(["active", "suspended", "deleted"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const VendorVerificationStatusSchema = z.enum([
  "unverified",
  "pending",
  "verified",
  "rejected",
]);
export type VendorVerificationStatus = z.infer<typeof VendorVerificationStatusSchema>;

export const VerificationKindSchema = z.enum([
  "identity",
  "business",
  "dbs",
  "qualification",
  "reference",
]);
export type VerificationKind = z.infer<typeof VerificationKindSchema>;

export const VerificationStateSchema = z.enum([
  "unverified",
  "pending",
  "verified",
  "rejected",
  "expired",
]);
export type VerificationState = z.infer<typeof VerificationStateSchema>;

export const SafeguardingReportStateSchema = z.enum(["open", "under_review", "resolved", "closed"]);
export type SafeguardingReportState = z.infer<typeof SafeguardingReportStateSchema>;

export const VendorMemberRoleSchema = z.enum(["owner", "member"]);
export type VendorMemberRole = z.infer<typeof VendorMemberRoleSchema>;
