package handler

import (
	"net/http"

	"github.com/nexus/backend/internal/service"
)

// RoleHandler serves /api/v1/roles.
type RoleHandler struct {
	svc *service.RoleService
}

func NewRoleHandler(svc *service.RoleService) *RoleHandler {
	return &RoleHandler{svc: svc}
}

// GET /api/v1/roles
// Returns system roles + custom roles for the caller's tenant.
func (h *RoleHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromContext(r.Context())
	roles, err := h.svc.List(r.Context(), claims.TenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respond(w, http.StatusOK, roles)
}

// POST /api/v1/roles
func (h *RoleHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromContext(r.Context())
	var req service.SaveRoleRequest
	if err := decode(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "geçersiz istek gövdesi")
		return
	}
	role, err := h.svc.Create(r.Context(), claims.TenantID, req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respond(w, http.StatusCreated, role)
}

// PUT /api/v1/roles/{id}
func (h *RoleHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromContext(r.Context())
	id := r.PathValue("id")
	var req service.SaveRoleRequest
	if err := decode(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "geçersiz istek gövdesi")
		return
	}
	role, err := h.svc.Update(r.Context(), claims.TenantID, id, req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respond(w, http.StatusOK, role)
}

// DELETE /api/v1/roles/{id}
func (h *RoleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromContext(r.Context())
	id := r.PathValue("id")
	if err := h.svc.Delete(r.Context(), claims.TenantID, id); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
