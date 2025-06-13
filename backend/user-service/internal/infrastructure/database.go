package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/restaurant-platform/shared/pkg/config"
	_ "github.com/lib/pq"
)

// DBInterface defines the common interface for both *sql.DB and *sql.Tx
type DBInterface interface {
	ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
}

type DB struct {
	*sql.DB
}

// TxDB wraps a transaction to implement DBInterface
type TxDB struct {
	*sql.Tx
}

// NewConnection creates a new database connection with modern Go practices.
// Uses context for timeout control and proper connection pooling settings.
func NewConnection(cfg *config.DatabaseConfig) (*DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.Name, cfg.SSLMode)

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

// Transaction helper for repository pattern
func (db *DB) WithTx(ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		} else if err != nil {
			tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()
	
	err = fn(tx)
	return err
}

// Helper functions for nullable fields
func nullTimeOrPointer(t *time.Time) interface{} {
	if t == nil {
		return nil
	}
	return *t
}

func nullStringOrPointer(s *string) interface{} {
	if s == nil {
		return nil
	}
	return *s
}

func scanNullTime(dest **time.Time, src sql.NullTime) {
	if src.Valid {
		*dest = &src.Time
	} else {
		*dest = nil
	}
}

func scanNullString(dest **string, src sql.NullString) {
	if src.Valid {
		*dest = &src.String
	} else {
		*dest = nil
	}
}