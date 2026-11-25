import { sql } from "drizzle-orm";
import { bigint, check, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./identity";

// ── support_tickets ───────────────────────────────────────────────────────────
export const supportTickets = pgTable(
  "support_tickets",
  {
    id: text("id").primaryKey(), // ULID
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    subject: text("subject").notNull(),
    state: text("state")
      .notNull()
      .default("open")
      .$type<"open" | "in_progress" | "resolved" | "closed">(),
    queue: text("queue")
      .notNull()
      .default("general")
      .$type<"general" | "payments" | "disputes" | "safety" | "technical">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("support_tickets_user_id_idx").on(t.userId),
    index("support_tickets_state_idx").on(t.state),
    index("support_tickets_queue_idx").on(t.queue),
    check(
      "support_tickets_state_check",
      sql`${t.state} IN ('open', 'in_progress', 'resolved', 'closed')`,
    ),
    check(
      "support_tickets_queue_check",
      sql`${t.queue} IN ('general', 'payments', 'disputes', 'safety', 'technical')`,
    ),
  ],
);

export type SupportTicketRow = typeof supportTickets.$inferSelect;
export type NewSupportTicketRow = typeof supportTickets.$inferInsert;

// ── export_jobs ───────────────────────────────────────────────────────────────
export const exportJobs = pgTable(
  "export_jobs",
  {
    id: text("id").primaryKey(), // ULID
    vendorId: text("vendor_id")
      .notNull()
      .references(() => users.id), // FK to users; vendors are users
    kind: text("kind").notNull().$type<"transactions" | "bookings" | "tax_summary">(),
    format: text("format").notNull().$type<"csv" | "pdf">(),
    state: text("state")
      .notNull()
      .default("pending")
      .$type<"pending" | "processing" | "completed" | "failed">(),
    objectKey: text("object_key"), // R2 private bucket key — set when completed
    rangeFrom: timestamp("range_from", { withTimezone: true }).notNull(),
    rangeTo: timestamp("range_to", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("export_jobs_vendor_id_idx").on(t.vendorId),
    index("export_jobs_state_idx").on(t.state),
    check("export_jobs_kind_check", sql`${t.kind} IN ('transactions', 'bookings', 'tax_summary')`),
    check("export_jobs_format_check", sql`${t.format} IN ('csv', 'pdf')`),
    check(
      "export_jobs_state_check",
      sql`${t.state} IN ('pending', 'processing', 'completed', 'failed')`,
    ),
  ],
);

export type ExportJobRow = typeof exportJobs.$inferSelect;
export type NewExportJobRow = typeof exportJobs.$inferInsert;

// ── audit_log ─────────────────────────────────────────────────────────────────
// Append-only: no UPDATE/DELETE exposed at the repository layer.
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(), // ULID
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(), // e.g. "booking.cancel", "payment.release"
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    metadata: jsonb("metadata"), // parsed with AuditLogMetadataSchema at repo
    at: bigint("at", { mode: "number" }).notNull(), // epoch-ms
  },
  (t) => [
    index("audit_log_actor_id_idx").on(t.actorId),
    index("audit_log_resource_idx").on(t.resourceType, t.resourceId),
    index("audit_log_at_idx").on(t.at),
  ],
);

export type AuditLogRow = typeof auditLog.$inferSelect;
export type NewAuditLogRow = typeof auditLog.$inferInsert;
