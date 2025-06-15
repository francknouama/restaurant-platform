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
		INSERT INTO suppliers (id, code, name, contact_name, email, phone, address, website, notes, rating, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	_, err := r.db.ExecContext(ctx, query,
		supplier.ID.String(), supplier.Code, supplier.Name, supplier.ContactInfo.ContactName,
		supplier.ContactInfo.Email, supplier.ContactInfo.Phone, supplier.ContactInfo.Address,
		nullString(supplier.Website), nullString(supplier.Notes), supplier.Rating,
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
	query := `
		INSERT INTO stock_movements (
			id, inventory_item_id, type, quantity, previous_stock, new_stock,
			unit, cost, reason, reference, performed_by, performed_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	_, err := r.db.ExecContext(ctx, query,
		movement.ID.String(), movement.InventoryItemID.String(), string(movement.Type),
		movement.Quantity, movement.PreviousStock, movement.NewStock,
		string(movement.Unit), movement.Cost, nullString(movement.Reason),
		nullString(movement.Reference), nullString(movement.PerformedBy),
		movement.PerformedAt, movement.CreatedAt)

	return err
}

func (r *InventoryRepository) GetMovementByID(ctx context.Context, id inventory.MovementID) (*inventory.StockMovement, error) {
	query := `
		SELECT id, inventory_item_id, type, quantity, previous_stock, new_stock,
		       unit, cost, reason, reference, performed_by, performed_at, created_at
		FROM stock_movements 
		WHERE id = $1`

	movements, err := r.queryMovements(ctx, query, id.String())
	if err != nil {
		return nil, err
	}
	if len(movements) == 0 {
		return nil, fmt.Errorf("movement not found")
	}
	return movements[0], nil
}

func (r *InventoryRepository) GetMovementsByItemID(ctx context.Context, itemID inventory.InventoryItemID, limit, offset int) ([]*inventory.StockMovement, error) {
	query := `
		SELECT id, inventory_item_id, type, quantity, previous_stock, new_stock,
		       unit, cost, reason, reference, performed_by, performed_at, created_at
		FROM stock_movements 
		WHERE inventory_item_id = $1
		ORDER BY performed_at DESC
		LIMIT $2 OFFSET $3`

	return r.queryMovements(ctx, query, itemID.String(), limit, offset)
}

func (r *InventoryRepository) GetMovementsByDateRange(ctx context.Context, start, end time.Time) ([]*inventory.StockMovement, error) {
	query := `
		SELECT id, inventory_item_id, type, quantity, previous_stock, new_stock,
		       unit, cost, reason, reference, performed_by, performed_at, created_at
		FROM stock_movements 
		WHERE performed_at >= $1 AND performed_at <= $2
		ORDER BY performed_at DESC`

	return r.queryMovements(ctx, query, start, end)
}

func (r *InventoryRepository) GetMovementsByType(ctx context.Context, movementType inventory.MovementType) ([]*inventory.StockMovement, error) {
	query := `
		SELECT id, inventory_item_id, type, quantity, previous_stock, new_stock,
		       unit, cost, reason, reference, performed_by, performed_at, created_at
		FROM stock_movements 
		WHERE type = $1
		ORDER BY performed_at DESC`

	return r.queryMovements(ctx, query, string(movementType))
}

func (r *InventoryRepository) DeleteMovement(ctx context.Context, id inventory.MovementID) error {
	query := `DELETE FROM stock_movements WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id.String())
	if err != nil {
		return err
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("movement not found")
	}
	
	return nil
}

func (r *InventoryRepository) GetSupplierByID(ctx context.Context, id inventory.SupplierID) (*inventory.Supplier, error) {
	query := `
		SELECT id, code, name, contact_name, email, phone, address, website, notes, rating, is_active, created_at, updated_at
		FROM suppliers WHERE id = $1`

	var supplier inventory.Supplier
	var idStr string
	var contactName, email, phone, address, website, notes sql.NullString

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&idStr, &supplier.Code, &supplier.Name, &contactName, &email, &phone,
		&address, &website, &notes, &supplier.Rating, &supplier.IsActive,
		&supplier.CreatedAt, &supplier.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("supplier not found")
		}
		return nil, err
	}

	supplier.ID = inventory.SupplierID(idStr)
	supplier.ContactInfo.ContactName = contactName.String
	supplier.ContactInfo.Email = email.String
	supplier.ContactInfo.Phone = phone.String
	supplier.ContactInfo.Address = address.String
	supplier.Website = website.String
	supplier.Notes = notes.String

	return &supplier, nil
}

func (r *InventoryRepository) UpdateSupplier(ctx context.Context, supplier *inventory.Supplier) error {
	query := `
		UPDATE suppliers 
		SET code = $2, name = $3, contact_name = $4, email = $5, phone = $6,
		    address = $7, website = $8, notes = $9, rating = $10, is_active = $11, updated_at = $12
		WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query,
		supplier.ID.String(), supplier.Code, supplier.Name,
		nullString(supplier.ContactInfo.ContactName), nullString(supplier.ContactInfo.Email),
		nullString(supplier.ContactInfo.Phone), nullString(supplier.ContactInfo.Address),
		nullString(supplier.Website), nullString(supplier.Notes), supplier.Rating,
		supplier.IsActive, supplier.UpdatedAt)

	return err
}

func (r *InventoryRepository) DeleteSupplier(ctx context.Context, id inventory.SupplierID) error {
	query := `DELETE FROM suppliers WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id.String())
	return err
}

