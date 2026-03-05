// Package service holds all business logic between handlers and repositories.
package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/newgen/backend/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

// ─── AuthService ──────────────────────────────────────────────────────────────

// LoginRequest carries login credentials.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse is returned on successful authentication.
type LoginResponse struct {
	Token     string      `json:"token"`
	ExpiresAt time.Time   `json:"expiresAt"`
	User      domain.User `json:"user"`
}

// AuthService handles authentication and token issuance.
type AuthService struct {
	users    domain.UserRepository
	jwtSvc   *JWTService
}

func NewAuthService(users domain.UserRepository, jwtSvc *JWTService) *AuthService {
	return &AuthService{users: users, jwtSvc: jwtSvc}
}

// Login validates credentials and returns a signed JWT.
func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	user, err := s.users.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}
	if !user.IsActive {
		return nil, fmt.Errorf("account is disabled")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}
	token, exp, err := s.jwtSvc.Issue(user.ID, user.TenantID, string(user.Role))
	if err != nil {
		return nil, fmt.Errorf("could not issue token: %w", err)
	}
	return &LoginResponse{Token: token, ExpiresAt: exp, User: *user}, nil
}

// ─── TenantService ────────────────────────────────────────────────────────────

type TenantService struct {
	repo domain.TenantRepository
}

func NewTenantService(repo domain.TenantRepository) *TenantService {
	return &TenantService{repo: repo}
}

func (s *TenantService) List(ctx context.Context) ([]domain.Tenant, error) {
	return s.repo.FindAll(ctx)
}

func (s *TenantService) Get(ctx context.Context, id string) (*domain.Tenant, error) {
	return s.repo.FindByID(ctx, id)
}

type CreateTenantRequest struct {
	Name      string `json:"name"`
	Subdomain string `json:"subdomain"`
	Email     string `json:"email"`
	Plan      string `json:"plan"`
}

