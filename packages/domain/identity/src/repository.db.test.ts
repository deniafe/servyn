/**
 * Real-Postgres identity repository integration tests.
 * Run with: `pnpm test:db`
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { closeDb, getDb, users } from "@servyn/db";
import { eq } from "drizzle-orm";
import { createIdentityRepository } from "./repository";

describe("identity repository (DB integration)", () => {
  const testEmail = `relink-test-${Date.now()}@servyn.test`;
  let createdUserId: string | null = null;

  beforeAll(() => {
    if (!process.env["DATABASE_URL"]) {
      throw new Error("DATABASE_URL must be set to run DB integration tests");
    }
  });

  afterAll(async () => {
    if (createdUserId) {
      await getDb().delete(users).where(eq(users.id, createdUserId));
    }
    await closeDb();
  });

  it("upsertUserByClerkId re-links a recreated Clerk user with the same email without 23505", async () => {
    const repo = createIdentityRepository(getDb());

    const first = await repo.upsertUserByClerkId({
      clerkUserId: `clerk_first_${Date.now()}`,
      email: testEmail,
      phone: null,
    });
    createdUserId = first.id;

    await repo.markUserDeletedByClerkId(first.clerkUserId);

    const newClerkId = `clerk_second_${Date.now()}`;
    const relinked = await repo.upsertUserByClerkId({
      clerkUserId: newClerkId,
      email: testEmail,
      phone: "+447700900000",
    });

    expect(relinked.id).toBe(first.id);
    expect(relinked.clerkUserId).toBe(newClerkId);
    expect(relinked.status).toBe("active");
    expect(relinked.phone).toBe("+447700900000");
  });
});
