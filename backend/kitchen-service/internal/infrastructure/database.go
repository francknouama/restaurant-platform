package infrastructure

import (
	"database/sql"
	"fmt"
	"log"

	"restaurant-platform/shared/pkg/config"

	_ "github.com/lib/pq"
)

// Database holds the database connection
type Database struct {
	Connection *sql.DB
}

// NewDatabase creates a new database connection
func NewDatabase(cfg *config.Config) (*Database, error) {
	// Build connection string
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Username,
		cfg.Database.Password,
		cfg.Database.Name,
	)

	// Open database connection
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Connected to database: %s:%s/%s", cfg.Database.Host, cfg.Database.Port, cfg.Database.Name)

	return &Database{
		Connection: db,
	}, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	if d.Connection != nil {
		return d.Connection.Close()
	}
	return nil
}