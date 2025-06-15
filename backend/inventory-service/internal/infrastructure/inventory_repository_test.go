package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	_ "github.com/mattn/go-sqlite3"

	inventory "github.com/restaurant-platform/inventory-service/internal/domain"
)


// UpdateItem implementation compatible with SQLite
func (r *TestInventoryRepository) UpdateItem(ctx context.Context, item *inventory.InventoryItem) error {
	query := `
		UPDATE inventory 
		SET name = ?, description = ?, current_stock = ?, unit = ?,
		    min_threshold = ?, max_threshold = ?, reorder_point = ?,
		    cost = ?, category = ?, location = ?, supplier_id = ?,
		    last_ordered = ?, expiry_date = ?, updated_at = ?
		WHERE id = ?`

	var supplierID interface{}
	if item.SupplierID != "" {
		supplierID = item.SupplierID.String()
	}

	var lastOrdered, expiryDate interface{}
	if !item.LastOrdered.IsZero() {
		lastOrdered = item.LastOrdered
	}
	if !item.ExpiryDate.IsZero() {
		expiryDate = item.ExpiryDate
	}

	_, err := r.db.ExecContext(ctx, query,
		item.Name, item.Description, item.CurrentStock, string(item.Unit),
		item.MinThreshold, item.MaxThreshold, item.ReorderPoint, item.Cost,
		item.Category, item.Location, supplierID, lastOrdered, expiryDate,
		item.UpdatedAt, item.ID.String())

	return err
}

// SearchItems implementation compatible with SQLite
func (r *TestInventoryRepository) SearchItems(ctx context.Context, query string) ([]*inventory.InventoryItem, error) {
	sql := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory 
		WHERE LOWER(name) LIKE LOWER(?) OR LOWER(sku) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?)`
	
	searchPattern := "%" + query + "%"
	return r.queryItems(ctx, sql, searchPattern, searchPattern, searchPattern)
}

// GetItemsByCategory implementation for SQLite
func (r *TestInventoryRepository) GetItemsByCategory(ctx context.Context, category string) ([]*inventory.InventoryItem, error) {
	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory WHERE category = ?`
	
	return r.queryItems(ctx, query, category)
}

// GetLowStockItems implementation for SQLite  
func (r *TestInventoryRepository) GetLowStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory 
		WHERE current_stock <= reorder_point AND reorder_point > 0
		ORDER BY current_stock ASC`

	return r.queryItems(ctx, query)
}

// GetOutOfStockItems implementation for SQLite
func (r *TestInventoryRepository) GetOutOfStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory 
		WHERE current_stock <= 0
		ORDER BY updated_at DESC`

	return r.queryItems(ctx, query)
}

// CheckStockAvailability implementation for SQLite
func (r *TestInventoryRepository) CheckStockAvailability(ctx context.Context, sku string, quantity float64) (bool, error) {
	query := `SELECT current_stock FROM inventory WHERE sku = ?`
	
	var currentStock float64
	err := r.db.QueryRowContext(ctx, query, sku).Scan(&currentStock)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, fmt.Errorf("inventory item not found")
		}
		return false, err
	}

	return currentStock >= quantity, nil
}