func (s *TenantService) Create(ctx context.Context, req CreateTenantRequest) (*domain.Tenant, error) {
	t := &domain.Tenant{
		Name:       req.Name,
		Subdomain:  req.Subdomain,
		Email:      req.Email,
		Status:     domain.TenantStatusTrial,
		Plan:       req.Plan,
		AgentToken: uuid.New().String(),
	}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TenantService) Update(ctx context.Context, id string, req CreateTenantRequest) (*domain.Tenant, error) {
	t, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	t.Name = req.Name
	t.Email = req.Email
	t.Plan = req.Plan
	if err := s.repo.Update(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TenantService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ─── WorkflowService ──────────────────────────────────────────────────────────

type WorkflowService struct {
	workflows domain.WorkflowRepository
	runs      domain.WorkflowRunRepository
}

func NewWorkflowService(workflows domain.WorkflowRepository, runs domain.WorkflowRunRepository) *WorkflowService {
	return &WorkflowService{workflows: workflows, runs: runs}
}

func (s *WorkflowService) List(ctx context.Context, tenantID string) ([]domain.Workflow, error) {
	return s.workflows.FindAll(ctx, tenantID)
}

func (s *WorkflowService) Get(ctx context.Context, id string) (*domain.Workflow, error) {
	return s.workflows.FindByID(ctx, id)
}

type SaveWorkflowRequest struct {
	Name        string               `json:"name"`
	Description string               `json:"description"`
	Trigger     string               `json:"trigger"`
	Nodes       []domain.WorkflowNode `json:"nodes"`
	Edges       []domain.WorkflowEdge `json:"edges"`
}

func (s *WorkflowService) Create(ctx context.Context, tenantID string, req SaveWorkflowRequest) (*domain.Workflow, error) {
	w := &domain.Workflow{
		ID:          uuid.New().String(),
		TenantID:    tenantID,
		Name:        req.Name,
		Description: req.Description,
		Status:      domain.WorkflowStatusDisabled,
		Trigger:     req.Trigger,
		Nodes:       req.Nodes,
		Edges:       req.Edges,
	}
	if err := s.workflows.Create(ctx, w); err != nil {
		return nil, err
	}
	return w, nil
}

func (s *WorkflowService) Update(ctx context.Context, id string, req SaveWorkflowRequest) (*domain.Workflow, error) {
	w, err := s.workflows.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	w.Name = req.Name
	w.Description = req.Description
	w.Trigger = req.Trigger
	w.Nodes = req.Nodes
	w.Edges = req.Edges
	if err := s.workflows.Update(ctx, w); err != nil {
		return nil, err
	}
	return w, nil
}

// SetEnabled toggles a workflow's active/disabled state.
func (s *WorkflowService) SetEnabled(ctx context.Context, id string, enabled bool) (*domain.Workflow, error) {
	w, err := s.workflows.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if enabled {
		w.Status = domain.WorkflowStatusActive
	} else {
		w.Status = domain.WorkflowStatusDisabled
	}
	if err := s.workflows.Update(ctx, w); err != nil {
		return nil, err
	}
	return w, nil
}

func (s *WorkflowService) Delete(ctx context.Context, id string) error {
	return s.workflows.Delete(ctx, id)
}

// GetRuns returns the N most recent execution records for a workflow.
func (s *WorkflowService) GetRuns(ctx context.Context, workflowID string, limit int) ([]domain.WorkflowRun, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.runs.FindByWorkflow(ctx, workflowID, limit)
}

// RecordRun simulates a workflow execution (test / trigger endpoint).
func (s *WorkflowService) RecordRun(
	ctx context.Context,
	workflowID, tenantID string,
	payload map[string]interface{},
	success bool,
	durationMs int64,
) (*domain.WorkflowRun, error) {
	status := domain.RunStatusSuccess
	if !success {
		status = domain.RunStatusFailed
	}
	t := time.Now().UTC()
	run := &domain.WorkflowRun{
		ID:         uuid.New().String(),
		WorkflowID: workflowID,
		TenantID:   tenantID,
		Status:     status,
		DurationMs: durationMs,
		Payload:    payload,
		Result:     map[string]interface{}{"ok": success},
		StartedAt:  t,
		FinishedAt: &t,
	}
	if err := s.runs.Create(ctx, run); err != nil {
		return nil, err
	}
	_ = s.workflows.IncrementStats(ctx, workflowID, success, durationMs)
	return run, nil
}

// TriggerResult is what WorkflowService.Trigger returns.
type TriggerResult struct {
	Run        *domain.WorkflowRun    `json:"run"`
	AgentModel map[string]interface{} `json:"agentModel"`
}

// Trigger executes the full trigger logic for a workflow:
//  1. Fetch the workflow and its nodes
//  2. Scan nodes: if any node has type "custom_cari_check" → cariKontrolEdilecekMi = true
//  3. Build the agent model that would be forwarded to the on-premise Agent
//  4. Record the run with the built model as result payload
func (s *WorkflowService) Trigger(
	ctx context.Context,
	workflowID, tenantID string,
	userPayload map[string]interface{},
) (*TriggerResult, error) {
	wf, err := s.workflows.FindByID(ctx, workflowID)
	if err != nil {
		return nil, err
	}

	// Scan node list: presence of "custom_cari_check" type drives the flag.
	cariKontrolEdilecekMi := false
	for _, node := range wf.Nodes {
		if node.Type == "custom_cari_check" {
			cariKontrolEdilecekMi = true
			break
		}
	}

	// Build the model that will be sent to the local Agent.
	agentModel := make(map[string]interface{}, len(userPayload)+1)
	for k, v := range userPayload {
		agentModel[k] = v
	}
	agentModel["cariKontrolEdilecekMi"] = cariKontrolEdilecekMi
	agentModel["workflowId"] = workflowID
	agentModel["triggeredAt"] = time.Now().UTC()

	// Record the run (simulated success for now).
	t := time.Now().UTC()
	run := &domain.WorkflowRun{
		ID:         uuid.New().String(),
		WorkflowID: workflowID,
		TenantID:   tenantID,
		Status:     domain.RunStatusSuccess,
		DurationMs: 0,
		Payload:    userPayload,
		Result:     agentModel,
		StartedAt:  t,
		FinishedAt: &t,
	}
	if err := s.runs.Create(ctx, run); err != nil {
		return nil, err
	}
	_ = s.workflows.IncrementStats(ctx, workflowID, true, 0)

	return &TriggerResult{
		Run:        run,
		AgentModel: agentModel,
	}, nil
}

// ─── ApiEndpointService ───────────────────────────────────────────────────────

type ApiEndpointService struct {
	repo domain.ApiEndpointRepository
}

func NewApiEndpointService(repo domain.ApiEndpointRepository) *ApiEndpointService {
	return &ApiEndpointService{repo: repo}
}

func (s *ApiEndpointService) List(ctx context.Context, tenantID string) ([]domain.ApiEndpoint, error) {
	return s.repo.FindAll(ctx, tenantID)
}

func (s *ApiEndpointService) Get(ctx context.Context, id string) (*domain.ApiEndpoint, error) {
	return s.repo.FindByID(ctx, id)
}

type CreateEndpointRequest struct {
	Name        string                  `json:"name"`
	Slug        string                  `json:"slug"`
	Method      domain.EndpointMethod   `json:"method"`
	Path        string                  `json:"path"`
	Description string                  `json:"description"`
	Auth        domain.EndpointAuthType `json:"auth"`
	Category    string                  `json:"category"`
	Parameters  []domain.EndpointParam  `json:"parameters"`
	Response    domain.EndpointResponse `json:"response"`
	TestMode    bool                    `json:"testMode"`
}

func (s *ApiEndpointService) Create(ctx context.Context, tenantID string, req CreateEndpointRequest) (*domain.ApiEndpoint, error) {
	ep := &domain.ApiEndpoint{
		TenantID:    tenantID,
		Name:        req.Name,
		Slug:        req.Slug,
		Method:      req.Method,
		Path:        req.Path,
		Description: req.Description,
		Enabled:     true,
		Auth:        req.Auth,
		Category:    req.Category,
		Parameters:  req.Parameters,
		Response:    req.Response,
		TestMode:    req.TestMode,
	}
	if err := s.repo.Create(ctx, ep); err != nil {
		return nil, err
	}
	return ep, nil
}

func (s *ApiEndpointService) SetEnabled(ctx context.Context, id string, enabled bool) (*domain.ApiEndpoint, error) {
	ep, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	ep.Enabled = enabled
	if err := s.repo.Update(ctx, ep); err != nil {
		return nil, err
	}
	return ep, nil
}

func (s *ApiEndpointService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ─── CariKontrolService ───────────────────────────────────────────────────────

// CariKontrolService implements the "Cari Kontrol" business operation.
// Architecture:
//   1. Cloud receives cariKod
//   2. Cloud returns { cariKontrolEdilecekMi: true } to caller
//   3. Cloud builds AgentCariKontrolModel and forwards to the local Agent
//   4. Agent does actual ERP lookup and returns result
type CariKontrolService struct {
	endpoints domain.ApiEndpointRepository
	agents    domain.AgentRepository
}

func NewCariKontrolService(endpoints domain.ApiEndpointRepository, agents domain.AgentRepository) *CariKontrolService {
	return &CariKontrolService{endpoints: endpoints, agents: agents}
}

// Check performs the cloud-side Cari Kontrol: always returns
// cariKontrolEdilecekMi=true (test mode) and records the call.
func (s *CariKontrolService) Check(ctx context.Context, tenantID string, req domain.CariKontrolRequest) (*domain.CariKontrolResponse, error) {
	if req.CariKod == "" {
		return nil, fmt.Errorf("cariKod is required")
	}
	// record the call
	_ = s.endpoints.IncrementCallCount(ctx, "ep-001")

	return &domain.CariKontrolResponse{
		Success:               true,
		CariKontrolEdilecekMi: true,
		CariKod:               req.CariKod,
	}, nil
}

// BuildAgentModel constructs the model that will be forwarded to the local Agent.
func (s *CariKontrolService) BuildAgentModel(cariKod string, extra map[string]interface{}) *domain.AgentCariKontrolModel {
	return &domain.AgentCariKontrolModel{
		CariKod:               cariKod,
		CariKontrolEdilecekMi: true,
		AdditionalData:        extra,
	}
}

// ─── AgentService ────────────────────────────────────────────────────────────

type AgentService struct {
	repo domain.AgentRepository
}

func NewAgentService(repo domain.AgentRepository) *AgentService {
	return &AgentService{repo: repo}
}

func (s *AgentService) GetStatus(ctx context.Context, tenantID string) (*domain.Agent, error) {
	return s.repo.FindByTenant(ctx, tenantID)
}

// Heartbeat is called by the local Agent to signal it is alive.
func (s *AgentService) Heartbeat(ctx context.Context, tenantID, agentID, version, hostname string) error {
	t := time.Now().UTC()
	a := &domain.Agent{
		ID:            agentID,
		TenantID:      tenantID,
		Hostname:      hostname,
		Version:       version,
		Status:        domain.AgentOnline,
		LastHeartbeat: &t,
		RegisteredAt:  t,
	}
	return s.repo.Upsert(ctx, a)
}

// ProcessRequest simulates the Agent processing a model from the cloud.
// In production, this logic runs inside the on-premise Agent binary.
func (s *AgentService) ProcessRequest(ctx context.Context, req domain.AgentProcessRequest) (*domain.AgentProcessResponse, error) {
	// Simulate cari kontrol lookup
	cariMevcut := true
	if kod, ok := req.Model["cariKod"].(string); ok && kod == "" {
		cariMevcut = false
	}
	return &domain.AgentProcessResponse{
		Success:    true,
		CariMevcut: cariMevcut,
		Result: map[string]interface{}{
			"runId":      req.RunID,
			"processed":  true,
			"cariMevcut": cariMevcut,
		},
	}, nil
}
