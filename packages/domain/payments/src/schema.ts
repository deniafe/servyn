import { z } from "zod/v4";

export const PaymentStateSchema = z.enum([
  "requires_payment",
  "processing",
  "held",
  "releasable",
  "released",
  "refund_pending",
  "refunded",
  "disputed",
  "under_review",
  "error",
]);
export type PaymentState = z.infer<typeof PaymentStateSchema>;

export const ReleaseBasisSchema = z.enum(["completion_confirm", "auto_48h", "delivery"]);
export type ReleaseBasis = z.infer<typeof ReleaseBasisSchema>;

export const RefundReasonSchema = z.enum([
  "vendor_cancel",
  "customer_cancel",
  "dispute_resolved",
  "admin",
]);
export type RefundReason = z.infer<typeof RefundReasonSchema>;

export const FeeWaiverKindSchema = z.enum(["early_adopter", "promo"]);
export type FeeWaiverKind = z.infer<typeof FeeWaiverKindSchema>;