func (r *InventoryRepository) ListSuppliers(ctx context.Context, activeOnly bool) ([]*inventory.Supplier, error) {
	query := `
		SELECT id, name, contact_name, email, phone, address, website, notes, is_active, created_at, updated_at
		FROM suppliers 
		WHERE ($1 = false OR is_active = true)
		ORDER BY name ASC`

	return r.querySuppliers(ctx, query, activeOnly)
}

func (r *InventoryRepository) ListSuppliersWithPagination(ctx context.Context, offset, limit int) ([]*inventory.Supplier, int, error) {
	countQuery := `SELECT COUNT(*) FROM suppliers`
	var total int
	err := r.db.QueryRowContext(ctx, countQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, name, contact_name, email, phone, address, website, notes, is_active, created_at, updated_at
		FROM suppliers 
		ORDER BY name ASC 
		LIMIT $1 OFFSET $2`

	suppliers, err := r.querySuppliers(ctx, query, limit, offset)
	return suppliers, total, err
}

func (r *InventoryRepository) GetSuppliersByItem(ctx context.Context, itemID inventory.InventoryItemID) ([]*inventory.Supplier, error) {
	query := `
		SELECT s.id, s.name, s.contact_name, s.email, s.phone, s.address, s.website, s.notes, s.is_active, s.created_at, s.updated_at
		FROM suppliers s
		JOIN inventory i ON s.id = i.supplier_id
		WHERE i.id = $1`

	return r.querySuppliers(ctx, query, itemID.String())
}

func (r *InventoryRepository) GetActiveSuppliers(ctx context.Context) ([]*inventory.Supplier, error) {
	query := `
		SELECT id, name, contact_name, email, phone, address, website, notes, is_active, created_at, updated_at
		FROM suppliers 
		WHERE is_active = true
		ORDER BY name ASC`

	return r.querySuppliers(ctx, query)
}

func (r *InventoryRepository) GetItemsBySupplier(ctx context.Context, supplierID inventory.SupplierID) ([]*inventory.InventoryItem, error) {
	query := `
		SELECT id, sku, name, description, current_stock, unit, min_threshold,
		       max_threshold, reorder_point, cost, category, location, supplier_id,
		       last_ordered, expiry_date, created_at, updated_at
		FROM inventory 
		WHERE supplier_id = $1
		ORDER BY name ASC`

	return r.queryItems(ctx, query, supplierID.String())
}

// Helper methods for querying movements
func (r *InventoryRepository) queryMovements(ctx context.Context, query string, args ...interface{}) ([]*inventory.StockMovement, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movements []*inventory.StockMovement
	for rows.Next() {
		var movement inventory.StockMovement
		var idStr, itemIDStr, typeStr, unitStr string
		var reason, reference, performedBy sql.NullString

		err := rows.Scan(
			&idStr, &itemIDStr, &typeStr, &movement.Quantity,
			&movement.PreviousStock, &movement.NewStock,
			&unitStr, &movement.Cost, &reason, &reference, &performedBy,
			&movement.PerformedAt, &movement.CreatedAt)
		if err != nil {
			return nil, err
		}

		movement.ID = inventory.MovementID(idStr)
		movement.InventoryItemID = inventory.InventoryItemID(itemIDStr)
		movement.Type = inventory.MovementType(typeStr)
		movement.Unit = inventory.UnitType(unitStr)
		movement.Reason = reason.String
		movement.Reference = reference.String
		movement.PerformedBy = performedBy.String

		movements = append(movements, &movement)
	}

	return movements, rows.Err()
}

// Helper methods for querying suppliers
func (r *InventoryRepository) querySuppliers(ctx context.Context, query string, args ...interface{}) ([]*inventory.Supplier, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var suppliers []*inventory.Supplier
	for rows.Next() {
		var supplier inventory.Supplier
		var idStr string
		var contactName, email, phone, address, website, notes sql.NullString

		err := rows.Scan(
			&idStr, &supplier.Code, &supplier.Name, &contactName, &email, &phone,
			&address, &website, &notes, &supplier.Rating, &supplier.IsActive,
			&supplier.CreatedAt, &supplier.UpdatedAt)
		if err != nil {
			return nil, err
		}

		supplier.ID = inventory.SupplierID(idStr)
		supplier.ContactInfo.ContactName = contactName.String
		supplier.ContactInfo.Email = email.String
		supplier.ContactInfo.Phone = phone.String
		supplier.ContactInfo.Address = address.String
		supplier.Website = website.String
		supplier.Notes = notes.String

		suppliers = append(suppliers, &supplier)
	}

	return suppliers, rows.Err()
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