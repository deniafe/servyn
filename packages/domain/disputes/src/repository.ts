import "server-only";
import { eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import {
  disputes,
  evidence,
  type DisputeRow,
  type NewDisputeRow,
  type EvidenceRow,
  type NewEvidenceRow,
} from "@servyn/db";
import {
  asDisputeId,
  asEvidenceId,
  asBookingId,
  asUserId,
  newUlid,
  type DisputeId,
  type EvidenceId,
  type BookingId,
  type UserId,
} from "@servyn/core";
import {
  DisputeStateSchema,
  type DisputeReason,
  type DisputeState,
  type EvidenceKind,
} from "./schema.js";

export interface Dispute {
  id: DisputeId;
  bookingId: BookingId;
  openedBy: UserId;
  reason: DisputeReason;
  description: string;
  state: DisputeState;
  openedAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Evidence {
  id: EvidenceId;
  disputeId: DisputeId;
  submittedBy: UserId;
  kind: EvidenceKind;
  objectKey: string | null;
  body: string | null;
  createdAt: Date;
}

export function mapDispute(row: DisputeRow): Dispute {
  return {
    id: asDisputeId(row.id),
    bookingId: asBookingId(row.bookingId),
    openedBy: asUserId(row.openedBy),
    reason: row.reason,
    description: row.description,
    state: DisputeStateSchema.parse(row.state),
    openedAt: row.openedAt,
    resolvedAt: row.resolvedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapEvidence(row: EvidenceRow): Evidence {
  return {
    id: asEvidenceId(row.id),
    disputeId: asDisputeId(row.disputeId),
    submittedBy: asUserId(row.submittedBy),
    kind: row.kind,
    objectKey: row.objectKey ?? null,
    body: row.body ?? null,
    createdAt: row.createdAt,
  };
}

export function createDisputesRepository(executor: DbExecutor) {
  return {
    async insertDispute(data: Omit<NewDisputeRow, "id">): Promise<Dispute> {
      const id = newUlid();
      const [row] = await executor
        .insert(disputes)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert dispute returned no row");
      return mapDispute(row);
    },

    async findDisputeById(id: DisputeId): Promise<Dispute | null> {
      const [row] = await executor.select().from(disputes).where(eq(disputes.id, id)).limit(1);
      return row ? mapDispute(row) : null;
    },

    async findDisputesByBookingId(bookingId: BookingId): Promise<Dispute[]> {
      const rows = await executor.select().from(disputes).where(eq(disputes.bookingId, bookingId));
      return rows.map(mapDispute);
    },

    async updateDisputeState(
      id: DisputeId,
      state: DisputeState,
      resolvedAt?: Date,
    ): Promise<Dispute> {
      const [row] = await executor
        .update(disputes)
        .set({ state, resolvedAt: resolvedAt ?? undefined, updatedAt: new Date() })
        .where(eq(disputes.id, id))
        .returning();
      if (!row) throw new Error("Dispute update returned no row");
      return mapDispute(row);
    },

    async insertEvidence(data: Omit<NewEvidenceRow, "id">): Promise<Evidence> {
      const id = newUlid();
      const [row] = await executor
        .insert(evidence)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert evidence returned no row");
      return mapEvidence(row);
    },

    async findEvidenceByDisputeId(disputeId: DisputeId): Promise<Evidence[]> {
      const rows = await executor.select().from(evidence).where(eq(evidence.disputeId, disputeId));
      return rows.map(mapEvidence);
    },
  };
}

export type DisputesRepository = ReturnType<typeof createDisputesRepository>;
