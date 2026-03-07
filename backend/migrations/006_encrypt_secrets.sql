-- =============================================================================
-- Migration 006: Secure API-key storage
-- • api_key_hash  → SHA-256 of the raw key stored by the application layer
--   Used for O(1) indexed lookup without the key ever touching DB in plaintext.
-- • api_key       → AES-256-GCM encrypted value (encrypted at application layer)
--   Decrypted only when displaying to the tenant owner.
-- =============================================================================

-- Add hash column for indexed lookup
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS api_key_hash TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_tenants_api_key_hash ON tenants(api_key_hash);

-- api_key and agent_token columns are already present; the application layer
-- will now encrypt their values before INSERT / UPDATE and decrypt after SELECT.
-- Backfill of existing rows must be done via the admin CLI after deploying
-- (or simply reset with: docker compose down -v && docker compose up -d).
