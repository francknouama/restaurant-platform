package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/restaurant-platform/shared/pkg/config"
	"time"

	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	*sql.DB
}

func NewConnection(cfg *config.DatabaseConfig) (*DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.Name, cfg.SSLMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{DB: db}, nil
}

func (db *DB) Close() error {
	return db.DB.Close()
}

// Test infrastructure

func NewTestDB() (*DB, error) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		return nil, fmt.Errorf("failed to open test database: %w", err)
	}

	// Create tables
	if err := createTestTables(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to create test tables: %w", err)
	}

	return &DB{DB: db}, nil
}

func createTestTables(db *sql.DB) error {
	// Create inventory table
	inventoryTable := `
		CREATE TABLE inventory (
			id TEXT PRIMARY KEY,
			sku TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			description TEXT,
			current_stock REAL NOT NULL DEFAULT 0,
			unit TEXT NOT NULL,
			min_threshold REAL NOT NULL DEFAULT 0,
			max_threshold REAL NOT NULL DEFAULT 0,
			reorder_point REAL NOT NULL DEFAULT 0,
			cost REAL NOT NULL DEFAULT 0,
			category TEXT,
			location TEXT,
			supplier_id TEXT,
			last_ordered DATETIME,
			expiry_date DATETIME,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		)`

	if _, err := db.Exec(inventoryTable); err != nil {
		return fmt.Errorf("failed to create inventory table: %w", err)
	}

	// Create stock_movements table
	movementsTable := `
		CREATE TABLE stock_movements (
			id TEXT PRIMARY KEY,
			inventory_item_id TEXT NOT NULL,
			type TEXT NOT NULL,
			quantity REAL NOT NULL,
			previous_stock REAL NOT NULL,
			new_stock REAL NOT NULL,
			unit TEXT NOT NULL,
			cost REAL NOT NULL DEFAULT 0,
			reason TEXT,
			reference TEXT,
			performed_by TEXT,
			performed_at DATETIME NOT NULL,
			created_at DATETIME NOT NULL,
			FOREIGN KEY (inventory_item_id) REFERENCES inventory(id)
		)`

	if _, err := db.Exec(movementsTable); err != nil {
		return fmt.Errorf("failed to create stock_movements table: %w", err)
	}

	// Create suppliers table
	suppliersTable := `
		CREATE TABLE suppliers (
			id TEXT PRIMARY KEY,
			code TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			contact_name TEXT,
			email TEXT,
			phone TEXT,
			address TEXT,
			website TEXT,
			notes TEXT,
			rating REAL NOT NULL DEFAULT 0,
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		)`

	if _, err := db.Exec(suppliersTable); err != nil {
		return fmt.Errorf("failed to create suppliers table: %w", err)
	}

	return nil
}

// TestInventoryRepository for testing
type TestInventoryRepository struct {
	*InventoryRepository
}

func NewTestInventoryRepository(db *DB) *TestInventoryRepository {
	return &TestInventoryRepository{
		InventoryRepository: NewInventoryRepository(db),
	}
}

