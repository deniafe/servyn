import "server-only";
import { and, eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import {
  listingEmbeddings,
  type ListingEmbeddingRow,
  type NewListingEmbeddingRow,
} from "@servyn/db";
import { asListingEmbeddingId, newUlid, type ListingEmbeddingId } from "@servyn/core";
import { EmbeddingEntityTypeSchema, type EmbeddingEntityType } from "./schema.js";

// ── Domain type ───────────────────────────────────────────────────────────────

export interface ListingEmbedding {
  id: ListingEmbeddingId;
  entityType: EmbeddingEntityType;
  entityId: string;
  model: string;
  embedding: number[];
  updatedAt: Date;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

export function mapListingEmbedding(row: ListingEmbeddingRow): ListingEmbedding {
  return {
    id: asListingEmbeddingId(row.id),
    entityType: EmbeddingEntityTypeSchema.parse(row.entityType),
    entityId: row.entityId,
    model: row.model,
    embedding: row.embedding,
    updatedAt: row.updatedAt,
  };
}

// ── Repository factory ────────────────────────────────────────────────────────

export function createDiscoveryRepository(executor: DbExecutor) {
  return {
    async upsertEmbedding(data: Omit<NewListingEmbeddingRow, "id">): Promise<ListingEmbedding> {
      // Upsert: replace existing embedding for the same entity+model
      const existing = await executor
        .select()
        .from(listingEmbeddings)
        .where(
          and(
            eq(listingEmbeddings.entityType, data.entityType),
            eq(listingEmbeddings.entityId, data.entityId),
            eq(listingEmbeddings.model, data.model),
          ),
        )
        .limit(1);

      if (existing[0]) {
        const [row] = await executor
          .update(listingEmbeddings)
          .set({ embedding: data.embedding, updatedAt: new Date() })
          .where(eq(listingEmbeddings.id, existing[0].id))
          .returning();
        if (!row) throw new Error("Upsert embedding returned no row");
        return mapListingEmbedding(row);
      }

      const id = newUlid();
      const [row] = await executor
        .insert(listingEmbeddings)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert embedding returned no row");
      return mapListingEmbedding(row);
    },

    async findEmbeddingByEntity(
      entityType: EmbeddingEntityType,
      entityId: string,
      model: string,
    ): Promise<ListingEmbedding | null> {
      const [row] = await executor
        .select()
        .from(listingEmbeddings)
        .where(
          and(
            eq(listingEmbeddings.entityType, entityType),
            eq(listingEmbeddings.entityId, entityId),
            eq(listingEmbeddings.model, model),
          ),
        )
        .limit(1);
      return row ? mapListingEmbedding(row) : null;
    },
  };
}

export type DiscoveryRepository = ReturnType<typeof createDiscoveryRepository>;
