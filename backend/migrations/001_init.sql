-- =============================================================================
-- NewGen Platform -- Complete Database Schema (Security-Hardened)
-- =============================================================================
-- Security principles:
--   * All primary keys are native UUID type (16-byte, efficient B-tree index)
--   * Foreign keys are also UUID type to maintain referential integrity
--   * api_key:      AES-256-GCM ciphertext (application layer encrypts)
--   * api_key_hash: SHA-256 hex of the raw key -- used for O(1) indexed lookup
--   * agent_token:  AES-256-GCM ciphertext (application layer encrypts)
--   * secret_key:   AES-256-GCM ciphertext (application layer encrypts)
--   * No plaintext secrets in seed data -- create tenants via API
--   * CHECK constraints enforce enum values at DB level
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TENANTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT        NOT NULL,
    subdomain    TEXT        NOT NULL UNIQUE,
    email        TEXT        NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'ACTIVE'
                             CHECK (status IN ('ACTIVE','SUSPENDED','TRIAL')),
    plan         TEXT        NOT NULL DEFAULT 'Starter',
    -- Secrets: application layer encrypts before INSERT/UPDATE, decrypts after SELECT
    api_key      TEXT        NOT NULL DEFAULT '',  -- AES-256-GCM ciphertext
    api_key_hash TEXT        NOT NULL DEFAULT '',  -- SHA-256 hex of raw key (lookup)
    agent_token  TEXT        NOT NULL DEFAULT '',  -- AES-256-GCM ciphertext
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_api_key_hash ON tenants(api_key_hash);

-- ---------------------------------------------------------------------------
-- TENANT AGENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_agents (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID        NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL DEFAULT 'LOGO ERP Agent',
    endpoint_url TEXT        NOT NULL DEFAULT '',
    secret_key   TEXT        NOT NULL DEFAULT '',  -- AES-256-GCM ciphertext
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- ROLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = system role
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

-- Seed system roles with fixed UUIDs for predictable FK reference
INSERT INTO roles (id, name, description, is_system, permissions) VALUES
(
    '00000001-0000-0000-0000-000000000001',
    'SUPER_ADMIN',
    'Platform yoneticisi. Tum hesaplara tam erisim.',
    TRUE,
    '{"dashboard":{"view":true,"manage":true},"users":{"view":true,"manage":true},"logs":{"view":true,"manage":true},"mappings":{"view":true,"manage":true},"settings":{"view":true,"manage":true}}'
),
(
    '00000001-0000-0000-0000-000000000002',
    'TENANT_ADMIN',
    'Hesap yoneticisi. Kendi hesabinin tum ozelliklerine tam erisim.',
    TRUE,
    '{"dashboard":{"view":true,"manage":true},"users":{"view":true,"manage":true},"logs":{"view":true,"manage":true},"mappings":{"view":true,"manage":true},"settings":{"view":true,"manage":true}}'
),
(
    '00000001-0000-0000-0000-000000000003',
    'VIEWER',
    'Izleyici. Tum ekranlari salt okunur modda goruntuleyebilir.',
    TRUE,
    '{"dashboard":{"view":true,"manage":false},"users":{"view":true,"manage":false},"logs":{"view":true,"manage":false},"mappings":{"view":true,"manage":false},"settings":{"view":true,"manage":false}}'
)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID        REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = super-admin
    name                 TEXT        NOT NULL,
    email                TEXT        NOT NULL UNIQUE,
    password_hash        TEXT        NOT NULL,
    role_id              UUID        NOT NULL REFERENCES roles(id),
    is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);

-- Seed: Platform super-admin (password: admin123)
-- IMPORTANT: Change this password before any production deployment.
-- Hash: bcrypt cost=10 of "admin123"
INSERT INTO users (id, tenant_id, name, email, password_hash, role_id, is_active, must_change_password)
VALUES (
    '00000002-0000-0000-0000-000000000001',
    NULL,
    'Platform Yoneticisi',
    'admin@nexus.dev',
    '$2a$10$Ow.YEo17kozKkhRBqwt66.erzprXjunto.VYkYif0a9tWWEf5WvO6',
    '00000001-0000-0000-0000-000000000001',
    TRUE,
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- WORKFLOWS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflows (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    status      TEXT        NOT NULL DEFAULT 'ACTIVE'
                            CHECK (status IN ('ACTIVE','DISABLED')),
    trigger     TEXT        NOT NULL DEFAULT '',
    nodes       JSONB       NOT NULL DEFAULT '[]',
    edges       JSONB       NOT NULL DEFAULT '[]',
    stats       JSONB       NOT NULL DEFAULT '{"totalRuns":0,"successRuns":0,"failedRuns":0,"avgDurationMs":0,"lastDayRuns":0,"lastDaySuccess":0,"lastDayFailed":0,"trend":"neutral"}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_run_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id);

-- ---------------------------------------------------------------------------
-- WORKFLOW_RUNS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_runs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID        NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    tenant_id   UUID        NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'RUNNING'
                            CHECK (status IN ('RUNNING','SUCCESS','FAILED')),
    duration_ms BIGINT      NOT NULL DEFAULT 0,
    payload     JSONB,
    result      JSONB,
    error_msg   TEXT        NOT NULL DEFAULT '',
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT fk_runs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_runs_tenant   ON workflow_runs(tenant_id);

-- ---------------------------------------------------------------------------
-- API_ENDPOINTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_endpoints (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name           TEXT        NOT NULL,
    slug           TEXT        NOT NULL,
    method         TEXT        NOT NULL DEFAULT 'POST'
                               CHECK (method IN ('GET','POST','PUT','DELETE','PATCH')),
    path           TEXT        NOT NULL DEFAULT '',
    description    TEXT        NOT NULL DEFAULT '',
    enabled        BOOLEAN     NOT NULL DEFAULT TRUE,
    auth           TEXT        NOT NULL DEFAULT 'NONE'
                               CHECK (auth IN ('API_KEY','BEARER','NONE')),
    category       TEXT        NOT NULL DEFAULT '',
    parameters     JSONB       NOT NULL DEFAULT '[]',
    response       JSONB       NOT NULL DEFAULT '{"type":"object","example":"{}"}',
    test_mode      BOOLEAN     NOT NULL DEFAULT FALSE,
    call_count     BIGINT      NOT NULL DEFAULT 0,
    last_called_at TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_endpoints_tenant ON api_endpoints(tenant_id);

-- ---------------------------------------------------------------------------
-- AGENTS (legacy ERP agent heartbeat)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID        NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    version        TEXT        NOT NULL DEFAULT '',
    hostname       TEXT        NOT NULL DEFAULT '',
    status         TEXT        NOT NULL DEFAULT 'OFFLINE'
                               CHECK (status IN ('ONLINE','OFFLINE')),
    last_heartbeat TIMESTAMPTZ,
    registered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);