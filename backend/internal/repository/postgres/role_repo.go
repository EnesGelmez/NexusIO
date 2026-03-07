package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/google/uuid"
	"github.com/nexus/backend/internal/domain"
)

// RoleRepo is the PostgreSQL implementation of domain.RoleRepository.
type RoleRepo struct{ db *DB }

func NewRoleRepo(db *DB) *RoleRepo { return &RoleRepo{db: db} }

func scanRole(rows pgx.Rows) (domain.Role, error) {
	var r domain.Role
	var tenantID *string
	var permJSON []byte
	err := rows.Scan(
		&r.ID, &tenantID, &r.Name, &r.Description,
		&permJSON, &r.IsSystem, &r.UserCount, &r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		return r, err
	}
	if tenantID != nil {
		r.TenantID = *tenantID
	}
	if err := json.Unmarshal(permJSON, &r.Permissions); err != nil {
		return r, fmt.Errorf("roles: unmarshal permissions: %w", err)
	}
	return r, nil
}

const roleSelectSQL = `
SELECT r.id, r.tenant_id, r.name, r.description, r.permissions, r.is_system,
       COUNT(u.id) AS user_count, r.created_at, r.updated_at
FROM roles r
LEFT JOIN users u ON u.role_id = r.id
`

// FindAll returns system roles (tenant_id IS NULL) plus all custom roles that
// belong to tenantID. Pass tenantID="" to return system roles only.
func (repo *RoleRepo) FindAll(ctx context.Context, tenantID string) ([]domain.Role, error) {
	var rows pgx.Rows
	var err error
	if tenantID == "" {
		rows, err = repo.db.Pool.Query(ctx,
			roleSelectSQL+
				`WHERE r.tenant_id IS NULL `+
				`GROUP BY r.id ORDER BY r.is_system DESC, r.name`,
		)
	} else {
		rows, err = repo.db.Pool.Query(ctx,
			roleSelectSQL+
				`WHERE r.tenant_id IS NULL OR r.tenant_id = $1 `+
				`GROUP BY r.id ORDER BY r.is_system DESC, r.name`,
			tenantID,
		)
	}
	if err != nil {
		return nil, fmt.Errorf("roles FindAll: %w", err)
	}
	defer rows.Close()

	var out []domain.Role
	for rows.Next() {
		r, err := scanRole(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (repo *RoleRepo) FindByID(ctx context.Context, id string) (*domain.Role, error) {
	rows, err := repo.db.Pool.Query(ctx,
		roleSelectSQL+
			`WHERE r.id = $1 GROUP BY r.id`,
		id,
	)
	if err != nil {
		return nil, fmt.Errorf("roles FindByID: %w", err)
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, fmt.Errorf("role %q not found", id)
	}
	r, err := scanRole(rows)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (repo *RoleRepo) Create(ctx context.Context, r *domain.Role) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	now := time.Now().UTC()
	r.CreatedAt = now
	r.UpdatedAt = now

	permJSON, err := json.Marshal(r.Permissions)
	if err != nil {
		return fmt.Errorf("roles Create: marshal permissions: %w", err)
	}
	var tenantID *string
	if r.TenantID != "" {
		tenantID = &r.TenantID
	}
	_, err = repo.db.Pool.Exec(ctx, `
		INSERT INTO roles (id, tenant_id, name, description, permissions, is_system, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		r.ID, tenantID, r.Name, r.Description, permJSON, r.IsSystem, r.CreatedAt, r.UpdatedAt,
	)
	return err
}

func (repo *RoleRepo) Update(ctx context.Context, r *domain.Role) error {
	r.UpdatedAt = time.Now().UTC()
	permJSON, err := json.Marshal(r.Permissions)
	if err != nil {
		return fmt.Errorf("roles Update: marshal permissions: %w", err)
	}
	res, err := repo.db.Pool.Exec(ctx, `
		UPDATE roles SET name=$2, description=$3, permissions=$4, updated_at=$5
		WHERE id=$1 AND is_system=false`,
		r.ID, r.Name, r.Description, permJSON, r.UpdatedAt,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("role not found or is a system role (cannot update)")
	}
	return nil
}

func (repo *RoleRepo) Delete(ctx context.Context, id string) error {
	// Ensure no users are still assigned to this role first.
	var count int
	_ = repo.db.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role_id=$1`, id).Scan(&count)
	if count > 0 {
		return fmt.Errorf("cannot delete role: %d user(s) still assigned", count)
	}
	res, err := repo.db.Pool.Exec(ctx,
		`DELETE FROM roles WHERE id=$1 AND is_system=false`, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("role not found or is a system role (cannot delete)")
	}
	return nil
}
