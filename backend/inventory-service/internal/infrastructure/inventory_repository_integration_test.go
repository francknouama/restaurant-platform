package infrastructure

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/lib/pq"
	inventory "github.com/restaurant-platform/inventory-service/internal/domain"
	"github.com/restaurant-platform/shared/pkg/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestDB creates a test database connection
func setupTestDB(t *testing.T) (*InventoryRepository, func()) {
	// Use environment variables or default test database
	db, err := sql.Open("postgres", "postgresql://postgres:password@localhost:5432/inventory_test_db?sslmode=disable")
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Wrap in our DB type
	wrappedDB := &DB{DB: db}
	repo := NewInventoryRepository(wrappedDB)

	// Create tables
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS inventory (
			id VARCHAR(255) PRIMARY KEY,
			sku VARCHAR(100) UNIQUE NOT NULL,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			current_stock DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
			unit VARCHAR(20) NOT NULL,
			min_threshold DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
			max_threshold DECIMAL(10, 3),
			reorder_point DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
			cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
			category VARCHAR(100),
			location VARCHAR(255),
			supplier_id VARCHAR(255),
			last_ordered TIMESTAMP WITH TIME ZONE,
			expiry_date TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`)
	if err != nil {
		t.Fatalf("Failed to create inventory table: %v", err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS suppliers (
			id VARCHAR(255) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			contact_name VARCHAR(255),
			email VARCHAR(255),
			phone VARCHAR(50),
			address TEXT,
			website VARCHAR(255),
			notes TEXT,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`)
	if err != nil {
		t.Fatalf("Failed to create suppliers table: %v", err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS stock_movements (
			id VARCHAR(255) PRIMARY KEY,
			inventory_item_id VARCHAR(255) NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
			type VARCHAR(20) NOT NULL CHECK (type IN ('RECEIVED', 'USED', 'WASTED', 'ADJUSTED', 'RETURNED')),
			quantity DECIMAL(10, 3) NOT NULL,
			previous_stock DECIMAL(10, 3) NOT NULL,
			new_stock DECIMAL(10, 3) NOT NULL,
			notes TEXT,
			reference VARCHAR(255),
			performed_by VARCHAR(255),
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`)
	if err != nil {
		t.Fatalf("Failed to create stock_movements table: %v", err)
	}

	// Cleanup function
	cleanup := func() {
		db.Exec("DROP TABLE IF EXISTS stock_movements CASCADE")
		db.Exec("DROP TABLE IF EXISTS inventory CASCADE")
		db.Exec("DROP TABLE IF EXISTS suppliers CASCADE")
		db.Close()
	}

	return repo, cleanup
}

func TestInventoryRepository_StockMovements(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	repo, cleanup := setupTestDB(t)
	defer cleanup()

	ctx := context.Background()

	// Create an inventory item
	item := &inventory.InventoryItem{
		ID:           types.NewID[inventory.InventoryItemEntity]("inv"),
		SKU:          "TEST-001",
		Name:         "Test Item",
		Description:  "Test Description",
		CurrentStock: 100.0,
		Unit:         inventory.UnitTypeKilograms,
		MinThreshold: 10.0,
		MaxThreshold: 200.0,
		ReorderPoint: 20.0,
		Cost:         25.50,
		Category:     "Test Category",
		Location:     "Warehouse A",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	err := repo.CreateItem(ctx, item)
	require.NoError(t, err)

	t.Run("CreateMovement", func(t *testing.T) {
		movement := &inventory.StockMovement{
			ID:              types.NewID[inventory.MovementEntity]("mov"),
			InventoryItemID: item.ID,
			Type:            inventory.MovementTypeUsed,
			Quantity:        10.0,
			PreviousStock:   100.0,
			NewStock:        90.0,
			Notes:           "Used for order #123",
			Reference:       "ORDER-123",
			PerformedBy:     "user123",
			CreatedAt:       time.Now(),
		}

		err := repo.CreateMovement(ctx, movement)
		assert.NoError(t, err)
	})

	t.Run("GetMovementsByItemID", func(t *testing.T) {
		// Create multiple movements
		movements := []*inventory.StockMovement{
			{
				ID:              types.NewID[inventory.MovementEntity]("mov"),
				InventoryItemID: item.ID,
				Type:            inventory.MovementTypeReceived,
				Quantity:        50.0,
				PreviousStock:   90.0,
				NewStock:        140.0,
				Notes:           "Restocked",
				PerformedBy:     "user123",
				CreatedAt:       time.Now().Add(-2 * time.Hour),
			},
			{
				ID:              types.NewID[inventory.MovementEntity]("mov"),
				InventoryItemID: item.ID,
				Type:            inventory.MovementTypeUsed,
				Quantity:        20.0,
				PreviousStock:   140.0,
				NewStock:        120.0,
				Notes:           "Used for order #124",
				Reference:       "ORDER-124",
				PerformedBy:     "user456",
				CreatedAt:       time.Now().Add(-1 * time.Hour),
			},
		}

		for _, m := range movements {
			err := repo.CreateMovement(ctx, m)
			require.NoError(t, err)
		}

		// Get movements
		result, err := repo.GetMovementsByItemID(ctx, item.ID, 10, 0)
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, len(result), 3) // Including the first movement
	})

	t.Run("GetMovementsByDateRange", func(t *testing.T) {
		start := time.Now().Add(-3 * time.Hour)
		end := time.Now().Add(1 * time.Hour)

		movements, err := repo.GetMovementsByDateRange(ctx, start, end)
		assert.NoError(t, err)
		assert.Greater(t, len(movements), 0)
	})
}

func TestInventoryRepository_Suppliers(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	repo, cleanup := setupTestDB(t)
	defer cleanup()

	ctx := context.Background()

	t.Run("CreateSupplier", func(t *testing.T) {
		supplier := &inventory.Supplier{
			ID:          types.NewID[inventory.SupplierEntity]("sup"),
			Name:        "Test Supplier",
			ContactName: "John Doe",
			Email:       "john@testsupplier.com",
			Phone:       "123-456-7890",
			Address:     "123 Test St, Test City",
			Website:     "https://testsupplier.com",
			Notes:       "Reliable supplier",
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		err := repo.CreateSupplier(ctx, supplier)
		assert.NoError(t, err)

		// Get the supplier
		retrieved, err := repo.GetSupplierByID(ctx, supplier.ID)
		assert.NoError(t, err)
		assert.Equal(t, supplier.Name, retrieved.Name)
		assert.Equal(t, supplier.Email, retrieved.Email)
		assert.Equal(t, supplier.IsActive, retrieved.IsActive)
	})

	t.Run("UpdateSupplier", func(t *testing.T) {
		supplier := &inventory.Supplier{
			ID:        types.NewID[inventory.SupplierEntity]("sup"),
			Name:      "Update Test Supplier",
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		err := repo.CreateSupplier(ctx, supplier)
		require.NoError(t, err)

		// Update supplier
		supplier.Email = "updated@testsupplier.com"
		supplier.Phone = "987-654-3210"
		supplier.UpdatedAt = time.Now()

		err = repo.UpdateSupplier(ctx, supplier)
		assert.NoError(t, err)

		// Verify update
		updated, err := repo.GetSupplierByID(ctx, supplier.ID)
		assert.NoError(t, err)
		assert.Equal(t, "updated@testsupplier.com", updated.Email)
		assert.Equal(t, "987-654-3210", updated.Phone)
	})

	t.Run("ListSuppliers", func(t *testing.T) {
		// Create multiple suppliers
		for i := 0; i < 5; i++ {
			supplier := &inventory.Supplier{
				ID:        types.NewID[inventory.SupplierEntity]("sup"),
				Name:      "List Test Supplier " + string(rune('A'+i)),
				IsActive:  i%2 == 0,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			err := repo.CreateSupplier(ctx, supplier)
			require.NoError(t, err)
		}

		// List suppliers
		suppliers, total, err := repo.ListSuppliersWithPagination(ctx, 0, 10)
		assert.NoError(t, err)
		assert.Greater(t, total, 5)
		assert.GreaterOrEqual(t, len(suppliers), 5)
	})

	t.Run("GetActiveSuppliers", func(t *testing.T) {
		suppliers, err := repo.GetActiveSuppliers(ctx)
		assert.NoError(t, err)
		
		// All returned suppliers should be active
		for _, s := range suppliers {
			assert.True(t, s.IsActive)
		}
	})

	t.Run("DeleteSupplier", func(t *testing.T) {
		supplier := &inventory.Supplier{
			ID:        types.NewID[inventory.SupplierEntity]("sup"),
			Name:      "Delete Test Supplier",
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		err := repo.CreateSupplier(ctx, supplier)
		require.NoError(t, err)

		// Delete supplier
		err = repo.DeleteSupplier(ctx, supplier.ID)
		assert.NoError(t, err)

		// Verify deletion
		_, err = repo.GetSupplierByID(ctx, supplier.ID)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "supplier not found")
	})

	t.Run("GetItemsBySupplier", func(t *testing.T) {
		supplier := &inventory.Supplier{
			ID:        types.NewID[inventory.SupplierEntity]("sup"),
			Name:      "Items Test Supplier",
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		err := repo.CreateSupplier(ctx, supplier)
		require.NoError(t, err)

		// Create items for this supplier
		for i := 0; i < 3; i++ {
			item := &inventory.InventoryItem{
				ID:           types.NewID[inventory.InventoryItemEntity]("inv"),
				SKU:          "SUPPLIER-TEST-00" + string(rune('1'+i)),
				Name:         "Supplier Test Item " + string(rune('A'+i)),
				CurrentStock: 50.0,
				Unit:         inventory.UnitTypeUnits,
				Cost:         10.0,
				SupplierID:   supplier.ID,
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			}
			err := repo.CreateItem(ctx, item)
			require.NoError(t, err)
		}

		// Get items by supplier
		items, err := repo.GetItemsBySupplier(ctx, supplier.ID)
		assert.NoError(t, err)
		assert.Equal(t, 3, len(items))
		
		// All items should have the correct supplier ID
		for _, item := range items {
			assert.Equal(t, supplier.ID, item.SupplierID)
		}
	})
}