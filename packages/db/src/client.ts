import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

export type DbSchema = typeof schema;
export type Db = NodePgDatabase<DbSchema>;

/**
 * DbExecutor is the type accepted by all repository factories.
 * It is satisfied by both a bare `Db` instance and a transaction (`tx`)
 * obtained from `withTransaction`, so repositories never need to know which
 * context they are running in.
 */
export type DbExecutor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

let _pool: pg.Pool | undefined;
let _db: Db | undefined;

/** Return (or lazily create) the singleton Postgres pool + Drizzle instance. */
export function getDb(): Db {
  if (_db) return _db;

  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  _pool = new pg.Pool({ connectionString });
  _db = drizzle(_pool, { schema });
  return _db;
}

/**
 * Run `fn` inside a single Postgres transaction.
 * Pass the resulting `tx` executor into any repository factories that
 * need to participate in the same transaction.
 *
 * @example
 * await withTransaction(async (tx) => {
 *   await createBookingRepository(tx).insert(booking);
 *   await createPaymentRepository(tx).insert(payment);
 * });
 */
export async function withTransaction<T>(
  fn: (tx: Parameters<Parameters<Db["transaction"]>[0]>[0]) => Promise<T>,
): Promise<T> {
  return getDb().transaction(fn);
}

/** Close the connection pool — call in graceful-shutdown handlers. */
export async function closeDb(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = undefined;
    _db = undefined;
  }
}
