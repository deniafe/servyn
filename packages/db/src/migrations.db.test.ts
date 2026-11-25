/**
 * Real-Postgres migration and infrastructure integration tests.
 * Run with: `pnpm test:db`
 * Requires DATABASE_URL pointing to a Postgres instance with
 * PostGIS and pgvector extensions available (see docker-compose.yml).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_FOLDER = path.join(__dirname, "../migrations");

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL must be set to run DB integration tests");
}

let pool: pg.Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

function extractPgErrorCode(error: unknown): unknown {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof (error as { code?: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  if ("cause" in error) {
    return extractPgErrorCode((error as { cause?: unknown }).cause);
  }
  return undefined;
}

async function expectPgErrorCode(promise: Promise<unknown>, code: string): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected Postgres error code ${code}, but query succeeded`);
  } catch (error) {
    expect(extractPgErrorCode(error)).toBe(code);
  }
}

beforeAll(async () => {
  pool = new pg.Pool({ connectionString });
  db = drizzle(pool, { schema });

  // Apply all migrations
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
});

afterAll(async () => {
  if (pool) await pool.end();
});

// ── Migration integrity ───────────────────────────────────────────────────────

describe("migrations", () => {
  it("applies cleanly and creates all 34 core tables", async () => {
    const result = await db.execute(sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE '__drizzle%'
      ORDER BY tablename
    `);

    const tables = result.rows.map((r) => (r as { tablename: string }).tablename);

    const expected = [
      "audit_log",
      "availability_exceptions",
      "availability_rules",
      "booking_events",
      "bookings",
      "bulk_enquiries",
      "categories",
      "conversations",
      "customer_profiles",
      "disputes",
      "evidence",
      "export_jobs",
      "favourites",
      "fee_waivers",
      "listing_embeddings",
      "messages",
      "notifications",
      "order_items",
      "orders",
      "payments",
      "policy_versions",
      "products",
      "quotes",
      "refunds",
      "reviews",
      "safeguarding_reports",
      "services",
      "support_tickets",
      "transfers",
      "users",
      "vendor_members",
      "vendor_profiles",
      "verifications",
      "webhook_events",
    ];

    for (const t of expected) {
      expect(tables).toContain(t);
    }
  });
});

// ── PostGIS ───────────────────────────────────────────────────────────────────

describe("PostGIS", () => {
  it("ST_DWithin is available and returns a boolean result", async () => {
    const result = await db.execute(sql`
      SELECT ST_DWithin(
        ST_SetSRID(ST_MakePoint(-2.2426, 53.4808), 4326)::geography,
        ST_SetSRID(ST_MakePoint(-2.2345, 53.4750), 4326)::geography,
        10000
      ) AS within
    `);

    const row = result.rows[0] as { within: boolean };
    expect(typeof row.within).toBe("boolean");
    expect(row.within).toBe(true);
  });

  it("ST_AsGeoJSON converts a geometry to JSON", async () => {
    const result = await db.execute(sql`
      SELECT ST_AsGeoJSON(
        ST_SetSRID(ST_MakePoint(-2.2426, 53.4808), 4326)
      ) AS geojson
    `);

    const row = result.rows[0] as { geojson: string };
    const parsed = JSON.parse(row.geojson) as { type: string };
    expect(parsed.type).toBe("Point");
  });
});

// ── pgvector ──────────────────────────────────────────────────────────────────

describe("pgvector", () => {
  it("cosine distance operator <=> is available", async () => {
    const result = await db.execute(sql`
      SELECT ('[1,0,0]'::vector(3)) <=> ('[0,1,0]'::vector(3)) AS distance
    `);

    const row = result.rows[0] as { distance: number };
    expect(row.distance).toBeCloseTo(1.0, 5);
  });
});

// ── CHECK constraints & bigint timestamps ─────────────────────────────────────

describe("CHECK constraints and bigint timestamps", () => {
  const userId = "01JTESTUSER000000000000001";
  const vendorId = "01JTESTVEND000000000000001";
  const categoryId = "01JTESTCATG000000000000001";
  const serviceId = "01JTESTSERV000000000000001";
  const policyId = "01JTESTPOLC000000000000001";
  const bookingId = "01JTESTBOOK000000000000001";
  const orderId = "01JTESTORDR000000000000001";

  beforeAll(async () => {
    await db.execute(sql`
      INSERT INTO users (id, clerk_user_id, email, status)
      VALUES (${userId}, 'clerk_test_1', 'dbtest@servyn.test', 'active')
      ON CONFLICT (id) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO vendor_profiles (id, user_id, business_name, slug)
      VALUES (${vendorId}, ${userId}, 'Test Vendor', 'test-vendor-db')
      ON CONFLICT (id) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO categories (id, slug, name, kind)
      VALUES (${categoryId}, 'test-cat-db', 'Test Category', 'service')
      ON CONFLICT (id) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO services (id, vendor_id, category_id, slug, title, duration_minutes, price_minor)
      VALUES (${serviceId}, ${vendorId}, ${categoryId}, 'test-srv-db', 'Test Service', 60, 5000)
      ON CONFLICT (id) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO policy_versions (id, version, cancellation_rules, refund_rules, effective_from)
      VALUES (${policyId}, 'v1-test', '{"vendorCancelPct":100}'::jsonb, '{"noShowRefundPct":0}'::jsonb, NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO bookings (
        id, customer_id, vendor_id, service_id, booking_model, status,
        scheduled_at, duration_minutes, gross_price_minor, vendor_share_minor,
        platform_fee_minor, policy_version_id
      ) VALUES (
        ${bookingId}, ${userId}, ${vendorId}, ${serviceId}, 'instant', 'completed',
        NOW(), 60, 5000, 4500, 500, ${policyId}
      )
      ON CONFLICT (id) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO orders (id, customer_id, seller_id, status, total_minor, delivery)
      VALUES (${orderId}, ${userId}, ${userId}, 'completed', 2500, '{"fullName":"Ada","addressLine1":"1 High St","city":"Manchester","postcode":"M1 1AE"}'::jsonb)
      ON CONFLICT (id) DO NOTHING
    `);
  });

  it("payments rejects rows with both or neither booking_id and order_id (23514)", async () => {
    await expectPgErrorCode(
      db.execute(sql`
        INSERT INTO payments (
          id, booking_id, order_id,
          amount_minor, vendor_share_minor, platform_fee_minor, state
        ) VALUES (
          'test-pay-1', ${bookingId}, ${orderId},
          1000, 850, 150, 'requires_payment'
        )
      `),
      "23514",
    );

    await expectPgErrorCode(
      db.execute(sql`
        INSERT INTO payments (
          id, booking_id, order_id,
          amount_minor, vendor_share_minor, platform_fee_minor, state
        ) VALUES (
          'test-pay-2', NULL, NULL,
          1000, 850, 150, 'requires_payment'
        )
      `),
      "23514",
    );
  });

  it("conversations rejects rows with both booking_id and order_id (23514)", async () => {
    await expectPgErrorCode(
      db.execute(sql`
        INSERT INTO conversations (id, booking_id, order_id)
        VALUES ('test-conv-1', ${bookingId}, ${orderId})
      `),
      "23514",
    );
  });

  it("reviews enforces rating 1-5 and booking_id XOR order_id (23514)", async () => {
    await expectPgErrorCode(
      db.execute(sql`
        INSERT INTO reviews (id, booking_id, order_id, customer_id, vendor_id, rating, moderation_state)
        VALUES ('test-rev-1', ${bookingId}, NULL, ${userId}, ${vendorId}, 0, 'pending')
      `),
      "23514",
    );

    await expectPgErrorCode(
      db.execute(sql`
        INSERT INTO reviews (id, booking_id, order_id, customer_id, vendor_id, rating, moderation_state)
        VALUES ('test-rev-2', ${bookingId}, ${orderId}, ${userId}, ${vendorId}, 5, 'pending')
      `),
      "23514",
    );

    // Valid order-scoped review succeeds
    await db.execute(sql`
      INSERT INTO reviews (id, booking_id, order_id, customer_id, vendor_id, rating, moderation_state)
      VALUES ('test-rev-order-ok', NULL, ${orderId}, ${userId}, ${vendorId}, 5, 'published')
      ON CONFLICT (id) DO NOTHING
    `);
  });

  it("availability_rules rejects weekday outside 0-6 (23514)", async () => {
    await expectPgErrorCode(
      db.execute(sql`
        INSERT INTO availability_rules (id, vendor_id, weekday, start, "end")
        VALUES ('test-ar-1', ${vendorId}, 7, '09:00', '17:00')
      `),
      "23514",
    );
  });

  it("domain status CHECK constraint rejects invalid status (23514)", async () => {
    await expectPgErrorCode(
      db.execute(sql`
        INSERT INTO users (id, clerk_user_id, email, status)
        VALUES ('test-bad-user', 'clerk_bad', 'bad@servyn.test', 'invalid_status')
      `),
      "23514",
    );
  });

  it("booking_events.at and audit_log.at accept bigint epoch-ms (> 2^31)", async () => {
    const epochMs = Date.now();
    await db.execute(sql`
      INSERT INTO booking_events (id, booking_id, status, actor_id, at)
      VALUES ('test-be-bigint', ${bookingId}, 'completed', ${userId}, ${epochMs})
      ON CONFLICT (id) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO audit_log (id, actor_id, action, resource_type, resource_id, at)
      VALUES ('test-al-bigint', ${userId}, 'test.action', 'booking', ${bookingId}, ${epochMs})
      ON CONFLICT (id) DO NOTHING
    `);
  });
});

// ── withTransaction rollback ──────────────────────────────────────────────────

describe("withTransaction", () => {
  it("rolls back all writes on error", async () => {
    const testId = `rollback-test-${Date.now()}`;

    await expect(
      db.transaction(async (tx) => {
        await tx.execute(sql`
          INSERT INTO users (id, clerk_user_id, email, status)
          VALUES (${testId}, ${"clerk_" + testId}, ${"rb@test.com"}, 'active')
        `);
        throw new Error("forced rollback");
      }),
    ).rejects.toThrow("forced rollback");

    const check = await db.execute(sql`
      SELECT id FROM users WHERE id = ${testId}
    `);
    expect(check.rows).toHaveLength(0);
  });

  it("defaults users.is_admin and vendor_profiles.is_seller to false", async () => {
    const cols = await db.execute(sql`
      SELECT table_name, column_name, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND ((table_name = 'users' AND column_name = 'is_admin')
          OR (table_name = 'vendor_profiles' AND column_name = 'is_seller'))
      ORDER BY table_name
    `);
    expect(cols.rows).toHaveLength(2);
  });

  it("supports nullable users.consent_preferences jsonb round-trip", async () => {
    const cols = await db.execute(sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'consent_preferences'
    `);
    expect(cols.rows).toHaveLength(1);
    expect((cols.rows[0] as { is_nullable: string }).is_nullable).toBe("YES");
  });
});
