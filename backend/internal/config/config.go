// Package config loads application configuration from environment variables
// with sensible defaults for development.
package config

import (
	"os"
	"strconv"
)

// Config holds all runtime configuration for the server.
type Config struct {
	// Server
	Port string

	// Database
	DatabaseURL string

	// JWT
	JWTSecret   string
	JWTTTLHours int

	// CORS – comma-separated list of allowed origins
	AllowedOrigins []string

	// API Keys – maps key → tenantID (for external callers)
	APIKeys map[string]string
}

// Load reads environment variables and returns a populated Config.
func Load() Config {
	c := Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://newgen:newgen_secret@localhost:5432/newgen?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "change-me-in-production-super-secret-key"),
		JWTTTLHours: getEnvInt("JWT_TTL_HOURS", 24),
		AllowedOrigins: []string{
			getEnv("CORS_ORIGIN", "http://localhost:5173"),
			"http://localhost:3000",
			"http://localhost:4173",
		},
		APIKeys: map[string]string{
			getEnv("API_KEY_ARCELIK", "test-api-key-arcelik-001"): "tenant-001",
			getEnv("API_KEY_BEKO", "test-api-key-beko-002"):       "tenant-002",
		},
	}
	return c
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
