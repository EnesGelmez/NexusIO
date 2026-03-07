package postgres

import (
"context"
"errors"
"fmt"
"time"

"github.com/google/uuid"
"github.com/jackc/pgx/v5"
"github.com/nexus/backend/internal/domain"
"github.com/nexus/backend/internal/service"
)

// TenantAgentRepo is the PostgreSQL implementation of domain.TenantAgentRepository.
type TenantAgentRepo struct {
db     *DB
crypto *service.CryptoService
}

func NewTenantAgentRepo(db *DB, crypto *service.CryptoService) *TenantAgentRepo {
return &TenantAgentRepo{db: db, crypto: crypto}
}

func (r *TenantAgentRepo) enc(plain string) string {
s, err := r.crypto.Encrypt(plain)
if err != nil {
panic(fmt.Sprintf("TenantAgentRepo encrypt: %v", err))
}
return s
}

func (r *TenantAgentRepo) dec(cipher string) string {
s, _ := r.crypto.Decrypt(cipher)
return s
}

func (r *TenantAgentRepo) FindByTenant(ctx context.Context, tenantID string) (*domain.TenantAgent, error) {
var a domain.TenantAgent
var encSecretKey string
err := r.db.Pool.QueryRow(ctx, `
SELECT id, tenant_id, name, endpoint_url, secret_key, is_active, created_at, updated_at
FROM tenant_agents WHERE tenant_id = $1`, tenantID).
Scan(&a.ID, &a.TenantID, &a.Name, &a.EndpointURL, &encSecretKey, &a.IsActive, &a.CreatedAt, &a.UpdatedAt)
if errors.Is(err, pgx.ErrNoRows) {
return nil, fmt.Errorf("agent not configured for tenant %q", tenantID)
}
if err != nil {
return nil, err
}
a.SecretKey = r.dec(encSecretKey)
return &a, nil
}

func (r *TenantAgentRepo) Upsert(ctx context.Context, a *domain.TenantAgent) error {
if a.ID == "" {
a.ID = uuid.New().String()
}
a.UpdatedAt = time.Now().UTC()
if a.CreatedAt.IsZero() {
a.CreatedAt = a.UpdatedAt
}
encSecretKey := r.enc(a.SecretKey)
_, err := r.db.Pool.Exec(ctx, `
INSERT INTO tenant_agents (id, tenant_id, name, endpoint_url, secret_key, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (tenant_id) DO UPDATE SET
name         = EXCLUDED.name,
endpoint_url = EXCLUDED.endpoint_url,
secret_key   = EXCLUDED.secret_key,
is_active    = EXCLUDED.is_active,
updated_at   = EXCLUDED.updated_at`,
a.ID, a.TenantID, a.Name, a.EndpointURL, encSecretKey, a.IsActive, a.CreatedAt, a.UpdatedAt)
return err
}

func (r *TenantAgentRepo) Delete(ctx context.Context, tenantID string) error {
_, err := r.db.Pool.Exec(ctx, `DELETE FROM tenant_agents WHERE tenant_id = $1`, tenantID)
return err
}