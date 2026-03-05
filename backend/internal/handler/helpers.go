// Package handler contains HTTP handler types and shared helpers.
package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/newgen/backend/internal/middleware"
	"github.com/newgen/backend/internal/service"
)

// claimsFromContext is a convenience wrapper used by all handlers.
func claimsFromContext(ctx context.Context) *service.Claims {
	return middleware.ClaimsFromContext(ctx)
}

// respond serialises v as JSON and writes it to w with the given status code.
func respond(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// respondError writes a JSON error envelope.
func respondError(w http.ResponseWriter, status int, msg string) {
	respond(w, status, map[string]string{"error": msg})
}

// decode deserialises the request body into dest.
func decode(r *http.Request, dest any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(dest)
}
