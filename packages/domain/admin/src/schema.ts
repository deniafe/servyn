import { z } from "zod/v4";

export const SupportTicketStateSchema = z.enum(["open", "in_progress", "resolved", "closed"]);
export type SupportTicketState = z.infer<typeof SupportTicketStateSchema>;

export const SupportQueueSchema = z.enum([
  "general",
  "payments",
  "disputes",
  "safety",
  "technical",
]);
export type SupportQueue = z.infer<typeof SupportQueueSchema>;

export const ExportJobKindSchema = z.enum(["transactions", "bookings", "tax_summary"]);
export type ExportJobKind = z.infer<typeof ExportJobKindSchema>;

export const ExportFormatSchema = z.enum(["csv", "pdf"]);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const ExportJobStateSchema = z.enum(["pending", "processing", "completed", "failed"]);
export type ExportJobState = z.infer<typeof ExportJobStateSchema>;

export const AuditLogMetadataSchema = z.record(z.string(), z.unknown());
export type AuditLogMetadata = z.infer<typeof AuditLogMetadataSchema>;
