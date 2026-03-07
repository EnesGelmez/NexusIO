-- =============================================================================
-- Migration 005: Proper roles table + migrate users.role to role_id FK
-- =============================================================================
-- Requires: docker compose down -v && docker compose up -d  (fresh DB)
-- =============================================================================

BEGIN;

-- ─── Roles table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id   TEXT        REFERENCES tenants(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    permissions JSONB       NOT NULL DEFAULT '{"dashboard":{"view":false,"manage":false},"users":{"view":false,"manage":false},"logs":{"view":false,"manage":false},"mappings":{"view":false,"manage":false},"settings":{"view":false,"manage":false}}',
    is_system   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique per (tenant_id, name); NULL tenant_id = system-wide role
CREATE UNIQUE INDEX IF NOT EXISTS roles_tenant_name_idx
    ON roles(COALESCE(tenant_id::text, ''), name);

CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);

-- ─── Seed system roles ────────────────────────────────────────────────────────
INSERT INTO roles (name, description, is_system, permissions) VALUES
(
    'SUPER_ADMIN',
    'Sistem yöneticisi. Tüm hesaplara tam erişim.',
    true,
    '{"dashboard":{"view":true,"manage":true},"users":{"view":true,"manage":true},"logs":{"view":true,"manage":true},"mappings":{"view":true,"manage":true},"settings":{"view":true,"manage":true}}'
),
(
    'TENANT_ADMIN',
    'Hesap yöneticisi. Kendi hesabının tüm özelliklerine tam erişim.',
    true,
    '{"dashboard":{"view":true,"manage":true},"users":{"view":true,"manage":true},"logs":{"view":true,"manage":true},"mappings":{"view":true,"manage":true},"settings":{"view":true,"manage":true}}'
),
(
    'VIEWER',
    'İzleyici. Tüm ekranları salt okunur modda görüntüleyebilir.',
    true,
    '{"dashboard":{"view":true,"manage":false},"users":{"view":true,"manage":false},"logs":{"view":true,"manage":false},"mappings":{"view":true,"manage":false},"settings":{"view":true,"manage":false}}'
)
ON CONFLICT DO NOTHING;

-- ─── Migrate users.role TEXT → users.role_id FK ───────────────────────────────
-- (Only runs on legacy databases that still have the 'role' TEXT column.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    -- Step 1: Add nullable column first
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id TEXT REFERENCES roles(id);

    -- Step 2: Backfill from existing role TEXT column (matches system role names)
    UPDATE users u
    SET    role_id = r.id
    FROM   roles r
    WHERE  r.name       = u.role
    AND    r.tenant_id  IS NULL
    AND    u.role_id    IS NULL;

    -- Step 3: Fallback to VIEWER for any unmatched rows
    UPDATE users
    SET    role_id = (SELECT id FROM roles WHERE name = 'VIEWER' AND tenant_id IS NULL)
    WHERE  role_id IS NULL;

    -- Step 4: Enforce NOT NULL
    ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

    -- Step 5: Drop the old plain-text column
    ALTER TABLE users DROP COLUMN IF EXISTS role;
  END IF;
END;
$$;

COMMIT;
