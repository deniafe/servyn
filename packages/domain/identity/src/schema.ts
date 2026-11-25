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

export const ConsentPreferencesSchema = z.object({
  essential: z.literal(true),
  analytics: z.boolean(),
  marketing: z.boolean(),
  updatedAt: z.string().datetime(),
  version: z.literal(1),
});

export type ConsentPreferences = z.infer<typeof ConsentPreferencesSchema>;

export const UpdateConsentInputSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
});

export type UpdateConsentInput = z.infer<typeof UpdateConsentInputSchema>;

// ── Domain enum / union schemas ───────────────────────────────────────────────

export const RoleContextSchema = z.enum(["customer", "vendor", "seller", "admin"]);
export type RoleContext = z.infer<typeof RoleContextSchema>;

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

// ── Clerk webhook & API input schemas ─────────────────────────────────────────

export const ClerkEmailAddressSchema = z.object({
  id: z.string(),
  email_address: z.string().email(),
});

export const ClerkPhoneNumberSchema = z.object({
  id: z.string(),
  phone_number: z.string(),
});

export const ClerkUserPayloadSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  primary_email_address_id: z.string().nullable().optional(),
  email_addresses: z.array(ClerkEmailAddressSchema).default([]),
  primary_phone_number_id: z.string().nullable().optional(),
  phone_numbers: z.array(ClerkPhoneNumberSchema).default([]),
});

export type ClerkUserPayload = z.infer<typeof ClerkUserPayloadSchema>;

export const ClerkDeletedPayloadSchema = z.object({
  id: z.string().min(1),
  deleted: z.boolean().optional(),
});

export type ClerkDeletedPayload = z.infer<typeof ClerkDeletedPayloadSchema>;

export const ClerkWebhookEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("user.created"),
    data: ClerkUserPayloadSchema,
  }),
  z.object({
    type: z.literal("user.updated"),
    data: ClerkUserPayloadSchema,
  }),
  z.object({
    type: z.literal("user.deleted"),
    data: ClerkDeletedPayloadSchema,
  }),
]);

export type ClerkWebhookEvent = z.infer<typeof ClerkWebhookEventSchema>;

export const SwitchRoleInputSchema = z.object({
  role: RoleContextSchema,
});
export type SwitchRoleInput = z.infer<typeof SwitchRoleInputSchema>;

export const UpdateMeInputSchema = z
  .object({
    displayName: z.string().trim().min(1, "Display name is required").max(80).optional(),
    ageConfirmed18Plus: z.boolean().optional(),
    marketingOptIn: z.boolean().optional(),
    defaultLocation: DefaultLocationSchema.optional(),
  })
  .refine(
    (data) =>
      data.displayName !== undefined ||
      data.ageConfirmed18Plus !== undefined ||
      data.marketingOptIn !== undefined ||
      data.defaultLocation !== undefined,
    { message: "At least one field must be provided" },
  );
export type UpdateMeInput = z.infer<typeof UpdateMeInputSchema>;

export const BecomeVendorInputSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters").max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isSeller: z.boolean().optional(),
  turnstileToken: z.string().optional(),
});
export type BecomeVendorInput = z.infer<typeof BecomeVendorInputSchema>;

export const BecomeSellerInputSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Storefront name must be at least 2 characters")
    .max(100)
    .optional(),
  description: z.string().trim().max(500).nullable().optional(),
  turnstileToken: z.string().optional(),
});
export type BecomeSellerInput = z.infer<typeof BecomeSellerInputSchema>;