// ListItems implementation for SQLite
func (r *TestInventoryRepository) ListItems(ctx context.Context, offset, limit int) ([]*inventory.InventoryItem, int, error) {
	countQuery := `SELECT COUNT(*) FROM inventory`
	var total int
	err := r.db.QueryRowContext(ctx, countQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory 
		ORDER BY name ASC 
		LIMIT ? OFFSET ?`

	items, err := r.queryItems(ctx, query, limit, offset)
	return items, total, err
}

// Helper method that properly handles SQLite parameter conversion 
func (r *TestInventoryRepository) queryItems(ctx context.Context, query string, args ...interface{}) ([]*inventory.InventoryItem, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*inventory.InventoryItem
	for rows.Next() {
		var item inventory.InventoryItem
		var idStr, unit string
		var supplierStr sql.NullString
		var lastOrdered, expiryDate sql.NullTime

		err := rows.Scan(
			&idStr, &item.SKU, &item.Name, &item.Description, &item.CurrentStock,
			&unit, &item.MinThreshold, &item.MaxThreshold, &item.ReorderPoint,
			&item.Cost, &item.Category, &item.Location, &supplierStr,
			&lastOrdered, &expiryDate, &item.CreatedAt, &item.UpdatedAt)
		if err != nil {
			return nil, err
		}

		item.ID = inventory.InventoryItemID(idStr)
		item.Unit = inventory.UnitType(unit)
		if supplierStr.Valid && supplierStr.String != "" {
			item.SupplierID = inventory.SupplierID(supplierStr.String)
		}
		if lastOrdered.Valid {
			item.LastOrdered = lastOrdered.Time
		}
		if expiryDate.Valid {
			item.ExpiryDate = expiryDate.Time
		}

		items = append(items, &item)
	}

	return items, rows.Err()
}

// InventoryRepositoryTestSuite contains all repository tests
type InventoryRepositoryTestSuite struct {
	suite.Suite
	db   *DB
	repo *TestInventoryRepository
	ctx  context.Context
}

func TestInventoryRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(InventoryRepositoryTestSuite))
}

func (suite *InventoryRepositoryTestSuite) SetupTest() {
	// Create in-memory SQLite database
	sqlDB, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		suite.T().Fatalf("Failed to open SQLite database: %v", err)
	}

	// Create DB wrapper
	suite.db = &DB{DB: sqlDB}
	suite.repo = NewTestInventoryRepository(suite.db)
	suite.ctx = context.Background()

	// Create table schemas
	suite.createSchemas()
}

func (suite *InventoryRepositoryTestSuite) TearDownTest() {
	if suite.db != nil && suite.db.DB != nil {
		suite.db.Close()
	}
}

func (suite *InventoryRepositoryTestSuite) createSchemas() {
	schemas := []string{
		`CREATE TABLE suppliers (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			contact_name TEXT,
			email TEXT,
			phone TEXT,
			address TEXT,
			website TEXT,
			notes TEXT,
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		)`,
		`CREATE TABLE inventory (
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
			updated_at DATETIME NOT NULL,
			FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
		)`,
		`CREATE TABLE stock_movements (
			id TEXT PRIMARY KEY,
			inventory_item_id TEXT NOT NULL,
			type TEXT NOT NULL,
			quantity REAL NOT NULL,
			previous_stock REAL NOT NULL,
			new_stock REAL NOT NULL,
			notes TEXT,
			reference TEXT,
			performed_by TEXT,
			created_at DATETIME NOT NULL,
			FOREIGN KEY (inventory_item_id) REFERENCES inventory(id)
		)`,
	}

	for _, schema := range schemas {
		_, err := suite.db.Exec(schema)
		if err != nil {
			suite.T().Fatalf("Failed to create schema: %v", err)
		}
	}
}

func (suite *InventoryRepositoryTestSuite) createTestSupplier() *inventory.Supplier {
	supplier, err := inventory.NewSupplier(fmt.Sprintf("Supplier_%d", time.Now().UnixNano()))
	if err != nil {
		suite.T().Fatalf("Failed to create test supplier: %v", err)
	}
	// Sleep to ensure unique IDs
	time.Sleep(1 * time.Millisecond)
	return supplier
}

func (suite *InventoryRepositoryTestSuite) createTestItem() *inventory.InventoryItem {
	item, err := inventory.NewInventoryItem(
		fmt.Sprintf("SKU_%d", time.Now().UnixNano()),
		fmt.Sprintf("Item_%d", time.Now().UnixNano()),
		50.0,
		inventory.UnitTypeKilograms,
		5.50,
	)
	if err != nil {
		suite.T().Fatalf("Failed to create test item: %v", err)
	}
	// Sleep to ensure unique IDs
	time.Sleep(1 * time.Millisecond)
	return item
}

// Test Supplier Operations
func (suite *InventoryRepositoryTestSuite) TestCreateSupplier_Success() {
	// Given
	supplier := suite.createTestSupplier()

	// When
	err := suite.repo.CreateSupplier(suite.ctx, supplier)

	// Then
	assert.NoError(suite.T(), err)

	// Verify supplier was created by querying directly
	var count int
	err = suite.db.QueryRow("SELECT COUNT(*) FROM suppliers WHERE id = ?", supplier.ID.String()).Scan(&count)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 1, count)
}

func (suite *InventoryRepositoryTestSuite) TestCreateSupplier_DuplicateID() {
	// Given
	supplier := suite.createTestSupplier()

	// When - Create first time
	err := suite.repo.CreateSupplier(suite.ctx, supplier)
	assert.NoError(suite.T(), err)

	// When - Create second time with same ID
	err = suite.repo.CreateSupplier(suite.ctx, supplier)

	// Then - Should fail due to primary key constraint
	assert.Error(suite.T(), err)
}

// Test Inventory Item Operations
func (suite *InventoryRepositoryTestSuite) TestCreateItem_Success() {
	// Given
	item := suite.createTestItem()

	// When
	err := suite.repo.CreateItem(suite.ctx, item)

	// Then
	assert.NoError(suite.T(), err)

	// Verify item was created
	retrieved, err := suite.repo.GetItemByID(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), item.ID, retrieved.ID)
	assert.Equal(suite.T(), item.SKU, retrieved.SKU)
	assert.Equal(suite.T(), item.Name, retrieved.Name)
	assert.Equal(suite.T(), item.CurrentStock, retrieved.CurrentStock)
	assert.Equal(suite.T(), item.Unit, retrieved.Unit)
	assert.Equal(suite.T(), item.Cost, retrieved.Cost)
}

func (suite *InventoryRepositoryTestSuite) TestCreateItem_DuplicateSKU() {
	// Given
	item1 := suite.createTestItem()
	item2 := suite.createTestItem()
	item2.SKU = item1.SKU // Same SKU

	err := suite.repo.CreateItem(suite.ctx, item1)
	assert.NoError(suite.T(), err)

	// When
	err = suite.repo.CreateItem(suite.ctx, item2)

	// Then - Should fail due to unique constraint on SKU
	assert.Error(suite.T(), err)
}

func (suite *InventoryRepositoryTestSuite) TestGetItemByID_Success() {
	// Given
	item := suite.createTestItem()
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	retrieved, err := suite.repo.GetItemByID(suite.ctx, item.ID)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), retrieved)
	assert.Equal(suite.T(), item.ID, retrieved.ID)
	assert.Equal(suite.T(), item.SKU, retrieved.SKU)
	assert.Equal(suite.T(), item.Name, retrieved.Name)
	assert.Equal(suite.T(), item.CurrentStock, retrieved.CurrentStock)
	assert.Equal(suite.T(), item.Unit, retrieved.Unit)
	assert.Equal(suite.T(), item.Cost, retrieved.Cost)
}

func (suite *InventoryRepositoryTestSuite) TestGetItemByID_NotFound() {
	// Given
	nonExistentID := inventory.InventoryItemID("inv_nonexistent")

	// When
	retrieved, err := suite.repo.GetItemByID(suite.ctx, nonExistentID)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), retrieved)
	assert.Contains(suite.T(), err.Error(), "inventory item not found")
}

func (suite *InventoryRepositoryTestSuite) TestGetItemBySKU_Success() {
	// Given
	item := suite.createTestItem()
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	retrieved, err := suite.repo.GetItemBySKU(suite.ctx, item.SKU)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), retrieved)
	assert.Equal(suite.T(), item.ID, retrieved.ID)
	assert.Equal(suite.T(), item.SKU, retrieved.SKU)
	assert.Equal(suite.T(), item.Name, retrieved.Name)
}

func (suite *InventoryRepositoryTestSuite) TestGetItemBySKU_NotFound() {
	// Given
	nonExistentSKU := "NONEXISTENT_SKU"

	// When
	retrieved, err := suite.repo.GetItemBySKU(suite.ctx, nonExistentSKU)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), retrieved)
	assert.Contains(suite.T(), err.Error(), "inventory item not found")
}

func (suite *InventoryRepositoryTestSuite) TestUpdateItem_Success() {
	// Given
	item := suite.createTestItem()
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// Modify item
	item.Name = "Updated Item Name"
	item.CurrentStock = 75.0
	item.Cost = 6.25
	item.Category = "Updated Category"
	item.Location = "Updated Location"
	item.MinThreshold = 5.0
	item.MaxThreshold = 100.0
	item.ReorderPoint = 15.0

	// When
	err = suite.repo.UpdateItem(suite.ctx, item)

	// Then
	assert.NoError(suite.T(), err)

	// Verify update
	retrieved, err := suite.repo.GetItemByID(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Updated Item Name", retrieved.Name)
	assert.Equal(suite.T(), 75.0, retrieved.CurrentStock)
	assert.Equal(suite.T(), 6.25, retrieved.Cost)
	assert.Equal(suite.T(), "Updated Category", retrieved.Category)
	assert.Equal(suite.T(), "Updated Location", retrieved.Location)
	assert.Equal(suite.T(), 5.0, retrieved.MinThreshold)
	assert.Equal(suite.T(), 100.0, retrieved.MaxThreshold)
	assert.Equal(suite.T(), 15.0, retrieved.ReorderPoint)
}

func (suite *InventoryRepositoryTestSuite) TestUpdateItem_WithSupplier() {
	// Given
	supplier := suite.createTestSupplier()
	err := suite.repo.CreateSupplier(suite.ctx, supplier)
	assert.NoError(suite.T(), err)

	item := suite.createTestItem()
	err = suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// Assign supplier to item
	item.SupplierID = supplier.ID

	// When
	err = suite.repo.UpdateItem(suite.ctx, item)

	// Then
	assert.NoError(suite.T(), err)

	// Verify supplier assignment
	retrieved, err := suite.repo.GetItemByID(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), supplier.ID, retrieved.SupplierID)
}

func (suite *InventoryRepositoryTestSuite) TestUpdateItem_WithDates() {
	// Given
	item := suite.createTestItem()
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// Set dates
	lastOrdered := time.Now().Add(-7 * 24 * time.Hour) // 7 days ago
	expiryDate := time.Now().Add(30 * 24 * time.Hour)  // 30 days from now
	item.LastOrdered = lastOrdered
	item.ExpiryDate = expiryDate

	// When
	err = suite.repo.UpdateItem(suite.ctx, item)

	// Then
	assert.NoError(suite.T(), err)

	// Verify dates
	retrieved, err := suite.repo.GetItemByID(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), retrieved.LastOrdered.Equal(lastOrdered) || retrieved.LastOrdered.Sub(lastOrdered).Abs() < time.Second)
	assert.True(suite.T(), retrieved.ExpiryDate.Equal(expiryDate) || retrieved.ExpiryDate.Sub(expiryDate).Abs() < time.Second)
}

func (suite *InventoryRepositoryTestSuite) TestDeleteItem_Success() {
	// Given
	item := suite.createTestItem()
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	err = suite.repo.DeleteItem(suite.ctx, item.ID)

	// Then
	assert.NoError(suite.T(), err)

	// Verify item was deleted
	retrieved, err := suite.repo.GetItemByID(suite.ctx, item.ID)
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), retrieved)
}

func (suite *InventoryRepositoryTestSuite) TestDeleteItem_NotFound() {
	// Given
	nonExistentID := inventory.InventoryItemID("inv_nonexistent")

	// When
	err := suite.repo.DeleteItem(suite.ctx, nonExistentID)

	// Then - Should not error even if item doesn't exist
	assert.NoError(suite.T(), err)
}

// Test CheckStockAvailability
func (suite *InventoryRepositoryTestSuite) TestCheckStockAvailability_Available() {
	// Given
	item := suite.createTestItem()
	item.CurrentStock = 100.0
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	available, err := suite.repo.CheckStockAvailability(suite.ctx, item.SKU, 50.0)

	// Then
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), available)
}

func (suite *InventoryRepositoryTestSuite) TestCheckStockAvailability_NotAvailable() {
	// Given
	item := suite.createTestItem()
	item.CurrentStock = 30.0
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	available, err := suite.repo.CheckStockAvailability(suite.ctx, item.SKU, 50.0)

	// Then
	assert.NoError(suite.T(), err)
	assert.False(suite.T(), available)
}

func (suite *InventoryRepositoryTestSuite) TestCheckStockAvailability_ExactAmount() {
	// Given
	item := suite.createTestItem()
	item.CurrentStock = 50.0
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	available, err := suite.repo.CheckStockAvailability(suite.ctx, item.SKU, 50.0)

	// Then
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), available)
}

func (suite *InventoryRepositoryTestSuite) TestCheckStockAvailability_ItemNotFound() {
	// Given
	nonExistentSKU := "NONEXISTENT_SKU"

	// When
	available, err := suite.repo.CheckStockAvailability(suite.ctx, nonExistentSKU, 10.0)

	// Then
	assert.Error(suite.T(), err)
	assert.False(suite.T(), available)
	assert.Contains(suite.T(), err.Error(), "inventory item not found")
}

// Test GetLowStockItems
func (suite *InventoryRepositoryTestSuite) TestGetLowStockItems_Success() {
	// Given
	item1 := suite.createTestItem()
	item1.CurrentStock = 5.0
	item1.ReorderPoint = 10.0
	err := suite.repo.CreateItem(suite.ctx, item1)
	assert.NoError(suite.T(), err)

	item2 := suite.createTestItem()
	item2.CurrentStock = 15.0
	item2.ReorderPoint = 10.0 // Not low stock
	err = suite.repo.CreateItem(suite.ctx, item2)
	assert.NoError(suite.T(), err)

	item3 := suite.createTestItem()
	item3.CurrentStock = 3.0
	item3.ReorderPoint = 8.0
	err = suite.repo.CreateItem(suite.ctx, item3)
	assert.NoError(suite.T(), err)

	// When
	lowStockItems, err := suite.repo.GetLowStockItems(suite.ctx)

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), lowStockItems, 2) // item1 and item3
	
	// Verify items are sorted by current stock ASC
	assert.Equal(suite.T(), item3.ID, lowStockItems[0].ID) // Lower stock first
	assert.Equal(suite.T(), item1.ID, lowStockItems[1].ID)
}

func (suite *InventoryRepositoryTestSuite) TestGetLowStockItems_NoLowStock() {
	// Given
	item := suite.createTestItem()
	item.CurrentStock = 50.0
	item.ReorderPoint = 10.0
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	lowStockItems, err := suite.repo.GetLowStockItems(suite.ctx)

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), lowStockItems, 0)
}

// Test GetOutOfStockItems
func (suite *InventoryRepositoryTestSuite) TestGetOutOfStockItems_Success() {
	// Given
	item1 := suite.createTestItem()
	item1.CurrentStock = 0.0
	err := suite.repo.CreateItem(suite.ctx, item1)
	assert.NoError(suite.T(), err)

	item2 := suite.createTestItem()
	item2.CurrentStock = 10.0 // Not out of stock
	err = suite.repo.CreateItem(suite.ctx, item2)
	assert.NoError(suite.T(), err)

	item3 := suite.createTestItem()
	item3.CurrentStock = -1.0 // Negative stock
	err = suite.repo.CreateItem(suite.ctx, item3)
	assert.NoError(suite.T(), err)

	// When
	outOfStockItems, err := suite.repo.GetOutOfStockItems(suite.ctx)

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), outOfStockItems, 2) // item1 and item3
}

func (suite *InventoryRepositoryTestSuite) TestGetOutOfStockItems_NoOutOfStock() {
	// Given
	item := suite.createTestItem()
	item.CurrentStock = 50.0
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	outOfStockItems, err := suite.repo.GetOutOfStockItems(suite.ctx)

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), outOfStockItems, 0)
}

// Test ListItems
func (suite *InventoryRepositoryTestSuite) TestListItems_Success() {
	// Given - Create multiple items
	item1 := suite.createTestItem()
	item1.Name = "Apple"
	err := suite.repo.CreateItem(suite.ctx, item1)
	assert.NoError(suite.T(), err)

	item2 := suite.createTestItem()
	item2.Name = "Banana"
	err = suite.repo.CreateItem(suite.ctx, item2)
	assert.NoError(suite.T(), err)

	item3 := suite.createTestItem()
	item3.Name = "Cherry"
	err = suite.repo.CreateItem(suite.ctx, item3)
	assert.NoError(suite.T(), err)

	// When
	items, total, err := suite.repo.ListItems(suite.ctx, 0, 10)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 3, total)
	assert.Len(suite.T(), items, 3)
	
	// Verify items are sorted by name ASC
	assert.Equal(suite.T(), "Apple", items[0].Name)
	assert.Equal(suite.T(), "Banana", items[1].Name)
	assert.Equal(suite.T(), "Cherry", items[2].Name)
}

func (suite *InventoryRepositoryTestSuite) TestListItems_WithPagination() {
	// Given - Create multiple items
	for i := 0; i < 5; i++ {
		item := suite.createTestItem()
		item.Name = fmt.Sprintf("Item_%02d", i)
		err := suite.repo.CreateItem(suite.ctx, item)
		assert.NoError(suite.T(), err)
	}

	// When - Get first page
	firstPage, total, err := suite.repo.ListItems(suite.ctx, 0, 2)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 5, total)
	assert.Len(suite.T(), firstPage, 2)

	// When - Get second page
	secondPage, total, err := suite.repo.ListItems(suite.ctx, 2, 2)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 5, total)
	assert.Len(suite.T(), secondPage, 2)

	// When - Get third page
	thirdPage, total, err := suite.repo.ListItems(suite.ctx, 4, 2)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 5, total)
	assert.Len(suite.T(), thirdPage, 1) // Only one remaining
}

func (suite *InventoryRepositoryTestSuite) TestListItems_EmptyResult() {
	// When - No items exist
	items, total, err := suite.repo.ListItems(suite.ctx, 0, 10)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 0, total)
	assert.Len(suite.T(), items, 0)
}

// Test GetItemsByCategory
func (suite *InventoryRepositoryTestSuite) TestGetItemsByCategory_Success() {
	// Given
	item1 := suite.createTestItem()
	item1.Category = "Vegetables"
	err := suite.repo.CreateItem(suite.ctx, item1)
	assert.NoError(suite.T(), err)

	item2 := suite.createTestItem()
	item2.Category = "Fruits"
	err = suite.repo.CreateItem(suite.ctx, item2)
	assert.NoError(suite.T(), err)

	item3 := suite.createTestItem()
	item3.Category = "Vegetables"
	err = suite.repo.CreateItem(suite.ctx, item3)
	assert.NoError(suite.T(), err)

	// When
	vegetableItems, err := suite.repo.GetItemsByCategory(suite.ctx, "Vegetables")

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), vegetableItems, 2)
	
	// Verify all items have the correct category
	for _, item := range vegetableItems {
		assert.Equal(suite.T(), "Vegetables", item.Category)
	}
}

func (suite *InventoryRepositoryTestSuite) TestGetItemsByCategory_NoResults() {
	// Given
	item := suite.createTestItem()
	item.Category = "Vegetables"
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	fruitItems, err := suite.repo.GetItemsByCategory(suite.ctx, "Fruits")

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), fruitItems, 0)
}

// Test SearchItems
func (suite *InventoryRepositoryTestSuite) TestSearchItems_ByName() {
	// Given
	item1 := suite.createTestItem()
	item1.Name = "Red Apple"
	err := suite.repo.CreateItem(suite.ctx, item1)
	assert.NoError(suite.T(), err)

	item2 := suite.createTestItem()
	item2.Name = "Green Apple"
	err = suite.repo.CreateItem(suite.ctx, item2)
	assert.NoError(suite.T(), err)

	item3 := suite.createTestItem()
	item3.Name = "Banana"
	err = suite.repo.CreateItem(suite.ctx, item3)
	assert.NoError(suite.T(), err)

	// When
	appleItems, err := suite.repo.SearchItems(suite.ctx, "Apple")

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), appleItems, 2)
	
	// Verify all items contain "Apple" in name
	for _, item := range appleItems {
		assert.Contains(suite.T(), item.Name, "Apple")
	}
}

func (suite *InventoryRepositoryTestSuite) TestSearchItems_BySKU() {
	// Given
	item1 := suite.createTestItem()
	item1.SKU = "APPL001"
	err := suite.repo.CreateItem(suite.ctx, item1)
	assert.NoError(suite.T(), err)

	item2 := suite.createTestItem()
	item2.SKU = "APPL002"
	err = suite.repo.CreateItem(suite.ctx, item2)
	assert.NoError(suite.T(), err)

	item3 := suite.createTestItem()
	item3.SKU = "BANN001"
	err = suite.repo.CreateItem(suite.ctx, item3)
	assert.NoError(suite.T(), err)

	// When
	applItems, err := suite.repo.SearchItems(suite.ctx, "APPL")

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), applItems, 2)
	
	// Verify all items contain "APPL" in SKU
	for _, item := range applItems {
		assert.Contains(suite.T(), item.SKU, "APPL")
	}
}

func (suite *InventoryRepositoryTestSuite) TestSearchItems_ByDescription() {
	// Given
	item1 := suite.createTestItem()
	item1.Description = "Fresh organic apple"
	err := suite.repo.CreateItem(suite.ctx, item1)
	assert.NoError(suite.T(), err)

	item2 := suite.createTestItem()
	item2.Description = "Ripe banana"
	err = suite.repo.CreateItem(suite.ctx, item2)
	assert.NoError(suite.T(), err)

	item3 := suite.createTestItem()
	item3.Description = "Green apple variety"
	err = suite.repo.CreateItem(suite.ctx, item3)
	assert.NoError(suite.T(), err)

	// When
	appleItems, err := suite.repo.SearchItems(suite.ctx, "apple")

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), appleItems, 2)
	
	// Verify all items contain "apple" in description
	for _, item := range appleItems {
		assert.Contains(suite.T(), item.Description, "apple")
	}
}

func (suite *InventoryRepositoryTestSuite) TestSearchItems_NoResults() {
	// Given
	item := suite.createTestItem()
	item.Name = "Apple"
	item.SKU = "APPL001"
	item.Description = "Fresh apple"
	err := suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// When
	orangeItems, err := suite.repo.SearchItems(suite.ctx, "orange")

	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), orangeItems, 0)
}

// Test complex scenarios
func (suite *InventoryRepositoryTestSuite) TestCompleteInventoryWorkflow() {
	// Given - Create a supplier
	supplier := suite.createTestSupplier()
	supplier.Name = "Fresh Produce Co"
	supplier.ContactName = "John Doe"
	supplier.Email = "john@freshproduce.com"
	supplier.Phone = "+1234567890"
	err := suite.repo.CreateSupplier(suite.ctx, supplier)
	assert.NoError(suite.T(), err)

	// Step 1: Create inventory item
	item := suite.createTestItem()
	item.SKU = "TOMATO001"
	item.Name = "Fresh Tomatoes"
	item.Description = "Organic cherry tomatoes"
	item.CurrentStock = 0.0
	item.Unit = inventory.UnitTypeKilograms
	item.MinThreshold = 5.0
	item.MaxThreshold = 50.0
	item.ReorderPoint = 10.0
	item.Cost = 3.50
	item.Category = "Vegetables"
	item.Location = "Refrigerator A"
	item.SupplierID = supplier.ID
	item.ExpiryDate = time.Now().Add(7 * 24 * time.Hour) // Expires in 7 days

	err = suite.repo.CreateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	// Step 2: Verify item was created correctly
	retrieved, err := suite.repo.GetItemByID(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "TOMATO001", retrieved.SKU)
	assert.Equal(suite.T(), "Fresh Tomatoes", retrieved.Name)
	assert.Equal(suite.T(), "Vegetables", retrieved.Category)
	assert.Equal(suite.T(), supplier.ID, retrieved.SupplierID)

	// Step 3: Test search functionality
	searchResults, err := suite.repo.SearchItems(suite.ctx, "tomato")
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), searchResults, 1)
	assert.Equal(suite.T(), item.ID, searchResults[0].ID)

	// Step 4: Test category filtering
	categoryItems, err := suite.repo.GetItemsByCategory(suite.ctx, "Vegetables")
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), categoryItems, 1)
	assert.Equal(suite.T(), item.ID, categoryItems[0].ID)

	// Step 5: Test stock availability
	available, err := suite.repo.CheckStockAvailability(suite.ctx, "TOMATO001", 5.0)
	assert.NoError(suite.T(), err)
	assert.False(suite.T(), available) // No stock yet

	// Step 6: Update stock and test again
	item.CurrentStock = 25.0
	err = suite.repo.UpdateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	available, err = suite.repo.CheckStockAvailability(suite.ctx, "TOMATO001", 5.0)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), available) // Now available

	// Step 7: Test low stock detection
	item.CurrentStock = 8.0 // Below reorder point (10.0)
	err = suite.repo.UpdateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	lowStockItems, err := suite.repo.GetLowStockItems(suite.ctx)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), lowStockItems, 1)
	assert.Equal(suite.T(), item.ID, lowStockItems[0].ID)

	// Step 8: Test out of stock detection
	item.CurrentStock = 0.0
	err = suite.repo.UpdateItem(suite.ctx, item)
	assert.NoError(suite.T(), err)

	outOfStockItems, err := suite.repo.GetOutOfStockItems(suite.ctx)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), outOfStockItems, 1)
	assert.Equal(suite.T(), item.ID, outOfStockItems[0].ID)

	// Step 9: Test listing and pagination
	// Create more items for pagination test
	for i := 0; i < 5; i++ {
		additionalItem := suite.createTestItem()
		additionalItem.Name = fmt.Sprintf("Item_%02d", i)
		err = suite.repo.CreateItem(suite.ctx, additionalItem)
		assert.NoError(suite.T(), err)
	}

	allItems, total, err := suite.repo.ListItems(suite.ctx, 0, 10)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 6, total) // Original item + 5 additional
	assert.Len(suite.T(), allItems, 6)

	// Test pagination
	firstPage, total, err := suite.repo.ListItems(suite.ctx, 0, 3)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 6, total)
	assert.Len(suite.T(), firstPage, 3)

	secondPage, total, err := suite.repo.ListItems(suite.ctx, 3, 3)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 6, total)
	assert.Len(suite.T(), secondPage, 3)

	// Step 10: Test deletion
	err = suite.repo.DeleteItem(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)

	// Verify item was deleted
	_, err = suite.repo.GetItemByID(suite.ctx, item.ID)
	assert.Error(suite.T(), err)
}

func (suite *InventoryRepositoryTestSuite) TestMultipleUnitsAndCategories() {
	// Given - Create items with different units and categories
	items := []*inventory.InventoryItem{
		{
			SKU:          "FLOUR001",
			Name:         "All-purpose Flour",
			CurrentStock: 25.0,
			Unit:         inventory.UnitTypeKilograms,
			Cost:         1.20,
			Category:     "Baking",
		},
		{
			SKU:          "MILK001",
			Name:         "Whole Milk",
			CurrentStock: 50.0,
			Unit:         inventory.UnitTypeLiters,
			Cost:         0.85,
			Category:     "Dairy",
		},
		{
			SKU:          "PLATES001",
			Name:         "Dinner Plates",
			CurrentStock: 100.0,
			Unit:         inventory.UnitTypeUnits,
			Cost:         8.50,
			Category:     "Tableware",
		},
		{
			SKU:          "SALT001",
			Name:         "Sea Salt",
			CurrentStock: 500.0,
			Unit:         inventory.UnitTypeGrams,
			Cost:         0.05,
			Category:     "Seasoning",
		},
		{
			SKU:          "OIL001",
			Name:         "Olive Oil",
			CurrentStock: 2000.0,
			Unit:         inventory.UnitTypeMilliliters,
			Cost:         0.01,
			Category:     "Cooking",
		},
	}

	// Create all items
	for _, item := range items {
		// Need to create proper inventory items with IDs
		newItem, err := inventory.NewInventoryItem(item.SKU, item.Name, item.CurrentStock, item.Unit, item.Cost)
		assert.NoError(suite.T(), err)
		newItem.Category = item.Category
		
		err = suite.repo.CreateItem(suite.ctx, newItem)
		assert.NoError(suite.T(), err)
		
		// Update the items slice with the created item
		item.ID = newItem.ID
		item.CreatedAt = newItem.CreatedAt
		item.UpdatedAt = newItem.UpdatedAt
	}

	// Test retrieving items by different units
	allItems, total, err := suite.repo.ListItems(suite.ctx, 0, 10)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 5, total)
	assert.Len(suite.T(), allItems, 5)

	// Verify each unit type is represented
	unitCounts := make(map[inventory.UnitType]int)
	for _, item := range allItems {
		unitCounts[item.Unit]++
	}
	
	assert.Equal(suite.T(), 1, unitCounts[inventory.UnitTypeKilograms])
	assert.Equal(suite.T(), 1, unitCounts[inventory.UnitTypeLiters])
	assert.Equal(suite.T(), 1, unitCounts[inventory.UnitTypeUnits])
	assert.Equal(suite.T(), 1, unitCounts[inventory.UnitTypeGrams])
	assert.Equal(suite.T(), 1, unitCounts[inventory.UnitTypeMilliliters])

	// Test category filtering
	bakingItems, err := suite.repo.GetItemsByCategory(suite.ctx, "Baking")
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), bakingItems, 1)
	assert.Equal(suite.T(), "All-purpose Flour", bakingItems[0].Name)

	dairyItems, err := suite.repo.GetItemsByCategory(suite.ctx, "Dairy")
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), dairyItems, 1)
	assert.Equal(suite.T(), "Whole Milk", dairyItems[0].Name)

	// Test search across different items
	plateResults, err := suite.repo.SearchItems(suite.ctx, "plate")
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), plateResults, 1)
	assert.Equal(suite.T(), "Dinner Plates", plateResults[0].Name)

	oilResults, err := suite.repo.SearchItems(suite.ctx, "oil")
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), oilResults, 1)
	assert.Equal(suite.T(), "Olive Oil", oilResults[0].Name)
}

func (suite *InventoryRepositoryTestSuite) TestEdgeCases() {
	// Test with very small quantities
	smallItem, err := inventory.NewInventoryItem("SPICE001", "Black Pepper", 0.1, inventory.UnitTypeGrams, 0.01)
	assert.NoError(suite.T(), err)
	
	err = suite.repo.CreateItem(suite.ctx, smallItem)
	assert.NoError(suite.T(), err)

	// Test availability with small quantity
	available, err := suite.repo.CheckStockAvailability(suite.ctx, "SPICE001", 0.05)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), available)

	available, err = suite.repo.CheckStockAvailability(suite.ctx, "SPICE001", 0.2)
	assert.NoError(suite.T(), err)
	assert.False(suite.T(), available)

	// Test with large quantities
	bulkItem, err := inventory.NewInventoryItem("RICE001", "Rice Bulk", 1000.0, inventory.UnitTypeKilograms, 0.75)
	assert.NoError(suite.T(), err)
	
	err = suite.repo.CreateItem(suite.ctx, bulkItem)
	assert.NoError(suite.T(), err)

	// Test availability with large quantity
	available, err = suite.repo.CheckStockAvailability(suite.ctx, "RICE001", 999.99)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), available)

	// Test exact stock amount
	available, err = suite.repo.CheckStockAvailability(suite.ctx, "RICE001", 1000.0)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), available)

	// Test with zero stock
	zeroItem, err := inventory.NewInventoryItem("ZERO001", "Zero Stock Item", 0.0, inventory.UnitTypeUnits, 1.0)
	assert.NoError(suite.T(), err)
	
	err = suite.repo.CreateItem(suite.ctx, zeroItem)
	assert.NoError(suite.T(), err)

	available, err = suite.repo.CheckStockAvailability(suite.ctx, "ZERO001", 0.1)
	assert.NoError(suite.T(), err)
	assert.False(suite.T(), available)

	// Verify zero stock item appears in out of stock list
	outOfStockItems, err := suite.repo.GetOutOfStockItems(suite.ctx)
	assert.NoError(suite.T(), err)
	
	foundZeroItem := false
	for _, item := range outOfStockItems {
		if item.SKU == "ZERO001" {
			foundZeroItem = true
			break
		}
	}
	assert.True(suite.T(), foundZeroItem)
}