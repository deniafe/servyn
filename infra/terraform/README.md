# Servyn Infrastructure (Terraform)

Starter templates for UK/EU (London) cloud resources:
- **Neon Postgres** (`aws-eu-west-2`) with PostGIS and pgvector
- **Upstash Redis** (`eu-west-2`) for slot caching, rate limiting, idempotency, and pub/sub
- **Cloudflare R2** (`WEUR`) public & private buckets + strict TLS/HTTPS settings

Secrets (`neon_api_key`, `upstash_api_key`, `cloudflare_api_token`) are supplied via environment variables (`TF_VAR_*`) or CI secrets — never committed.
