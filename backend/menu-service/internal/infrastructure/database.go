package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/restaurant-platform/shared/pkg/config"
	"time"

	_ "github.com/lib/pq"
)

type DB struct {
	*sql.DB
}

// NewConnection creates a new database connection with modern Go practices.
// Uses context for timeout control and proper connection pooling settings.
func NewConnection(cfg *config.DatabaseConfig) (*DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.Database, cfg.SSLMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure connection pool with modern settings
	db.SetMaxOpenConns(25)                  // Maximum open connections
	db.SetMaxIdleConns(5)                   // Maximum idle connections
	db.SetConnMaxLifetime(30 * time.Minute) // Maximum connection lifetime
	db.SetConnMaxIdleTime(5 * time.Minute)  // Maximum idle time

	// Use context with timeout for ping
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		db.Close() // Clean up on error
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{DB: db}, nil
}

func (db *DB) Close() error {
	return db.DB.Close()
}

func nullTimeOrPointer(t *time.Time) interface{} {
	if t == nil {
		return nil
	}
	return *t
}