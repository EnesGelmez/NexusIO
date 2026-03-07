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

// TenantRepo is the PostgreSQL implementation of domain.TenantRepository.
type TenantRepo struct {
db     *DB
crypto *service.CryptoService
}

func NewTenantRepo(db *DB, crypto *service.CryptoService) *TenantRepo {
return &TenantRepo{db: db, crypto: crypto}
}

// encrypt wraps CryptoService.Encrypt, panics on unexpected error.
func (r *TenantRepo) enc(plain string) string {
s, err := r.crypto.Encrypt(plain)
if err != nil {
panic(fmt.Sprintf("TenantRepo encrypt: %v", err))
}
return s
}

func (r *TenantRepo) dec(cipher string) string {
s, _ := r.crypto.Decrypt(cipher)
return s
}

const tenantCols = `id, name, subdomain, email, status, plan, api_key, api_key_hash, agent_token, created_at, updated_at`

func (r *TenantRepo) scanTenant(row pgx.Row) (*domain.Tenant, error) {
var t domain.Tenant
var encAPIKey, apiKeyHash, encAgentToken string
err := row.Scan(
&t.ID, &t.Name, &t.Subdomain, &t.Email,
&t.Status, &t.Plan,
&encAPIKey, &apiKeyHash, &encAgentToken,
&t.CreatedAt, &t.UpdatedAt,
)
if err != nil {
return nil, err
}
t.APIKey      = r.dec(encAPIKey)
t.APIKeyHash  = apiKeyHash
t.AgentToken  = r.dec(encAgentToken)
return &t, nil
}

func (r *TenantRepo) FindAll(ctx context.Context) ([]domain.Tenant, error) {
rows, err := r.db.Pool.Query(ctx,
`SELECT `+tenantCols+` FROM tenants ORDER BY created_at DESC`)
if err != nil {
return nil, fmt.Errorf("tenants FindAll: %w", err)
}
defer rows.Close()

var out []domain.Tenant
for rows.Next() {
var t domain.Tenant
var encAPIKey, apiKeyHash, encAgentToken string
if err := rows.Scan(
&t.ID, &t.Name, &t.Subdomain, &t.Email,
&t.Status, &t.Plan,
&encAPIKey, &apiKeyHash, &encAgentToken,
&t.CreatedAt, &t.UpdatedAt,
); err != nil {
return nil, err
}
t.APIKey     = r.dec(encAPIKey)
t.APIKeyHash = apiKeyHash
t.AgentToken = r.dec(encAgentToken)
out = append(out, t)
}
return out, rows.Err()
}

func (r *TenantRepo) FindByID(ctx context.Context, id string) (*domain.Tenant, error) {
row := r.db.Pool.QueryRow(ctx,
`SELECT `+tenantCols+` FROM tenants WHERE id = $1`, id)
t, err := r.scanTenant(row)
if errors.Is(err, pgx.ErrNoRows) {
return nil, fmt.Errorf("tenant %q not found", id)
}
return t, err
}

func (r *TenantRepo) FindBySubdomain(ctx context.Context, subdomain string) (*domain.Tenant, error) {
row := r.db.Pool.QueryRow(ctx,
`SELECT `+tenantCols+` FROM tenants WHERE subdomain = $1`, subdomain)
t, err := r.scanTenant(row)
if errors.Is(err, pgx.ErrNoRows) {
return nil, fmt.Errorf("tenant subdomain %q not found", subdomain)
}
return t, err
}

// FindByAPIKey looks up a tenant by the SHA-256 hash of the incoming key.
func (r *TenantRepo) FindByAPIKey(ctx context.Context, apiKey string) (*domain.Tenant, error) {
hash := r.crypto.Hash(apiKey)
row := r.db.Pool.QueryRow(ctx,
`SELECT `+tenantCols+` FROM tenants WHERE api_key_hash = $1`, hash)
t, err := r.scanTenant(row)
if errors.Is(err, pgx.ErrNoRows) {
return nil, fmt.Errorf("invalid API key")
}
return t, err
}

func (r *TenantRepo) Create(ctx context.Context, t *domain.Tenant) error {
if t.ID == "" {
t.ID = uuid.New().String()
}
now := time.Now().UTC()
t.CreatedAt = now
t.UpdatedAt = now

encAPIKey    := r.enc(t.APIKey)
apiKeyHash   := r.crypto.Hash(t.APIKey)
encAgentToken := r.enc(t.AgentToken)

_, err := r.db.Pool.Exec(ctx, `
INSERT INTO tenants (id, name, subdomain, email, status, plan, api_key, api_key_hash, agent_token, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
t.ID, t.Name, t.Subdomain, t.Email, t.Status, t.Plan,
encAPIKey, apiKeyHash, encAgentToken,
t.CreatedAt, t.UpdatedAt,
)
return err
}

func (r *TenantRepo) Update(ctx context.Context, t *domain.Tenant) error {
t.UpdatedAt = time.Now().UTC()
encAgentToken := r.enc(t.AgentToken)
_, err := r.db.Pool.Exec(ctx, `
UPDATE tenants SET name=$2, subdomain=$3, email=$4, status=$5, plan=$6,
agent_token=$7, updated_at=$8 WHERE id=$1`,
t.ID, t.Name, t.Subdomain, t.Email, t.Status, t.Plan,
encAgentToken, t.UpdatedAt,
)
return err
}

func (r *TenantRepo) Delete(ctx context.Context, id string) error {
_, err := r.db.Pool.Exec(ctx, `DELETE FROM tenants WHERE id=$1`, id)
return err
}