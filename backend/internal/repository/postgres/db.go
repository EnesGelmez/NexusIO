// Package postgres provides PostgreSQL implementations of all domain repositories
// using the pgx/v5 connection pool.
package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps a pgxpool.Pool so we have a single shared handle.
type DB struct {
	Pool *pgxpool.Pool
}

// New opens a connection pool using the provided connection string.
// Returns an error if the pool cannot be established or the ping fails.
func New(ctx context.Context, connString string) (*DB, error) {
	cfg, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("postgres: parse config: %w", err)
	}
	cfg.MaxConns = 20
	cfg.MinConns = 2

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("postgres: create pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("postgres: ping: %w", err)
	}
	return &DB{Pool: pool}, nil
}

// Close releases all connections in the pool.
func (db *DB) Close() {
	db.Pool.Close()
}
