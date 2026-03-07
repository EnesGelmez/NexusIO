package service

import (
	"context"
	"fmt"

	"github.com/nexus/backend/internal/domain"
)

// RoleService handles business logic for role management.
type RoleService struct {
	repo domain.RoleRepository
}

func NewRoleService(repo domain.RoleRepository) *RoleService {
	return &RoleService{repo: repo}
}

func (s *RoleService) List(ctx context.Context, tenantID string) ([]domain.Role, error) {
	roles, err := s.repo.FindAll(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	if roles == nil {
		roles = []domain.Role{}
	}
	return roles, nil
}

// SaveRoleRequest is used for both Create and Update.
type SaveRoleRequest struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Permissions domain.RolePermissions `json:"permissions"`
}

func (s *RoleService) Create(ctx context.Context, tenantID string, req SaveRoleRequest) (*domain.Role, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("rol adı zorunludur")
	}
	r := &domain.Role{
		TenantID:    tenantID,
		Name:        req.Name,
		Description: req.Description,
		Permissions: req.Permissions,
		IsSystem:    false,
	}
	if err := s.repo.Create(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

func (s *RoleService) Update(ctx context.Context, tenantID, id string, req SaveRoleRequest) (*domain.Role, error) {
	r, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if r.IsSystem {
		return nil, fmt.Errorf("sistem rolleri güncellenemez")
	}
	if r.TenantID != tenantID {
		return nil, fmt.Errorf("forbidden")
	}
	if req.Name == "" {
		return nil, fmt.Errorf("rol adı zorunludur")
	}
	r.Name = req.Name
	r.Description = req.Description
	r.Permissions = req.Permissions
	if err := s.repo.Update(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

func (s *RoleService) Delete(ctx context.Context, tenantID, id string) error {
	r, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if r.IsSystem {
		return fmt.Errorf("sistem rolleri silinemez")
	}
	if r.TenantID != tenantID {
		return fmt.Errorf("forbidden")
	}
	return s.repo.Delete(ctx, id)
}
