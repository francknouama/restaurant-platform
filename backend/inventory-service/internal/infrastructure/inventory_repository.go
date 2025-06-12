package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"time"
	inventory "github.com/restaurant-platform/inventory-service/internal/domain"
)

type InventoryRepository struct {
	db *DB
}

func NewInventoryRepository(db *DB) *InventoryRepository {
	return &InventoryRepository{db: db}
}

func (r *InventoryRepository) CreateItem(ctx context.Context, item *inventory.InventoryItem) error {
	query := `
		INSERT INTO inventory (
			id, sku, name, description, current_stock, unit, min_threshold, 
			max_threshold, reorder_point, cost, category, location, supplier_id, 
			last_ordered, expiry_date, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`

	_, err := r.db.ExecContext(ctx, query,
		item.ID.String(), item.SKU, item.Name, item.Description, item.CurrentStock,
		string(item.Unit), item.MinThreshold, item.MaxThreshold, item.ReorderPoint,
		item.Cost, item.Category, item.Location, nullString(item.SupplierID.String()),
		nullTime(item.LastOrdered), nullTime(item.ExpiryDate), item.CreatedAt, item.UpdatedAt)

	return err
}

func (r *InventoryRepository) GetItemByID(ctx context.Context, id inventory.InventoryItemID) (*inventory.InventoryItem, error) {
	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory WHERE id = $1`

	var item inventory.InventoryItem
	var idStr, unit string
	var supplierStr sql.NullString
	var lastOrdered, expiryDate sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&idStr, &item.SKU, &item.Name, &item.Description, &item.CurrentStock,
		&unit, &item.MinThreshold, &item.MaxThreshold, &item.ReorderPoint,
		&item.Cost, &item.Category, &item.Location, &supplierStr,
		&lastOrdered, &expiryDate, &item.CreatedAt, &item.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("inventory item not found")
		}
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

	return &item, nil
}

func (r *InventoryRepository) GetItemBySKU(ctx context.Context, sku string) (*inventory.InventoryItem, error) {
	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory WHERE sku = $1`

	var item inventory.InventoryItem
	var idStr, unit string
	var supplierStr sql.NullString
	var lastOrdered, expiryDate sql.NullTime

	err := r.db.QueryRowContext(ctx, query, sku).Scan(
		&idStr, &item.SKU, &item.Name, &item.Description, &item.CurrentStock,
		&unit, &item.MinThreshold, &item.MaxThreshold, &item.ReorderPoint,
		&item.Cost, &item.Category, &item.Location, &supplierStr,
		&lastOrdered, &expiryDate, &item.CreatedAt, &item.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("inventory item not found")
		}
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

	return &item, nil
}

func (r *InventoryRepository) UpdateItem(ctx context.Context, item *inventory.InventoryItem) error {
	query := `
		UPDATE inventory 
		SET name = $2, description = $3, current_stock = $4, unit = $5,
		    min_threshold = $6, max_threshold = $7, reorder_point = $8,
		    cost = $9, category = $10, location = $11, supplier_id = $12,
		    last_ordered = $13, expiry_date = $14, updated_at = $15
		WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query,
		item.ID.String(), item.Name, item.Description, item.CurrentStock,
		string(item.Unit), item.MinThreshold, item.MaxThreshold, item.ReorderPoint,
		item.Cost, item.Category, item.Location, nullString(item.SupplierID.String()),
		nullTime(item.LastOrdered), nullTime(item.ExpiryDate), item.UpdatedAt)

	return err
}

func (r *InventoryRepository) CheckStockAvailability(ctx context.Context, sku string, quantity float64) (bool, error) {
	query := `SELECT current_stock FROM inventory WHERE sku = $1`
	
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

func (r *InventoryRepository) GetLowStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory 
		WHERE current_stock <= reorder_point AND reorder_point > 0
		ORDER BY current_stock ASC`

	return r.queryItems(ctx, query)
}

