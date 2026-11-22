# @servyn/db

PostgreSQL + Drizzle ORM data layer for Servyn.

---

## Timestamp conventions

| Column type                              | Used for                                                                     | Example                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| `timestamp(..., { withTimezone: true })` | Human-facing dates — booking time, `created_at`, `updated_at`, `released_at` | `bookings.scheduled_at`, `payments.held_at` |
| `bigint({ mode: "number" })` (epoch-ms)  | Sortable append-only log timestamps that benefit from integer ordering       | `booking_events.at`, `audit_log.at`         |

> **Never** mix the two conventions within the same table.

---

## PostGIS SRID 4326

All `geometry(Geometry, 4326)` columns use **WGS-84 (longitude/latitude)** — the same CRS as GeoJSON and postcodes.io. Spatial queries use PostGIS functions:

```sql
-- vendors within 10 km of a point
WHERE ST_DWithin(
  service_area::geography,
  ST_SetSRID(ST_MakePoint($lon, $lat), 4326)::geography,
  10000  -- metres
)
```

GiST indexes are created on `vendor_profiles.service_area` and `services.service_area`.

---

## pgvector HNSW index

`listing_embeddings.embedding` stores `vector(1536)` for AI Match (OpenAI `text-embedding-3-small` / `ada-002`). The HNSW cosine index enables fast approximate nearest-neighbour search:

```sql
ORDER BY embedding <=> $query_vector
LIMIT 20
```

---

## Append-only tables

The following tables must only be inserted into — never updated or deleted — at the repository layer:

| Table                  | Reason                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `booking_events`       | FSM audit trail; every status change is a new row                                           |
| `messages`             | Chat history; redaction sets `body = null` and `redacted = true` via a dedicated transition |
| `policy_versions`      | Each booking pins the policy in force at booking time                                       |
| `safeguarding_reports` | Legal retention; corrections are new rows                                                   |
| `audit_log`            | Immutable admin audit trail                                                                 |

Repositories for these tables expose `insert` and `findBy*` methods only. The `messages` repository additionally exposes `redact(id)`.

---

## Migration workflow

```bash
# Generate a new forward-only migration from schema changes
pnpm db:generate

# Apply all pending migrations to the target DATABASE_URL
pnpm db:migrate

# Inspect the live schema in Drizzle Studio
pnpm db:studio
```

Migrations live in `packages/db/migrations/`. They are forward-only; use **expand-then-contract** for zero-downtime changes (add column → backfill → drop old column in separate migrations).

For preview environments, Neon branches provide isolated Postgres instances per PR.

---

## Running real-Postgres tests

```bash
# Start local Docker Postgres (PostGIS + pgvector)
docker compose up -d postgres

# Run migration + integration tests
DATABASE_URL=postgresql://servyn:servyn_local_password@localhost:5432/servyn pnpm test:db
```

The Docker image is built inline from `postgis/postgis:16-3.4` with `postgresql-16-pgvector` installed (see `docker-compose.yml`).
