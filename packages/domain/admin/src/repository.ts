import "server-only";
import { and, eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import {
  supportTickets,
  exportJobs,
  auditLog,
  webhookEvents,
  type SupportTicketRow,
  type NewSupportTicketRow,
  type ExportJobRow,
  type NewExportJobRow,
  type AuditLogRow,
  type NewAuditLogRow,
  type WebhookEventRow,
  type NewWebhookEventRow,
} from "@servyn/db";
import {
  asSupportTicketId,
  asExportJobId,
  asAuditLogId,
  asWebhookEventId,
  asUserId,
  newUlid,
  type SupportTicketId,
  type ExportJobId,
  type AuditLogId,
  type WebhookEventId,
  type UserId,
} from "@servyn/core";
import {
  AuditLogMetadataSchema,
  type SupportTicketState,
  type SupportQueue,
  type ExportJobKind,
  type ExportFormat,
  type ExportJobState,
  type AuditLogMetadata,
} from "./schema";

export interface SupportTicket {
  id: SupportTicketId;
  userId: UserId;
  subject: string;
  state: SupportTicketState;
  queue: SupportQueue;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportJob {
  id: ExportJobId;
  vendorId: UserId;
  kind: ExportJobKind;
  format: ExportFormat;
  state: ExportJobState;
  objectKey: string | null;
  rangeFrom: Date;
  rangeTo: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogEntry {
  id: AuditLogId;
  actorId: UserId;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: AuditLogMetadata | null;
  at: number; // epoch-ms
}

export interface WebhookEvent {
  id: WebhookEventId;
  provider: "stripe" | "clerk" | "inngest";
  eventId: string;
  type: string;
  state: "received" | "processing" | "processed" | "failed";
  payload: unknown;
  processedAt: Date | null;
  createdAt: Date;
}

export function mapSupportTicket(row: SupportTicketRow): SupportTicket {
  return {
    id: asSupportTicketId(row.id),
    userId: asUserId(row.userId),
    subject: row.subject,
    state: row.state,
    queue: row.queue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapExportJob(row: ExportJobRow): ExportJob {
  return {
    id: asExportJobId(row.id),
    vendorId: asUserId(row.vendorId),
    kind: row.kind,
    format: row.format,
    state: row.state,
    objectKey: row.objectKey ?? null,
    rangeFrom: row.rangeFrom,
    rangeTo: row.rangeTo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: asAuditLogId(row.id),
    actorId: asUserId(row.actorId),
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    metadata:
      row.metadata !== null && row.metadata !== undefined
        ? AuditLogMetadataSchema.parse(row.metadata)
        : null,
    at: row.at,
  };
}

export function mapWebhookEvent(row: WebhookEventRow): WebhookEvent {
  return {
    id: asWebhookEventId(row.id),
    provider: row.provider,
    eventId: row.eventId,
    type: row.type,
    state: row.state,
    payload: row.payload,
    processedAt: row.processedAt ?? null,
    createdAt: row.createdAt,
  };
}

export function createAdminRepository(executor: DbExecutor) {
  return {
    // ── Support tickets ─────────────────────────────────────────────────────

    async insertSupportTicket(data: Omit<NewSupportTicketRow, "id">): Promise<SupportTicket> {
      const id = newUlid();
      const [row] = await executor
        .insert(supportTickets)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert support ticket returned no row");
      return mapSupportTicket(row);
    },

    async findSupportTicketById(id: SupportTicketId): Promise<SupportTicket | null> {
      const [row] = await executor
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, id))
        .limit(1);
      return row ? mapSupportTicket(row) : null;
    },

    async updateSupportTicketState(
      id: SupportTicketId,
      state: SupportTicketState,
    ): Promise<SupportTicket> {
      const [row] = await executor
        .update(supportTickets)
        .set({ state, updatedAt: new Date() })
        .where(eq(supportTickets.id, id))
        .returning();
      if (!row) throw new Error("Support ticket update returned no row");
      return mapSupportTicket(row);
    },

    // ── Export jobs ─────────────────────────────────────────────────────────

    async insertExportJob(data: Omit<NewExportJobRow, "id">): Promise<ExportJob> {
      const id = newUlid();
      const [row] = await executor
        .insert(exportJobs)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert export job returned no row");
      return mapExportJob(row);
    },

    async updateExportJobState(
      id: ExportJobId,
      state: ExportJobState,
      objectKey?: string,
    ): Promise<ExportJob> {
      const [row] = await executor
        .update(exportJobs)
        .set({ state, objectKey: objectKey ?? undefined, updatedAt: new Date() })
        .where(eq(exportJobs.id, id))
        .returning();
      if (!row) throw new Error("Export job update returned no row");
      return mapExportJob(row);
    },

    // ── Audit log (append-only) ─────────────────────────────────────────────

    async insertAuditLogEntry(
      data: Omit<NewAuditLogRow, "id" | "metadata"> & { metadata?: AuditLogMetadata },
    ): Promise<AuditLogEntry> {
      const id = newUlid();
      const [row] = await executor
        .insert(auditLog)
        .values({
          ...data,
          id,
          metadata: data.metadata ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert audit log entry returned no row");
      return mapAuditLogEntry(row);
    },

    async findAuditLogByResource(
      resourceType: string,
      resourceId: string,
    ): Promise<AuditLogEntry[]> {
      const rows = await executor
        .select()
        .from(auditLog)
        .where(and(eq(auditLog.resourceType, resourceType), eq(auditLog.resourceId, resourceId)));
      return rows.map(mapAuditLogEntry);
    },

    // ── Webhook events (dedupe helper) ───────────────────────────────────────

    /**
     * Atomic idempotent insert: uses ON CONFLICT (provider, event_id) DO NOTHING.
     * Returns { event, alreadyProcessed } so concurrent retries never throw 23505.
     */
    async upsertWebhookEvent(
      data: Omit<NewWebhookEventRow, "id">,
    ): Promise<{ event: WebhookEvent; alreadyProcessed: boolean }> {
      const id = newUlid();
      const [inserted] = await executor
        .insert(webhookEvents)
        .values({ ...data, id })
        .onConflictDoNothing({
          target: [webhookEvents.provider, webhookEvents.eventId],
        })
        .returning();

      if (inserted) {
        return { event: mapWebhookEvent(inserted), alreadyProcessed: false };
      }

      const [existing] = await executor
        .select()
        .from(webhookEvents)
        .where(
          and(eq(webhookEvents.provider, data.provider), eq(webhookEvents.eventId, data.eventId)),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Webhook event conflict occurred but existing row was not found");
      }

      return {
        event: mapWebhookEvent(existing),
        alreadyProcessed: existing.state === "processed",
      };
    },

    async updateWebhookEventState(
      id: WebhookEventId,
      state: "processing" | "processed" | "failed",
      processedAt?: Date,
    ): Promise<WebhookEvent> {
      const [row] = await executor
        .update(webhookEvents)
        .set({ state, processedAt: processedAt ?? undefined })
        .where(eq(webhookEvents.id, id))
        .returning();
      if (!row) throw new Error("Webhook event update returned no row");
      return mapWebhookEvent(row);
    },
  };
}

export type AdminRepository = ReturnType<typeof createAdminRepository>;