func (r *InventoryRepository) GetOutOfStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory 
		WHERE current_stock <= 0
		ORDER BY updated_at DESC`

	return r.queryItems(ctx, query)
}

func (r *InventoryRepository) ListItems(ctx context.Context, offset, limit int) ([]*inventory.InventoryItem, int, error) {
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
		LIMIT $1 OFFSET $2`

	items, err := r.queryItems(ctx, query, limit, offset)
	return items, total, err
}

// Helper methods
func (r *InventoryRepository) queryItems(ctx context.Context, query string, args ...interface{}) ([]*inventory.InventoryItem, error) {
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

// Supplier operations
func (r *InventoryRepository) CreateSupplier(ctx context.Context, supplier *inventory.Supplier) error {
	query := `
		INSERT INTO suppliers (id, name, contact_name, email, phone, address, website, notes, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err := r.db.ExecContext(ctx, query,
		supplier.ID.String(), supplier.Name, supplier.ContactName, supplier.Email,
		supplier.Phone, supplier.Address, supplier.Website, supplier.Notes,
		supplier.IsActive, supplier.CreatedAt, supplier.UpdatedAt)

	return err
}

// Stub implementations for remaining interface methods
func (r *InventoryRepository) DeleteItem(ctx context.Context, id inventory.InventoryItemID) error {
	query := `DELETE FROM inventory WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id.String())
	return err
}

func (r *InventoryRepository) GetItemsByCategory(ctx context.Context, category string) ([]*inventory.InventoryItem, error) {
	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory WHERE category = $1`
	
	return r.queryItems(ctx, query, category)
}

func (r *InventoryRepository) SearchItems(ctx context.Context, query string) ([]*inventory.InventoryItem, error) {
	sql := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory 
		WHERE name ILIKE $1 OR sku ILIKE $1 OR description ILIKE $1`
	
	searchPattern := "%" + query + "%"
	return r.queryItems(ctx, sql, searchPattern)
}

func (r *InventoryRepository) CreateMovement(ctx context.Context, movement *inventory.StockMovement) error {
	// Simplified implementation - in real scenario you'd have a separate movements table
	return nil
}

func (r *InventoryRepository) GetMovementsByItemID(ctx context.Context, itemID inventory.InventoryItemID, limit int) ([]*inventory.StockMovement, error) {
	// Simplified implementation
	return []*inventory.StockMovement{}, nil
}

func (r *InventoryRepository) GetMovementsByDateRange(ctx context.Context, start, end time.Time) ([]*inventory.StockMovement, error) {
	// Simplified implementation
	return []*inventory.StockMovement{}, nil
}

func (r *InventoryRepository) GetSupplierByID(ctx context.Context, id inventory.SupplierID) (*inventory.Supplier, error) {
	// Simplified implementation
	return nil, fmt.Errorf("not implemented")
}

func (r *InventoryRepository) UpdateSupplier(ctx context.Context, supplier *inventory.Supplier) error {
	// Simplified implementation
	return fmt.Errorf("not implemented")
}

func (r *InventoryRepository) DeleteSupplier(ctx context.Context, id inventory.SupplierID) error {
	// Simplified implementation
	return fmt.Errorf("not implemented")
}

func (r *InventoryRepository) ListSuppliers(ctx context.Context, offset, limit int) ([]*inventory.Supplier, int, error) {
	// Simplified implementation
	return []*inventory.Supplier{}, 0, nil
}

func (r *InventoryRepository) GetActiveSuppliers(ctx context.Context) ([]*inventory.Supplier, error) {
	// Simplified implementation
	return []*inventory.Supplier{}, nil
}

func (r *InventoryRepository) GetItemsBySupplier(ctx context.Context, supplierID inventory.SupplierID) ([]*inventory.InventoryItem, error) {
	// Simplified implementation
	return []*inventory.InventoryItem{}, nil
}

// Helper functions
func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

func nullTime(t time.Time) sql.NullTime {
	if t.IsZero() {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: t, Valid: true}
}